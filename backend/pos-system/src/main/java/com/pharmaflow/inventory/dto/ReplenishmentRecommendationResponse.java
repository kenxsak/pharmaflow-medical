package com.pharmaflow.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplenishmentRecommendationResponse {

    private UUID targetStoreId;
    private String targetStoreCode;
    private String targetStoreName;
    private UUID medicineId;
    private String brandName;
    private String genericName;
    private String manufacturerName;
    private Integer reorderLevel;
    private Integer currentQuantityStrips;
    private Integer shortageQuantityStrips;
    private LocalDate nearestExpiryDate;
    private String preferredAction;
    private Integer recommendedTransferQuantityStrips;
    private Integer recommendedOrderQuantityStrips;
    private UUID supplierId;
    private String supplierName;
    private BigDecimal lastPurchaseRate;
    private BigDecimal mrp;
    private BigDecimal gstRate;
    private BigDecimal estimatedOrderValue;
    private List<TransferRecommendationResponse> transferOptions;
}
