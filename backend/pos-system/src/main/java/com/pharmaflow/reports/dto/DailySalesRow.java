package com.pharmaflow.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailySalesRow {

    private LocalDate saleDate;
    private long invoiceCount;
    private BigDecimal totalSales;
    private BigDecimal cashSales;
    private BigDecimal upiSales;
    private BigDecimal cardSales;
    private BigDecimal creditSales;
}
