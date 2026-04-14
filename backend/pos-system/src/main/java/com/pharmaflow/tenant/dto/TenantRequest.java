package com.pharmaflow.tenant.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class TenantRequest {

    private UUID planId;

    private String planCode;

    private String tenantCode;

    @NotBlank
    private String brandName;

    private String legalName;

    @NotBlank
    private String slug;

    @NotBlank
    private String status;

    @NotBlank
    private String billingCycle;

    @NotNull
    private Integer storeCount;

    @NotNull
    private Integer activeUsers;

    private String deploymentMode;

    private String supportEmail;

    private String supportPhone;

    private String billingEmail;

    private String gstin;

    private LocalDate renewalDate;

    @NotNull
    private BigDecimal monthlyRecurringRevenueInr;

    private String notes;
}
