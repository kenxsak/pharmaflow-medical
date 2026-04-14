package com.pharmaflow.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockBatchResponse {

    private UUID batchId;
    private UUID medicineId;
    private String brandName;
    private String genericName;
    private String batchNumber;
    private LocalDate expiryDate;
    private Integer quantityStrips;
    private Integer quantityLoose;
    private BigDecimal purchaseRate;
    private BigDecimal mrp;
    private String expiryStatus;
}
