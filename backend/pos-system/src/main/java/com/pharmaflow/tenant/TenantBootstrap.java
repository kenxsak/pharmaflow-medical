package com.pharmaflow.tenant;

import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.auth.PharmaUserRepository;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class TenantBootstrap implements CommandLineRunner {

    private final TenantRepository tenantRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final StoreRepository storeRepository;
    private final PharmaUserRepository pharmaUserRepository;

    @Override
    @Transactional
    public void run(String... args) {
        ensurePlan("launch", "Launch", "For a single pharmacy or a small pilot rollout.",
                "1 to 3 stores starting billing, inventory, and compliance.", 14999, 149990, 35000, 2500, 1500,
                3, 20, SupportTier.BUSINESS_HOURS, codes(2, 3, 4, 5, 6, 8, 11, 13, 16, 17, 18, 19, 20, 21, 22, 23, 30, 31, 32, 34, 35, 36, 38, 39, 40, 41, 42));
        SubscriptionPlan growthPlan = ensurePlan("growth", "Growth", "For regional operators running multi-branch operations.",
                "5 to 25 stores with HO oversight and cross-branch processes.", 39999, 399990, 90000, 2000, 1250,
                25, 150, SupportTier.EXTENDED, codes(1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43));
        SubscriptionPlan chainPlan = ensurePlan("chain", "Chain", "For large branded retail chains with warehouse and HO governance.",
                "25 to 300 stores with stronger visibility and rollout support.", 99999, 999990, 250000, 1500, 1000,
                300, 1200, SupportTier.ALWAYS_ON, codes(rangeExcluding(10)));
        SubscriptionPlan enterprisePlan = ensurePlan("enterprise", "Enterprise Plus", "For chains needing rollout services, delivery, integrations, and 24x7 coverage.",
                "300+ stores or premium deployments with custom integration scope.", 199999, 1999990, 500000, 1250, 800,
                9999, 5000, SupportTier.ALWAYS_ON, codes(rangeIncludingAll()));

        Tenant pharmaflowTenant = ensureTenant("PHARMAFLOW", "pharmaflow", "PharmaFlow", "PharmaFlow Private Limited",
                "Retail pharmacy operations, billing, and compliance workspace", "support@pharmaflow.in",
                "+91 44 4000 9000", "finance@pharmaflow.in", "33AABCP1234A1Z5",
                "Hybrid cloud + branch-local operations", TenantStatus.LIVE, 5, 65,
                "Reference tenant for enterprise demo, receipts, and buyer walkthrough.");
        ensureSubscription(pharmaflowTenant, enterprisePlan, BillingCycle.ANNUAL, SubscriptionStatus.ACTIVE, LocalDate.now().plusYears(1), 199999);

        Tenant posibleTenant = ensureTenant("POSIBLE-RX", "posible-rx", "Posible Rx", "Posible Retail Private Limited",
                "Multi-store pharmacy SaaS for Posible Rx", "support@posible.in", "+91 44 5555 0100",
                "finance@posible.in", "33AABCP1234A1Z5", "Hybrid cloud + branch-local operations",
                TenantStatus.EXPANSION, 300, 1180, "Tamil Nadu enterprise chain rollout with HO, warehouse, and branch expansion plan.");
        ensureSubscription(posibleTenant, chainPlan, BillingCycle.ANNUAL, SubscriptionStatus.ACTIVE, LocalDate.of(2027, 4, 1), 99999);

        Tenant lifePillTenant = ensureTenant("LIFEPILL", "lifepill-legacy", "LifePill Legacy", "LifePill Legacy",
                "Legacy branch-first rollout", "support@lifepill.com", "+94 11 700 5000", "ops@lifepill.com", "N/A",
                "Legacy branch-first rollout", TenantStatus.PILOT, 10, 96,
                "Legacy login and cashier flow used for compatibility demonstrations.");
        ensureSubscription(lifePillTenant, growthPlan, BillingCycle.MONTHLY, SubscriptionStatus.ACTIVE, LocalDate.now().plusMonths(1), 39999);

        List<Store> stores = storeRepository.findAllByIsActiveTrueOrderByStoreNameAsc();
        stores.stream()
                .filter(store -> store.getTenant() == null)
                .forEach(store -> store.setTenant(pharmaflowTenant));
        storeRepository.saveAll(stores);

        List<PharmaUser> users = pharmaUserRepository.findAll();
        users.forEach(user -> {
            if (user.getTenant() == null) {
                if (user.getStore() != null && user.getStore().getTenant() != null) {
                    user.setTenant(user.getStore().getTenant());
                } else {
                    user.setTenant(pharmaflowTenant);
                }
            }
            if ("admin".equalsIgnoreCase(user.getUsername())) {
                user.setIsPlatformOwner(true);
            }
        });
        pharmaUserRepository.saveAll(users);
    }

    private SubscriptionPlan ensurePlan(
            String planCode,
            String name,
            String description,
            String bestFor,
            int monthlyPriceInr,
            int annualPriceInr,
            int onboardingFeeInr,
            int perStoreOverageInr,
            int perUserOverageInr,
            int maxStores,
            int maxUsers,
            SupportTier supportTier,
            Set<String> featureCodes
    ) {
        SubscriptionPlan plan = subscriptionPlanRepository.findByPlanCode(planCode).orElseGet(SubscriptionPlan::new);
        plan.setPlanCode(planCode);
        plan.setName(name);
        plan.setDescription(description);
        plan.setBestFor(bestFor);
        plan.setMonthlyPriceInr(BigDecimal.valueOf(monthlyPriceInr));
        plan.setAnnualPriceInr(BigDecimal.valueOf(annualPriceInr));
        plan.setOnboardingFeeInr(BigDecimal.valueOf(onboardingFeeInr));
        plan.setPerStoreOverageInr(BigDecimal.valueOf(perStoreOverageInr));
        plan.setPerUserOverageInr(BigDecimal.valueOf(perUserOverageInr));
        plan.setMaxStores(maxStores);
        plan.setMaxUsers(maxUsers);
        plan.setSupportTier(supportTier);
        plan.setFeatureCodes(featureCodes);
        plan.setIsActive(true);
        return subscriptionPlanRepository.save(plan);
    }

    private Tenant ensureTenant(
            String tenantCode,
            String slug,
            String brandName,
            String legalName,
            String tagline,
            String supportEmail,
            String supportPhone,
            String billingEmail,
            String gstin,
            String deploymentMode,
            TenantStatus status,
            int licensedStoreCount,
            int licensedUserCount,
            String notes
    ) {
        Tenant tenant = tenantRepository.findBySlug(slug).orElseGet(Tenant::new);
        tenant.setTenantCode(tenantCode.toUpperCase(Locale.ROOT));
        tenant.setSlug(slug);
        tenant.setBrandName(brandName);
        tenant.setLegalName(legalName);
        tenant.setBrandTagline(tagline);
        tenant.setSupportEmail(supportEmail);
        tenant.setSupportPhone(supportPhone);
        tenant.setBillingEmail(billingEmail);
        tenant.setGstin(gstin);
        tenant.setDeploymentMode(deploymentMode);
        tenant.setStatus(status);
        tenant.setLicensedStoreCount(licensedStoreCount);
        tenant.setLicensedUserCount(licensedUserCount);
        tenant.setNotes(notes);
        tenant.setIsActive(true);
        return tenantRepository.save(tenant);
    }

    private void ensureSubscription(
            Tenant tenant,
            SubscriptionPlan plan,
            BillingCycle billingCycle,
            SubscriptionStatus status,
            LocalDate renewalDate,
            int monthlyRecurringRevenueInr
    ) {
        Optional<TenantSubscription> currentSubscription = tenantSubscriptionRepository
                .findTopByTenantTenantIdAndStatusInOrderByCreatedAtDesc(
                        tenant.getTenantId(),
                        Arrays.asList(SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.PAST_DUE, SubscriptionStatus.SUSPENDED)
                );

        TenantSubscription subscription = currentSubscription.orElseGet(() -> TenantSubscription.builder().tenant(tenant).build());
        subscription.setTenant(tenant);
        subscription.setPlan(plan);
        subscription.setBillingCycle(billingCycle);
        subscription.setStatus(status);
        subscription.setStartDate(LocalDate.now());
        subscription.setRenewalDate(renewalDate);
        subscription.setMonthlyRecurringRevenueInr(BigDecimal.valueOf(monthlyRecurringRevenueInr));
        subscription.setAnnualContractValueInr(BigDecimal.valueOf(monthlyRecurringRevenueInr).multiply(BigDecimal.valueOf(12)));
        subscription.setStoresIncluded(tenant.getLicensedStoreCount());
        subscription.setUsersIncluded(tenant.getLicensedUserCount());
        subscription.setOverageStorePriceInr(plan.getPerStoreOverageInr());
        subscription.setOverageUserPriceInr(plan.getPerUserOverageInr());
        subscription.setAutoRenew(true);
        tenantSubscriptionRepository.save(subscription);
    }

    private Set<String> codes(int... numbers) {
        Set<String> items = new LinkedHashSet<>();
        for (int number : numbers) {
            for (TenantFeatureCode featureCode : TenantFeatureCode.values()) {
                if (featureCode.getQuestionNumber() == number) {
                    items.add(featureCode.getCode());
                }
            }
        }
        return items;
    }

    private int[] rangeIncludingAll() {
        int[] values = new int[TenantFeatureCode.values().length];
        for (int index = 0; index < values.length; index++) {
            values[index] = index + 1;
        }
        return values;
    }

    private int[] rangeExcluding(int excluded) {
        return Arrays.stream(rangeIncludingAll())
                .filter(value -> value != excluded)
                .toArray();
    }
}
