package com.pharmaflow.procurement;

import com.pharmaflow.audit.AuditLogService;
import com.pharmaflow.auth.CurrentPharmaUserService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.medicine.MedicineRepository;
import com.pharmaflow.procurement.dto.PurchaseOrderSummaryResponse;
import com.pharmaflow.procurement.dto.ReorderDraftRequest;
import com.pharmaflow.procurement.dto.ReorderDraftResponse;
import com.pharmaflow.procurement.dto.SupplierCreateRequest;
import com.pharmaflow.procurement.dto.SupplierResponse;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import com.pharmaflow.store.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProcurementService {

    private final PharmaSupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final PurchaseOrderPlanLineRepository purchaseOrderPlanLineRepository;
    private final MedicineRepository medicineRepository;
    private final StoreRepository storeRepository;
    private final StoreService storeService;
    private final CurrentPharmaUserService currentPharmaUserService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<SupplierResponse> listSuppliers() {
        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();
        List<UUID> accessibleStoreIds = storeService.getAccessibleStoresForUser(currentUser).stream()
                .map(Store::getStoreId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        Map<UUID, SupplierMetrics> metricsBySupplier = buildSupplierMetrics(accessibleStoreIds);

        return supplierRepository.findAllByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(supplier -> toSupplierResponse(supplier, metricsBySupplier.get(supplier.getSupplierId())))
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
                        .defaultLeadTimeDays(normalizeLeadTimeDays(request.getDefaultLeadTimeDays()))
                        .isActive(true)
                        .build()
        );
        return toSupplierResponse(supplier, null);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderSummaryResponse> listPurchaseOrders(UUID storeId, int limit) {
        Store store = storeService.requireAccessibleStore(storeId);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<PurchaseOrder> orders = purchaseOrderRepository.findByStoreStoreIdOrderByPoDateDesc(
                store.getStoreId(),
                PageRequest.of(0, safeLimit)
        );

        List<UUID> purchaseOrderIds = orders.stream()
                .map(PurchaseOrder::getPoId)
                .collect(Collectors.toList());

        Map<UUID, List<PurchaseOrderItem>> receiptLinesByOrder = purchaseOrderIds.isEmpty()
                ? Map.of()
                : purchaseOrderItemRepository.findByPurchaseOrderPoIdIn(purchaseOrderIds)
                        .stream()
                        .collect(Collectors.groupingBy(line -> line.getPurchaseOrder().getPoId(), LinkedHashMap::new, Collectors.toList()));

        Map<UUID, List<PurchaseOrderPlanLine>> plannedLinesByOrder = purchaseOrderIds.isEmpty()
                ? Map.of()
                : purchaseOrderPlanLineRepository.findByPurchaseOrderPoIdIn(purchaseOrderIds)
                        .stream()
                        .collect(Collectors.groupingBy(line -> line.getPurchaseOrder().getPoId(), LinkedHashMap::new, Collectors.toList()));

        return orders.stream()
                .map(order -> {
                    LineSummary summary = buildLineSummary(
                            order,
                            receiptLinesByOrder.getOrDefault(order.getPoId(), List.of()),
                            plannedLinesByOrder.getOrDefault(order.getPoId(), List.of())
                    );
                    return PurchaseOrderSummaryResponse.builder()
                            .purchaseOrderId(order.getPoId())
                            .poNumber(order.getPoNumber())
                            .poDate(order.getPoDate())
                            .receivedAt(order.getReceivedAt())
                            .invoiceNumber(order.getInvoiceNumber())
                            .supplierName(order.getSupplier() != null ? order.getSupplier().getName() : null)
                            .createdByName(order.getCreatedBy() != null ? order.getCreatedBy().getFullName() : null)
                            .status(order.getStatus())
                            .orderType(order.getOrderType())
                            .supplierReference(order.getSupplierReference())
                            .expectedDeliveryDate(order.getExpectedDeliveryDate())
                            .notes(order.getNotes())
                            .itemCount(summary.itemCount)
                            .summaryText(summary.summaryText)
                            .subtotal(order.getSubtotal())
                            .totalAmount(order.getTotalAmount())
                            .build();
                })
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
        SupplierMetrics supplierMetrics = buildSupplierMetrics(resolveTenantStoreIds(store)).get(
                supplier != null ? supplier.getSupplierId() : null
        );
        int supplierLeadTimeDays = resolveEffectiveLeadTimeDays(supplier, supplierMetrics);
        BigDecimal lineSubtotal = purchaseRate.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal gstRate = safe(medicine.getGstRate());
        BigDecimal totalGst = lineSubtotal.multiply(gstRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal halfGst = totalGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        LocalDate expectedDeliveryDate = request.getExpectedDeliveryDate() != null
                ? request.getExpectedDeliveryDate()
                : LocalDate.now().plusDays(supplierLeadTimeDays);
        String notes = trim(request.getNotes());
        if (notes == null) {
            notes = "Created from replenishment desk";
        }

        PurchaseOrder purchaseOrder = purchaseOrderRepository.save(
                PurchaseOrder.builder()
                        .store(store)
                        .supplier(supplier)
                        .poNumber(generateDraftPoNumber())
                        .poDate(LocalDateTime.now())
                        .orderType("PLANNED_ORDER")
                        .expectedDeliveryDate(expectedDeliveryDate)
                        .status("PLANNED")
                        .notes(notes)
                        .subtotal(lineSubtotal)
                        .cgstAmount(halfGst)
                        .sgstAmount(totalGst.subtract(halfGst))
                        .totalAmount(lineSubtotal.add(totalGst))
                        .createdBy(currentUser)
                        .build()
        );

        purchaseOrderPlanLineRepository.save(
                PurchaseOrderPlanLine.builder()
                        .purchaseOrder(purchaseOrder)
                        .medicine(medicine)
                        .quantity(quantity)
                        .quantityLoose(0)
                        .purchaseRate(purchaseRate)
                        .mrp(safe(medicine.getMrp()))
                        .gstRate(gstRate)
                        .medicineForm(medicine.getMedicineForm())
                        .packSize(medicine.getPackSize())
                        .packSizeLabel(medicine.getPackSizeLabel())
                        .notes("Suggested reorder")
                        .build()
        );

        auditLogService.log(
                store,
                currentUser,
                "REORDER_DRAFT_CREATED",
                "PURCHASE_ORDER",
                purchaseOrder.getPoId().toString(),
                null,
                "{\"medicine\":\"" + medicine.getBrandName() + "\",\"quantity\":\"" + quantity
                        + "\",\"expectedDeliveryDate\":\"" + expectedDeliveryDate + "\"}"
        );

        return ReorderDraftResponse.builder()
                .purchaseOrderId(purchaseOrder.getPoId())
                .poNumber(purchaseOrder.getPoNumber())
                .poDate(purchaseOrder.getPoDate())
                .expectedDeliveryDate(purchaseOrder.getExpectedDeliveryDate())
                .status(purchaseOrder.getStatus())
                .orderType(purchaseOrder.getOrderType())
                .storeId(store.getStoreId())
                .storeCode(store.getStoreCode())
                .medicineId(medicine.getMedicineId())
                .brandName(medicine.getBrandName())
                .supplierId(supplier != null ? supplier.getSupplierId() : null)
                .supplierName(supplier != null ? supplier.getName() : null)
                .supplierLeadTimeDays(supplierLeadTimeDays)
                .quantity(quantity)
                .itemCount(1)
                .purchaseRate(purchaseRate)
                .mrp(safe(medicine.getMrp()))
                .gstRate(gstRate)
                .subtotal(purchaseOrder.getSubtotal())
                .totalAmount(purchaseOrder.getTotalAmount())
                .notes(purchaseOrder.getNotes())
                .build();
    }

    private SupplierResponse toSupplierResponse(Supplier supplier, SupplierMetrics metrics) {
        return SupplierResponse.builder()
                .supplierId(supplier.getSupplierId())
                .name(supplier.getName())
                .contact(supplier.getContact())
                .phone(supplier.getPhone())
                .email(supplier.getEmail())
                .gstin(supplier.getGstin())
                .drugLicense(supplier.getDrugLicense())
                .address(supplier.getAddress())
                .defaultLeadTimeDays(normalizeLeadTimeDays(supplier.getDefaultLeadTimeDays()))
                .observedLeadTimeDays(metrics != null ? metrics.getObservedLeadTimeDays() : null)
                .effectiveLeadTimeDays(resolveEffectiveLeadTimeDays(supplier, metrics))
                .leadTimeSampleCount(metrics != null ? metrics.leadTimeSampleCount : 0)
                .lastLeadTimeDays(metrics != null ? metrics.lastLeadTimeDays : null)
                .openPurchaseOrderCount(metrics != null ? metrics.openPurchaseOrderCount : 0)
                .receivedPurchaseOrderCount(metrics != null ? metrics.receivedPurchaseOrderCount : 0)
                .lastOrderDate(metrics != null ? metrics.lastOrderDate : null)
                .lastReceiptDate(metrics != null ? metrics.lastReceiptDate : null)
                .receivedValue(metrics != null ? metrics.receivedValue : BigDecimal.ZERO)
                .build();
    }

    private Map<UUID, SupplierMetrics> buildSupplierMetrics(List<UUID> storeIds) {
        if (storeIds.isEmpty()) {
            return Map.of();
        }

        Map<UUID, SupplierMetrics> metricsBySupplier = new LinkedHashMap<>();
        for (PurchaseOrder purchaseOrder : purchaseOrderRepository.findByStoreStoreIdInOrderByPoDateDesc(storeIds)) {
            if (purchaseOrder.getSupplier() == null || purchaseOrder.getSupplier().getSupplierId() == null) {
                continue;
            }
            SupplierMetrics metrics = metricsBySupplier.computeIfAbsent(
                    purchaseOrder.getSupplier().getSupplierId(),
                    ignored -> new SupplierMetrics()
            );
            metrics.lastOrderDate = max(metrics.lastOrderDate, purchaseOrder.getPoDate());
            if ("RECEIVED".equalsIgnoreCase(purchaseOrder.getStatus())) {
                metrics.receivedPurchaseOrderCount++;
                LocalDateTime receiptDate = purchaseOrder.getReceivedAt() != null
                        ? purchaseOrder.getReceivedAt()
                        : purchaseOrder.getPoDate();
                metrics.lastReceiptDate = max(metrics.lastReceiptDate, receiptDate);
                metrics.receivedValue = safe(metrics.receivedValue).add(safe(purchaseOrder.getTotalAmount()));
                Integer leadTimeDays = calculateLeadTimeDays(purchaseOrder.getPoDate(), receiptDate);
                if (leadTimeDays != null) {
                    metrics.leadTimeDayTotal += leadTimeDays;
                    metrics.leadTimeSampleCount++;
                    metrics.lastLeadTimeDays = leadTimeDays;
                }
            } else if (!"CANCELLED".equalsIgnoreCase(purchaseOrder.getStatus())) {
                metrics.openPurchaseOrderCount++;
            }
        }
        return metricsBySupplier;
    }

    private LineSummary buildLineSummary(PurchaseOrder order,
                                         List<PurchaseOrderItem> receiptLines,
                                         List<PurchaseOrderPlanLine> plannedLines) {
        if (!receiptLines.isEmpty() && "RECEIVED".equalsIgnoreCase(order.getStatus())) {
            PurchaseOrderItem firstLine = receiptLines.get(0);
            return new LineSummary(
                    receiptLines.size(),
                    buildSummaryText(
                            firstLine.getMedicine() != null ? firstLine.getMedicine().getBrandName() : "Receipt line",
                            firstLine.getQuantity(),
                            firstLine.getQuantityLoose(),
                            receiptLines.size()
                    )
            );
        }
        if (!plannedLines.isEmpty()) {
            PurchaseOrderPlanLine firstLine = plannedLines.get(0);
            return new LineSummary(
                    plannedLines.size(),
                    buildSummaryText(
                            firstLine.getMedicine() != null ? firstLine.getMedicine().getBrandName() : "Planned line",
                            firstLine.getQuantity(),
                            firstLine.getQuantityLoose(),
                            plannedLines.size()
                    )
            );
        }
        if (!receiptLines.isEmpty()) {
            PurchaseOrderItem firstLine = receiptLines.get(0);
            return new LineSummary(
                    receiptLines.size(),
                    buildSummaryText(
                            firstLine.getMedicine() != null ? firstLine.getMedicine().getBrandName() : "Receipt line",
                            firstLine.getQuantity(),
                            firstLine.getQuantityLoose(),
                            receiptLines.size()
                    )
            );
        }
        return new LineSummary(0, "No line items");
    }

    private String buildSummaryText(String medicineName, Integer quantity, Integer quantityLoose, int itemCount) {
        if (itemCount <= 0) {
            return "No line items";
        }
        if (itemCount == 1) {
            return medicineName + " x " + describeQuantity(quantity, quantityLoose);
        }
        return medicineName + " + " + (itemCount - 1) + " more";
    }

    private String describeQuantity(Integer quantity, Integer quantityLoose) {
        int packQty = quantity == null ? 0 : quantity;
        int looseQty = quantityLoose == null ? 0 : quantityLoose;
        if (packQty > 0 && looseQty > 0) {
            return packQty + " packs + " + looseQty + " loose";
        }
        if (looseQty > 0) {
            return looseQty + " loose";
        }
        return packQty + " packs";
    }

    private String trim(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Supplier resolveSupplier(Store store, Medicine medicine, UUID supplierId) {
        if (supplierId != null) {
            return supplierRepository.findById(supplierId)
                    .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
        }

        ProcurementReference recentReference = resolveRecentProcurementReference(store, medicine);
        if (recentReference.supplier != null) {
            return recentReference.supplier;
        }

        return supplierRepository.findAllByIsActiveTrueOrderByNameAsc()
                .stream()
                .findFirst()
                .orElse(null);
    }

    private BigDecimal resolvePurchaseRate(Store store, Medicine medicine) {
        ProcurementReference recentReference = resolveRecentProcurementReference(store, medicine);
        if (recentReference.purchaseRate != null) {
            return recentReference.purchaseRate;
        }
        return medicine.getPtr() != null
                ? medicine.getPtr()
                : medicine.getPts() != null ? medicine.getPts() : safe(medicine.getMrp());
    }

    private ProcurementReference resolveRecentProcurementReference(Store store, Medicine medicine) {
        ReceivedProcurementReference receivedReference = purchaseOrderItemRepository.findRecentByTenantAndMedicine(
                        store.getTenant().getTenantId(),
                        medicine.getMedicineId(),
                        PageRequest.of(0, 1)
                )
                .stream()
                .findFirst()
                .map(item -> new ReceivedProcurementReference(
                        item.getPurchaseOrder().getPoDate(),
                        item.getPurchaseOrder().getSupplier(),
                        item.getPurchaseRate()
                ))
                .orElse(null);

        ReceivedProcurementReference plannedReference = purchaseOrderPlanLineRepository.findRecentByTenantAndMedicine(
                        store.getTenant().getTenantId(),
                        medicine.getMedicineId(),
                        PageRequest.of(0, 1)
                )
                .stream()
                .findFirst()
                .map(line -> new ReceivedProcurementReference(
                        line.getPurchaseOrder().getPoDate(),
                        line.getPurchaseOrder().getSupplier(),
                        line.getPurchaseRate()
                ))
                .orElse(null);

        return pickLatest(receivedReference, plannedReference);
    }

    private ProcurementReference pickLatest(ReceivedProcurementReference left, ReceivedProcurementReference right) {
        if (left == null && right == null) {
            return new ProcurementReference(null, null);
        }
        if (left == null) {
            return new ProcurementReference(right.supplier, right.purchaseRate);
        }
        if (right == null) {
            return new ProcurementReference(left.supplier, left.purchaseRate);
        }
        return Comparator.comparing((ReceivedProcurementReference candidate) -> candidate.poDate,
                        Comparator.nullsLast(LocalDateTime::compareTo))
                .compare(left, right) >= 0
                ? new ProcurementReference(left.supplier, left.purchaseRate)
                : new ProcurementReference(right.supplier, right.purchaseRate);
    }

    private String generateDraftPoNumber() {
        String candidate;
        do {
            candidate = "PO-PLAN-" + System.currentTimeMillis();
        } while (purchaseOrderRepository.existsByPoNumber(candidate));
        return candidate;
    }

    private List<UUID> resolveTenantStoreIds(Store store) {
        if (store == null || store.getTenant() == null || store.getTenant().getTenantId() == null) {
            return List.of();
        }
        return storeRepository.findAllByTenantTenantIdAndIsActiveTrueOrderByStoreNameAsc(store.getTenant().getTenantId())
                .stream()
                .map(Store::getStoreId)
                .collect(Collectors.toList());
    }

    private Integer normalizeLeadTimeDays(Integer value) {
        if (value == null || value <= 0) {
            return null;
        }
        return value;
    }

    private Integer calculateLeadTimeDays(LocalDateTime orderedAt, LocalDateTime receivedAt) {
        if (orderedAt == null || receivedAt == null) {
            return null;
        }
        long days = ChronoUnit.DAYS.between(orderedAt.toLocalDate(), receivedAt.toLocalDate());
        return (int) Math.max(days, 0);
    }

    private int resolveEffectiveLeadTimeDays(Supplier supplier, SupplierMetrics metrics) {
        Integer configured = supplier != null ? normalizeLeadTimeDays(supplier.getDefaultLeadTimeDays()) : null;
        if (configured != null) {
            return configured;
        }
        Integer observed = metrics != null ? metrics.getObservedLeadTimeDays() : null;
        if (observed != null && observed > 0) {
            return observed;
        }
        return 2;
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private LocalDateTime max(LocalDateTime current, LocalDateTime candidate) {
        if (current == null) {
            return candidate;
        }
        if (candidate == null) {
            return current;
        }
        return current.isAfter(candidate) ? current : candidate;
    }

    private static final class SupplierMetrics {
        private int openPurchaseOrderCount;
        private int receivedPurchaseOrderCount;
        private LocalDateTime lastOrderDate;
        private LocalDateTime lastReceiptDate;
        private BigDecimal receivedValue = BigDecimal.ZERO;
        private int leadTimeSampleCount;
        private int leadTimeDayTotal;
        private Integer lastLeadTimeDays;

        private Integer getObservedLeadTimeDays() {
            if (leadTimeSampleCount <= 0) {
                return null;
            }
            return (int) Math.round((double) leadTimeDayTotal / (double) leadTimeSampleCount);
        }
    }

    private static final class LineSummary {
        private final int itemCount;
        private final String summaryText;

        private LineSummary(int itemCount, String summaryText) {
            this.itemCount = itemCount;
            this.summaryText = summaryText;
        }
    }

    private static final class ProcurementReference {
        private final Supplier supplier;
        private final BigDecimal purchaseRate;

        private ProcurementReference(Supplier supplier, BigDecimal purchaseRate) {
            this.supplier = supplier;
            this.purchaseRate = purchaseRate;
        }
    }

    private static final class ReceivedProcurementReference {
        private final LocalDateTime poDate;
        private final Supplier supplier;
        private final BigDecimal purchaseRate;

        private ReceivedProcurementReference(LocalDateTime poDate, Supplier supplier, BigDecimal purchaseRate) {
            this.poDate = poDate;
            this.supplier = supplier;
            this.purchaseRate = purchaseRate;
        }
    }
}
