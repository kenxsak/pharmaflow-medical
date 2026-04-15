package com.pharmaflow.procurement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    private LocalDate expectedDeliveryDate;
    private String status;
    private String orderType;
    private UUID storeId;
    private String storeCode;
    private UUID medicineId;
    private String brandName;
    private UUID supplierId;
    private String supplierName;
    private Integer supplierLeadTimeDays;
    private Integer quantity;
    private Integer itemCount;
    private BigDecimal purchaseRate;
    private BigDecimal mrp;
    private BigDecimal gstRate;
    private BigDecimal subtotal;
    private BigDecimal totalAmount;
    private String notes;
}
