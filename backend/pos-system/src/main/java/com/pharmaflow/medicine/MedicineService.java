package com.pharmaflow.medicine;

import com.pharmaflow.inventory.InventoryBatch;
import com.pharmaflow.inventory.InventoryBatchRepository;
import com.pharmaflow.medicine.dto.BatchSnapshotResponse;
import com.pharmaflow.medicine.dto.MedicineSearchResponse;
import com.pharmaflow.medicine.dto.SubstituteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final MedicineSubstituteRepository medicineSubstituteRepository;
    private final InventoryBatchRepository inventoryBatchRepository;

    public List<MedicineSearchResponse> search(UUID storeId, String query) {
        return searchCatalog(storeId, query, 20);
    }

    public List<MedicineSearchResponse> searchCatalog(UUID storeId, String query, int limit) {
        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<Medicine> medicines = medicineRepository.searchCatalog(query.trim(), PageRequest.of(0, safeLimit))
                .stream()
                .collect(Collectors.toList());
        Map<UUID, InventoryBatch> currentBatchByMedicine = resolveCurrentBatches(storeId, medicines);

        return medicines.stream()
                .map(medicine -> toSearchResponse(medicine, currentBatchByMedicine.get(medicine.getMedicineId())))
                .collect(Collectors.toList());
    }

    public MedicineSearchResponse lookupByBarcode(UUID storeId, String barcode) {
        if (barcode == null || barcode.isBlank()) {
            throw new IllegalArgumentException("Barcode is required");
        }
        Medicine medicine = medicineRepository.findFirstByBarcodeIgnoreCase(barcode.trim())
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found for barcode " + barcode));
        return toSearchResponse(medicine, resolveCurrentBatch(storeId, medicine.getMedicineId()));
    }

    public List<SubstituteResponse> getSubstitutes(UUID storeId, UUID medicineId) {
        return medicineSubstituteRepository.findByMedicineMedicineId(medicineId)
                .stream()
                .map(substitute -> toSubstituteResponse(storeId, substitute))
                .filter(substitute -> substitute.getCurrentBatch() != null)
                .collect(Collectors.toList());
    }

    private InventoryBatch resolveCurrentBatch(UUID storeId, UUID medicineId) {
        LocalDate today = LocalDate.now();
        if (storeId != null) {
            return inventoryBatchRepository
                    .findSellableBatches(storeId, medicineId, today)
                    .stream()
                    .filter(this::hasAvailableQuantity)
                    .findFirst()
                    .orElse(null);
        }
        return inventoryBatchRepository
                .findFirstByMedicineMedicineIdAndIsActiveTrueAndExpiryDateGreaterThanEqualOrderByExpiryDateAsc(
                        medicineId,
                        today
                )
                .filter(this::hasAvailableQuantity)
                .orElse(null);
    }

    private Map<UUID, InventoryBatch> resolveCurrentBatches(UUID storeId, List<Medicine> medicines) {
        if (medicines == null || medicines.isEmpty()) {
            return Collections.emptyMap();
        }

        List<UUID> medicineIds = medicines.stream()
                .map(Medicine::getMedicineId)
                .collect(Collectors.toList());
        LocalDate today = LocalDate.now();

        List<InventoryBatch> batches = storeId != null
                ? inventoryBatchRepository.findCurrentSellableBatches(storeId, medicineIds, today)
                : inventoryBatchRepository.findCurrentSellableBatches(medicineIds, today);

        Map<UUID, InventoryBatch> currentBatchByMedicine = new LinkedHashMap<>();
        for (InventoryBatch batch : batches) {
            if (batch.getMedicine() == null || batch.getMedicine().getMedicineId() == null) {
                continue;
            }
            currentBatchByMedicine.putIfAbsent(batch.getMedicine().getMedicineId(), batch);
        }
        return currentBatchByMedicine;
    }

    private MedicineSearchResponse toSearchResponse(Medicine medicine, InventoryBatch currentBatch) {
        return MedicineSearchResponse.builder()
                .medicineId(medicine.getMedicineId())
                .brandName(medicine.getBrandName())
                .genericName(medicine.getGenericName())
                .saltName(medicine.getSaltComposition() != null ? medicine.getSaltComposition().getSaltName() : null)
                .barcode(medicine.getBarcode())
                .medicineForm(medicine.getMedicineForm())
                .strength(medicine.getStrength())
                .packSizeLabel(medicine.getPackSizeLabel())
                .compositionSummary(medicine.getCompositionSummary())
                .manufacturer(medicine.getManufacturer() != null ? medicine.getManufacturer().getName() : null)
                .scheduleType(medicine.getScheduleType())
                .requiresRx(medicine.getRequiresRx())
                .isNarcotic(medicine.getIsNarcotic())
                .isPsychotropic(medicine.getIsPsychotropic())
                .packSize(medicine.getPackSize())
                .mrp(medicine.getMrp())
                .gstRate(medicine.getGstRate())
                .currentBatch(toBatchSnapshotResponse(currentBatch))
                .build();
    }

    private SubstituteResponse toSubstituteResponse(UUID storeId, MedicineSubstitute substitute) {
        Medicine alt = substitute.getSubstitute();
        InventoryBatch currentBatch = alt != null ? resolveCurrentBatch(storeId, alt.getMedicineId()) : null;
        return SubstituteResponse.builder()
                .medicineId(alt != null ? alt.getMedicineId() : null)
                .brandName(alt != null ? alt.getBrandName() : null)
                .genericName(alt != null ? alt.getGenericName() : null)
                .medicineForm(alt != null ? alt.getMedicineForm() : null)
                .strength(alt != null ? alt.getStrength() : null)
                .packSizeLabel(alt != null ? alt.getPackSizeLabel() : null)
                .manufacturer(alt != null && alt.getManufacturer() != null ? alt.getManufacturer().getName() : null)
                .scheduleType(alt != null ? alt.getScheduleType() : null)
                .requiresRx(alt != null ? alt.getRequiresRx() : null)
                .isNarcotic(alt != null ? alt.getIsNarcotic() : null)
                .isPsychotropic(alt != null ? alt.getIsPsychotropic() : null)
                .packSize(alt != null ? alt.getPackSize() : null)
                .mrp(alt != null ? alt.getMrp() : null)
                .gstRate(alt != null ? alt.getGstRate() : null)
                .isGeneric(substitute.getIsGeneric())
                .priceDiffPct(substitute.getPriceDiffPct())
                .currentBatch(toBatchSnapshotResponse(currentBatch))
                .build();
    }

    private BatchSnapshotResponse toBatchSnapshotResponse(InventoryBatch currentBatch) {
        return currentBatch != null ? BatchSnapshotResponse.builder()
                .batchId(currentBatch.getBatchId())
                .batchNumber(currentBatch.getBatchNumber())
                .expiryDate(currentBatch.getExpiryDate())
                .quantityStrips(currentBatch.getQuantityStrips())
                .quantityLoose(currentBatch.getQuantityLoose())
                .expiryStatus(expiryStatus(currentBatch))
                .build() : null;
    }

    private boolean hasAvailableQuantity(InventoryBatch batch) {
        int strips = batch.getQuantityStrips() != null ? batch.getQuantityStrips() : 0;
        int loose = batch.getQuantityLoose() != null ? batch.getQuantityLoose() : 0;
        return strips > 0 || loose > 0;
    }

    private String expiryStatus(InventoryBatch batch) {
        if (batch == null || batch.getExpiryDate() == null) {
            return "UNKNOWN";
        }
        LocalDate today = LocalDate.now();
        if (!batch.getExpiryDate().isAfter(today)) {
            return "EXPIRED";
        }
        if (!batch.getExpiryDate().isAfter(today.plusDays(30))) {
            return "EXPIRY_30";
        }
        if (!batch.getExpiryDate().isAfter(today.plusDays(60))) {
            return "EXPIRY_60";
        }
        if (!batch.getExpiryDate().isAfter(today.plusDays(90))) {
            return "EXPIRY_90";
        }
        return "OK";
    }
}
