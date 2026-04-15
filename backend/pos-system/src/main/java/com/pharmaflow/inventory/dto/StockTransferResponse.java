package com.pharmaflow.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransferResponse {

    private UUID transferId;
    private String status;
    private UUID fromStoreId;
    private String fromStoreCode;
    private UUID toStoreId;
    private String toStoreCode;
    private UUID medicineId;
    private String brandName;
    private UUID batchId;
    private String batchNumber;
    private Integer quantityStrips;
    private Integer quantityLoose;
    private LocalDateTime createdAt;
}
