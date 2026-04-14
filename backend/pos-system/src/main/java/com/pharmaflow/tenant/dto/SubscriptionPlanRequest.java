package com.pharmaflow.tenant.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
public class SubscriptionPlanRequest {

    @NotBlank
    private String planCode;

    @NotBlank
    private String name;

    private String description;

    private String bestFor;

    @NotNull
    private BigDecimal monthlyPriceInr;

    @NotNull
    private BigDecimal annualPriceInr;

    @NotNull
    private BigDecimal onboardingFeeInr;

    @NotNull
    private BigDecimal perStoreOverageInr;

    private BigDecimal perUserOverageInr;

    @NotNull
    private Integer maxStores;

    @NotNull
    private Integer maxUsers;

    @NotBlank
    private String supportTier;

    private Set<String> featureCodes = new LinkedHashSet<>();
}
