package com.pharmaflow.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {

    private UUID invoiceId;
    private String invoiceNo;
    private LocalDateTime invoiceDate;
    private String paymentMode;
    private String customerName;
    private String billedByName;
    private String doctorName;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxableAmount;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal amountDue;
    private Boolean prescriptionAttached;
    private String prescriptionUrl;
    private List<InvoiceItemResponse> items;
}
