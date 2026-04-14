package com.pharmaflow.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PharmaUserResponse {

    private UUID userId;
    private String username;
    private String fullName;
    private String phone;
    private String email;
    private String role;
    private String roleLabel;
    private String roleDescription;
    private UUID storeId;
    private String storeCode;
    private String storeName;
    private UUID tenantId;
    private String tenantSlug;
    private String tenantName;
    private Boolean active;
    private Boolean platformOwner;
    private String pharmacistRegNo;
    private Boolean canEditPrice;
    private Boolean canEditBills;
    private Boolean canSellScheduleH;
    private Boolean canViewReports;
    private Boolean canManageInventory;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
}
