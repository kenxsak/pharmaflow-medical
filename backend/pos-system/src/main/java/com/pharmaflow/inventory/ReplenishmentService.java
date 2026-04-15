package com.pharmaflow.inventory;

import com.pharmaflow.audit.AuditLogService;
import com.pharmaflow.auth.CurrentPharmaUserService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.billing.InvoiceItem;
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
import com.pharmaflow.procurement.PurchaseOrder;
import com.pharmaflow.procurement.PurchaseOrderItem;
import com.pharmaflow.procurement.PurchaseOrderItemRepository;
import com.pharmaflow.procurement.PurchaseOrderPlanLine;
import com.pharmaflow.procurement.PurchaseOrderPlanLineRepository;
import com.pharmaflow.procurement.PurchaseOrderRepository;
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
import java.time.temporal.ChronoUnit;
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
    private final PurchaseOrderRepository purchaseOrderRepository;
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
    private final InventoryMovementService inventoryMovementService;

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

        List<UUID> accessibleStoreIds = accessibleStores.stream()
                .map(Store::getStoreId)
                .collect(Collectors.toList());

        List<InventoryBatch> activeBatches = inventoryBatchRepository.findActiveStockForStores(
                accessibleStoreIds
        );
        LocalDateTime demandWindowStart = today.minusDays(30).atStartOfDay();
        LocalDateTime supplyWindowStart = today.minusDays(90).atStartOfDay();
        LocalDateTime dayEnd = today.plusDays(1).atStartOfDay();

        Map<UUID, Map<UUID, MovementStats>> movementByStore = buildMovementStats(
                invoiceItemRepository.findForStoresBetween(accessibleStoreIds, demandWindowStart, dayEnd),
                purchaseOrderItemRepository.findReceivedForStoresBetween(accessibleStoreIds, supplyWindowStart, dayEnd),
                stockTransferRepository.findByStoreIds(accessibleStoreIds, null),
                demandWindowStart,
                supplyWindowStart,
                dayEnd
        );
        Map<UUID, SupplierMetrics> supplierMetricsById = buildSupplierMetrics(accessibleStoreIds);

        Map<UUID, Map<UUID, StoreMedicineSnapshot>> stockByStore = buildStockByStore(activeBatches, today);
        List<ReplenishmentRecommendationResponse> recommendations = new ArrayList<>();

        for (Store targetStore : targetStores) {
            Map<UUID, StoreMedicineSnapshot> targetStock = new LinkedHashMap<>(
                    stockByStore.getOrDefault(targetStore.getStoreId(), Map.of())
            );
            ensureRelevantMedicines(
                    targetStore,
                    targetStock,
                    movementByStore.getOrDefault(targetStore.getStoreId(), Map.of()).keySet()
            );
            for (StoreMedicineSnapshot snapshot : targetStock.values()) {
                MovementStats movementStats = movementByStore
                        .getOrDefault(targetStore.getStoreId(), Map.of())
                        .getOrDefault(snapshot.medicine.getMedicineId(), new MovementStats());

                SupplierInfo supplierInfo = resolveSupplierInfo(targetStore, snapshot.medicine, supplierMetricsById);
                int targetStockLevel = calculateTargetStockLevel(snapshot, movementStats, supplierInfo.effectiveLeadTimeDays);
                int shortageQty = Math.max(targetStockLevel - snapshot.totalStrips, 0);
                Integer daysOfCover = calculateDaysOfCover(snapshot.totalStrips, movementStats.averageDailyDemand);

                if (!shouldRecommend(snapshot, shortageQty, daysOfCover, supplierInfo.effectiveLeadTimeDays)) {
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
                String preferredAction = resolvePreferredAction(recommendedTransferQty, recommendedOrderQty, movementStats);
                LocalDate suggestedOrderDate = resolveSuggestedOrderDate(today, daysOfCover, supplierInfo.effectiveLeadTimeDays);
                LocalDate expectedDeliveryDate = suggestedOrderDate.plusDays(Math.max(supplierInfo.effectiveLeadTimeDays, 0));

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
                        .reorderLevel(targetStockLevel)
                        .currentQuantityStrips(snapshot.totalStrips)
                        .shortageQuantityStrips(shortageQty)
                        .nearestExpiryDate(snapshot.nearestExpiryDate)
                        .preferredAction(preferredAction)
                        .recommendedTransferQuantityStrips(recommendedTransferQty)
                        .recommendedOrderQuantityStrips(recommendedOrderQty)
                        .supplierId(supplierInfo.supplier != null ? supplierInfo.supplier.getSupplierId() : null)
                        .supplierName(supplierInfo.supplier != null ? supplierInfo.supplier.getName() : null)
                        .supplierLeadTimeDays(supplierInfo.effectiveLeadTimeDays)
                        .observedLeadTimeDays(supplierInfo.observedLeadTimeDays)
                        .daysOfCover(daysOfCover)
                        .recentReceiptCount(movementStats.recentReceiptCount)
                        .recentTransferInCount(movementStats.transferInCount)
                        .recentTransferOutCount(movementStats.transferOutCount)
                        .averageDailyDemand(scale(movementStats.averageDailyDemand))
                        .suggestedOrderDate(suggestedOrderDate)
                        .expectedDeliveryDate(expectedDeliveryDate)
                        .planningReason(buildPlanningReason(movementStats, daysOfCover, supplierInfo, preferredAction))
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

        inventoryMovementService.applyPackLooseDelta(
                batch.getBatchId(),
                -safe(transfer.getQuantityStrips()),
                -safe(transfer.getQuantityLoose()),
                "TRANSFER_OUT",
                "INTER_STORE_TRANSFER",
                "STOCK_TRANSFER",
                transfer.getTransferId().toString(),
                "Dispatch to " + transfer.getToStore().getStoreCode(),
                currentUser
        );

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
                    .inventoryState("SELLABLE")
                    .build();
        }
        destinationBatch.setManufactureDate(sourceBatch.getManufactureDate());
        destinationBatch.setExpiryDate(sourceBatch.getExpiryDate());
        destinationBatch.setPurchaseRate(sourceBatch.getPurchaseRate());
        destinationBatch.setMrp(sourceBatch.getMrp());
        destinationBatch = inventoryBatchRepository.save(destinationBatch);

        inventoryMovementService.applyPackLooseDelta(
                destinationBatch.getBatchId(),
                safe(transfer.getQuantityStrips()),
                safe(transfer.getQuantityLoose()),
                "TRANSFER_IN",
                "INTER_STORE_TRANSFER",
                "STOCK_TRANSFER",
                transfer.getTransferId().toString(),
                "Received from " + transfer.getFromStore().getStoreCode(),
                currentUser
        );

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

    private Map<UUID, Map<UUID, MovementStats>> buildMovementStats(
            List<InvoiceItem> invoiceItems,
            List<PurchaseOrderItem> purchaseItems,
            List<StockTransfer> transfers,
            LocalDateTime demandWindowStart,
            LocalDateTime supplyWindowStart,
            LocalDateTime dayEnd
    ) {
        Map<UUID, Map<UUID, MovementStats>> movementByStore = new LinkedHashMap<>();

        for (InvoiceItem invoiceItem : invoiceItems) {
            if (invoiceItem.getInvoice() == null
                    || invoiceItem.getInvoice().getStore() == null
                    || invoiceItem.getInvoice().getStore().getStoreId() == null
                    || invoiceItem.getMedicine() == null
                    || invoiceItem.getMedicine().getMedicineId() == null) {
                continue;
            }

            LocalDateTime invoiceDate = invoiceItem.getInvoice().getInvoiceDate() != null
                    ? invoiceItem.getInvoice().getInvoiceDate()
                    : invoiceItem.getInvoice().getCreatedAt();
            if (invoiceDate == null || invoiceDate.isBefore(demandWindowStart) || !invoiceDate.isBefore(dayEnd)) {
                continue;
            }

            MovementStats stats = getMovementStats(
                    movementByStore,
                    invoiceItem.getInvoice().getStore().getStoreId(),
                    invoiceItem.getMedicine().getMedicineId()
            );
            stats.totalDemandPacks = stats.totalDemandPacks.add(toPackEquivalent(invoiceItem));
        }

        for (PurchaseOrderItem purchaseItem : purchaseItems) {
            if (purchaseItem.getPurchaseOrder() == null
                    || purchaseItem.getPurchaseOrder().getStore() == null
                    || purchaseItem.getPurchaseOrder().getStore().getStoreId() == null
                    || purchaseItem.getMedicine() == null
                    || purchaseItem.getMedicine().getMedicineId() == null) {
                continue;
            }

            LocalDateTime receiptTime = purchaseItem.getPurchaseOrder().getReceivedAt() != null
                    ? purchaseItem.getPurchaseOrder().getReceivedAt()
                    : purchaseItem.getPurchaseOrder().getPoDate();
            if (receiptTime == null || receiptTime.isBefore(supplyWindowStart) || !receiptTime.isBefore(dayEnd)) {
                continue;
            }

            MovementStats stats = getMovementStats(
                    movementByStore,
                    purchaseItem.getPurchaseOrder().getStore().getStoreId(),
                    purchaseItem.getMedicine().getMedicineId()
            );
            if (purchaseItem.getPurchaseOrder().getPoId() != null
                    && stats.receiptOrderIds.add(purchaseItem.getPurchaseOrder().getPoId())) {
                stats.recentReceiptCount++;
            }
            stats.receiptQuantityPacks = stats.receiptQuantityPacks.add(toPackEquivalent(purchaseItem));
        }

        for (StockTransfer transfer : transfers) {
            if (!"RECEIVED".equalsIgnoreCase(transfer.getStatus()) || transfer.getMedicine() == null
                    || transfer.getMedicine().getMedicineId() == null) {
                continue;
            }

            LocalDateTime movementTime = transfer.getCompletedAt() != null
                    ? transfer.getCompletedAt()
                    : transfer.getDispatchedAt() != null ? transfer.getDispatchedAt() : transfer.getCreatedAt();
            if (movementTime == null || movementTime.isBefore(supplyWindowStart) || !movementTime.isBefore(dayEnd)) {
                continue;
            }

            BigDecimal transferPacks = toPackEquivalent(
                    transfer.getQuantityStrips(),
                    transfer.getQuantityLoose(),
                    transfer.getMedicine()
            );

            if (transfer.getToStore() != null && transfer.getToStore().getStoreId() != null) {
                MovementStats inboundStats = getMovementStats(
                        movementByStore,
                        transfer.getToStore().getStoreId(),
                        transfer.getMedicine().getMedicineId()
                );
                if (inboundStats.transferInIds.add(transfer.getTransferId())) {
                    inboundStats.transferInCount++;
                }
                inboundStats.transferInQuantityPacks = inboundStats.transferInQuantityPacks.add(transferPacks);
            }

            if (transfer.getFromStore() != null && transfer.getFromStore().getStoreId() != null) {
                MovementStats outboundStats = getMovementStats(
                        movementByStore,
                        transfer.getFromStore().getStoreId(),
                        transfer.getMedicine().getMedicineId()
                );
                if (outboundStats.transferOutIds.add(transfer.getTransferId())) {
                    outboundStats.transferOutCount++;
                }
                outboundStats.transferOutQuantityPacks = outboundStats.transferOutQuantityPacks.add(transferPacks);
                if (!movementTime.isBefore(demandWindowStart)) {
                    outboundStats.totalDemandPacks = outboundStats.totalDemandPacks.add(transferPacks);
                }
            }
        }

        int demandDays = Math.max(1, (int) ChronoUnit.DAYS.between(demandWindowStart.toLocalDate(), dayEnd.toLocalDate()));
        movementByStore.values().forEach(byMedicine ->
                byMedicine.values().forEach(stats -> {
                    if (stats.totalDemandPacks.compareTo(BigDecimal.ZERO) > 0) {
                        stats.averageDailyDemand = stats.totalDemandPacks
                                .divide(BigDecimal.valueOf(demandDays), 4, RoundingMode.HALF_UP);
                    }
                })
        );

        return movementByStore;
    }

    private MovementStats getMovementStats(Map<UUID, Map<UUID, MovementStats>> movementByStore,
                                           UUID storeId,
                                           UUID medicineId) {
        Map<UUID, MovementStats> byMedicine = movementByStore.computeIfAbsent(storeId, ignored -> new LinkedHashMap<>());
        return byMedicine.computeIfAbsent(medicineId, ignored -> new MovementStats());
    }

    private Map<UUID, SupplierMetrics> buildSupplierMetrics(List<UUID> accessibleStoreIds) {
        if (accessibleStoreIds.isEmpty()) {
            return Map.of();
        }

        Map<UUID, SupplierMetrics> metricsBySupplier = new LinkedHashMap<>();
        for (PurchaseOrder purchaseOrder : purchaseOrderRepository.findByStoreStoreIdInOrderByPoDateDesc(accessibleStoreIds)) {
            if (purchaseOrder.getSupplier() == null || purchaseOrder.getSupplier().getSupplierId() == null) {
                continue;
            }

            SupplierMetrics metrics = metricsBySupplier.computeIfAbsent(
                    purchaseOrder.getSupplier().getSupplierId(),
                    ignored -> new SupplierMetrics()
            );
            Integer leadTimeDays = calculateLeadTimeDays(
                    purchaseOrder.getPoDate(),
                    purchaseOrder.getReceivedAt() != null ? purchaseOrder.getReceivedAt() : purchaseOrder.getPoDate()
            );
            if ("RECEIVED".equalsIgnoreCase(purchaseOrder.getStatus()) && leadTimeDays != null) {
                metrics.leadTimeDayTotal += leadTimeDays;
                metrics.leadTimeSampleCount++;
                metrics.lastLeadTimeDays = leadTimeDays;
            }
        }
        return metricsBySupplier;
    }

    private SupplierInfo resolveSupplierInfo(Store targetStore,
                                             Medicine medicine,
                                             Map<UUID, SupplierMetrics> supplierMetricsById) {
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

        Supplier supplier = null;
        BigDecimal purchaseRate = null;

        if (isMoreRecentPlanLine(recentPlanLine, recentItem) && recentPlanLine != null && recentPlanLine.getPurchaseOrder() != null
                && recentPlanLine.getPurchaseOrder().getSupplier() != null) {
            supplier = recentPlanLine.getPurchaseOrder().getSupplier();
            purchaseRate = recentPlanLine.getPurchaseRate();
        } else if (recentItem != null && recentItem.getPurchaseOrder() != null && recentItem.getPurchaseOrder().getSupplier() != null) {
            supplier = recentItem.getPurchaseOrder().getSupplier();
            purchaseRate = recentItem.getPurchaseRate();
        }

        if (supplier == null) {
            supplier = supplierRepository.findAllByIsActiveTrueOrderByNameAsc()
                    .stream()
                    .findFirst()
                    .orElse(null);
        }

        if (purchaseRate == null) {
            purchaseRate = medicine.getPtr() != null
                ? medicine.getPtr()
                : medicine.getPts() != null ? medicine.getPts() : medicine.getMrp();
        }

        SupplierMetrics supplierMetrics = supplier != null ? supplierMetricsById.get(supplier.getSupplierId()) : null;
        Integer observedLeadTimeDays = supplierMetrics != null ? supplierMetrics.getObservedLeadTimeDays() : null;
        int effectiveLeadTimeDays = resolveEffectiveLeadTimeDays(supplier, supplierMetrics);

        return new SupplierInfo(supplier, purchaseRate, observedLeadTimeDays, effectiveLeadTimeDays);
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

    private int calculateTargetStockLevel(StoreMedicineSnapshot snapshot,
                                          MovementStats movementStats,
                                          int effectiveLeadTimeDays) {
        int baseline = Math.max(snapshot.reorderLevel, 0);
        if (movementStats.averageDailyDemand.compareTo(BigDecimal.ZERO) <= 0) {
            return baseline;
        }

        int safetyDays = movementStats.recentReceiptCount > 0 || movementStats.transferInCount > 0 ? 3 : 5;
        int planningDays = Math.max(effectiveLeadTimeDays, 1) + safetyDays;
        int demandDrivenLevel = movementStats.averageDailyDemand
                .multiply(BigDecimal.valueOf(planningDays))
                .setScale(0, RoundingMode.CEILING)
                .intValue();

        return Math.max(baseline, demandDrivenLevel);
    }

    private Integer calculateDaysOfCover(int currentQuantityStrips, BigDecimal averageDailyDemand) {
        if (averageDailyDemand == null || averageDailyDemand.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        if (currentQuantityStrips <= 0) {
            return 0;
        }
        return BigDecimal.valueOf(currentQuantityStrips)
                .divide(averageDailyDemand, 0, RoundingMode.DOWN)
                .intValue();
    }

    private boolean shouldRecommend(StoreMedicineSnapshot snapshot,
                                    int shortageQty,
                                    Integer daysOfCover,
                                    int effectiveLeadTimeDays) {
        if (shortageQty > 0) {
            return true;
        }
        if (snapshot.totalStrips <= 0 && snapshot.reorderLevel > 0) {
            return true;
        }
        return daysOfCover != null && daysOfCover <= Math.max(effectiveLeadTimeDays + 2, 5);
    }

    private String resolvePreferredAction(int recommendedTransferQty,
                                          int recommendedOrderQty,
                                          MovementStats movementStats) {
        if (recommendedTransferQty > 0 && recommendedOrderQty > 0) {
            return "HYBRID";
        }
        if (recommendedTransferQty > 0) {
            return "TRANSFER";
        }
        if (recommendedOrderQty > 0) {
            return movementStats.transferOutCount > movementStats.recentReceiptCount ? "PURCHASE" : "PURCHASE";
        }
        return "MONITOR";
    }

    private LocalDate resolveSuggestedOrderDate(LocalDate today, Integer daysOfCover, int effectiveLeadTimeDays) {
        if (daysOfCover == null) {
            return today;
        }
        int leadTimeDays = Math.max(effectiveLeadTimeDays, 1);
        if (daysOfCover <= leadTimeDays) {
            return today;
        }
        return today.plusDays(daysOfCover - leadTimeDays);
    }

    private String buildPlanningReason(MovementStats movementStats,
                                       Integer daysOfCover,
                                       SupplierInfo supplierInfo,
                                       String preferredAction) {
        String demandPart = movementStats.averageDailyDemand.compareTo(BigDecimal.ZERO) > 0
                ? "Rolling demand is " + scale(movementStats.averageDailyDemand).stripTrailingZeros().toPlainString() + " pack/day"
                : "No recent sales or donor movement is recorded";
        String coverPart = daysOfCover != null
                ? "current stock covers about " + daysOfCover + " day(s)"
                : "days of cover are still forming";
        String supplierPart = supplierInfo.supplier != null
                ? supplierInfo.supplier.getName() + " is the preferred supplier with "
                + supplierInfo.effectiveLeadTimeDays + " day lead time"
                + (supplierInfo.observedLeadTimeDays != null
                ? (supplierInfo.observedLeadTimeDays == 0 ? " (same-day receipts observed)" : " (" + supplierInfo.observedLeadTimeDays + " observed)")
                : "")
                : "no preferred supplier is linked yet";
        String movementPart = "recent supply shows "
                + movementStats.recentReceiptCount + " receipt(s), "
                + movementStats.transferInCount + " inbound transfer(s), and "
                + movementStats.transferOutCount + " outbound transfer(s)";
        return demandPart + "; " + coverPart + "; " + supplierPart + "; " + movementPart
                + ". Recommended action: " + preferredAction.toLowerCase() + ".";
    }

    private void ensureRelevantMedicines(Store targetStore,
                                         Map<UUID, StoreMedicineSnapshot> targetStock,
                                         Iterable<UUID> extraMedicineIds) {
        LinkedHashSet<UUID> relevantMedicineIds = new LinkedHashSet<>(targetStock.keySet());
        relevantMedicineIds.addAll(purchaseOrderItemRepository.findDistinctMedicineIdsByStoreId(targetStore.getStoreId()));
        relevantMedicineIds.addAll(invoiceItemRepository.findDistinctMedicineIdsByStoreId(targetStore.getStoreId()));
        if (extraMedicineIds != null) {
            for (UUID medicineId : extraMedicineIds) {
                if (medicineId != null) {
                    relevantMedicineIds.add(medicineId);
                }
            }
        }

        medicineRepository.findAllById(relevantMedicineIds)
                .forEach(medicine -> targetStock.computeIfAbsent(
                        medicine.getMedicineId(),
                        ignored -> new StoreMedicineSnapshot(targetStore, medicine)
                ));
    }

    private BigDecimal toPackEquivalent(InvoiceItem invoiceItem) {
        int packSize = invoiceItem.getPackSizeSnapshot() != null && invoiceItem.getPackSizeSnapshot() > 0
                ? invoiceItem.getPackSizeSnapshot()
                : safePackSize(invoiceItem.getMedicine());
        return toPackEquivalent(invoiceItem.getQuantity(), invoiceItem.getUnitType(), packSize);
    }

    private BigDecimal toPackEquivalent(PurchaseOrderItem purchaseOrderItem) {
        int packSize = safePackSize(purchaseOrderItem.getMedicine());
        int totalLooseUnits = (safe(purchaseOrderItem.getQuantity()) + safe(purchaseOrderItem.getFreeQty())) * packSize
                + safe(purchaseOrderItem.getQuantityLoose())
                + safe(purchaseOrderItem.getFreeQtyLoose());
        return BigDecimal.valueOf(totalLooseUnits)
                .divide(BigDecimal.valueOf(packSize), 4, RoundingMode.HALF_UP);
    }

    private BigDecimal toPackEquivalent(Integer quantityStrips, Integer quantityLoose, Medicine medicine) {
        int packSize = safePackSize(medicine);
        int totalLooseUnits = safe(quantityStrips) * packSize + safe(quantityLoose);
        return BigDecimal.valueOf(totalLooseUnits)
                .divide(BigDecimal.valueOf(packSize), 4, RoundingMode.HALF_UP);
    }

    private BigDecimal toPackEquivalent(BigDecimal quantity, String unitType, int packSize) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        if (isPackUnitType(unitType)) {
            return quantity.setScale(4, RoundingMode.HALF_UP);
        }
        return quantity.divide(BigDecimal.valueOf(Math.max(packSize, 1)), 4, RoundingMode.HALF_UP);
    }

    private boolean isPackUnitType(String unitType) {
        return "PACK".equalsIgnoreCase(unitType) || "STRIP".equalsIgnoreCase(unitType);
    }

    private Integer calculateLeadTimeDays(LocalDateTime orderedAt, LocalDateTime receivedAt) {
        if (orderedAt == null || receivedAt == null) {
            return null;
        }
        long days = ChronoUnit.DAYS.between(orderedAt.toLocalDate(), receivedAt.toLocalDate());
        return (int) Math.max(days, 0);
    }

    private int resolveEffectiveLeadTimeDays(Supplier supplier, SupplierMetrics metrics) {
        Integer configuredLeadTime = supplier != null && supplier.getDefaultLeadTimeDays() != null
                && supplier.getDefaultLeadTimeDays() > 0
                ? supplier.getDefaultLeadTimeDays()
                : null;
        if (configuredLeadTime != null) {
            return configuredLeadTime;
        }

        Integer observedLeadTime = metrics != null ? metrics.getObservedLeadTimeDays() : null;
        if (observedLeadTime != null && observedLeadTime > 0) {
            return observedLeadTime;
        }

        return 2;
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
        private final Integer observedLeadTimeDays;
        private final int effectiveLeadTimeDays;

        private SupplierInfo(Supplier supplier,
                             BigDecimal purchaseRate,
                             Integer observedLeadTimeDays,
                             int effectiveLeadTimeDays) {
            this.supplier = supplier;
            this.purchaseRate = purchaseRate;
            this.observedLeadTimeDays = observedLeadTimeDays;
            this.effectiveLeadTimeDays = effectiveLeadTimeDays;
        }
    }

    private static final class MovementStats {
        private BigDecimal totalDemandPacks = BigDecimal.ZERO;
        private BigDecimal receiptQuantityPacks = BigDecimal.ZERO;
        private BigDecimal transferInQuantityPacks = BigDecimal.ZERO;
        private BigDecimal transferOutQuantityPacks = BigDecimal.ZERO;
        private BigDecimal averageDailyDemand = BigDecimal.ZERO;
        private int recentReceiptCount;
        private int transferInCount;
        private int transferOutCount;
        private final LinkedHashSet<UUID> receiptOrderIds = new LinkedHashSet<>();
        private final LinkedHashSet<UUID> transferInIds = new LinkedHashSet<>();
        private final LinkedHashSet<UUID> transferOutIds = new LinkedHashSet<>();
    }

    private static final class SupplierMetrics {
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
}
