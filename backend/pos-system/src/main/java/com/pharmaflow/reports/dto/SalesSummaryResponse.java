package com.pharmaflow.reports.dto;

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
public class SalesSummaryResponse {

    private long invoiceCount;
    private BigDecimal totalSales;
    private BigDecimal creditSales;
    private BigDecimal cashSales;
    private BigDecimal upiSales;
    private BigDecimal cardSales;
    private BigDecimal averageBillValue;
}
