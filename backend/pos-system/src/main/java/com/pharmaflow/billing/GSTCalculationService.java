package com.pharmaflow.billing;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class GSTCalculationService {

    @Value("${pharmaflow.gst.state-name:Tamil Nadu}")
    private String homeState;

    public GSTBreakdown calculate(
            BigDecimal mrp,
            BigDecimal discountPercent,
            BigDecimal gstRate,
            String customerState
    ) {
        BigDecimal safeMrp = mrp == null ? BigDecimal.ZERO : mrp;
        BigDecimal safeDiscount = discountPercent == null ? BigDecimal.ZERO : discountPercent;
        BigDecimal safeGstRate = gstRate == null ? BigDecimal.ZERO : gstRate;
        String effectiveState = customerState == null || customerState.isBlank() ? homeState : customerState;

        BigDecimal discountAmt = safeMrp.multiply(safeDiscount)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal priceAfterDiscount = safeMrp.subtract(discountAmt);

        BigDecimal gstMultiplier = BigDecimal.ONE.add(
                safeGstRate.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
        );
        BigDecimal taxableAmount = gstMultiplier.compareTo(BigDecimal.ONE) == 0
                ? priceAfterDiscount
                : priceAfterDiscount.divide(gstMultiplier, 2, RoundingMode.HALF_UP);
        BigDecimal totalGst = priceAfterDiscount.subtract(taxableAmount);

        BigDecimal cgst = BigDecimal.ZERO;
        BigDecimal sgst = BigDecimal.ZERO;
        BigDecimal igst = BigDecimal.ZERO;

        if (homeState.equalsIgnoreCase(effectiveState)) {
            cgst = totalGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            sgst = totalGst.subtract(cgst);
        } else {
            igst = totalGst;
        }

        return GSTBreakdown.builder()
                .mrp(safeMrp)
                .discountAmount(discountAmt)
                .discountPercent(safeDiscount)
                .taxableAmount(taxableAmount)
                .gstRate(safeGstRate)
                .cgst(cgst)
                .sgst(sgst)
                .igst(igst)
                .totalAmount(priceAfterDiscount)
                .build();
    }
}
