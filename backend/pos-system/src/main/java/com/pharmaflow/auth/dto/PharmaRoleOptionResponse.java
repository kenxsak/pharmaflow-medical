package com.pharmaflow.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PharmaRoleOptionResponse {

    private String role;
    private String label;
    private String description;
    private boolean canEditPrice;
    private boolean canEditBills;
    private boolean canSellScheduleH;
    private boolean canViewReports;
    private boolean canManageInventory;
}
