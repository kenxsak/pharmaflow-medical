package com.pharmaflow.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpiryLossRow {

    private UUID medicineId;
    private String brandName;
    private String genericName;
    private String manufacturerName;
    private int expiredBatchCount;
    private int expiredStrips;
    private int expiredLoose;
    private BigDecimal estimatedLossValue;
    private LocalDate lastExpiryDate;
}
