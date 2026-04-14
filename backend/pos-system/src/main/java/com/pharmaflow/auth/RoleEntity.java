package com.pharmaflow.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.PrePersist;
import javax.persistence.Table;

@Entity
@Table(name = "roles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private Integer roleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_name", nullable = false, unique = true)
    private PharmaRoleName roleName;

    @Column(name = "description")
    private String description;

    @Column(name = "can_edit_price")
    private Boolean canEditPrice;

    @Column(name = "can_edit_bills")
    private Boolean canEditBills;

    @Column(name = "can_sell_schedule_h")
    private Boolean canSellScheduleH;

    @Column(name = "can_view_reports")
    private Boolean canViewReports;

    @Column(name = "can_manage_inventory")
    private Boolean canManageInventory;

    @PrePersist
    public void prePersist() {
        if (canEditPrice == null) {
            canEditPrice = false;
        }
        if (canEditBills == null) {
            canEditBills = false;
        }
        if (canSellScheduleH == null) {
            canSellScheduleH = false;
        }
        if (canViewReports == null) {
            canViewReports = false;
        }
        if (canManageInventory == null) {
            canManageInventory = false;
        }
    }
}
