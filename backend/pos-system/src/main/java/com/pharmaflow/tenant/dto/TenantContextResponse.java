package com.pharmaflow.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantContextResponse {

    private UUID tenantId;
    private String tenantCode;
    private String tenantSlug;
    private String brandName;
    private String brandTagline;
    private String supportEmail;
    private String supportPhone;
    private String deploymentMode;
    private String tenantStatus;
    private UUID planId;
    private String planCode;
    private String planName;
    private String billingCycle;
    private String subscriptionStatus;
    private boolean platformOwner;
    @Builder.Default
    private Set<String> featureCodes = new LinkedHashSet<>();
}
