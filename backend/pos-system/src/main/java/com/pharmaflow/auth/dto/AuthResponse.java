package com.pharmaflow.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private String username;
    private String fullName;
    private String role;
    private UUID storeId;
    private String storeCode;
    private UUID tenantId;
    private String tenantSlug;
    private String brandName;
    private String brandTagline;
    private String supportEmail;
    private String supportPhone;
    private String deploymentMode;
    private String subscriptionPlanCode;
    private String subscriptionPlanName;
    private Boolean platformOwner;
}
