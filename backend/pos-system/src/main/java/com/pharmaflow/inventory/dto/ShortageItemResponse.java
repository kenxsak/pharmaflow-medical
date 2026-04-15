package com.pharmaflow.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShortageItemResponse {

    private UUID medicineId;
    private String brandName;
    private String genericName;
    private String manufacturerName;
    private String medicineForm;
    private Integer packSize;
    private String packSizeLabel;
    private Integer reorderLevel;
    private Integer quantityStrips;
    private Integer quantityLoose;
    private Integer suggestedOrderQty;
    private LocalDate nearestExpiryDate;
}
