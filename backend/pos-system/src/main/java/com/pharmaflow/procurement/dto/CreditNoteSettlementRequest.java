package com.pharmaflow.procurement.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Setter
public class CreditNoteSettlementRequest {

    @NotNull
    @DecimalMin(value = "0.00")
    private BigDecimal settledAmount;

    private String notes;
}
