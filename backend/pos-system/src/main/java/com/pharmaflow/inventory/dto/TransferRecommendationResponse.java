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
public class TransferRecommendationResponse {

    private UUID fromStoreId;
    private String fromStoreCode;
    private String fromStoreName;
    private UUID batchId;
    private String batchNumber;
    private LocalDate expiryDate;
    private Integer transferableQuantityStrips;
}
