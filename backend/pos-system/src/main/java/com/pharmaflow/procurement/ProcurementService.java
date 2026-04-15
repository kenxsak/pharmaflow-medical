package com.pharmaflow.procurement;

import com.pharmaflow.audit.AuditLogService;
import com.pharmaflow.auth.CurrentPharmaUserService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.medicine.MedicineRepository;
import com.pharmaflow.procurement.dto.ReorderDraftRequest;
import com.pharmaflow.procurement.dto.ReorderDraftResponse;
import com.pharmaflow.procurement.dto.PurchaseOrderSummaryResponse;
import com.pharmaflow.procurement.dto.SupplierCreateRequest;
import com.pharmaflow.procurement.dto.SupplierResponse;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProcurementService {

    private final PharmaSupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final MedicineRepository medicineRepository;
    private final StoreService storeService;
    private final CurrentPharmaUserService currentPharmaUserService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<SupplierResponse> listSuppliers() {
        return supplierRepository.findAllByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toSupplierResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierCreateRequest request) {
        supplierRepository.findFirstByNameIgnoreCase(request.getName())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Supplier already exists with name " + request.getName());
                });

        Supplier supplier = supplierRepository.save(
                Supplier.builder()
                        .name(request.getName().trim())
                        .contact(trim(request.getContact()))
                        .phone(trim(request.getPhone()))
                        .email(trim(request.getEmail()))
                        .gstin(trim(request.getGstin()))
                        .drugLicense(trim(request.getDrugLicense()))
                        .address(trim(request.getAddress()))
                        .isActive(true)
                        .build()
        );
        return toSupplierResponse(supplier);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderSummaryResponse> listPurchaseOrders(java.util.UUID storeId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return purchaseOrderRepository.findByStoreStoreIdOrderByPoDateDesc(storeId, PageRequest.of(0, safeLimit))
                .stream()
                .map(order -> PurchaseOrderSummaryResponse.builder()
                        .purchaseOrderId(order.getPoId())
                        .poNumber(order.getPoNumber())
                        .poDate(order.getPoDate())
                        .invoiceNumber(order.getInvoiceNumber())
                        .supplierName(order.getSupplier() != null ? order.getSupplier().getName() : null)
                        .createdByName(order.getCreatedBy() != null ? order.getCreatedBy().getFullName() : null)
                        .status(order.getStatus())
                        .subtotal(order.getSubtotal())
                        .totalAmount(order.getTotalAmount())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public ReorderDraftResponse createReorderDraft(ReorderDraftRequest request) {
        Store store = storeService.requireAccessibleStore(request.getStoreId());
        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found"));
        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();

        int quantity = request.getQuantity() == null ? 0 : request.getQuantity();
        if (quantity <= 0) {
            throw new BusinessRuleException("Draft reorder quantity must be at least 1 pack");
        }

        Supplier supplier = resolveSupplier(store, medicine, request.getSupplierId());
        BigDecimal purchaseRate = resolvePurchaseRate(store, medicine);
        BigDecimal lineSubtotal = purchaseRate.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal gstRate = safe(medicine.getGstRate());
        BigDecimal totalGst = lineSubtotal.multiply(gstRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal halfGst = totalGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);

        PurchaseOrder purchaseOrder = purchaseOrderRepository.save(
                PurchaseOrder.builder()
                        .store(store)
                        .supplier(supplier)
                        .poNumber(generateDraftPoNumber())
                        .poDate(LocalDateTime.now())
                        .invoiceNumber("DRAFT-REORDER")
                        .status("DRAFT")
                        .subtotal(lineSubtotal)
                        .cgstAmount(halfGst)
                        .sgstAmount(totalGst.subtract(halfGst))
                        .totalAmount(lineSubtotal.add(totalGst))
                        .createdBy(currentUser)
                        .build()
        );

        purchaseOrderItemRepository.save(
                PurchaseOrderItem.builder()
                        .purchaseOrder(purchaseOrder)
                        .medicine(medicine)
                        .batchNumber("PLANNED")
                        .expiryDate(LocalDate.now().plusYears(2))
                        .quantity(quantity)
                        .quantityLoose(0)
                        .freeQty(0)
                        .freeQtyLoose(0)
                        .purchaseRate(purchaseRate)
                        .mrp(safe(medicine.getMrp()))
                        .gstRate(gstRate)
                        .build()
        );

        auditLogService.log(
                store,
                currentUser,
                "REORDER_DRAFT_CREATED",
                "PURCHASE_ORDER",
                purchaseOrder.getPoId().toString(),
                null,
                "{\"medicine\":\"" + medicine.getBrandName() + "\",\"quantity\":\"" + quantity + "\"}"
        );

        return ReorderDraftResponse.builder()
                .purchaseOrderId(purchaseOrder.getPoId())
                .poNumber(purchaseOrder.getPoNumber())
                .poDate(purchaseOrder.getPoDate())
                .status(purchaseOrder.getStatus())
                .storeId(store.getStoreId())
                .storeCode(store.getStoreCode())
                .medicineId(medicine.getMedicineId())
                .brandName(medicine.getBrandName())
                .supplierId(supplier != null ? supplier.getSupplierId() : null)
                .supplierName(supplier != null ? supplier.getName() : null)
                .quantity(quantity)
                .purchaseRate(purchaseRate)
                .mrp(safe(medicine.getMrp()))
                .gstRate(gstRate)
                .subtotal(purchaseOrder.getSubtotal())
                .totalAmount(purchaseOrder.getTotalAmount())
                .build();
    }

    private SupplierResponse toSupplierResponse(Supplier supplier) {
        return SupplierResponse.builder()
                .supplierId(supplier.getSupplierId())
                .name(supplier.getName())
                .contact(supplier.getContact())
                .phone(supplier.getPhone())
                .email(supplier.getEmail())
                .gstin(supplier.getGstin())
                .drugLicense(supplier.getDrugLicense())
                .address(supplier.getAddress())
                .build();
    }

    private String trim(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Supplier resolveSupplier(Store store, Medicine medicine, java.util.UUID supplierId) {
        if (supplierId != null) {
            return supplierRepository.findById(supplierId)
                    .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
        }

        return purchaseOrderItemRepository.findRecentByTenantAndMedicine(
                        store.getTenant().getTenantId(),
                        medicine.getMedicineId(),
                        PageRequest.of(0, 1)
                )
                .stream()
                .map(PurchaseOrderItem::getPurchaseOrder)
                .map(PurchaseOrder::getSupplier)
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElseGet(() -> supplierRepository.findAllByIsActiveTrueOrderByNameAsc()
                        .stream()
                        .findFirst()
                        .orElse(null));
    }

    private BigDecimal resolvePurchaseRate(Store store, Medicine medicine) {
        return purchaseOrderItemRepository.findRecentByTenantAndMedicine(
                        store.getTenant().getTenantId(),
                        medicine.getMedicineId(),
                        PageRequest.of(0, 1)
                )
                .stream()
                .map(PurchaseOrderItem::getPurchaseRate)
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElseGet(() -> medicine.getPtr() != null
                        ? medicine.getPtr()
                        : medicine.getPts() != null ? medicine.getPts() : safe(medicine.getMrp()));
    }

    private String generateDraftPoNumber() {
        String candidate;
        do {
            candidate = "PO-DRAFT-" + System.currentTimeMillis();
        } while (purchaseOrderRepository.existsByPoNumber(candidate));
        return candidate;
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
