package com.pharmaflow.inventory;

import com.pharmaflow.inventory.dto.ExpiryAlertSummary;
import com.pharmaflow.inventory.dto.ExpiryActionQueueResponse;
import com.pharmaflow.inventory.dto.ExpiryActionRecommendationResponse;
import com.pharmaflow.inventory.dto.ShortageItemResponse;
import com.pharmaflow.inventory.dto.StockBatchResponse;
import com.pharmaflow.billing.InvoiceItemRepository;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.medicine.MedicineRepository;
import com.pharmaflow.procurement.PharmaSupplierRepository;
import com.pharmaflow.procurement.PurchaseOrderItem;
import com.pharmaflow.procurement.PurchaseOrderItemRepository;
import com.pharmaflow.procurement.Supplier;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExpiryAlertService {

    private final InventoryBatchRepository inventoryBatchRepository;
    private final InventoryService inventoryService;
    private final MedicineRepository medicineRepository;
    private final StoreRepository storeRepository;
    private final PharmaSupplierRepository supplierRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final InvoiceItemRepository invoiceItemRepository;

    public ExpiryAlertSummary getExpiryAlerts(UUID storeId) {
        LocalDate today = LocalDate.now();

        List<StockBatchResponse> expired = inventoryBatchRepository.findExpiredBatches(storeId, today)
                .stream()
                .map(inventoryService::toStockBatchResponse)
                .collect(Collectors.toList());

        List<StockBatchResponse> expiring30 = inventoryBatchRepository.findBatchesExpiringBetween(storeId, today, today.plusDays(30))
                .stream()
                .map(inventoryService::toStockBatchResponse)
                .collect(Collectors.toList());

        List<StockBatchResponse> expiring60 = inventoryBatchRepository.findBatchesExpiringBetween(storeId, today.plusDays(30), today.plusDays(60))
                .stream()
                .map(inventoryService::toStockBatchResponse)
                .collect(Collectors.toList());

        List<StockBatchResponse> expiring90 = inventoryBatchRepository.findBatchesExpiringBetween(storeId, today.plusDays(60), today.plusDays(90))
                .stream()
                .map(inventoryService::toStockBatchResponse)
                .collect(Collectors.toList());

        return ExpiryAlertSummary.builder()
                .expired(expired)
                .expiring30Days(expiring30)
                .expiring60Days(expiring60)
                .expiring90Days(expiring90)
                .totalExpiredValue(calculateValue(expired))
                .totalAtRiskValue(calculateValue(expiring30))
                .build();
    }

    public List<ShortageItemResponse> getShortageReport(UUID storeId) {
        Map<UUID, MedicineStockSummary> summaries = buildRelevantMedicineSummaries(storeId);

        return summaries.values().stream()
                .filter(this::isBelowReorderLevel)
                .sorted(Comparator
                        .comparing(MedicineStockSummary::suggestedOrderQty)
                        .reversed()
                        .thenComparing(summary -> summary.medicine.getBrandName(), Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(summary -> ShortageItemResponse.builder()
                        .medicineId(summary.medicine.getMedicineId())
                        .brandName(summary.medicine.getBrandName())
                        .genericName(summary.medicine.getGenericName())
                        .manufacturerName(summary.medicine.getManufacturer() != null
                                ? summary.medicine.getManufacturer().getName()
                                : null)
                        .medicineForm(summary.medicine.getMedicineForm())
                        .packSize(summary.medicine.getPackSize())
                        .packSizeLabel(summary.medicine.getPackSizeLabel())
                        .reorderLevel(summary.reorderLevel())
                        .quantityStrips(summary.totalStrips)
                        .quantityLoose(summary.totalLoose)
                        .suggestedOrderQty(summary.suggestedOrderQty())
                        .nearestExpiryDate(summary.nearestExpiryDate)
                        .build())
                .collect(Collectors.toList());
    }

    public ExpiryActionQueueResponse getExpiryActionQueue(UUID storeId, int limit) {
        Store store = storeRepository.findByStoreId(storeId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found"));
        LocalDate today = LocalDate.now();
        int safeLimit = Math.max(1, Math.min(limit, 200));
        boolean hasSiblingStores = hasSiblingStores(store);

        List<ExpiryActionRecommendationResponse> recommendations = inventoryBatchRepository.findActiveStockForStore(storeId)
                .stream()
                .filter(batch -> batch.getExpiryDate() != null)
                .filter(batch -> !batch.getExpiryDate().isAfter(today.plusDays(90)))
                .filter(this::hasRecoverableQuantity)
                .filter(batch -> !"DUMPED".equals(normalizeText(batch.getInventoryState())))
                .sorted(Comparator
                        .comparing(InventoryBatch::getExpiryDate)
                        .thenComparing(InventoryBatch::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(safeLimit)
                .map(batch -> toExpiryActionRecommendation(store, batch, today, hasSiblingStores))
                .collect(Collectors.toList());

        BigDecimal rtvCandidateValue = recommendations.stream()
                .filter(recommendation -> "RTV_NOW".equals(recommendation.getRecommendedAction()))
                .map(ExpiryActionRecommendationResponse::getStockValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal dumpCandidateValue = recommendations.stream()
                .filter(recommendation -> "DUMP_NOW".equals(recommendation.getRecommendedAction()))
                .map(ExpiryActionRecommendationResponse::getStockValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int quarantineCandidateCount = (int) recommendations.stream()
                .filter(recommendation -> "QUARANTINE_NOW".equals(recommendation.getRecommendedAction()))
                .count();

        int immediateActionCount = (int) recommendations.stream()
                .filter(recommendation -> List.of("QUARANTINE_NOW", "RTV_NOW", "DUMP_NOW").contains(recommendation.getRecommendedAction()))
                .count();

        return ExpiryActionQueueResponse.builder()
                .recommendationCount(recommendations.size())
                .immediateActionCount(immediateActionCount)
                .quarantineCandidateCount(quarantineCandidateCount)
                .rtvCandidateValue(scale(rtvCandidateValue))
                .dumpCandidateValue(scale(dumpCandidateValue))
                .recommendations(recommendations)
                .build();
    }

    private BigDecimal calculateValue(List<StockBatchResponse> items) {
        return items.stream()
                .map(item -> item.getMrp().multiply(BigDecimal.valueOf(item.getQuantityStrips() == null ? 0 : item.getQuantityStrips())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Map<UUID, MedicineStockSummary> buildRelevantMedicineSummaries(UUID storeId) {
        List<InventoryBatch> activeBatches = inventoryBatchRepository.findActiveStockForStore(storeId);
        Map<UUID, MedicineStockSummary> summaries = new LinkedHashMap<>();

        for (InventoryBatch batch : activeBatches) {
            if (batch.getMedicine() == null || batch.getMedicine().getMedicineId() == null) {
                continue;
            }
            summaries.computeIfAbsent(
                    batch.getMedicine().getMedicineId(),
                    ignored -> new MedicineStockSummary(batch.getMedicine())
            ).include(batch);
        }

        LinkedHashSet<UUID> relevantMedicineIds = new LinkedHashSet<>(summaries.keySet());
        relevantMedicineIds.addAll(purchaseOrderItemRepository.findDistinctMedicineIdsByStoreId(storeId));
        relevantMedicineIds.addAll(invoiceItemRepository.findDistinctMedicineIdsByStoreId(storeId));

        medicineRepository.findAllById(relevantMedicineIds)
                .forEach(medicine -> summaries.computeIfAbsent(
                        medicine.getMedicineId(),
                        ignored -> new MedicineStockSummary(medicine)
                ));

        return summaries;
    }

    private boolean isBelowReorderLevel(MedicineStockSummary summary) {
        return summary.reorderLevel() > 0 && summary.totalStrips < summary.reorderLevel();
    }

    private ExpiryActionRecommendationResponse toExpiryActionRecommendation(Store store,
                                                                            InventoryBatch batch,
                                                                            LocalDate today,
                                                                            boolean hasSiblingStores) {
        int daysToExpiry = (int) ChronoUnit.DAYS.between(today, batch.getExpiryDate());
        Supplier supplier = resolveSuggestedSupplier(store, batch.getMedicine());
        ExpiryActionPlan plan = determineAction(batch, daysToExpiry, supplier != null, hasSiblingStores);

        return ExpiryActionRecommendationResponse.builder()
                .batchId(batch.getBatchId())
                .medicineId(batch.getMedicine() != null ? batch.getMedicine().getMedicineId() : null)
                .brandName(batch.getMedicine() != null ? batch.getMedicine().getBrandName() : null)
                .genericName(batch.getMedicine() != null ? batch.getMedicine().getGenericName() : null)
                .batchNumber(batch.getBatchNumber())
                .expiryDate(batch.getExpiryDate())
                .daysToExpiry(daysToExpiry)
                .quantityStrips(safe(batch.getQuantityStrips()))
                .quantityLoose(safe(batch.getQuantityLoose()))
                .mrp(scale(batch.getMrp()))
                .stockValue(estimateStockValue(batch))
                .expiryStatus(inventoryService.toStockBatchResponse(batch).getExpiryStatus())
                .inventoryState(normalizeStateLabel(batch.getInventoryState()))
                .recommendedAction(plan.code)
                .actionLabel(plan.label)
                .actionSeverity(plan.severity)
                .actionReason(plan.reason)
                .suggestedSupplierId(supplier != null ? supplier.getSupplierId() : null)
                .suggestedSupplierName(supplier != null ? supplier.getName() : null)
                .canQuarantine("QUARANTINE_NOW".equals(plan.code))
                .canCreateRtv("RTV_NOW".equals(plan.code))
                .canCreateDump("DUMP_NOW".equals(plan.code))
                .build();
    }

    private ExpiryActionPlan determineAction(InventoryBatch batch,
                                             int daysToExpiry,
                                             boolean hasSupplier,
                                             boolean hasSiblingStores) {
        String inventoryState = normalizeText(batch.getInventoryState());

        if ("QUARANTINED".equals(inventoryState)) {
            if (daysToExpiry <= 30 && hasSupplier) {
                return new ExpiryActionPlan(
                        "RTV_NOW",
                        "Create RTV claim",
                        "HIGH",
                        "This batch is already blocked from sale and still has recoverable value through the supplier workflow."
                );
            }
            if (daysToExpiry <= 0) {
                return new ExpiryActionPlan(
                        "DUMP_NOW",
                        "Write off as dump",
                        "HIGH",
                        "The batch is expired and already blocked from sale, so the next clean action is a dump note."
                );
            }
        }

        if (daysToExpiry <= 0) {
            return new ExpiryActionPlan(
                    "QUARANTINE_NOW",
                    "Block from sale",
                    "HIGH",
                    "Expired stock should be removed from the sellable pool immediately before any recovery step."
            );
        }

        if (daysToExpiry <= 30) {
            if (hasSupplier) {
                return new ExpiryActionPlan(
                        "RTV_NOW",
                        "Start supplier return",
                        "HIGH",
                        "This batch is inside the highest-risk expiry window and still has a likely supplier recovery path."
                );
            }
            if (hasSiblingStores) {
                return new ExpiryActionPlan(
                        "TRANSFER_REVIEW",
                        "Review network transfer",
                        "MEDIUM",
                        "The batch is close to expiry, and a faster-moving sibling store may be able to consume it first."
                );
            }
            return new ExpiryActionPlan(
                    "MONITOR_CLOSELY",
                    "Monitor closely",
                    "MEDIUM",
                    "This batch is close to expiry but has no clear supplier recovery path linked yet."
            );
        }

        if (daysToExpiry <= 60 && hasSiblingStores) {
            return new ExpiryActionPlan(
                    "TRANSFER_REVIEW",
                    "Review transfer window",
                    "MEDIUM",
                    "This batch still has time to move through the network before it becomes an urgent RTV candidate."
            );
        }

        return new ExpiryActionPlan(
                "MONITOR",
                "Monitor",
                "LOW",
                "Keep this batch visible in the ageing queue so it does not become an avoidable expiry surprise later."
        );
    }

    private Supplier resolveSuggestedSupplier(Store store, Medicine medicine) {
        if (store == null || store.getTenant() == null || medicine == null || medicine.getMedicineId() == null) {
            return null;
        }

        List<PurchaseOrderItem> recentItems = purchaseOrderItemRepository.findRecentByTenantAndMedicine(
                store.getTenant().getTenantId(),
                medicine.getMedicineId(),
                PageRequest.of(0, 5)
        );

        for (PurchaseOrderItem recentItem : recentItems) {
            if (recentItem.getPurchaseOrder() != null && recentItem.getPurchaseOrder().getSupplier() != null) {
                return recentItem.getPurchaseOrder().getSupplier();
            }
        }

        List<Supplier> activeSuppliers = supplierRepository.findAllByIsActiveTrueOrderByNameAsc();
        return activeSuppliers.size() == 1 ? activeSuppliers.get(0) : null;
    }

    private boolean hasSiblingStores(Store store) {
        return store != null
                && store.getTenant() != null
                && storeRepository.findAllByTenantTenantIdAndIsActiveTrueOrderByStoreNameAsc(
                        store.getTenant().getTenantId()
                ).size() > 1;
    }

    private boolean hasRecoverableQuantity(InventoryBatch batch) {
        return safe(batch.getQuantityStrips()) > 0 || safe(batch.getQuantityLoose()) > 0;
    }

    private BigDecimal estimateStockValue(InventoryBatch batch) {
        BigDecimal stripUnits = BigDecimal.valueOf(safe(batch.getQuantityStrips()));
        BigDecimal looseUnits = BigDecimal.valueOf(safe(batch.getQuantityLoose()));
        int packSize = batch.getMedicine() != null && batch.getMedicine().getPackSize() != null && batch.getMedicine().getPackSize() > 0
                ? batch.getMedicine().getPackSize()
                : 1;
        BigDecimal fractionalStrips = looseUnits.divide(BigDecimal.valueOf(packSize), 4, RoundingMode.HALF_UP);
        return scale(scale(batch.getMrp()).multiply(stripUnits.add(fractionalStrips)));
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeStateLabel(String value) {
        String normalized = normalizeText(value);
        if (normalized.isBlank()) {
            return "SELLABLE";
        }
        return normalized;
    }

    private BigDecimal scale(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private static final class ExpiryActionPlan {
        private final String code;
        private final String label;
        private final String severity;
        private final String reason;

        private ExpiryActionPlan(String code, String label, String severity, String reason) {
            this.code = code;
            this.label = label;
            this.severity = severity;
            this.reason = reason;
        }
    }

    private static final class MedicineStockSummary {
        private final Medicine medicine;
        private int totalStrips;
        private int totalLoose;
        private LocalDate nearestExpiryDate;

        private MedicineStockSummary(Medicine medicine) {
            this.medicine = medicine;
        }

        private void include(InventoryBatch batch) {
            totalStrips += batch.getQuantityStrips() == null ? 0 : batch.getQuantityStrips();
            totalLoose += batch.getQuantityLoose() == null ? 0 : batch.getQuantityLoose();
            if (batch.getExpiryDate() != null && (nearestExpiryDate == null || batch.getExpiryDate().isBefore(nearestExpiryDate))) {
                nearestExpiryDate = batch.getExpiryDate();
            }
        }

        private int reorderLevel() {
            return medicine.getReorderLevel() == null ? 0 : medicine.getReorderLevel();
        }

        private int suggestedOrderQty() {
            return Math.max(reorderLevel() - totalStrips, 0);
        }
    }
}
