package com.pharmaflow.procurement;

import com.pharmaflow.audit.AuditLogService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.auth.PharmaUserRepository;
import com.pharmaflow.billing.Invoice;
import com.pharmaflow.billing.InvoiceRepository;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.inventory.InventoryBatch;
import com.pharmaflow.inventory.InventoryBatchRepository;
import com.pharmaflow.inventory.InventoryService;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.medicine.MedicineRepository;
import com.pharmaflow.procurement.dto.CreditNoteCreateRequest;
import com.pharmaflow.procurement.dto.CreditNoteItemRequest;
import com.pharmaflow.procurement.dto.CreditNoteResponse;
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
    private final InventoryService inventoryService;
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
                .cnType(request.getCnType() == null || request.getCnType().isBlank() ? "VENDOR_RETURN" : request.getCnType())
                .status("PENDING")
                .notes(request.getNotes())
                .createdBy(currentUser)
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

            inventoryService.deductStock(batch.getBatchId(), itemRequest.getQuantity(), resolveUnitType(itemRequest.getUnitType()));

            BigDecimal lineMrp = itemRequest.getMrp() != null ? itemRequest.getMrp() : safe(batch.getMrp());
            BigDecimal lineTotal = lineMrp.multiply(safe(itemRequest.getQuantity()));
            totalAmount = totalAmount.add(lineTotal);

            creditNoteItemRepository.save(
                    CreditNoteItem.builder()
                            .creditNote(creditNote)
                            .medicine(medicine)
                            .batch(batch)
                            .quantity(itemRequest.getQuantity())
                            .mrp(lineMrp)
                            .reason(itemRequest.getReason())
                            .build()
            );
        }

        creditNote.setTotalAmount(totalAmount);
        creditNoteRepository.save(creditNote);

        auditLogService.log(
                store,
                currentUser,
                "CREDIT_NOTE_CREATED",
                "CREDIT_NOTE",
                creditNote.getCnId().toString(),
                null,
                "{\"cnNumber\":\"" + creditNote.getCnNumber() + "\",\"totalAmount\":\"" + totalAmount + "\"}"
        );

        return toResponse(creditNote);
    }

    private CreditNoteResponse toResponse(CreditNote creditNote) {
        return CreditNoteResponse.builder()
                .creditNoteId(creditNote.getCnId())
                .cnNumber(creditNote.getCnNumber())
                .cnType(creditNote.getCnType())
                .status(creditNote.getStatus())
                .supplierId(creditNote.getSupplierId())
                .originalInvoiceId(creditNote.getOriginalInvoice() != null ? creditNote.getOriginalInvoice().getInvoiceId() : null)
                .totalAmount(creditNote.getTotalAmount())
                .notes(creditNote.getNotes())
                .createdAt(creditNote.getCreatedAt())
                .build();
    }

    private String resolveCnNumber(Store store, String cnNumber) {
        if (cnNumber != null && !cnNumber.isBlank()) {
            return cnNumber.trim();
        }
        String storeCode = store.getStoreCode() == null ? "STORE" : store.getStoreCode().replaceAll("[^A-Za-z0-9]", "");
        return storeCode + "/CN/" + System.currentTimeMillis();
    }

    private String resolveUnitType(String unitType) {
        return unitType == null || unitType.isBlank() ? "STRIP" : unitType;
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
}
