package com.pharmaflow.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GSTR1Row {

    private String invoiceNo;
    private LocalDateTime invoiceDate;
    private String customerGSTIN;
    private BigDecimal taxableValue;
    private BigDecimal rate;
    private BigDecimal cgst;
    private BigDecimal sgst;
    private BigDecimal igst;
    private BigDecimal totalAmount;
}
