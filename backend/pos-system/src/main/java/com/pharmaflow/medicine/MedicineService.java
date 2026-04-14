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
import java.util.List;
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
        return medicineRepository.searchCatalog(query.trim(), PageRequest.of(0, safeLimit))
                .stream()
                .map(medicine -> toSearchResponse(medicine, resolveCurrentBatch(storeId, medicine.getMedicineId())))
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

    public List<SubstituteResponse> getSubstitutes(UUID medicineId) {
        return medicineSubstituteRepository.findByMedicineMedicineId(medicineId)
                .stream()
                .map(this::toSubstituteResponse)
                .collect(Collectors.toList());
    }

    private InventoryBatch resolveCurrentBatch(UUID storeId, UUID medicineId) {
        LocalDate today = LocalDate.now();
        if (storeId != null) {
            return inventoryBatchRepository
                    .findFirstByStoreStoreIdAndMedicineMedicineIdAndIsActiveTrueAndExpiryDateGreaterThanEqualOrderByExpiryDateAsc(
                            storeId,
                            medicineId,
                            today
                    )
                    .orElse(null);
        }
        return inventoryBatchRepository
                .findFirstByMedicineMedicineIdAndIsActiveTrueAndExpiryDateGreaterThanEqualOrderByExpiryDateAsc(
                        medicineId,
                        today
                )
                .orElse(null);
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
                .currentBatch(currentBatch != null ? BatchSnapshotResponse.builder()
                        .batchId(currentBatch.getBatchId())
                        .batchNumber(currentBatch.getBatchNumber())
                        .expiryDate(currentBatch.getExpiryDate())
                        .quantityStrips(currentBatch.getQuantityStrips())
                        .quantityLoose(currentBatch.getQuantityLoose())
                        .expiryStatus(expiryStatus(currentBatch))
                        .build() : null)
                .build();
    }

    private SubstituteResponse toSubstituteResponse(MedicineSubstitute substitute) {
        Medicine alt = substitute.getSubstitute();
        return SubstituteResponse.builder()
                .medicineId(alt != null ? alt.getMedicineId() : null)
                .brandName(alt != null ? alt.getBrandName() : null)
                .genericName(alt != null ? alt.getGenericName() : null)
                .mrp(alt != null ? alt.getMrp() : null)
                .isGeneric(substitute.getIsGeneric())
                .priceDiffPct(substitute.getPriceDiffPct())
                .build();
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
