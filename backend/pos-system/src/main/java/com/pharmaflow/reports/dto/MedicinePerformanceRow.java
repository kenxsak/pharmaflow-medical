package com.pharmaflow.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicinePerformanceRow {

    private UUID medicineId;
    private String brandName;
    private String genericName;
    private String manufacturerName;
    private BigDecimal soldQuantity;
    private BigDecimal salesValue;
    private BigDecimal estimatedProfit;
    private Integer currentStockStrips;
    private Integer currentStockLoose;
    private String velocityLabel;
}
