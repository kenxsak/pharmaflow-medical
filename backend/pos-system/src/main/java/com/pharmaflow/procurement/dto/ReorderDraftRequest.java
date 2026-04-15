package com.pharmaflow.procurement.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.util.UUID;

@Getter
@Setter
public class ReorderDraftRequest {

    @NotNull
    private UUID storeId;

    @NotNull
    private UUID medicineId;

    private UUID supplierId;

    @NotNull
    @Min(1)
    private Integer quantity;
}
