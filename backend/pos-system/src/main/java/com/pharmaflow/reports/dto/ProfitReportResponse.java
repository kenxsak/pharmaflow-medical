package com.pharmaflow.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfitReportResponse {

    private BigDecimal totalRevenue;
    private BigDecimal totalEstimatedCost;
    private BigDecimal totalEstimatedProfit;
    private BigDecimal overallMarginPct;
    private List<ProfitReportRow> byManufacturer;
    private List<ProfitReportRow> byCategory;
}
