package com.pharmaflow.inventory;

import com.pharmaflow.billing.dto.BillingItemRequest;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.medicine.MedicineRepository;
import com.pharmaflow.inventory.dto.StockBatchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryService {

    private final InventoryBatchRepository inventoryBatchRepository;
    private final MedicineRepository medicineRepository;
    private final InventoryMovementService inventoryMovementService;

    public List<StockBatchResponse> getStock(UUID storeId, UUID medicineId) {
        return inventoryBatchRepository.findByStoreStoreIdAndMedicineMedicineIdAndIsActiveTrueOrderByExpiryDateAsc(storeId, medicineId)
                .stream()
                .map(this::toStockBatchResponse)
                .collect(Collectors.toList());
    }

    public List<StockBatchResponse> searchStock(UUID storeId, String query, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return inventoryBatchRepository.searchByStoreId(storeId, query, PageRequest.of(0, safeLimit))
                .stream()
                .map(this::toStockBatchResponse)
                .collect(Collectors.toList());
    }

    public InventoryBatch getBatchOrThrow(UUID batchId) {
        return inventoryBatchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found"));
    }

    @Transactional
    public void validateNoExpiredBatches(List<BillingItemRequest> items) {
        if (items == null) {
            return;
        }
        for (BillingItemRequest item : items) {
            InventoryBatch batch = getBatchOrThrow(item.getBatchId());
            if (batch.getExpiryDate() == null || !batch.getExpiryDate().isAfter(LocalDate.now())) {
                throw new BusinessRuleException("Batch " + batch.getBatchNumber() + " is expired and cannot be billed");
            }
        }
    }

    @Transactional
    public InventoryBatch deductStock(UUID batchId, BigDecimal quantity, String unitType) {
        InventoryMovement movement = inventoryMovementService.applyQuantity(
                batchId,
                quantity.negate(),
                unitType,
                "ADJUST_REMOVE",
                "LEGACY_DEDUCT",
                "LEGACY_SERVICE",
                batchId.toString(),
                "Legacy inventory deduction path",
                null
        );
        return movement.getBatch();
    }

    @Transactional
    public void deductStock(UUID storeId, List<BillingItemRequest> items) {
        if (items == null) {
            return;
        }
        for (BillingItemRequest item : items) {
            InventoryBatch batch = getBatchOrThrow(item.getBatchId());
            if (storeId != null && batch.getStore() != null && !storeId.equals(batch.getStore().getStoreId())) {
                throw new BusinessRuleException("Batch " + batch.getBatchNumber() + " does not belong to the selected store");
            }
            deductStock(item.getBatchId(), item.getQuantity(), item.getUnitType());
        }
    }

    @Transactional
    public InventoryBatch addStock(UUID batchId, BigDecimal quantity, String unitType) {
        InventoryMovement movement = inventoryMovementService.applyQuantity(
                batchId,
                quantity,
                unitType,
                "ADJUST_ADD",
                "LEGACY_ADD",
                "LEGACY_SERVICE",
                batchId.toString(),
                "Legacy inventory add path",
                null
        );
        return movement.getBatch();
    }

    public StockBatchResponse toStockBatchResponse(InventoryBatch batch) {
        return StockBatchResponse.builder()
                .batchId(batch.getBatchId())
                .medicineId(batch.getMedicine() != null ? batch.getMedicine().getMedicineId() : null)
                .brandName(batch.getMedicine() != null ? batch.getMedicine().getBrandName() : null)
                .genericName(batch.getMedicine() != null ? batch.getMedicine().getGenericName() : null)
                .batchNumber(batch.getBatchNumber())
                .expiryDate(batch.getExpiryDate())
                .quantityStrips(batch.getQuantityStrips())
                .quantityLoose(batch.getQuantityLoose())
                .purchaseRate(batch.getPurchaseRate())
                .mrp(batch.getMrp())
                .expiryStatus(expiryStatus(batch.getExpiryDate()))
                .inventoryState(batch.getInventoryState())
                .build();
    }

    private String expiryStatus(LocalDate expiryDate) {
        LocalDate today = LocalDate.now();
        if (expiryDate == null) {
            return "UNKNOWN";
        }
        if (!expiryDate.isAfter(today)) {
            return "EXPIRED";
        }
        if (!expiryDate.isAfter(today.plusDays(30))) {
            return "EXPIRY_30";
        }
        if (!expiryDate.isAfter(today.plusDays(60))) {
            return "EXPIRY_60";
        }
        if (!expiryDate.isAfter(today.plusDays(90))) {
            return "EXPIRY_90";
        }
        return "OK";
    }

    private int toLooseUnits(BigDecimal quantity, String unitType, Integer packSize) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }
        if (!isPackUnitType(unitType)) {
            return quantity.setScale(0, RoundingMode.HALF_UP).intValueExact();
        }
        return quantity.multiply(BigDecimal.valueOf(safePackSize(packSize)))
                .setScale(0, RoundingMode.HALF_UP)
                .intValueExact();
    }

    private boolean isPackUnitType(String unitType) {
        return "PACK".equalsIgnoreCase(unitType) || "STRIP".equalsIgnoreCase(unitType);
    }

    private int safePackSize(Medicine medicine) {
        return safePackSize(medicine != null ? medicine.getPackSize() : null);
    }

    private int safePackSize(Integer packSize) {
        return packSize == null || packSize <= 0 ? 1 : packSize;
    }

    private Integer safe(Integer value) {
        return value == null ? 0 : value;
    }
}
