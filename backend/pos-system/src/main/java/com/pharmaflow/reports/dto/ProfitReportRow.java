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
public class ProfitReportRow {

    private String groupName;
    private BigDecimal revenue;
    private BigDecimal estimatedCost;
    private BigDecimal estimatedProfit;
    private BigDecimal marginPct;
    private BigDecimal quantity;
}
