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

    private UUID batchId;

    @NotNull
    private BigDecimal quantity;

    @NotNull
    private String unitType;

    private BigDecimal mrp;

    private BigDecimal discountPercent;

    private BigDecimal gstRate;
}
