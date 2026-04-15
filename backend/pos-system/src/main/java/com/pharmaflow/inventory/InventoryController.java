package com.pharmaflow.inventory;

import com.pharmaflow.inventory.dto.ExpiryAlertSummary;
import com.pharmaflow.inventory.dto.ReplenishmentInsightResponse;
import com.pharmaflow.inventory.dto.ShortageItemResponse;
import com.pharmaflow.inventory.dto.StockTransferCreateRequest;
import com.pharmaflow.inventory.dto.StockBatchResponse;
import com.pharmaflow.inventory.dto.StockTransferResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@Validated
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;
    private final ExpiryAlertService expiryAlertService;
    private final ReplenishmentService replenishmentService;

    @GetMapping("/stock/{medicineId}")
    public List<StockBatchResponse> getStock(
            @PathVariable UUID medicineId,
            @RequestParam("storeId") UUID storeId
    ) {
        return inventoryService.getStock(storeId, medicineId);
    }

    @GetMapping("/search")
    public List<StockBatchResponse> searchStock(
            @RequestParam("storeId") UUID storeId,
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return inventoryService.searchStock(storeId, query, limit);
    }

    @GetMapping("/expiry-alerts")
    public ExpiryAlertSummary getExpiryAlerts(@RequestParam("storeId") UUID storeId) {
        return expiryAlertService.getExpiryAlerts(storeId);
    }

    @GetMapping("/shortage")
    public List<ShortageItemResponse> getShortageReport(@RequestParam("storeId") UUID storeId) {
        return expiryAlertService.getShortageReport(storeId);
    }

    @GetMapping("/replenishment")
    public ReplenishmentInsightResponse getReplenishmentInsights(
            @RequestParam(value = "storeId", required = false) UUID storeId,
            @RequestParam(defaultValue = "15") int limit
    ) {
        return replenishmentService.getInsights(storeId, limit);
    }

    @PostMapping("/transfers")
    public StockTransferResponse createTransferRequest(@Valid @RequestBody StockTransferCreateRequest request) {
        return replenishmentService.createTransferRequest(request);
    }
}
