package com.pharmaflow.procurement.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class PurchaseImportRowRequest {

    private UUID medicineId;
    private String barcode;
    private String brandName;

    @NotBlank
    private String batchNumber;

    private LocalDate manufactureDate;

    @NotNull
    private LocalDate expiryDate;

    @NotNull
    private Integer quantity;

    private Integer quantityLoose;

    private Integer freeQty;

    private Integer freeQtyLoose;

    @NotNull
    private BigDecimal purchaseRate;

    @NotNull
    private BigDecimal mrp;

    private BigDecimal gstRate;
}
