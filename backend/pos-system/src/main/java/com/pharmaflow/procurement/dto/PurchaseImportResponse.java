package com.pharmaflow.procurement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseImportResponse {

    private UUID purchaseOrderId;
    private String poNumber;
    private String invoiceNumber;
    private String status;
    private String orderType;
    private boolean linkedToExistingPlan;
    private int importedRows;
    private int createdBatches;
    private int updatedBatches;
    private String receiptState;
    private int receivedLineCount;
    private int pendingLineCount;
    private int receiptCount;
    private int invoiceCount;
    private BigDecimal subtotal;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal totalAmount;
}
