package com.pharmaflow.procurement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderDraftResponse {

    private UUID purchaseOrderId;
    private String poNumber;
    private LocalDateTime poDate;
    private String status;
    private UUID storeId;
    private String storeCode;
    private UUID medicineId;
    private String brandName;
    private UUID supplierId;
    private String supplierName;
    private Integer quantity;
    private BigDecimal purchaseRate;
    private BigDecimal mrp;
    private BigDecimal gstRate;
    private BigDecimal subtotal;
    private BigDecimal totalAmount;
}
