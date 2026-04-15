package com.pharmaflow.documents;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.pharmaflow.audit.AuditLogService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.auth.PharmaUserRepository;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.common.ForbiddenActionException;
import com.pharmaflow.documents.dto.UploadedDocumentResponse;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import com.pharmaflow.tenant.TenantRequestContext;
import com.pharmaflow.tenant.TenantRequestContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentStorageService {

    private static final DateTimeFormatter DATE_SEGMENT = DateTimeFormatter.ofPattern("yyyy/MM");
    private static final List<String> FALLBACK_IMAGE_TYPES = List.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/webp"
    );

    private final StoredDocumentRepository storedDocumentRepository;
    private final StoreRepository storeRepository;
    private final PharmaUserRepository pharmaUserRepository;
    private final AuditLogService auditLogService;
    private final DocumentStorageProperties storageProperties;
    private final ObjectProvider<AmazonS3> amazonS3Provider;

    @Value("${aws.s3.bucket:}")
    private String s3Bucket;

    @Transactional
    public UploadedDocumentResponse uploadPrescription(UUID storeId, MultipartFile file) {
        Store store = resolveScopedStore(storeId);
        PharmaUser currentUser = requireCurrentUser();
        validateFile(file);

        try {
            byte[] fileBytes = file.getBytes();
            String contentType = normalizeContentType(file.getContentType(), file.getOriginalFilename());
            String extension = resolveExtension(file.getOriginalFilename(), contentType);
            String storageKey = buildStorageKey(store, extension);
            String storageProvider = persistDocument(storageKey, contentType, fileBytes);
            String checksum = sha256(fileBytes);

            StoredDocument document = storedDocumentRepository.save(
                    StoredDocument.builder()
                            .tenantId(store.getTenant() != null ? store.getTenant().getTenantId() : null)
                            .storeId(store.getStoreId())
                            .documentType("PRESCRIPTION")
                            .originalFileName(sanitizeOriginalFileName(file.getOriginalFilename(), extension))
                            .contentType(contentType)
                            .storageProvider(storageProvider)
                            .storageKey(storageKey)
                            .sizeBytes((long) fileBytes.length)
                            .checksumSha256(checksum)
                            .createdBy(currentUser.getUserId())
                            .build()
            );

            auditLogService.log(
                    store,
                    currentUser,
                    "PRESCRIPTION_UPLOADED",
                    "DOCUMENT",
                    document.getDocumentId().toString(),
                    null,
                    "{\"contentType\":\"" + contentType + "\",\"sizeBytes\":\"" + fileBytes.length + "\"}"
            );

            return UploadedDocumentResponse.builder()
                    .documentId(document.getDocumentId())
                    .documentUrl(buildDocumentUrl(document.getDocumentId()))
                    .originalFileName(document.getOriginalFileName())
                    .contentType(document.getContentType())
                    .sizeBytes(document.getSizeBytes())
                    .storageProvider(document.getStorageProvider())
                    .build();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to store prescription file", exception);
        }
    }

    @Transactional(readOnly = true)
    public DocumentDownload loadDocument(UUID documentId) {
        StoredDocument document = storedDocumentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        ensureTenantScope(document);

        try {
            byte[] content = readDocument(document);
            return new DocumentDownload(
                    document.getOriginalFileName(),
                    document.getContentType(),
                    content
            );
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read stored document", exception);
        }
    }

    private Store resolveScopedStore(UUID storeId) {
        if (storeId == null) {
            throw new IllegalArgumentException("Active store is required for prescription uploads");
        }

        TenantRequestContext context = TenantRequestContextHolder.get();
        return storeRepository.findById(storeId)
                .filter(store -> context == null
                        || context.getTenant() == null
                        || (store.getTenant() != null
                        && context.getTenant().getTenantId().equals(store.getTenant().getTenantId())))
                .filter(store -> context == null
                        || context.getStore() == null
                        || context.getStore().getStoreId().equals(store.getStoreId()))
                .orElseThrow(() -> new ForbiddenActionException("Selected store is not available for the active tenant"));
    }

    private PharmaUser requireCurrentUser() {
        return Optional.ofNullable(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication())
                .map(org.springframework.security.core.Authentication::getName)
                .flatMap(pharmaUserRepository::findByUsername)
                .orElseThrow(() -> new ForbiddenActionException("Authenticated PharmaFlow user is required"));
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose a prescription file to upload");
        }

        if (file.getSize() > storageProperties.getMaxFileSizeBytes()) {
            throw new BusinessRuleException("Prescription files must be 10 MB or smaller");
        }

        String contentType = normalizeContentType(file.getContentType(), file.getOriginalFilename());
        boolean allowed = storageProperties.getAllowedContentTypes().stream()
                .map(value -> value.toLowerCase(Locale.ROOT))
                .anyMatch(value -> value.equals(contentType.toLowerCase(Locale.ROOT)));
        if (!allowed) {
            throw new BusinessRuleException("Only PDF, JPG, PNG, or WEBP prescription files are allowed");
        }
    }

    private String persistDocument(String storageKey, String contentType, byte[] bytes) throws IOException {
        boolean shouldUseS3 = shouldUseS3();
        if (shouldUseS3) {
            AmazonS3 amazonS3 = amazonS3Provider.getIfAvailable();
            if (amazonS3 == null) {
                throw new IllegalStateException("S3 storage is enabled but the S3 client is not available");
            }
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(contentType);
            metadata.setContentLength(bytes.length);
            amazonS3.putObject(s3Bucket, storageKey, new ByteArrayInputStream(bytes), metadata);
            return "S3";
        }

        Path target = Path.of(storageProperties.getLocalRoot()).resolve(storageKey).normalize();
        Files.createDirectories(target.getParent());
        Files.write(target, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        return "LOCAL";
    }

    private byte[] readDocument(StoredDocument document) throws IOException {
        if ("S3".equalsIgnoreCase(document.getStorageProvider())) {
            AmazonS3 amazonS3 = amazonS3Provider.getIfAvailable();
            if (amazonS3 == null) {
                throw new IllegalStateException("S3 storage is configured but the S3 client is not available");
            }
            try (var inputStream = amazonS3.getObject(s3Bucket, document.getStorageKey()).getObjectContent()) {
                return inputStream.readAllBytes();
            }
        }

        Path target = Path.of(storageProperties.getLocalRoot()).resolve(document.getStorageKey()).normalize();
        if (!Files.exists(target)) {
            throw new IllegalArgumentException("Document is no longer available in local storage");
        }
        return Files.readAllBytes(target);
    }

    private boolean shouldUseS3() {
        String provider = storageProperties.normalizedProvider();
        if ("s3".equals(provider)) {
            return true;
        }
        if ("local".equals(provider)) {
            return false;
        }
        return !isBlank(s3Bucket) && amazonS3Provider.getIfAvailable() != null;
    }

    private String buildStorageKey(Store store, String extension) {
        String tenantSegment = store.getTenant() != null
                ? safeSegment(store.getTenant().getSlug())
                : "standalone";
        String storeSegment = safeSegment(store.getStoreCode());
        String dateSegment = DATE_SEGMENT.format(LocalDate.now());
        return "prescriptions/" + tenantSegment + "/" + storeSegment + "/" + dateSegment + "/" + UUID.randomUUID() + extension;
    }

    private String normalizeContentType(String contentType, String originalFileName) {
        if (contentType != null
                && !contentType.isBlank()
                && !"application/octet-stream".equalsIgnoreCase(contentType)) {
            return contentType;
        }
        String lowerName = originalFileName == null ? "" : originalFileName.toLowerCase(Locale.ROOT);
        if (lowerName.endsWith(".pdf")) {
            return MediaType.APPLICATION_PDF_VALUE;
        }
        if (lowerName.endsWith(".png")) {
            return MediaType.IMAGE_PNG_VALUE;
        }
        if (lowerName.endsWith(".webp")) {
            return "image/webp";
        }
        return MediaType.IMAGE_JPEG_VALUE;
    }

    private String resolveExtension(String originalFileName, String contentType) {
        String lowerName = originalFileName == null ? "" : originalFileName.toLowerCase(Locale.ROOT);
        if (lowerName.endsWith(".pdf")) {
            return ".pdf";
        }
        if (lowerName.endsWith(".png")) {
            return ".png";
        }
        if (lowerName.endsWith(".webp")) {
            return ".webp";
        }
        if (FALLBACK_IMAGE_TYPES.contains(contentType)) {
            return ".jpg";
        }
        return ".bin";
    }

    private String sanitizeOriginalFileName(String originalFileName, String extension) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return "prescription" + extension;
        }
        String sanitized = originalFileName.replaceAll("[^A-Za-z0-9._-]", "_");
        return sanitized.length() > 255 ? sanitized.substring(sanitized.length() - 255) : sanitized;
    }

    private String buildDocumentUrl(UUID documentId) {
        return "/api/v1/documents/" + documentId;
    }

    private String safeSegment(String value) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }
        return value.replaceAll("[^A-Za-z0-9_-]", "-");
    }

    private String sha256(byte[] content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content);
            StringBuilder builder = new StringBuilder(hash.length * 2);
            for (byte value : hash) {
                builder.append(String.format("%02x", value & 0xff));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 support is required for document storage", exception);
        }
    }

    private void ensureTenantScope(StoredDocument document) {
        TenantRequestContext context = TenantRequestContextHolder.get();
        if (context == null || context.getTenant() == null || document.getTenantId() == null) {
            return;
        }
        if (!context.getTenant().getTenantId().equals(document.getTenantId())) {
            throw new ForbiddenActionException("Document does not belong to the active tenant");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public record DocumentDownload(
            String originalFileName,
            String contentType,
            byte[] bytes
    ) {
    }
}
