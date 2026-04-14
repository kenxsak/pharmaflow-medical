package com.pharmaflow.procurement.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class PurchaseImportRequest {

    @NotNull
    private UUID supplierId;

    @NotNull
    private String invoiceNumber;

    private String poNumber;
    private LocalDateTime purchaseDate;

    @Valid
    @NotEmpty
    private List<PurchaseImportRowRequest> rows;
}
