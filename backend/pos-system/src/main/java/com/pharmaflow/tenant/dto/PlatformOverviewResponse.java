package com.pharmaflow.tenant.dto;

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
public class PlatformOverviewResponse {

    private int tenantCount;
    private int planCount;
    private BigDecimal totalMonthlyRecurringRevenueInr;
    private BigDecimal annualRunRateInr;
    private long enterprisePlanTenantCount;
    private long alwaysOnSupportPlanCount;
}
