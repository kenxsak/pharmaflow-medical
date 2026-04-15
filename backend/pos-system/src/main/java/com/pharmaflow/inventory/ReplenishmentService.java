package com.pharmaflow.inventory;

import com.pharmaflow.audit.AuditLogService;
import com.pharmaflow.auth.CurrentPharmaUserService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.billing.InvoiceItemRepository;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.common.ForbiddenActionException;
import com.pharmaflow.inventory.dto.ReplenishmentInsightResponse;
import com.pharmaflow.inventory.dto.ReplenishmentRecommendationResponse;
import com.pharmaflow.inventory.dto.StockTransferCreateRequest;
import com.pharmaflow.inventory.dto.StockTransferResponse;
import com.pharmaflow.inventory.dto.TransferRecommendationResponse;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.medicine.MedicineRepository;
import com.pharmaflow.procurement.PharmaSupplierRepository;
import com.pharmaflow.procurement.PurchaseOrderItem;
import com.pharmaflow.procurement.PurchaseOrderItemRepository;
import com.pharmaflow.procurement.PurchaseOrderPlanLine;
import com.pharmaflow.procurement.PurchaseOrderPlanLineRepository;
import com.pharmaflow.procurement.Supplier;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import com.pharmaflow.store.StoreService;
import com.pharmaflow.tenant.Tenant;
import com.pharmaflow.tenant.TenantAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReplenishmentService {

    private final InventoryBatchRepository inventoryBatchRepository;
    private final StockTransferRepository stockTransferRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final PurchaseOrderPlanLineRepository purchaseOrderPlanLineRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final MedicineRepository medicineRepository;
    private final PharmaSupplierRepository supplierRepository;
    private final CurrentPharmaUserService currentPharmaUserService;
    private final StoreService storeService;
    private final StoreRepository storeRepository;
    private final TenantAccessService tenantAccessService;
    private final AuditLogService auditLogService;

    public ReplenishmentInsightResponse getInsights(UUID focusStoreId, int limit) {
        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();
        List<Store> accessibleStores = storeService.getAccessibleStoresForUser(currentUser);
        LocalDate today = LocalDate.now();

        if (accessibleStores.isEmpty()) {
            return ReplenishmentInsightResponse.builder()
                    .scopeLevel(resolveScopeLevel(currentUser))
                    .scopeLabel(resolveScopeLabel(currentUser))
                    .businessDate(today)
                    .recommendationCount(0)
                    .recommendations(List.of())
                    .build();
        }

        List<Store> targetStores;
        if (focusStoreId != null) {
            targetStores = List.of(storeService.requireAccessibleStore(focusStoreId));
        } else {
            targetStores = accessibleStores;
        }

        List<InventoryBatch> activeBatches = inventoryBatchRepository.findActiveStockForStores(
                accessibleStores.stream().map(Store::getStoreId).collect(Collectors.toList())
        );

        Map<UUID, Map<UUID, StoreMedicineSnapshot>> stockByStore = buildStockByStore(activeBatches, today);
        List<ReplenishmentRecommendationResponse> recommendations = new ArrayList<>();

        for (Store targetStore : targetStores) {
            Map<UUID, StoreMedicineSnapshot> targetStock = new LinkedHashMap<>(
                    stockByStore.getOrDefault(targetStore.getStoreId(), Map.of())
            );
            ensureRelevantMedicines(targetStore, targetStock);
            for (StoreMedicineSnapshot snapshot : targetStock.values()) {
                if (!isShortage(snapshot)) {
                    continue;
                }

                int shortageQty = Math.max(snapshot.reorderLevel - snapshot.totalStrips, 0);
                if (shortageQty <= 0) {
                    continue;
                }

                List<TransferRecommendationResponse> transferOptions = findTransferOptions(
                        accessibleStores,
                        targetStore,
                        snapshot,
                        stockByStore,
                        today,
                        shortageQty
                );
                int transferQty = transferOptions.stream()
                        .mapToInt(option -> option.getTransferableQuantityStrips() == null ? 0 : option.getTransferableQuantityStrips())
                        .sum();
                int recommendedTransferQty = Math.min(shortageQty, transferQty);
                int recommendedOrderQty = Math.max(shortageQty - recommendedTransferQty, 0);

                SupplierInfo supplierInfo = resolveSupplierInfo(targetStore, snapshot.medicine);
                String preferredAction = recommendedTransferQty > 0 && recommendedOrderQty > 0
                        ? "HYBRID"
                        : recommendedTransferQty > 0 ? "TRANSFER" : "REORDER";

                BigDecimal estimatedOrderValue = recommendedOrderQty > 0
                        ? safe(supplierInfo.purchaseRate).multiply(BigDecimal.valueOf(recommendedOrderQty)).setScale(2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;

                recommendations.add(ReplenishmentRecommendationResponse.builder()
                        .targetStoreId(targetStore.getStoreId())
                        .targetStoreCode(targetStore.getStoreCode())
                        .targetStoreName(targetStore.getStoreName())
                        .medicineId(snapshot.medicine.getMedicineId())
                        .brandName(snapshot.medicine.getBrandName())
                        .genericName(snapshot.medicine.getGenericName())
                        .manufacturerName(snapshot.medicine.getManufacturer() != null
                                ? snapshot.medicine.getManufacturer().getName()
                                : null)
                        .medicineForm(snapshot.medicine.getMedicineForm())
                        .packSize(snapshot.medicine.getPackSize())
                        .packSizeLabel(snapshot.medicine.getPackSizeLabel())
                        .reorderLevel(snapshot.reorderLevel)
                        .currentQuantityStrips(snapshot.totalStrips)
                        .shortageQuantityStrips(shortageQty)
                        .nearestExpiryDate(snapshot.nearestExpiryDate)
                        .preferredAction(preferredAction)
                        .recommendedTransferQuantityStrips(recommendedTransferQty)
                        .recommendedOrderQuantityStrips(recommendedOrderQty)
                        .supplierId(supplierInfo.supplier != null ? supplierInfo.supplier.getSupplierId() : null)
                        .supplierName(supplierInfo.supplier != null ? supplierInfo.supplier.getName() : null)
                        .lastPurchaseRate(scale(supplierInfo.purchaseRate))
                        .mrp(scale(safe(snapshot.medicine.getMrp())))
                        .gstRate(scale(safe(snapshot.medicine.getGstRate())))
                        .estimatedOrderValue(scale(estimatedOrderValue))
                        .transferOptions(transferOptions)
                        .build());
            }
        }

        List<ReplenishmentRecommendationResponse> sorted = recommendations.stream()
                .sorted(Comparator
                        .comparing(ReplenishmentRecommendationResponse::getShortageQuantityStrips, Comparator.nullsFirst(Integer::compareTo))
                        .reversed()
                        .thenComparing(ReplenishmentRecommendationResponse::getTargetStoreCode, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(ReplenishmentRecommendationResponse::getBrandName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .limit(Math.max(1, Math.min(limit, 50)))
                .collect(Collectors.toList());

        return ReplenishmentInsightResponse.builder()
                .scopeLevel(resolveScopeLevel(currentUser))
                .scopeLabel(resolveScopeLabel(currentUser))
                .businessDate(today)
                .recommendationCount(sorted.size())
                .recommendations(sorted)
                .build();
    }

    @Transactional
    public StockTransferResponse createTransferRequest(StockTransferCreateRequest request) {
        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();
        Store toStore = storeService.requireAccessibleStore(request.getToStoreId());
        Store fromStore = storeRepository.findById(request.getFromStoreId())
                .orElseThrow(() -> new IllegalArgumentException("Source store not found"));

        if (toStore.getTenant() == null || fromStore.getTenant() == null
                || !toStore.getTenant().getTenantId().equals(fromStore.getTenant().getTenantId())) {
            throw new ForbiddenActionException("Transfer requests must stay within the same company network");
        }

        InventoryBatch batch = inventoryBatchRepository.findById(request.getBatchId())
                .orElseThrow(() -> new IllegalArgumentException("Transfer batch not found"));
        if (batch.getStore() == null || !batch.getStore().getStoreId().equals(fromStore.getStoreId())) {
            throw new BusinessRuleException("Selected batch does not belong to the source store");
        }
        if (batch.getMedicine() == null || !batch.getMedicine().getMedicineId().equals(request.getMedicineId())) {
            throw new BusinessRuleException("Selected batch does not match the requested medicine");
        }
        if (batch.getExpiryDate() == null || !batch.getExpiryDate().isAfter(LocalDate.now())) {
            throw new BusinessRuleException("Expired or same-day-expiry stock cannot be requested for transfer");
        }

        int requestedStrips = request.getQuantityStrips() == null ? 0 : request.getQuantityStrips();
        if (requestedStrips <= 0) {
            throw new BusinessRuleException("Transfer quantity must be at least 1 pack");
        }

        int donorTotalStock = inventoryBatchRepository.findSellableBatches(fromStore.getStoreId(), request.getMedicineId(), LocalDate.now())
                .stream()
                .mapToInt(batchItem -> batchItem.getQuantityStrips() == null ? 0 : batchItem.getQuantityStrips())
                .sum();
        int reorderLevel = batch.getMedicine().getReorderLevel() == null ? 0 : batch.getMedicine().getReorderLevel();
        int maxTransferable = Math.max(donorTotalStock - reorderLevel, 0);
        int availableInBatch = batch.getQuantityStrips() == null ? 0 : batch.getQuantityStrips();

        if (requestedStrips > availableInBatch) {
            throw new BusinessRuleException("Requested transfer exceeds the selected batch quantity");
        }
        if (requestedStrips > maxTransferable) {
            throw new BusinessRuleException("Requested transfer would drop the source store below its reorder level");
        }

        StockTransfer transfer = stockTransferRepository.save(
                StockTransfer.builder()
                        .fromStore(fromStore)
                        .toStore(toStore)
                        .medicine(batch.getMedicine())
                        .batch(batch)
                        .quantityStrips(requestedStrips)
                        .quantityLoose(request.getQuantityLoose() == null ? 0 : request.getQuantityLoose())
                        .status("PENDING")
                .requestedBy(currentUser)
                .build()
        );

        auditLogService.log(
                toStore,
                currentUser,
                "TRANSFER_REQUEST_CREATED",
                "STOCK_TRANSFER",
                transfer.getTransferId().toString(),
                null,
                "{\"fromStore\":\"" + fromStore.getStoreCode() + "\",\"medicine\":\"" + batch.getMedicine().getBrandName()
                        + "\",\"quantityStrips\":\"" + requestedStrips + "\"}"
        );

        return toTransferResponse(transfer);
    }

    public List<StockTransferResponse> listTransfers(UUID focusStoreId, int limit, String status) {
        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();
        List<Store> accessibleStores = storeService.getAccessibleStoresForUser(currentUser);
        if (accessibleStores.isEmpty()) {
            return List.of();
        }

        UUID scopedStoreId = focusStoreId != null
                ? storeService.requireAccessibleStore(focusStoreId).getStoreId()
                : null;
        String normalizedStatus = status == null || status.isBlank()
                ? null
                : status.trim().toUpperCase();
        int safeLimit = Math.max(1, Math.min(limit, 50));

        List<UUID> accessibleStoreIds = accessibleStores.stream()
                .map(Store::getStoreId)
                .collect(Collectors.toList());

        return stockTransferRepository.findByStoreIds(accessibleStoreIds, null)
                .stream()
                .filter(transfer -> scopedStoreId == null
                        || matchesStore(transfer.getFromStore(), scopedStoreId)
                        || matchesStore(transfer.getToStore(), scopedStoreId))
                .filter(transfer -> normalizedStatus == null
                        || normalizedStatus.equalsIgnoreCase(transfer.getStatus()))
                .sorted(Comparator
                        .comparing(StockTransfer::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo))
                        .reversed())
                .limit(safeLimit)
                .map(this::toTransferResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public StockTransferResponse approveTransfer(UUID transferId) {
        StockTransfer transfer = getTransferOrThrow(transferId);
        ensureSourceStoreAccess(transfer);
        requireTransferStatus(transfer, List.of("PENDING"), "Only pending requests can be approved");

        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        transfer.setStatus("APPROVED");
        transfer.setApprovedBy(currentUser);
        transfer.setApprovedAt(now);
        stockTransferRepository.save(transfer);

        auditLogService.log(
                transfer.getFromStore(),
                currentUser,
                "TRANSFER_APPROVED",
                "STOCK_TRANSFER",
                transfer.getTransferId().toString(),
                null,
                "{\"fromStore\":\"" + transfer.getFromStore().getStoreCode()
                        + "\",\"toStore\":\"" + transfer.getToStore().getStoreCode()
                        + "\",\"medicine\":\"" + transfer.getMedicine().getBrandName() + "\"}"
        );

        return toTransferResponse(transfer);
    }

    @Transactional
    public StockTransferResponse rejectTransfer(UUID transferId) {
        StockTransfer transfer = getTransferOrThrow(transferId);
        ensureSourceStoreAccess(transfer);
        requireTransferStatus(transfer, List.of("PENDING", "APPROVED"), "Only open transfer requests can be rejected");

        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();
        transfer.setStatus("REJECTED");
        transfer.setCompletedAt(LocalDateTime.now());
        stockTransferRepository.save(transfer);

        auditLogService.log(
                transfer.getFromStore(),
                currentUser,
                "TRANSFER_REJECTED",
                "STOCK_TRANSFER",
                transfer.getTransferId().toString(),
                null,
                "{\"fromStore\":\"" + transfer.getFromStore().getStoreCode()
                        + "\",\"toStore\":\"" + transfer.getToStore().getStoreCode()
                        + "\",\"medicine\":\"" + transfer.getMedicine().getBrandName() + "\"}"
        );

        return toTransferResponse(transfer);
    }

    @Transactional
    public StockTransferResponse cancelTransfer(UUID transferId) {
        StockTransfer transfer = getTransferOrThrow(transferId);
        ensureParticipantAccess(transfer);
        requireTransferStatus(transfer, List.of("PENDING", "APPROVED"), "Only open transfer requests can be cancelled");

        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();
        transfer.setStatus("CANCELLED");
        transfer.setCompletedAt(LocalDateTime.now());
        stockTransferRepository.save(transfer);

        auditLogService.log(
                transfer.getToStore(),
                currentUser,
                "TRANSFER_CANCELLED",
                "STOCK_TRANSFER",
                transfer.getTransferId().toString(),
                null,
                "{\"fromStore\":\"" + transfer.getFromStore().getStoreCode()
                        + "\",\"toStore\":\"" + transfer.getToStore().getStoreCode()
                        + "\",\"medicine\":\"" + transfer.getMedicine().getBrandName() + "\"}"
        );

        return toTransferResponse(transfer);
    }

    @Transactional
    public StockTransferResponse dispatchTransfer(UUID transferId) {
        StockTransfer transfer = getTransferOrThrow(transferId);
        ensureSourceStoreAccess(transfer);
        requireTransferStatus(transfer, List.of("PENDING", "APPROVED"), "Only open transfer requests can be dispatched");

        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();
        InventoryBatch batch = inventoryBatchRepository.findByIdForUpdate(transfer.getBatch().getBatchId())
                .orElseThrow(() -> new IllegalArgumentException("Transfer batch not found"));
        validateTransferBatch(transfer, batch);

        int requestedLooseUnits = toLooseUnits(transfer.getQuantityStrips(), transfer.getQuantityLoose(), batch.getMedicine());
        int availableLooseUnits = toLooseUnits(batch.getQuantityStrips(), batch.getQuantityLoose(), batch.getMedicine());
        if (requestedLooseUnits > availableLooseUnits) {
            throw new BusinessRuleException("Requested transfer exceeds the current batch stock");
        }

        int donorLooseUnits = inventoryBatchRepository.findSellableBatches(
                        transfer.getFromStore().getStoreId(),
                        transfer.getMedicine().getMedicineId(),
                        LocalDate.now()
                )
                .stream()
                .mapToInt(candidate -> toLooseUnits(candidate.getQuantityStrips(), candidate.getQuantityLoose(), candidate.getMedicine()))
                .sum();
        int reorderThresholdLooseUnits = safePackSize(batch.getMedicine())
                * (batch.getMedicine().getReorderLevel() == null ? 0 : batch.getMedicine().getReorderLevel());
        if (donorLooseUnits - requestedLooseUnits < reorderThresholdLooseUnits) {
            throw new BusinessRuleException("Dispatch would drop the source store below reorder level");
        }

        applyLooseUnits(batch, availableLooseUnits - requestedLooseUnits);
        inventoryBatchRepository.save(batch);

        LocalDateTime now = LocalDateTime.now();
        if (transfer.getApprovedAt() == null) {
            transfer.setApprovedAt(now);
        }
        if (transfer.getApprovedBy() == null) {
            transfer.setApprovedBy(currentUser);
        }
        transfer.setStatus("IN_TRANSIT");
        transfer.setDispatchedAt(now);
        stockTransferRepository.save(transfer);

        auditLogService.log(
                transfer.getFromStore(),
                currentUser,
                "TRANSFER_DISPATCHED",
                "STOCK_TRANSFER",
                transfer.getTransferId().toString(),
                null,
                "{\"fromStore\":\"" + transfer.getFromStore().getStoreCode()
                        + "\",\"toStore\":\"" + transfer.getToStore().getStoreCode()
                        + "\",\"medicine\":\"" + transfer.getMedicine().getBrandName()
                        + "\",\"quantityStrips\":\"" + transfer.getQuantityStrips() + "\"}"
        );

        return toTransferResponse(transfer);
    }

    @Transactional
    public StockTransferResponse receiveTransfer(UUID transferId) {
        StockTransfer transfer = getTransferOrThrow(transferId);
        ensureDestinationStoreAccess(transfer);
        requireTransferStatus(transfer, List.of("IN_TRANSIT"), "Only in-transit stock can be received");

        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();
        InventoryBatch sourceBatch = inventoryBatchRepository.findByIdForUpdate(transfer.getBatch().getBatchId())
                .orElseThrow(() -> new IllegalArgumentException("Transfer batch not found"));
        InventoryBatch destinationBatch = inventoryBatchRepository
                .findByStoreAndMedicineAndBatchNumberForUpdate(
                        transfer.getToStore().getStoreId(),
                        transfer.getMedicine().getMedicineId(),
                        sourceBatch.getBatchNumber()
                )
                .orElse(null);

        int transferredLooseUnits = toLooseUnits(transfer.getQuantityStrips(), transfer.getQuantityLoose(), sourceBatch.getMedicine());
        if (destinationBatch == null) {
            destinationBatch = InventoryBatch.builder()
                    .store(transfer.getToStore())
                    .medicine(sourceBatch.getMedicine())
                    .batchNumber(sourceBatch.getBatchNumber())
                    .manufactureDate(sourceBatch.getManufactureDate())
                    .expiryDate(sourceBatch.getExpiryDate())
                    .purchaseRate(sourceBatch.getPurchaseRate())
                    .mrp(sourceBatch.getMrp())
                    .quantityStrips(0)
                    .quantityLoose(0)
                    .isActive(true)
                    .build();
        }

        int destinationLooseUnits = toLooseUnits(
                destinationBatch.getQuantityStrips(),
                destinationBatch.getQuantityLoose(),
                sourceBatch.getMedicine()
        );
        applyLooseUnits(destinationBatch, destinationLooseUnits + transferredLooseUnits);
        destinationBatch.setManufactureDate(sourceBatch.getManufactureDate());
        destinationBatch.setExpiryDate(sourceBatch.getExpiryDate());
        destinationBatch.setPurchaseRate(sourceBatch.getPurchaseRate());
        destinationBatch.setMrp(sourceBatch.getMrp());
        inventoryBatchRepository.save(destinationBatch);

        transfer.setStatus("RECEIVED");
        transfer.setReceivedBy(currentUser);
        transfer.setCompletedAt(LocalDateTime.now());
        stockTransferRepository.save(transfer);

        auditLogService.log(
                transfer.getToStore(),
                currentUser,
                "TRANSFER_RECEIVED",
                "STOCK_TRANSFER",
                transfer.getTransferId().toString(),
                null,
                "{\"fromStore\":\"" + transfer.getFromStore().getStoreCode()
                        + "\",\"toStore\":\"" + transfer.getToStore().getStoreCode()
                        + "\",\"medicine\":\"" + transfer.getMedicine().getBrandName()
                        + "\",\"quantityStrips\":\"" + transfer.getQuantityStrips() + "\"}"
        );

        return toTransferResponse(transfer);
    }

    private StockTransfer getTransferOrThrow(UUID transferId) {
        return stockTransferRepository.findById(transferId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer request not found"));
    }

    private void ensureSourceStoreAccess(StockTransfer transfer) {
        if (transfer.getFromStore() == null || transfer.getFromStore().getStoreId() == null) {
            throw new BusinessRuleException("Transfer source store is missing");
        }
        storeService.requireAccessibleStore(transfer.getFromStore().getStoreId());
    }

    private void ensureDestinationStoreAccess(StockTransfer transfer) {
        if (transfer.getToStore() == null || transfer.getToStore().getStoreId() == null) {
            throw new BusinessRuleException("Transfer destination store is missing");
        }
        storeService.requireAccessibleStore(transfer.getToStore().getStoreId());
    }

    private void ensureParticipantAccess(StockTransfer transfer) {
        List<UUID> accessibleStoreIds = storeService.getAccessibleStoreEntities()
                .stream()
                .map(Store::getStoreId)
                .collect(Collectors.toList());
        UUID fromStoreId = transfer.getFromStore() != null ? transfer.getFromStore().getStoreId() : null;
        UUID toStoreId = transfer.getToStore() != null ? transfer.getToStore().getStoreId() : null;
        boolean hasAccess = (fromStoreId != null && accessibleStoreIds.contains(fromStoreId))
                || (toStoreId != null && accessibleStoreIds.contains(toStoreId));
        if (!hasAccess) {
            throw new ForbiddenActionException("This transfer is not accessible for the current user");
        }
    }

    private void requireTransferStatus(StockTransfer transfer, List<String> allowedStatuses, String message) {
        String currentStatus = transfer.getStatus() == null ? "" : transfer.getStatus().trim().toUpperCase();
        boolean allowed = allowedStatuses.stream()
                .anyMatch(status -> status.equalsIgnoreCase(currentStatus));
        if (!allowed) {
            throw new BusinessRuleException(message);
        }
    }

    private void validateTransferBatch(StockTransfer transfer, InventoryBatch batch) {
        if (batch.getStore() == null || batch.getStore().getStoreId() == null
                || !batch.getStore().getStoreId().equals(transfer.getFromStore().getStoreId())) {
            throw new BusinessRuleException("Selected batch no longer belongs to the source store");
        }
        if (batch.getMedicine() == null || batch.getMedicine().getMedicineId() == null
                || !batch.getMedicine().getMedicineId().equals(transfer.getMedicine().getMedicineId())) {
            throw new BusinessRuleException("Selected batch no longer matches the requested medicine");
        }
        if (batch.getExpiryDate() == null || !batch.getExpiryDate().isAfter(LocalDate.now())) {
            throw new BusinessRuleException("Expired or same-day-expiry stock cannot be transferred");
        }
    }

    private boolean matchesStore(Store store, UUID storeId) {
        return store != null && store.getStoreId() != null && store.getStoreId().equals(storeId);
    }

    private int toLooseUnits(Integer quantityStrips, Integer quantityLoose, Medicine medicine) {
        return safe(quantityStrips) * safePackSize(medicine) + safe(quantityLoose);
    }

    private int safePackSize(Medicine medicine) {
        return medicine == null || medicine.getPackSize() == null || medicine.getPackSize() <= 0
                ? 1
                : medicine.getPackSize();
    }

    private void applyLooseUnits(InventoryBatch batch, int totalLooseUnits) {
        int packSize = safePackSize(batch.getMedicine());
        int normalizedTotal = Math.max(totalLooseUnits, 0);
        batch.setQuantityStrips(normalizedTotal / packSize);
        batch.setQuantityLoose(normalizedTotal % packSize);
        batch.setIsActive(normalizedTotal > 0);
    }

    private StockTransferResponse toTransferResponse(StockTransfer transfer) {
        InventoryBatch batch = transfer.getBatch();
        Medicine medicine = transfer.getMedicine();
        return StockTransferResponse.builder()
                .transferId(transfer.getTransferId())
                .status(transfer.getStatus())
                .fromStoreId(transfer.getFromStore() != null ? transfer.getFromStore().getStoreId() : null)
                .fromStoreCode(transfer.getFromStore() != null ? transfer.getFromStore().getStoreCode() : null)
                .fromStoreName(transfer.getFromStore() != null ? transfer.getFromStore().getStoreName() : null)
                .toStoreId(transfer.getToStore() != null ? transfer.getToStore().getStoreId() : null)
                .toStoreCode(transfer.getToStore() != null ? transfer.getToStore().getStoreCode() : null)
                .toStoreName(transfer.getToStore() != null ? transfer.getToStore().getStoreName() : null)
                .medicineId(medicine != null ? medicine.getMedicineId() : null)
                .brandName(medicine != null ? medicine.getBrandName() : null)
                .genericName(medicine != null ? medicine.getGenericName() : null)
                .medicineForm(medicine != null ? medicine.getMedicineForm() : null)
                .packSize(medicine != null ? medicine.getPackSize() : null)
                .packSizeLabel(medicine != null ? medicine.getPackSizeLabel() : null)
                .batchId(batch != null ? batch.getBatchId() : null)
                .batchNumber(batch != null ? batch.getBatchNumber() : null)
                .quantityStrips(transfer.getQuantityStrips())
                .quantityLoose(transfer.getQuantityLoose())
                .requestedByName(transfer.getRequestedBy() != null ? transfer.getRequestedBy().getFullName() : null)
                .approvedByName(transfer.getApprovedBy() != null ? transfer.getApprovedBy().getFullName() : null)
                .receivedByName(transfer.getReceivedBy() != null ? transfer.getReceivedBy().getFullName() : null)
                .createdAt(transfer.getCreatedAt())
                .approvedAt(transfer.getApprovedAt())
                .dispatchedAt(transfer.getDispatchedAt())
                .completedAt(transfer.getCompletedAt())
                .build();
    }

    private Map<UUID, Map<UUID, StoreMedicineSnapshot>> buildStockByStore(List<InventoryBatch> batches, LocalDate today) {
        Map<UUID, Map<UUID, StoreMedicineSnapshot>> result = new LinkedHashMap<>();

        for (InventoryBatch batch : batches) {
            if (batch.getStore() == null || batch.getStore().getStoreId() == null || batch.getMedicine() == null
                    || batch.getMedicine().getMedicineId() == null) {
                continue;
            }

            if (batch.getExpiryDate() == null || !batch.getExpiryDate().isAfter(today)) {
                continue;
            }

            Map<UUID, StoreMedicineSnapshot> storeStock = result.computeIfAbsent(
                    batch.getStore().getStoreId(),
                    key -> new LinkedHashMap<>()
            );
            StoreMedicineSnapshot snapshot = storeStock.computeIfAbsent(
                    batch.getMedicine().getMedicineId(),
                    key -> new StoreMedicineSnapshot(batch.getStore(), batch.getMedicine())
            );

            snapshot.totalStrips += batch.getQuantityStrips() == null ? 0 : batch.getQuantityStrips();
            if (batch.getQuantityStrips() != null && batch.getQuantityStrips() > 0) {
                snapshot.sellableBatches.add(batch);
            }
            if (snapshot.nearestExpiryDate == null || batch.getExpiryDate().isBefore(snapshot.nearestExpiryDate)) {
                snapshot.nearestExpiryDate = batch.getExpiryDate();
            }
        }

        return result;
    }

    private List<TransferRecommendationResponse> findTransferOptions(
            List<Store> accessibleStores,
            Store targetStore,
            StoreMedicineSnapshot targetSnapshot,
            Map<UUID, Map<UUID, StoreMedicineSnapshot>> stockByStore,
            LocalDate today,
            int shortageQty
    ) {
        return accessibleStores.stream()
                .filter(store -> !store.getStoreId().equals(targetStore.getStoreId()))
                .filter(store -> store.getTenant() != null && targetStore.getTenant() != null
                        && store.getTenant().getTenantId().equals(targetStore.getTenant().getTenantId()))
                .sorted(Comparator
                        .comparing((Store store) -> isSameCity(store, targetStore) ? 0 : 1)
                        .thenComparing(Store::getStoreCode, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(store -> toTransferOption(store, targetSnapshot, stockByStore, today, shortageQty))
                .filter(java.util.Objects::nonNull)
                .sorted(Comparator
                        .comparing(TransferRecommendationResponse::getTransferableQuantityStrips, Comparator.nullsFirst(Integer::compareTo))
                        .reversed()
                        .thenComparing(TransferRecommendationResponse::getExpiryDate, Comparator.nullsLast(LocalDate::compareTo)))
                .limit(3)
                .collect(Collectors.toList());
    }

    private TransferRecommendationResponse toTransferOption(
            Store donorStore,
            StoreMedicineSnapshot targetSnapshot,
            Map<UUID, Map<UUID, StoreMedicineSnapshot>> stockByStore,
            LocalDate today,
            int shortageQty
    ) {
        StoreMedicineSnapshot donorSnapshot = stockByStore
                .getOrDefault(donorStore.getStoreId(), Map.of())
                .get(targetSnapshot.medicine.getMedicineId());
        if (donorSnapshot == null || donorSnapshot.totalStrips <= donorSnapshot.reorderLevel) {
            return null;
        }

        int donorSurplus = Math.max(donorSnapshot.totalStrips - donorSnapshot.reorderLevel, 0);
        if (donorSurplus <= 0) {
            return null;
        }

        InventoryBatch batch = donorSnapshot.sellableBatches.stream()
                .filter(batchItem -> batchItem.getQuantityStrips() != null && batchItem.getQuantityStrips() > 0)
                .filter(batchItem -> batchItem.getExpiryDate() != null && batchItem.getExpiryDate().isAfter(today.plusDays(45)))
                .min(Comparator.comparing(InventoryBatch::getExpiryDate))
                .orElseGet(() -> donorSnapshot.sellableBatches.stream()
                        .filter(batchItem -> batchItem.getQuantityStrips() != null && batchItem.getQuantityStrips() > 0)
                        .min(Comparator.comparing(InventoryBatch::getExpiryDate))
                        .orElse(null));
        if (batch == null) {
            return null;
        }

        int transferableQty = Math.min(shortageQty, Math.min(donorSurplus, batch.getQuantityStrips()));
        if (transferableQty <= 0) {
            return null;
        }

        return TransferRecommendationResponse.builder()
                .fromStoreId(donorStore.getStoreId())
                .fromStoreCode(donorStore.getStoreCode())
                .fromStoreName(donorStore.getStoreName())
                .batchId(batch.getBatchId())
                .batchNumber(batch.getBatchNumber())
                .expiryDate(batch.getExpiryDate())
                .transferableQuantityStrips(transferableQty)
                .build();
    }

    private SupplierInfo resolveSupplierInfo(Store targetStore, Medicine medicine) {
        PurchaseOrderItem recentItem = purchaseOrderItemRepository.findRecentByTenantAndMedicine(
                        targetStore.getTenant().getTenantId(),
                        medicine.getMedicineId(),
                        PageRequest.of(0, 1)
                )
                .stream()
                .findFirst()
                .orElse(null);

        PurchaseOrderPlanLine recentPlanLine = purchaseOrderPlanLineRepository.findRecentByTenantAndMedicine(
                        targetStore.getTenant().getTenantId(),
                        medicine.getMedicineId(),
                        PageRequest.of(0, 1)
                )
                .stream()
                .findFirst()
                .orElse(null);

        if (isMoreRecentPlanLine(recentPlanLine, recentItem) && recentPlanLine != null && recentPlanLine.getPurchaseOrder() != null
                && recentPlanLine.getPurchaseOrder().getSupplier() != null) {
            return new SupplierInfo(
                    recentPlanLine.getPurchaseOrder().getSupplier(),
                    recentPlanLine.getPurchaseRate()
            );
        }

        if (recentItem != null && recentItem.getPurchaseOrder() != null && recentItem.getPurchaseOrder().getSupplier() != null) {
            return new SupplierInfo(
                    recentItem.getPurchaseOrder().getSupplier(),
                    recentItem.getPurchaseRate()
            );
        }

        Supplier fallbackSupplier = supplierRepository.findAllByIsActiveTrueOrderByNameAsc()
                .stream()
                .findFirst()
                .orElse(null);

        BigDecimal purchaseRate = medicine.getPtr() != null
                ? medicine.getPtr()
                : medicine.getPts() != null ? medicine.getPts() : medicine.getMrp();

        return new SupplierInfo(fallbackSupplier, purchaseRate);
    }

    private boolean isMoreRecentPlanLine(PurchaseOrderPlanLine recentPlanLine, PurchaseOrderItem recentItem) {
        if (recentPlanLine == null) {
            return false;
        }
        if (recentItem == null) {
            return true;
        }
        if (recentPlanLine.getPurchaseOrder() == null || recentPlanLine.getPurchaseOrder().getPoDate() == null) {
            return false;
        }
        if (recentItem.getPurchaseOrder() == null || recentItem.getPurchaseOrder().getPoDate() == null) {
            return true;
        }
        return !recentPlanLine.getPurchaseOrder().getPoDate().isBefore(recentItem.getPurchaseOrder().getPoDate());
    }

    private void ensureRelevantMedicines(Store targetStore, Map<UUID, StoreMedicineSnapshot> targetStock) {
        LinkedHashSet<UUID> relevantMedicineIds = new LinkedHashSet<>(targetStock.keySet());
        relevantMedicineIds.addAll(purchaseOrderItemRepository.findDistinctMedicineIdsByStoreId(targetStore.getStoreId()));
        relevantMedicineIds.addAll(invoiceItemRepository.findDistinctMedicineIdsByStoreId(targetStore.getStoreId()));

        medicineRepository.findAllById(relevantMedicineIds)
                .forEach(medicine -> targetStock.computeIfAbsent(
                        medicine.getMedicineId(),
                        ignored -> new StoreMedicineSnapshot(targetStore, medicine)
                ));
    }

    private boolean isShortage(StoreMedicineSnapshot snapshot) {
        return snapshot.reorderLevel > 0 && snapshot.totalStrips < snapshot.reorderLevel;
    }

    private String resolveScopeLevel(PharmaUser currentUser) {
        if (currentUser.isPlatformOwner()) {
            return "SAAS_ADMIN";
        }
        if (storeService.hasTenantWideAccess(currentUser)) {
            return "COMPANY";
        }
        return "STORE";
    }

    private String resolveScopeLabel(PharmaUser currentUser) {
        if (currentUser.isPlatformOwner()) {
            return "All tenants and stores";
        }
        if (storeService.hasTenantWideAccess(currentUser)) {
            Tenant tenant = tenantAccessService.resolveTenantForUser(currentUser);
            return tenant.getBrandName() + " replenishment desk";
        }
        if (currentUser.getStore() != null) {
            return currentUser.getStore().getStoreName();
        }
        return currentUser.getFullName();
    }

    private boolean isSameCity(Store donorStore, Store targetStore) {
        return donorStore.getCity() != null
                && targetStore.getCity() != null
                && donorStore.getCity().equalsIgnoreCase(targetStore.getCity());
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private BigDecimal scale(BigDecimal value) {
        return safe(value).setScale(2, RoundingMode.HALF_UP);
    }

    private static final class StoreMedicineSnapshot {
        private final Store store;
        private final Medicine medicine;
        private final int reorderLevel;
        private int totalStrips = 0;
        private LocalDate nearestExpiryDate;
        private final List<InventoryBatch> sellableBatches = new ArrayList<>();

        private StoreMedicineSnapshot(Store store, Medicine medicine) {
            this.store = store;
            this.medicine = medicine;
            this.reorderLevel = medicine.getReorderLevel() == null ? 0 : medicine.getReorderLevel();
        }
    }

    private static final class SupplierInfo {
        private final Supplier supplier;
        private final BigDecimal purchaseRate;

        private SupplierInfo(Supplier supplier, BigDecimal purchaseRate) {
            this.supplier = supplier;
            this.purchaseRate = purchaseRate;
        }
    }
}
