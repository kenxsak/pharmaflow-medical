package com.pharmaflow.tenant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.CollectionTable;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "plan_id")
    private UUID planId;

    @Column(name = "plan_code", nullable = false, unique = true, length = 50)
    private String planCode;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "best_for", length = 300)
    private String bestFor;

    @Column(name = "monthly_price_inr", precision = 12, scale = 2)
    private BigDecimal monthlyPriceInr;

    @Column(name = "annual_price_inr", precision = 12, scale = 2)
    private BigDecimal annualPriceInr;

    @Column(name = "onboarding_fee_inr", precision = 12, scale = 2)
    private BigDecimal onboardingFeeInr;

    @Column(name = "per_store_overage_inr", precision = 12, scale = 2)
    private BigDecimal perStoreOverageInr;

    @Column(name = "per_user_overage_inr", precision = 12, scale = 2)
    private BigDecimal perUserOverageInr;

    @Column(name = "max_stores")
    private Integer maxStores;

    @Column(name = "max_users")
    private Integer maxUsers;

    @Enumerated(EnumType.STRING)
    @Column(name = "support_tier", nullable = false, length = 30)
    private SupportTier supportTier;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "subscription_plan_features", joinColumns = @JoinColumn(name = "plan_id"))
    @Column(name = "feature_code", nullable = false, length = 80)
    @Builder.Default
    private Set<String> featureCodes = new LinkedHashSet<>();

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (isActive == null) {
            isActive = true;
        }
        if (supportTier == null) {
            supportTier = SupportTier.BUSINESS_HOURS;
        }
        if (featureCodes == null) {
            featureCodes = new LinkedHashSet<>();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
        if (featureCodes == null) {
            featureCodes = new LinkedHashSet<>();
        }
    }
}
