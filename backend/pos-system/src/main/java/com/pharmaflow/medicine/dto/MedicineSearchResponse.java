package com.pharmaflow.medicine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicineSearchResponse {

    private UUID medicineId;
    private String brandName;
    private String genericName;
    private String saltName;
    private String barcode;
    private String medicineForm;
    private String strength;
    private String packSizeLabel;
    private String compositionSummary;
    private String manufacturer;
    private String scheduleType;
    private Boolean requiresRx;
    private Boolean isNarcotic;
    private Boolean isPsychotropic;
    private Integer packSize;
    private BigDecimal mrp;
    private BigDecimal gstRate;
    private BatchSnapshotResponse currentBatch;
}
