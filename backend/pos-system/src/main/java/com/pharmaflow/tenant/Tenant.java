package com.pharmaflow.tenant;

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
import javax.persistence.PreUpdate;
import javax.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenants")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "tenant_code", nullable = false, unique = true, length = 50)
    private String tenantCode;

    @Column(name = "slug", nullable = false, unique = true, length = 80)
    private String slug;

    @Column(name = "brand_name", nullable = false, length = 200)
    private String brandName;

    @Column(name = "legal_name", length = 200)
    private String legalName;

    @Column(name = "brand_tagline", length = 300)
    private String brandTagline;

    @Column(name = "support_email", length = 200)
    private String supportEmail;

    @Column(name = "support_phone", length = 30)
    private String supportPhone;

    @Column(name = "billing_email", length = 200)
    private String billingEmail;

    @Column(name = "gstin", length = 20)
    private String gstin;

    @Column(name = "deployment_mode", length = 200)
    private String deploymentMode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private TenantStatus status;

    @Column(name = "licensed_store_count")
    private Integer licensedStoreCount;

    @Column(name = "licensed_user_count")
    private Integer licensedUserCount;

    @Column(name = "notes")
    private String notes;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (status == null) {
            status = TenantStatus.DRAFT;
        }
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
