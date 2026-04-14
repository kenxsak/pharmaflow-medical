package com.pharmaflow.billing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GSTBreakdown {

    private BigDecimal mrp;
    private BigDecimal discountAmount;
    private BigDecimal discountPercent;
    private BigDecimal taxableAmount;
    private BigDecimal gstRate;
    private BigDecimal cgst;
    private BigDecimal sgst;
    private BigDecimal igst;
    private BigDecimal totalAmount;
}
