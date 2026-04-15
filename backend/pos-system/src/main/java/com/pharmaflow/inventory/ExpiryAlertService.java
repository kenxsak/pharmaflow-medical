package com.pharmaflow.inventory;

import com.pharmaflow.inventory.dto.ExpiryAlertSummary;
import com.pharmaflow.inventory.dto.ShortageItemResponse;
import com.pharmaflow.inventory.dto.StockBatchResponse;
import com.pharmaflow.billing.InvoiceItemRepository;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.medicine.MedicineRepository;
import com.pharmaflow.procurement.PurchaseOrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
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
public class ExpiryAlertService {

    private final InventoryBatchRepository inventoryBatchRepository;
    private final InventoryService inventoryService;
    private final MedicineRepository medicineRepository;
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
