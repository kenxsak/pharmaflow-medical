package com.pharmaflow.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItemResponse {

    private UUID itemId;
    private UUID medicineId;
    private String medicineName;
    private String genericName;
    private String manufacturerName;
    private String hsnCode;
    private UUID batchId;
    private String batchNumber;
    private LocalDate expiryDate;
    private BigDecimal purchaseRate;
    private BigDecimal quantity;
    private String unitType;
    private BigDecimal mrp;
    private BigDecimal discountPct;
    private BigDecimal taxableAmount;
    private BigDecimal gstRate;
    private BigDecimal cgst;
    private BigDecimal sgst;
    private BigDecimal igst;
    private BigDecimal total;
}
