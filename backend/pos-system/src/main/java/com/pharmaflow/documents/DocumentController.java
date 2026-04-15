package com.pharmaflow.documents;

import com.pharmaflow.documents.dto.UploadedDocumentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentStorageService documentStorageService;

    @PostMapping(value = "/prescriptions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadedDocumentResponse uploadPrescription(
            @RequestHeader("X-Store-ID") UUID storeId,
            @RequestPart("file") MultipartFile file
    ) {
        return documentStorageService.uploadPrescription(storeId, file);
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<ByteArrayResource> getDocument(@PathVariable UUID documentId) {
        DocumentStorageService.DocumentDownload document = documentStorageService.loadDocument(documentId);
        MediaType mediaType = MediaType.parseMediaType(document.contentType());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(document.originalFileName()).build().toString()
                )
                .body(new ByteArrayResource(document.bytes()));
    }
}
