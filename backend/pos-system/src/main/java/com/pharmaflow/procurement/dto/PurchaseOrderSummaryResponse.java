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
public class PurchaseOrderSummaryResponse {

    private UUID purchaseOrderId;
    private String poNumber;
    private LocalDateTime poDate;
    private String invoiceNumber;
    private String supplierName;
    private String createdByName;
    private String status;
    private BigDecimal subtotal;
    private BigDecimal totalAmount;
}
