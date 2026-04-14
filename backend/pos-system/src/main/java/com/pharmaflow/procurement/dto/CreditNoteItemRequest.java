package com.pharmaflow.procurement.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class CreditNoteItemRequest {

    @NotNull
    private UUID medicineId;

    @NotNull
    private UUID batchId;

    @NotNull
    private BigDecimal quantity;

    private String unitType;
    private BigDecimal mrp;
    private String reason;
}
