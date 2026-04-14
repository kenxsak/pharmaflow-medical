package com.pharmaflow.billing.dto;

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
public class InvoiceHistoryItemResponse {

    private UUID invoiceId;
    private String invoiceNo;
    private LocalDateTime invoiceDate;
    private String customerName;
    private String billedByName;
    private String paymentMode;
    private BigDecimal totalAmount;
    private BigDecimal amountDue;
    private Boolean prescriptionAttached;
    private Boolean cancelled;
}
