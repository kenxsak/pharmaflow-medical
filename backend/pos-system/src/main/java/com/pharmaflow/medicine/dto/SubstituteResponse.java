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
public class SubstituteResponse {

    private UUID medicineId;
    private String brandName;
    private String genericName;
    private BigDecimal mrp;
    private Boolean isGeneric;
    private BigDecimal priceDiffPct;
}
