package com.pharmaflow.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantResponse {

    private UUID id;
    private String tenantCode;
    private String brandName;
    private String legalName;
    private String slug;
    private String status;
    private UUID planId;
    private String planCode;
    private String planName;
    private String billingCycle;
    private Integer storeCount;
    private Integer activeUsers;
    private String deploymentMode;
    private String supportEmail;
    private String supportPhone;
    private String billingEmail;
    private String gstin;
    private LocalDate renewalDate;
    private BigDecimal monthlyRecurringRevenueInr;
    private String notes;
}
