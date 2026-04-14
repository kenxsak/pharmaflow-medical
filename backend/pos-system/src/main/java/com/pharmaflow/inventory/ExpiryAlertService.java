package com.pharmaflow.inventory;

import com.pharmaflow.inventory.dto.ExpiryAlertSummary;
import com.pharmaflow.inventory.dto.ShortageItemResponse;
import com.pharmaflow.inventory.dto.StockBatchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExpiryAlertService {

    private final InventoryBatchRepository inventoryBatchRepository;
    private final InventoryService inventoryService;

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
        return inventoryBatchRepository.findStockBelowReorderLevel(storeId)
                .stream()
                .map(batch -> ShortageItemResponse.builder()
                        .medicineId(batch.getMedicine() != null ? batch.getMedicine().getMedicineId() : null)
                        .brandName(batch.getMedicine() != null ? batch.getMedicine().getBrandName() : null)
                        .genericName(batch.getMedicine() != null ? batch.getMedicine().getGenericName() : null)
                        .manufacturerName(batch.getMedicine() != null && batch.getMedicine().getManufacturer() != null
                                ? batch.getMedicine().getManufacturer().getName()
                                : null)
                        .reorderLevel(batch.getMedicine() != null ? batch.getMedicine().getReorderLevel() : null)
                        .quantityStrips(batch.getQuantityStrips())
                        .quantityLoose(batch.getQuantityLoose())
                        .suggestedOrderQty(suggestedOrderQty(batch))
                        .nearestExpiryDate(batch.getExpiryDate())
                        .build())
                .collect(Collectors.toList());
    }

    private BigDecimal calculateValue(List<StockBatchResponse> items) {
        return items.stream()
                .map(item -> item.getMrp().multiply(BigDecimal.valueOf(item.getQuantityStrips() == null ? 0 : item.getQuantityStrips())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Integer suggestedOrderQty(InventoryBatch batch) {
        int reorderLevel = batch.getMedicine() != null && batch.getMedicine().getReorderLevel() != null
                ? batch.getMedicine().getReorderLevel()
                : 0;
        int currentQty = batch.getQuantityStrips() == null ? 0 : batch.getQuantityStrips();
        return Math.max(reorderLevel - currentQty, 0);
    }
}
