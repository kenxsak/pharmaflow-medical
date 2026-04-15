package com.pharmaflow.inventory.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class InventoryAdjustmentRequest {

    @NotNull
    private UUID batchId;

    @NotNull
    @DecimalMin(value = "0.001")
    private BigDecimal quantity;

    @NotBlank
    private String unitType;

    @NotBlank
    private String adjustmentType;

    @NotBlank
    private String reasonCode;

    private String notes;
}
