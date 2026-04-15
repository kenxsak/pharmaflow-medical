package com.pharmaflow.inventory.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.util.UUID;

@Getter
@Setter
public class StockTransferCreateRequest {

    @NotNull
    private UUID fromStoreId;

    @NotNull
    private UUID toStoreId;

    @NotNull
    private UUID medicineId;

    @NotNull
    private UUID batchId;

    @NotNull
    @Min(1)
    private Integer quantityStrips;

    @Min(0)
    private Integer quantityLoose;
}
