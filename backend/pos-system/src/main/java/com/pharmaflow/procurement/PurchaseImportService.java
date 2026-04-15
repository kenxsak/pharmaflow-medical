package com.pharmaflow.procurement;

import com.pharmaflow.audit.AuditLogService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.auth.PharmaUserRepository;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.inventory.InventoryBatch;
import com.pharmaflow.inventory.InventoryBatchRepository;
import com.pharmaflow.inventory.InventoryMovementService;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.medicine.MedicineRepository;
import com.pharmaflow.procurement.dto.PurchaseImportRequest;
import com.pharmaflow.procurement.dto.PurchaseImportResponse;
import com.pharmaflow.procurement.dto.PurchaseImportRowRequest;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseImportService {

    private final StoreRepository storeRepository;
    private final PharmaSupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final PurchaseOrderPlanLineRepository purchaseOrderPlanLineRepository;
    private final PurchaseReceiptRepository purchaseReceiptRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final MedicineRepository medicineRepository;
    private final PharmaUserRepository pharmaUserRepository;
    private final AuditLogService auditLogService;
    private final InventoryMovementService inventoryMovementService;

    @Transactional
    public PurchaseImportResponse importPurchaseInvoice(UUID storeId, PurchaseImportRequest request) {
        if (request.getRows() == null || request.getRows().isEmpty()) {
            throw new IllegalArgumentException("Purchase import must contain at least one row");
        }
        if (request.getSupplierId() == null) {
            throw new IllegalArgumentException("Supplier is required for purchase import");
        }
        if (request.getInvoiceNumber() == null || request.getInvoiceNumber().isBlank()) {
            throw new IllegalArgumentException("Supplier invoice number is required for purchase import");
        }
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found"));
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
        PharmaUser currentUser = getCurrentPharmaUser();

        List<UUID> medicineIds = request.getRows().stream()
                .map(PurchaseImportRowRequest::getMedicineId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
        Map<UUID, Medicine> medicinesById = medicineRepository.findAllById(medicineIds).stream()
                .collect(Collectors.toMap(Medicine::getMedicineId, Function.identity()));

        ResolvedPurchaseOrder resolvedPurchaseOrder = resolvePurchaseOrder(store, supplier, request, currentUser);
        PurchaseOrder purchaseOrder = resolvedPurchaseOrder.purchaseOrder;
        validateDuplicateRows(request.getRows());
        LocalDateTime receiptTime = request.getPurchaseDate() != null ? request.getPurchaseDate() : LocalDateTime.now();
        PurchaseReceipt purchaseReceipt = purchaseReceiptRepository.save(
                PurchaseReceipt.builder()
                        .purchaseOrder(purchaseOrder)
                        .receiptNumber(generateReceiptNumber(store))
                        .supplierInvoiceNumber(request.getInvoiceNumber())
                        .receiptDate(receiptTime)
                        .status("RECEIVED")
                        .notes(resolvedPurchaseOrder.linkedToExistingPlan
                                ? "Logged against planned purchase order"
                                : "Direct inward receipt")
                        .createdBy(currentUser)
                        .build()
        );
        List<PurchaseOrderPlanLine> plannedLines = resolvedPurchaseOrder.linkedToExistingPlan
                ? purchaseOrderPlanLineRepository.findByPurchaseOrderPoId(purchaseOrder.getPoId())
                : List.of();
        List<PurchaseOrderItem> receiptLines = resolvedPurchaseOrder.linkedToExistingPlan
                ? new ArrayList<>(purchaseOrderItemRepository.findByPurchaseOrderPoIdIn(List.of(purchaseOrder.getPoId())))
                : new ArrayList<>();
        if (resolvedPurchaseOrder.linkedToExistingPlan) {
            validateAgainstPlannedOrder(request.getRows(), medicinesById, plannedLines, receiptLines);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalGst = BigDecimal.ZERO;
        int createdBatches = 0;
        int updatedBatches = 0;

        for (PurchaseImportRowRequest row : request.getRows()) {
            Medicine medicine = resolveMedicine(row, medicinesById);
            int freeQty = row.getFreeQty() == null ? 0 : row.getFreeQty();
            int quantityLoose = row.getQuantityLoose() == null ? 0 : row.getQuantityLoose();
            int freeQtyLoose = row.getFreeQtyLoose() == null ? 0 : row.getFreeQtyLoose();
            int receivedQuantity = row.getQuantity() + freeQty;
            int receivedLooseQuantity = quantityLoose + freeQtyLoose;
            validateRowQuantities(row, receivedQuantity, receivedLooseQuantity, medicine);

            InventoryBatch batch = inventoryBatchRepository
                    .findByStoreAndMedicineAndBatchNumberForUpdate(
                            storeId,
                            medicine.getMedicineId(),
                            row.getBatchNumber()
                    )
                    .orElse(null);

            if (batch == null) {
                batch = InventoryBatch.builder()
                        .store(store)
                        .medicine(medicine)
                        .batchNumber(row.getBatchNumber())
                        .manufactureDate(row.getManufactureDate())
                        .expiryDate(row.getExpiryDate())
                        .quantityStrips(0)
                        .quantityLoose(0)
                        .purchaseRate(row.getPurchaseRate())
                        .mrp(row.getMrp())
                        .isActive(true)
                        .inventoryState("SELLABLE")
                        .build();
                createdBatches++;
            } else {
                batch.setManufactureDate(row.getManufactureDate());
                batch.setExpiryDate(row.getExpiryDate());
                batch.setPurchaseRate(row.getPurchaseRate());
                batch.setMrp(row.getMrp());
                batch.setIsActive(true);
                updatedBatches++;
            }
            batch = inventoryBatchRepository.save(batch);

            inventoryMovementService.applyPackLooseDelta(
                    batch.getBatchId(),
                    receivedQuantity,
                    receivedLooseQuantity,
                    "PURCHASE_RECEIPT",
                    "SUPPLIER_INWARD",
                    "PURCHASE_ORDER",
                    purchaseOrder.getPoId().toString(),
                    "Supplier invoice " + request.getInvoiceNumber(),
                    currentUser
            );

            PurchaseOrderItem purchaseOrderItem = purchaseOrderItemRepository.save(
                    PurchaseOrderItem.builder()
                            .purchaseOrder(purchaseOrder)
                            .purchaseReceipt(purchaseReceipt)
                            .medicine(medicine)
                            .batchNumber(row.getBatchNumber())
                            .expiryDate(row.getExpiryDate())
                            .quantity(row.getQuantity())
                            .quantityLoose(quantityLoose)
                            .freeQty(freeQty)
                            .freeQtyLoose(freeQtyLoose)
                            .purchaseRate(row.getPurchaseRate())
                            .mrp(row.getMrp())
                            .gstRate(row.getGstRate() != null ? row.getGstRate() : safe(medicine.getGstRate()))
                            .supplierInvoiceNumber(request.getInvoiceNumber())
                            .receivedAt(receiptTime)
                            .build()
            );
            if (resolvedPurchaseOrder.linkedToExistingPlan) {
                receiptLines.add(purchaseOrderItem);
            }

            BigDecimal lineSubtotal = row.getPurchaseRate().multiply(toPackEquivalentQuantity(medicine, row.getQuantity(), quantityLoose));
            BigDecimal lineGst = lineSubtotal.multiply(row.getGstRate() != null ? row.getGstRate() : safe(medicine.getGstRate()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineSubtotal);
            totalGst = totalGst.add(lineGst);

            auditLogService.log(
                    store,
                    currentUser,
                    "PURCHASE_IMPORT_ROW",
                    "INVENTORY_BATCH",
                    batch.getBatchId().toString(),
                    null,
                    "{\"batchNumber\":\"" + row.getBatchNumber()
                            + "\",\"receivedQty\":\"" + receivedQuantity
                            + "\",\"receivedLooseQty\":\"" + receivedLooseQuantity + "\"}"
            );
        }

        if (resolvedPurchaseOrder.linkedToExistingPlan) {
            ReceiptTotals receiptTotals = calculateReceiptTotals(receiptLines);
            subtotal = receiptTotals.subtotal;
            totalGst = receiptTotals.totalGst;
        }

        BigDecimal halfGst = totalGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        purchaseOrder.setSubtotal(subtotal);
        purchaseOrder.setCgstAmount(halfGst);
        purchaseOrder.setSgstAmount(totalGst.subtract(halfGst));
        purchaseOrder.setTotalAmount(subtotal.add(totalGst));
        purchaseOrderRepository.save(purchaseOrder);

        purchaseReceipt.setSubtotal(purchaseOrder.getSubtotal());
        purchaseReceipt.setCgstAmount(purchaseOrder.getCgstAmount());
        purchaseReceipt.setSgstAmount(purchaseOrder.getSgstAmount());
        purchaseReceipt.setTotalAmount(purchaseOrder.getTotalAmount());

        ReceiptProgress receiptProgress = resolvedPurchaseOrder.linkedToExistingPlan
                ? updatePlannedOrderProgress(purchaseOrder, plannedLines, receiptLines, receiptTime, request.getInvoiceNumber())
                : ReceiptProgress.direct(request.getRows().size(), 1, 1);
        purchaseReceipt.setStatus(receiptProgress.receiptState);
        purchaseReceiptRepository.save(purchaseReceipt);

        return PurchaseImportResponse.builder()
                .purchaseOrderId(purchaseOrder.getPoId())
                .receiptId(purchaseReceipt.getReceiptId())
                .poNumber(purchaseOrder.getPoNumber())
                .receiptNumber(purchaseReceipt.getReceiptNumber())
                .invoiceNumber(purchaseOrder.getInvoiceNumber())
                .status(purchaseOrder.getStatus())
                .orderType(purchaseOrder.getOrderType())
                .linkedToExistingPlan(resolvedPurchaseOrder.linkedToExistingPlan)
                .importedRows(request.getRows().size())
                .createdBatches(createdBatches)
                .updatedBatches(updatedBatches)
                .receiptState(receiptProgress.receiptState)
                .receivedLineCount(receiptProgress.receivedLineCount)
                .pendingLineCount(receiptProgress.pendingLineCount)
                .receiptCount(receiptProgress.receiptCount)
                .invoiceCount(receiptProgress.invoiceCount)
                .subtotal(purchaseOrder.getSubtotal())
                .cgstAmount(purchaseOrder.getCgstAmount())
                .sgstAmount(purchaseOrder.getSgstAmount())
                .totalAmount(purchaseOrder.getTotalAmount())
                .build();
    }

    private Medicine resolveMedicine(PurchaseImportRowRequest row, Map<UUID, Medicine> medicinesById) {
        if (row.getMedicineId() != null) {
            Medicine medicine = medicinesById.get(row.getMedicineId());
            if (medicine == null) {
                throw new BusinessRuleException("Medicine not found for medicineId " + row.getMedicineId());
            }
            return medicine;
        }
        if (row.getBarcode() != null && !row.getBarcode().isBlank()) {
            return medicineRepository.findFirstByBarcodeIgnoreCase(row.getBarcode())
                    .orElseThrow(() -> new BusinessRuleException("Medicine not found for barcode " + row.getBarcode()));
        }
        if (row.getBrandName() != null && !row.getBrandName().isBlank()) {
            return medicineRepository.findFirstByBrandNameIgnoreCase(row.getBrandName())
                    .orElseThrow(() -> new BusinessRuleException("Medicine not found for brand " + row.getBrandName()));
        }
        throw new BusinessRuleException("Each import row must include medicineId, barcode, or brandName");
    }

    private String resolvePoNumber(PurchaseImportRequest request) {
        if (request.getPoNumber() != null && !request.getPoNumber().isBlank()) {
            return request.getPoNumber();
        }
        return "PO-" + System.currentTimeMillis();
    }

    private ResolvedPurchaseOrder resolvePurchaseOrder(Store store,
                                                       Supplier supplier,
                                                       PurchaseImportRequest request,
                                                       PharmaUser currentUser) {
        String poNumber = resolvePoNumber(request);
        PurchaseOrder existingOrder = purchaseOrderRepository.findFirstByStoreStoreIdAndPoNumberIgnoreCase(store.getStoreId(), poNumber);
        if (existingOrder != null) {
            if (!"PLANNED_ORDER".equalsIgnoreCase(existingOrder.getOrderType())) {
                throw new BusinessRuleException("PO number " + poNumber + " already exists for this store");
            }
            if ("CANCELLED".equalsIgnoreCase(existingOrder.getStatus())) {
                throw new BusinessRuleException("Cancelled purchase orders cannot receive inward stock");
            }
            if ("SHORT_CLOSED".equalsIgnoreCase(existingOrder.getStatus())) {
                throw new BusinessRuleException("This planned purchase order was short-closed and can no longer receive inward stock");
            }
            if ("RECEIVED".equalsIgnoreCase(existingOrder.getStatus())) {
                throw new BusinessRuleException("This planned purchase order has already been received");
            }
            if (existingOrder.getSupplier() != null
                    && supplier.getSupplierId() != null
                    && !supplier.getSupplierId().equals(existingOrder.getSupplier().getSupplierId())) {
                throw new BusinessRuleException("Supplier does not match the planned purchase order");
            }

            existingOrder.setSupplier(existingOrder.getSupplier() != null ? existingOrder.getSupplier() : supplier);
            existingOrder.setInvoiceNumber(request.getInvoiceNumber());
            existingOrder.setCreatedBy(existingOrder.getCreatedBy() != null ? existingOrder.getCreatedBy() : currentUser);
            existingOrder.setNotes(trimReceiptNote(existingOrder.getNotes()));
            return new ResolvedPurchaseOrder(purchaseOrderRepository.save(existingOrder), true);
        }

        PurchaseOrder purchaseOrder = PurchaseOrder.builder()
                .store(store)
                .supplier(supplier)
                .poNumber(poNumber)
                .poDate(request.getPurchaseDate() != null ? request.getPurchaseDate() : LocalDateTime.now())
                .invoiceNumber(request.getInvoiceNumber())
                .orderType("DIRECT_RECEIPT")
                .status("RECEIVED")
                .receivedAt(request.getPurchaseDate() != null ? request.getPurchaseDate() : LocalDateTime.now())
                .createdBy(currentUser)
                .notes("Direct inward receipt")
                .build();
        return new ResolvedPurchaseOrder(purchaseOrderRepository.save(purchaseOrder), false);
    }

    private String trimReceiptNote(String value) {
        if (value == null || value.isBlank()) {
            return "Planned order received through inward import";
        }
        if (value.toLowerCase().contains("received")) {
            return value;
        }
        return value + " | Received through inward import";
    }

    private String generateReceiptNumber(Store store) {
        String storeCode = store.getStoreCode() == null || store.getStoreCode().isBlank()
                ? "STORE"
                : store.getStoreCode().replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        String candidate;
        do {
            candidate = "GRN-" + storeCode + "-" + System.currentTimeMillis();
        } while (purchaseReceiptRepository.existsByReceiptNumber(candidate));
        return candidate;
    }

    private void validateAgainstPlannedOrder(List<PurchaseImportRowRequest> rows,
                                             Map<UUID, Medicine> medicinesById,
                                             List<PurchaseOrderPlanLine> plannedLines,
                                             List<PurchaseOrderItem> existingReceiptLines) {
        if (plannedLines.isEmpty()) {
            return;
        }

        Map<UUID, BigDecimal> plannedByMedicine = new HashMap<>();
        for (PurchaseOrderPlanLine planLine : plannedLines) {
            Medicine medicine = planLine.getMedicine();
            if (medicine == null || medicine.getMedicineId() == null) {
                continue;
            }
            plannedByMedicine.merge(
                    medicine.getMedicineId(),
                    toPackEquivalentQuantity(medicine, planLine.getQuantity(), planLine.getQuantityLoose()),
                    BigDecimal::add
            );
        }

        Map<UUID, BigDecimal> receivedByMedicine = new HashMap<>();
        for (PurchaseOrderItem receiptLine : existingReceiptLines) {
            Medicine medicine = receiptLine.getMedicine();
            if (medicine == null || medicine.getMedicineId() == null) {
                continue;
            }
            receivedByMedicine.merge(
                    medicine.getMedicineId(),
                    toPackEquivalentQuantity(medicine, receiptLine.getQuantity(), receiptLine.getQuantityLoose()),
                    BigDecimal::add
            );
        }

        Map<UUID, BigDecimal> importingByMedicine = new HashMap<>();
        for (PurchaseImportRowRequest row : rows) {
            Medicine medicine = resolveMedicine(row, medicinesById);
            importingByMedicine.merge(
                    medicine.getMedicineId(),
                    toPackEquivalentQuantity(
                            medicine,
                            safe(row.getQuantity()) + safe(row.getFreeQty()),
                            safe(row.getQuantityLoose()) + safe(row.getFreeQtyLoose())
                    ),
                    BigDecimal::add
            );
        }

        for (Map.Entry<UUID, BigDecimal> entry : importingByMedicine.entrySet()) {
            BigDecimal plannedQuantity = plannedByMedicine.get(entry.getKey());
            if (plannedQuantity == null) {
                Medicine medicine = medicinesById.get(entry.getKey());
                String medicineName = medicine != null ? medicine.getBrandName() : entry.getKey().toString();
                throw new BusinessRuleException("Medicine " + medicineName + " is not part of the planned purchase order");
            }
            BigDecimal alreadyReceived = receivedByMedicine.getOrDefault(entry.getKey(), BigDecimal.ZERO);
            if (alreadyReceived.add(entry.getValue()).compareTo(plannedQuantity) > 0) {
                Medicine medicine = medicinesById.get(entry.getKey());
                String medicineName = medicine != null ? medicine.getBrandName() : entry.getKey().toString();
                throw new BusinessRuleException("Receipt exceeds planned quantity for " + medicineName);
            }
        }
    }

    private ReceiptProgress updatePlannedOrderProgress(PurchaseOrder purchaseOrder,
                                                       List<PurchaseOrderPlanLine> plannedLines,
                                                       List<PurchaseOrderItem> receiptLines,
                                                       LocalDateTime receiptTime,
                                                       String latestInvoiceNumber) {
        if (plannedLines.isEmpty()) {
            purchaseOrder.setStatus("RECEIVED");
            purchaseOrder.setReceivedAt(receiptTime);
            purchaseOrder.setInvoiceNumber(latestInvoiceNumber);
            purchaseOrderRepository.save(purchaseOrder);
            return ReceiptProgress.direct(receiptLines.size(), countDistinctReceipts(receiptLines), countDistinctInvoices(receiptLines));
        }

        Map<UUID, BigDecimal> receivedByMedicine = new HashMap<>();
        for (PurchaseOrderItem receiptLine : receiptLines) {
            Medicine medicine = receiptLine.getMedicine();
            if (medicine == null || medicine.getMedicineId() == null) {
                continue;
            }
            receivedByMedicine.merge(
                    medicine.getMedicineId(),
                    toPackEquivalentQuantity(medicine, receiptLine.getQuantity(), receiptLine.getQuantityLoose()),
                    BigDecimal::add
            );
        }

        Map<UUID, BigDecimal> remainingByMedicine = new HashMap<>(receivedByMedicine);
        int receivedLineCount = 0;
        int pendingLineCount = 0;

        for (PurchaseOrderPlanLine planLine : plannedLines) {
            Medicine medicine = planLine.getMedicine();
            BigDecimal plannedQuantity = toPackEquivalentQuantity(medicine, planLine.getQuantity(), planLine.getQuantityLoose());
            BigDecimal remainingReceived = medicine != null && medicine.getMedicineId() != null
                    ? remainingByMedicine.getOrDefault(medicine.getMedicineId(), BigDecimal.ZERO)
                    : BigDecimal.ZERO;

            if (remainingReceived.compareTo(BigDecimal.ZERO) <= 0) {
                planLine.setLineStatus("PLANNED");
                pendingLineCount++;
                continue;
            }

            if (remainingReceived.compareTo(plannedQuantity) >= 0) {
                planLine.setLineStatus("RECEIVED");
                receivedLineCount++;
                if (medicine != null && medicine.getMedicineId() != null) {
                    remainingByMedicine.put(medicine.getMedicineId(), remainingReceived.subtract(plannedQuantity));
                }
            } else {
                planLine.setLineStatus("PARTIALLY_RECEIVED");
                receivedLineCount++;
                pendingLineCount++;
                if (medicine != null && medicine.getMedicineId() != null) {
                    remainingByMedicine.put(medicine.getMedicineId(), BigDecimal.ZERO);
                }
            }
        }

        String receiptState = pendingLineCount == 0 ? "RECEIVED" : receivedLineCount > 0 ? "PARTIALLY_RECEIVED" : "PLANNED";
        purchaseOrder.setStatus(receiptState);
        purchaseOrder.setReceivedAt(receiptTime);
        purchaseOrder.setInvoiceNumber(latestInvoiceNumber);
        purchaseOrderPlanLineRepository.saveAll(plannedLines);
        purchaseOrderRepository.save(purchaseOrder);

        int receiptCount = countDistinctReceipts(receiptLines);
        int invoiceCount = countDistinctInvoices(receiptLines);

        return new ReceiptProgress(
                receiptState,
                receivedLineCount,
                pendingLineCount,
                receiptCount,
                invoiceCount
        );
    }

    private ReceiptTotals calculateReceiptTotals(List<PurchaseOrderItem> receiptLines) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalGst = BigDecimal.ZERO;
        for (PurchaseOrderItem receiptLine : receiptLines) {
            Medicine medicine = receiptLine.getMedicine();
            BigDecimal lineSubtotal = safe(receiptLine.getPurchaseRate()).multiply(
                    toPackEquivalentQuantity(medicine, receiptLine.getQuantity(), receiptLine.getQuantityLoose())
            );
            BigDecimal lineGst = lineSubtotal.multiply(safe(receiptLine.getGstRate()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineSubtotal);
            totalGst = totalGst.add(lineGst);
        }
        return new ReceiptTotals(subtotal, totalGst);
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

    private BigDecimal toPackEquivalentQuantity(Medicine medicine, Integer quantity, Integer quantityLoose) {
        int packSize = safePackSize(medicine);
        BigDecimal packQuantity = BigDecimal.valueOf(safe(quantity));
        BigDecimal looseEquivalent = BigDecimal.valueOf(safe(quantityLoose))
                .divide(BigDecimal.valueOf(packSize), 4, RoundingMode.HALF_UP);
        return packQuantity.add(looseEquivalent).setScale(4, RoundingMode.HALF_UP);
    }

    private void validateRowQuantities(PurchaseImportRowRequest row,
                                       int receivedQuantity,
                                       int receivedLooseQuantity,
                                       Medicine medicine) {
        if (row.getQuantity() == null || row.getQuantity() < 0) {
            throw new BusinessRuleException("Purchase quantity must be zero or greater");
        }
        if (safe(row.getFreeQty()) < 0) {
            throw new BusinessRuleException("Free purchase quantity cannot be negative");
        }
        if (safe(row.getQuantityLoose()) < 0) {
            throw new BusinessRuleException("Loose quantity cannot be negative");
        }
        if (safe(row.getFreeQtyLoose()) < 0) {
            throw new BusinessRuleException("Free loose quantity cannot be negative");
        }
        if (receivedQuantity <= 0 && receivedLooseQuantity <= 0) {
            throw new BusinessRuleException("Each purchase row must add at least one pack or loose unit");
        }
        if (row.getBatchNumber() == null || row.getBatchNumber().isBlank()) {
            throw new BusinessRuleException("Batch number is required for purchase import");
        }
        if (row.getExpiryDate() == null || !row.getExpiryDate().isAfter(java.time.LocalDate.now())) {
            throw new BusinessRuleException("Expired stock cannot be inwarded as sellable inventory");
        }
        if (row.getManufactureDate() != null && !row.getManufactureDate().isBefore(row.getExpiryDate())) {
            throw new BusinessRuleException("Manufacture date must be before expiry date");
        }
        if (row.getPurchaseRate() == null || row.getPurchaseRate().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Purchase rate must be greater than zero");
        }
        if (row.getMrp() == null || row.getMrp().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("MRP must be greater than zero");
        }
        if (row.getPurchaseRate().compareTo(row.getMrp()) > 0) {
            throw new BusinessRuleException("Purchase rate cannot exceed MRP");
        }
        BigDecimal effectiveGst = row.getGstRate() != null ? row.getGstRate() : safe(medicine.getGstRate());
        if (effectiveGst.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("GST rate cannot be negative");
        }
    }

    private void validateDuplicateRows(List<PurchaseImportRowRequest> rows) {
        java.util.Set<String> uniqueKeys = new java.util.LinkedHashSet<>();
        for (PurchaseImportRowRequest row : rows) {
            String medicineKey = row.getMedicineId() != null
                    ? row.getMedicineId().toString()
                    : row.getBarcode() != null && !row.getBarcode().isBlank()
                    ? "BARCODE:" + row.getBarcode().trim().toLowerCase()
                    : "BRAND:" + (row.getBrandName() == null ? "" : row.getBrandName().trim().toLowerCase());
            String compositeKey = medicineKey + "|" + row.getBatchNumber().trim().toLowerCase();
            if (!uniqueKeys.add(compositeKey)) {
                throw new BusinessRuleException("Duplicate batch rows detected in the same inward invoice for " + row.getBatchNumber());
            }
        }
    }

    private int safePackSize(Medicine medicine) {
        return medicine == null || medicine.getPackSize() == null || medicine.getPackSize() <= 0
                ? 1
                : medicine.getPackSize();
    }

    private Integer safe(Integer value) {
        return value == null ? 0 : value;
    }

    private int countDistinctReceipts(List<PurchaseOrderItem> receiptLines) {
        return (int) receiptLines.stream()
                .map(PurchaseOrderItem::getPurchaseReceipt)
                .filter(java.util.Objects::nonNull)
                .map(PurchaseReceipt::getReceiptId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .count();
    }

    private int countDistinctInvoices(List<PurchaseOrderItem> receiptLines) {
        return (int) receiptLines.stream()
                .map(PurchaseOrderItem::getSupplierInvoiceNumber)
                .filter(invoiceNumber -> invoiceNumber != null && !invoiceNumber.isBlank())
                .distinct()
                .count();
    }

    private static final class ResolvedPurchaseOrder {
        private final PurchaseOrder purchaseOrder;
        private final boolean linkedToExistingPlan;

        private ResolvedPurchaseOrder(PurchaseOrder purchaseOrder, boolean linkedToExistingPlan) {
            this.purchaseOrder = purchaseOrder;
            this.linkedToExistingPlan = linkedToExistingPlan;
        }
    }

    private static final class ReceiptProgress {
        private final String receiptState;
        private final int receivedLineCount;
        private final int pendingLineCount;
        private final int receiptCount;
        private final int invoiceCount;

        private ReceiptProgress(String receiptState,
                                int receivedLineCount,
                                int pendingLineCount,
                                int receiptCount,
                                int invoiceCount) {
            this.receiptState = receiptState;
            this.receivedLineCount = receivedLineCount;
            this.pendingLineCount = pendingLineCount;
            this.receiptCount = receiptCount;
            this.invoiceCount = invoiceCount;
        }

        private static ReceiptProgress direct(int lineCount, int receiptCount, int invoiceCount) {
            return new ReceiptProgress(
                    "RECEIVED",
                    lineCount,
                    0,
                    Math.max(receiptCount, 1),
                    Math.max(invoiceCount, 1)
            );
        }
    }

    private static final class ReceiptTotals {
        private final BigDecimal subtotal;
        private final BigDecimal totalGst;

        private ReceiptTotals(BigDecimal subtotal, BigDecimal totalGst) {
            this.subtotal = subtotal;
            this.totalGst = totalGst;
        }
    }
}
