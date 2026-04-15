package com.pharmaflow.billing.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class SalesReturnItemRequest {

    @NotNull
    private UUID invoiceItemId;

    @NotNull
    @DecimalMin(value = "0.001")
    private BigDecimal quantity;

    private String reason;
}
