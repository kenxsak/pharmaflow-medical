package com.pharmaflow.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlanResponse {

    private UUID id;
    private String planCode;
    private String name;
    private String description;
    private String bestFor;
    private BigDecimal monthlyPriceInr;
    private BigDecimal annualPriceInr;
    private BigDecimal onboardingFeeInr;
    private BigDecimal perStoreOverageInr;
    private BigDecimal perUserOverageInr;
    private Integer maxStores;
    private Integer maxUsers;
    private String supportTier;
    @Builder.Default
    private Set<String> featureCodes = new LinkedHashSet<>();
}
