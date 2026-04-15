package com.pharmaflow.procurement;

import com.pharmaflow.audit.AuditLogService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.auth.PharmaUserRepository;
import com.pharmaflow.billing.Invoice;
import com.pharmaflow.billing.InvoiceRepository;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.inventory.InventoryBatch;
import com.pharmaflow.inventory.InventoryBatchRepository;
import com.pharmaflow.inventory.InventoryMovementService;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.medicine.MedicineRepository;
import com.pharmaflow.procurement.dto.CreditNoteCreateRequest;
import com.pharmaflow.procurement.dto.CreditNoteItemRequest;
import com.pharmaflow.procurement.dto.CreditNoteResponse;
import com.pharmaflow.procurement.dto.CreditNoteSettlementRequest;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CreditNoteService {

    private final CreditNoteRepository creditNoteRepository;
    private final CreditNoteItemRepository creditNoteItemRepository;
    private final StoreRepository storeRepository;
    private final InvoiceRepository invoiceRepository;
    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final InventoryMovementService inventoryMovementService;
    private final PharmaUserRepository pharmaUserRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<CreditNoteResponse> listCreditNotes(UUID storeId, String query, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return creditNoteRepository.searchByStoreId(storeId, query, PageRequest.of(0, safeLimit))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CreditNoteResponse createCreditNote(UUID storeId, CreditNoteCreateRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Credit note must contain at least one item");
        }

        String creditNoteType = normalizeType(request.getCnType());
        if (!"DUMP".equals(creditNoteType) && request.getSupplierId() == null) {
            throw new IllegalArgumentException("Supplier is required for supplier-facing credit notes");
        }

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found"));
        PharmaUser currentUser = getCurrentPharmaUser();
        Invoice originalInvoice = request.getOriginalInvoiceId() == null
                ? null
                : invoiceRepository.findById(request.getOriginalInvoiceId())
                .orElseThrow(() -> new IllegalArgumentException("Original invoice not found"));

        CreditNote creditNote = CreditNote.builder()
                .cnNumber(resolveCnNumber(store, request.getCnNumber()))
                .store(store)
                .supplierId(request.getSupplierId())
                .originalInvoice(originalInvoice)
                .cnType(creditNoteType)
                .status("DUMP".equals(creditNoteType) ? "RESOLVED" : "PENDING")
                .claimState("DUMP".equals(creditNoteType) ? "WRITEOFF" : "PENDING")
                .notes(request.getNotes())
                .createdBy(currentUser)
                .resolvedAt("DUMP".equals(creditNoteType) ? LocalDateTime.now() : null)
                .closedAt("DUMP".equals(creditNoteType) ? LocalDateTime.now() : null)
                .resolutionNotes("DUMP".equals(creditNoteType) ? "Stock written off locally" : null)
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;
        creditNote = creditNoteRepository.save(creditNote);

        for (CreditNoteItemRequest itemRequest : request.getItems()) {
            Medicine medicine = medicineRepository.findById(itemRequest.getMedicineId())
                    .orElseThrow(() -> new IllegalArgumentException("Medicine not found"));
            InventoryBatch batch = inventoryBatchRepository.findById(itemRequest.getBatchId())
                    .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found"));

            if (batch.getStore() == null || !storeId.equals(batch.getStore().getStoreId())) {
                throw new BusinessRuleException("Credit note batch does not belong to the selected store");
            }

            inventoryMovementService.applyQuantity(
                    batch.getBatchId(),
                    safe(itemRequest.getQuantity()).negate(),
                    resolveUnitType(itemRequest.getUnitType()),
                    "DUMP".equals(creditNoteType) ? "DUMP" : "VENDOR_RETURN",
                    "DUMP".equals(creditNoteType) ? "DAMAGE_OR_EXPIRY" : "SUPPLIER_RETURN",
                    "CREDIT_NOTE",
                    creditNote.getCnId().toString(),
                    itemRequest.getReason(),
                    currentUser
            );

            BigDecimal lineMrp = itemRequest.getMrp() != null ? itemRequest.getMrp() : safe(batch.getMrp());
            BigDecimal lineTotal = lineMrp.multiply(safe(itemRequest.getQuantity()));
            totalAmount = totalAmount.add(lineTotal);

            creditNoteItemRepository.save(
                    CreditNoteItem.builder()
                            .creditNote(creditNote)
                            .medicine(medicine)
                            .batch(batch)
                            .quantity(itemRequest.getQuantity())
                            .unitType(resolveUnitType(itemRequest.getUnitType()))
                            .mrp(lineMrp)
                            .reason(itemRequest.getReason())
                            .build()
            );
        }

        creditNote.setTotalAmount(totalAmount);
        creditNote.setClaimAmount(totalAmount);
        creditNoteRepository.save(creditNote);

        auditLogService.log(
                store,
                currentUser,
                "CREDIT_NOTE_CREATED",
                "CREDIT_NOTE",
                creditNote.getCnId().toString(),
                null,
                "{\"cnNumber\":\"" + creditNote.getCnNumber() + "\",\"totalAmount\":\"" + totalAmount + "\",\"cnType\":\"" + creditNoteType + "\"}"
        );

        return toResponse(creditNote);
    }

    @Transactional
    public CreditNoteResponse dispatchCreditNote(UUID storeId, UUID creditNoteId) {
        CreditNote creditNote = getCreditNoteForStore(storeId, creditNoteId);
        if ("DUMP".equalsIgnoreCase(creditNote.getCnType())) {
            throw new BusinessRuleException("Dump notes do not have a supplier dispatch lifecycle");
        }
        requireStatus(creditNote, List.of("PENDING"), "Only pending RTV claims can be dispatched");

        creditNote.setStatus("DISPATCHED");
        creditNote.setClaimState("DISPATCHED");
        creditNote.setDispatchedAt(LocalDateTime.now());
        creditNoteRepository.save(creditNote);

        auditLogService.log(
                creditNote.getStore(),
                getCurrentPharmaUser(),
                "CREDIT_NOTE_DISPATCHED",
                "CREDIT_NOTE",
                creditNote.getCnId().toString(),
                null,
                "{\"cnNumber\":\"" + creditNote.getCnNumber() + "\"}"
        );

        return toResponse(creditNote);
    }

    @Transactional
    public CreditNoteResponse acknowledgeCreditNote(UUID storeId, UUID creditNoteId) {
        CreditNote creditNote = getCreditNoteForStore(storeId, creditNoteId);
        requireStatus(creditNote, List.of("DISPATCHED"), "Only dispatched RTV claims can be acknowledged");

        creditNote.setStatus("ACKNOWLEDGED");
        creditNote.setClaimState("ACKNOWLEDGED");
        creditNote.setAcknowledgedAt(LocalDateTime.now());
        creditNoteRepository.save(creditNote);

        auditLogService.log(
                creditNote.getStore(),
                getCurrentPharmaUser(),
                "CREDIT_NOTE_ACKNOWLEDGED",
                "CREDIT_NOTE",
                creditNote.getCnId().toString(),
                null,
                "{\"cnNumber\":\"" + creditNote.getCnNumber() + "\"}"
        );

        return toResponse(creditNote);
    }

    @Transactional
    public CreditNoteResponse settleCreditNote(UUID storeId, UUID creditNoteId, CreditNoteSettlementRequest request) {
        CreditNote creditNote = getCreditNoteForStore(storeId, creditNoteId);
        requireStatus(creditNote, List.of("DISPATCHED", "ACKNOWLEDGED"), "Only open RTV claims can be settled");

        BigDecimal settledAmount = safe(request.getSettledAmount());
        if (settledAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("Settled amount cannot be negative");
        }

        creditNote.setSettledAmount(settledAmount);
        creditNote.setResolutionNotes(trim(request.getNotes()));
        creditNote.setResolvedAt(LocalDateTime.now());
        creditNote.setClosedAt(LocalDateTime.now());
        if (settledAmount.compareTo(safe(creditNote.getClaimAmount())) >= 0) {
            creditNote.setStatus("SETTLED");
            creditNote.setClaimState("SETTLED");
        } else {
            creditNote.setStatus("PARTIALLY_SETTLED");
            creditNote.setClaimState("PARTIAL");
        }
        creditNoteRepository.save(creditNote);

        auditLogService.log(
                creditNote.getStore(),
                getCurrentPharmaUser(),
                "CREDIT_NOTE_SETTLED",
                "CREDIT_NOTE",
                creditNote.getCnId().toString(),
                null,
                "{\"cnNumber\":\"" + creditNote.getCnNumber() + "\",\"settledAmount\":\"" + settledAmount + "\"}"
        );

        return toResponse(creditNote);
    }

    @Transactional
    public CreditNoteResponse cancelCreditNote(UUID storeId, UUID creditNoteId) {
        CreditNote creditNote = getCreditNoteForStore(storeId, creditNoteId);
        requireStatus(creditNote, List.of("PENDING"), "Only pending RTV claims can be cancelled");
        PharmaUser currentUser = getCurrentPharmaUser();

        for (CreditNoteItem item : creditNoteItemRepository.findByCreditNoteCnId(creditNote.getCnId())) {
            if (item.getBatch() == null || item.getBatch().getBatchId() == null) {
                continue;
            }
            inventoryMovementService.applyQuantity(
                    item.getBatch().getBatchId(),
                    item.getQuantity(),
                    item.getUnitType(),
                    "VENDOR_RETURN_CANCEL",
                    "SUPPLIER_RETURN_CANCELLED",
                    "CREDIT_NOTE",
                    creditNote.getCnId().toString(),
                    "Cancelled before supplier dispatch",
                    currentUser
            );
        }

        creditNote.setStatus("CANCELLED");
        creditNote.setClaimState("CANCELLED");
        creditNote.setClosedAt(LocalDateTime.now());
        creditNote.setResolutionNotes("Cancelled before supplier dispatch");
        creditNoteRepository.save(creditNote);

        auditLogService.log(
                creditNote.getStore(),
                currentUser,
                "CREDIT_NOTE_CANCELLED",
                "CREDIT_NOTE",
                creditNote.getCnId().toString(),
                null,
                "{\"cnNumber\":\"" + creditNote.getCnNumber() + "\"}"
        );

        return toResponse(creditNote);
    }

    private CreditNoteResponse toResponse(CreditNote creditNote) {
        return CreditNoteResponse.builder()
                .creditNoteId(creditNote.getCnId())
                .cnNumber(creditNote.getCnNumber())
                .cnType(creditNote.getCnType())
                .status(creditNote.getStatus())
                .claimState(creditNote.getClaimState())
                .supplierId(creditNote.getSupplierId())
                .originalInvoiceId(creditNote.getOriginalInvoice() != null ? creditNote.getOriginalInvoice().getInvoiceId() : null)
                .totalAmount(creditNote.getTotalAmount())
                .claimAmount(creditNote.getClaimAmount())
                .settledAmount(creditNote.getSettledAmount())
                .notes(creditNote.getNotes())
                .dispatchedAt(creditNote.getDispatchedAt())
                .acknowledgedAt(creditNote.getAcknowledgedAt())
                .resolvedAt(creditNote.getResolvedAt())
                .resolutionNotes(creditNote.getResolutionNotes())
                .createdAt(creditNote.getCreatedAt())
                .build();
    }

    private CreditNote getCreditNoteForStore(UUID storeId, UUID creditNoteId) {
        CreditNote creditNote = creditNoteRepository.findById(creditNoteId)
                .orElseThrow(() -> new IllegalArgumentException("Credit note not found"));
        if (creditNote.getStore() == null || !storeId.equals(creditNote.getStore().getStoreId())) {
            throw new BusinessRuleException("Credit note does not belong to the selected store");
        }
        return creditNote;
    }

    private void requireStatus(CreditNote creditNote, List<String> allowedStatuses, String message) {
        String currentStatus = creditNote.getStatus() == null ? "" : creditNote.getStatus().trim().toUpperCase(Locale.ROOT);
        boolean allowed = allowedStatuses.stream().anyMatch(candidate -> candidate.equalsIgnoreCase(currentStatus));
        if (!allowed) {
            throw new BusinessRuleException(message);
        }
    }

    private String resolveCnNumber(Store store, String cnNumber) {
        if (cnNumber != null && !cnNumber.isBlank()) {
            return cnNumber.trim();
        }
        String storeCode = store.getStoreCode() == null ? "STORE" : store.getStoreCode().replaceAll("[^A-Za-z0-9]", "");
        return storeCode + "/CN/" + System.currentTimeMillis();
    }

    private String resolveUnitType(String unitType) {
        return unitType == null || unitType.isBlank() ? "STRIP" : unitType.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeType(String cnType) {
        if (cnType == null || cnType.isBlank()) {
            return "VENDOR_RETURN";
        }
        return cnType.trim().toUpperCase(Locale.ROOT);
    }

    private PharmaUser getCurrentPharmaUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return pharmaUserRepository.findByUsername(authentication.getName()).orElse(null);
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String trim(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
