package com.pharmaflow.inventory.dto;

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
public class ExpiryAlertSummary {

    private List<StockBatchResponse> expired;
    private List<StockBatchResponse> expiring30Days;
    private List<StockBatchResponse> expiring60Days;
    private List<StockBatchResponse> expiring90Days;
    private BigDecimal totalExpiredValue;
    private BigDecimal totalAtRiskValue;
}
