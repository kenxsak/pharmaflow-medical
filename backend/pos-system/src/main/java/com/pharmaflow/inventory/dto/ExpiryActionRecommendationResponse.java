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
public class ExpiryActionRecommendationResponse {

    private UUID batchId;
    private UUID medicineId;
    private String brandName;
    private String genericName;
    private String batchNumber;
    private LocalDate expiryDate;
    private Integer daysToExpiry;
    private Integer quantityStrips;
    private Integer quantityLoose;
    private BigDecimal mrp;
    private BigDecimal stockValue;
    private String expiryStatus;
    private String inventoryState;
    private String recommendedAction;
    private String actionLabel;
    private String actionSeverity;
    private String actionReason;
    private UUID suggestedSupplierId;
    private String suggestedSupplierName;
    private Boolean canQuarantine;
    private Boolean canCreateRtv;
    private Boolean canCreateDump;
}
