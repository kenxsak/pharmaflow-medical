package com.pharmaflow.billing.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class BillingItemRequest {

    @NotNull
    private UUID medicineId;

    @NotNull
    private UUID batchId;

    @NotNull
    private BigDecimal quantity;

    @NotNull
    private String unitType;

    @NotNull
    private BigDecimal mrp;

    private BigDecimal discountPercent;

    @NotNull
    private BigDecimal gstRate;
}
