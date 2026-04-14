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
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant_subscriptions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "subscription_id")
    private UUID subscriptionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", nullable = false, length = 20)
    private BillingCycle billingCycle;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SubscriptionStatus status;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "renewal_date")
    private LocalDate renewalDate;

    @Column(name = "trial_ends_on")
    private LocalDate trialEndsOn;

    @Column(name = "monthly_recurring_revenue_inr", precision = 12, scale = 2)
    private BigDecimal monthlyRecurringRevenueInr;

    @Column(name = "annual_contract_value_inr", precision = 12, scale = 2)
    private BigDecimal annualContractValueInr;

    @Column(name = "stores_included")
    private Integer storesIncluded;

    @Column(name = "users_included")
    private Integer usersIncluded;

    @Column(name = "overage_store_price_inr", precision = 12, scale = 2)
    private BigDecimal overageStorePriceInr;

    @Column(name = "overage_user_price_inr", precision = 12, scale = 2)
    private BigDecimal overageUserPriceInr;

    @Column(name = "auto_renew")
    private Boolean autoRenew;

    @Column(name = "notes")
    private String notes;

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
        if (billingCycle == null) {
            billingCycle = BillingCycle.MONTHLY;
        }
        if (status == null) {
            status = SubscriptionStatus.TRIAL;
        }
        if (autoRenew == null) {
            autoRenew = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isActiveFor(LocalDate today) {
        if (status == SubscriptionStatus.ACTIVE) {
            return renewalDate == null || !renewalDate.isBefore(today);
        }
        if (status == SubscriptionStatus.TRIAL) {
            return trialEndsOn == null || !trialEndsOn.isBefore(today);
        }
        return false;
    }
}
