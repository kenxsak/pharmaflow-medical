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
public class PurchaseReceiptSummaryResponse {

    private UUID receiptId;
    private String receiptNumber;
    private UUID purchaseOrderId;
    private String poNumber;
    private String supplierName;
    private String supplierInvoiceNumber;
    private String receivedByName;
    private LocalDateTime receiptDate;
    private String status;
    private String invoiceMatchState;
    private String supplierSettlementState;
    private Integer lineCount;
    private String summaryText;
    private BigDecimal subtotal;
    private BigDecimal totalAmount;
    private String notes;
}
