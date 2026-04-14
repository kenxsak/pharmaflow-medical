package com.pharmaflow.tenant;

import com.pharmaflow.auth.CurrentPharmaUserService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.tenant.dto.PlatformFeatureResponse;
import com.pharmaflow.tenant.dto.PlatformOverviewResponse;
import com.pharmaflow.tenant.dto.SubscriptionPlanRequest;
import com.pharmaflow.tenant.dto.SubscriptionPlanResponse;
import com.pharmaflow.tenant.dto.TenantContextResponse;
import com.pharmaflow.tenant.dto.TenantRequest;
import com.pharmaflow.tenant.dto.TenantResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlatformAdminService {

    private final TenantRepository tenantRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final TenantAccessService tenantAccessService;
    private final CurrentPharmaUserService currentPharmaUserService;

    @Transactional(readOnly = true)
    public PlatformOverviewResponse getOverview() {
        requirePlatformOwner();

        List<TenantResponse> tenants = listTenants();
        List<SubscriptionPlanResponse> plans = listPlans();
        BigDecimal totalMrr = tenants.stream()
                .map(TenantResponse::getMonthlyRecurringRevenueInr)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long enterpriseCount = tenants.stream()
                .filter(tenant -> tenant.getPlanCode() != null
                        && Set.of("chain", "enterprise").contains(tenant.getPlanCode().toLowerCase(Locale.ROOT)))
                .count();

        long alwaysOnSupportCount = plans.stream()
                .filter(plan -> "24x7".equalsIgnoreCase(plan.getSupportTier()))
                .count();

        return PlatformOverviewResponse.builder()
                .tenantCount(tenants.size())
                .planCount(plans.size())
                .totalMonthlyRecurringRevenueInr(totalMrr)
                .annualRunRateInr(totalMrr.multiply(BigDecimal.valueOf(12)))
                .enterprisePlanTenantCount(enterpriseCount)
                .alwaysOnSupportPlanCount(alwaysOnSupportCount)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PlatformFeatureResponse> listFeatures() {
        requirePlatformOwner();
        return Arrays.stream(TenantFeatureCode.values())
                .sorted(Comparator.comparingInt(TenantFeatureCode::getQuestionNumber))
                .map(feature -> PlatformFeatureResponse.builder()
                        .id(feature.getQuestionNumber())
                        .code(feature.getCode())
                        .title(feature.getTitle())
                        .group(toLabel(feature.getGroup().name()))
                        .priority(toLabel(feature.getPriority().name()))
                        .summary(feature.getSummary())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPlanResponse> listPlans() {
        requirePlatformOwner();
        return subscriptionPlanRepository.search(null, PageRequest.of(0, 50))
                .stream()
                .map(this::toPlanResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SubscriptionPlanResponse savePlan(UUID planId, SubscriptionPlanRequest request) {
        requirePlatformOwner();

        SubscriptionPlan plan = planId == null
                ? subscriptionPlanRepository.findByPlanCode(request.getPlanCode().trim().toLowerCase(Locale.ROOT))
                .orElseGet(SubscriptionPlan::new)
                : subscriptionPlanRepository.findById(planId).orElseGet(SubscriptionPlan::new);

        plan.setPlanCode(request.getPlanCode().trim().toLowerCase(Locale.ROOT));
        plan.setName(request.getName().trim());
        plan.setDescription(request.getDescription());
        plan.setBestFor(request.getBestFor());
        plan.setMonthlyPriceInr(request.getMonthlyPriceInr());
        plan.setAnnualPriceInr(request.getAnnualPriceInr());
        plan.setOnboardingFeeInr(request.getOnboardingFeeInr());
        plan.setPerStoreOverageInr(request.getPerStoreOverageInr());
        plan.setPerUserOverageInr(request.getPerUserOverageInr());
        plan.setMaxStores(request.getMaxStores());
        plan.setMaxUsers(request.getMaxUsers());
        plan.setSupportTier(SupportTier.fromLabel(request.getSupportTier()));
        plan.setFeatureCodes(normalizeFeatureCodes(request.getFeatureCodes()));
        plan.setIsActive(true);

        return toPlanResponse(subscriptionPlanRepository.save(plan));
    }

    @Transactional(readOnly = true)
    public List<TenantResponse> listTenants() {
        requirePlatformOwner();
        return tenantRepository.search(null, PageRequest.of(0, 200))
                .stream()
                .map(this::toTenantResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TenantResponse saveTenant(UUID tenantId, TenantRequest request) {
        requirePlatformOwner();

        SubscriptionPlan plan = resolvePlan(request);
        Tenant tenant = tenantId == null
                ? tenantRepository.findBySlug(request.getSlug().trim().toLowerCase(Locale.ROOT)).orElseGet(Tenant::new)
                : tenantRepository.findById(tenantId).orElseGet(Tenant::new);

        String slug = request.getSlug().trim().toLowerCase(Locale.ROOT);
        tenant.setSlug(slug);
        tenant.setTenantCode(resolveTenantCode(request, slug));
        tenant.setBrandName(request.getBrandName().trim());
        tenant.setLegalName(request.getLegalName());
        tenant.setBrandTagline("Multi-store pharmacy SaaS for " + request.getBrandName().trim());
        tenant.setStatus(TenantStatus.fromLabel(request.getStatus()));
        tenant.setLicensedStoreCount(request.getStoreCount());
        tenant.setLicensedUserCount(request.getActiveUsers());
        tenant.setDeploymentMode(request.getDeploymentMode());
        tenant.setSupportEmail(request.getSupportEmail());
        tenant.setSupportPhone(request.getSupportPhone());
        tenant.setBillingEmail(request.getBillingEmail());
        tenant.setGstin(request.getGstin());
        tenant.setNotes(request.getNotes());
        tenant.setIsActive(true);
        tenant = tenantRepository.save(tenant);
        Tenant persistedTenant = tenant;

        TenantSubscription subscription = tenantSubscriptionRepository
                .findTopByTenantTenantIdAndStatusInOrderByCreatedAtDesc(
                        persistedTenant.getTenantId(),
                        Arrays.asList(
                                SubscriptionStatus.ACTIVE,
                                SubscriptionStatus.TRIAL,
                                SubscriptionStatus.PAST_DUE,
                                SubscriptionStatus.SUSPENDED
                        )
                )
                .orElseGet(() -> TenantSubscription.builder().tenant(persistedTenant).build());

        subscription.setTenant(persistedTenant);
        subscription.setPlan(plan);
        subscription.setBillingCycle(BillingCycle.fromLabel(request.getBillingCycle()));
        subscription.setStatus(resolveSubscriptionStatus(persistedTenant.getStatus()));
        subscription.setRenewalDate(request.getRenewalDate());
        subscription.setMonthlyRecurringRevenueInr(request.getMonthlyRecurringRevenueInr());
        subscription.setAnnualContractValueInr(request.getMonthlyRecurringRevenueInr().multiply(BigDecimal.valueOf(12)));
        subscription.setStoresIncluded(request.getStoreCount());
        subscription.setUsersIncluded(request.getActiveUsers());
        subscription.setOverageStorePriceInr(plan.getPerStoreOverageInr());
        subscription.setOverageUserPriceInr(plan.getPerUserOverageInr());
        subscription.setNotes(request.getNotes());
        tenantSubscriptionRepository.save(subscription);

        return toTenantResponse(persistedTenant);
    }

    @Transactional(readOnly = true)
    public TenantContextResponse getCurrentTenantContext() {
        PharmaUser user = currentPharmaUserService.requireCurrentUser();
        Tenant tenant = tenantAccessService.resolveTenantForUser(user);
        TenantSubscription subscription = tenantAccessService.requireActiveSubscription(tenant);
        Set<String> featureCodes = tenantAccessService.getEffectiveFeatureCodes(tenant, subscription);

        return TenantContextResponse.builder()
                .tenantId(tenant.getTenantId())
                .tenantCode(tenant.getTenantCode())
                .tenantSlug(tenant.getSlug())
                .brandName(tenant.getBrandName())
                .brandTagline(tenant.getBrandTagline())
                .supportEmail(tenant.getSupportEmail())
                .supportPhone(tenant.getSupportPhone())
                .deploymentMode(tenant.getDeploymentMode())
                .tenantStatus(tenant.getStatus().getLabel())
                .planId(subscription.getPlan().getPlanId())
                .planCode(subscription.getPlan().getPlanCode())
                .planName(subscription.getPlan().getName())
                .billingCycle(subscription.getBillingCycle().getLabel())
                .subscriptionStatus(subscription.getStatus().name())
                .platformOwner(user.isPlatformOwner())
                .featureCodes(featureCodes)
                .build();
    }

    private SubscriptionPlan resolvePlan(TenantRequest request) {
        if (request.getPlanId() != null) {
            return subscriptionPlanRepository.findById(request.getPlanId())
                    .orElseThrow(() -> new BusinessRuleException("Subscription plan not found"));
        }
        if (request.getPlanCode() != null && !request.getPlanCode().isBlank()) {
            return subscriptionPlanRepository.findByPlanCode(request.getPlanCode().trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new BusinessRuleException("Subscription plan not found"));
        }
        throw new BusinessRuleException("A subscription plan is required");
    }

    private SubscriptionPlanResponse toPlanResponse(SubscriptionPlan plan) {
        return SubscriptionPlanResponse.builder()
                .id(plan.getPlanId())
                .planCode(plan.getPlanCode())
                .name(plan.getName())
                .description(plan.getDescription())
                .bestFor(plan.getBestFor())
                .monthlyPriceInr(plan.getMonthlyPriceInr())
                .annualPriceInr(plan.getAnnualPriceInr())
                .onboardingFeeInr(plan.getOnboardingFeeInr())
                .perStoreOverageInr(plan.getPerStoreOverageInr())
                .perUserOverageInr(plan.getPerUserOverageInr())
                .maxStores(plan.getMaxStores())
                .maxUsers(plan.getMaxUsers())
                .supportTier(plan.getSupportTier() != null ? plan.getSupportTier().getLabel() : null)
                .featureCodes(plan.getFeatureCodes())
                .build();
    }

    private TenantResponse toTenantResponse(Tenant tenant) {
        TenantSubscription subscription = tenantSubscriptionRepository
                .findTopByTenantTenantIdAndStatusInOrderByCreatedAtDesc(
                        tenant.getTenantId(),
                        Arrays.asList(
                                SubscriptionStatus.ACTIVE,
                                SubscriptionStatus.TRIAL,
                                SubscriptionStatus.PAST_DUE,
                                SubscriptionStatus.SUSPENDED
                        )
                )
                .orElse(null);

        return TenantResponse.builder()
                .id(tenant.getTenantId())
                .tenantCode(tenant.getTenantCode())
                .brandName(tenant.getBrandName())
                .legalName(tenant.getLegalName())
                .slug(tenant.getSlug())
                .status(tenant.getStatus() != null ? tenant.getStatus().getLabel() : null)
                .planId(subscription != null && subscription.getPlan() != null ? subscription.getPlan().getPlanId() : null)
                .planCode(subscription != null && subscription.getPlan() != null ? subscription.getPlan().getPlanCode() : null)
                .planName(subscription != null && subscription.getPlan() != null ? subscription.getPlan().getName() : null)
                .billingCycle(subscription != null && subscription.getBillingCycle() != null ? subscription.getBillingCycle().getLabel() : null)
                .storeCount(tenant.getLicensedStoreCount())
                .activeUsers(tenant.getLicensedUserCount())
                .deploymentMode(tenant.getDeploymentMode())
                .supportEmail(tenant.getSupportEmail())
                .supportPhone(tenant.getSupportPhone())
                .billingEmail(tenant.getBillingEmail())
                .gstin(tenant.getGstin())
                .renewalDate(subscription != null ? subscription.getRenewalDate() : null)
                .monthlyRecurringRevenueInr(subscription != null ? subscription.getMonthlyRecurringRevenueInr() : BigDecimal.ZERO)
                .notes(tenant.getNotes())
                .build();
    }

    private String resolveTenantCode(TenantRequest request, String slug) {
        if (request.getTenantCode() != null && !request.getTenantCode().isBlank()) {
            return request.getTenantCode().trim().toUpperCase(Locale.ROOT);
        }
        return slug.replaceAll("[^a-z0-9]+", "-").toUpperCase(Locale.ROOT);
    }

    private java.util.LinkedHashSet<String> normalizeFeatureCodes(Set<String> requestCodes) {
        if (requestCodes == null) {
            return new java.util.LinkedHashSet<>();
        }

        Set<String> knownCodes = Arrays.stream(TenantFeatureCode.values())
                .map(TenantFeatureCode::getCode)
                .collect(Collectors.toSet());

        java.util.LinkedHashSet<String> normalized = requestCodes.stream()
                .map(String::trim)
                .map(code -> code.toUpperCase(Locale.ROOT))
                .filter(code -> !code.isBlank())
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));

        List<String> unknownCodes = normalized.stream()
                .filter(code -> !knownCodes.contains(code))
                .collect(Collectors.toList());

        if (!unknownCodes.isEmpty()) {
            throw new BusinessRuleException("Unknown feature codes supplied: " + String.join(", ", unknownCodes));
        }

        return normalized;
    }

    private SubscriptionStatus resolveSubscriptionStatus(TenantStatus tenantStatus) {
        if (tenantStatus == null) {
            return SubscriptionStatus.TRIAL;
        }

        switch (tenantStatus) {
            case DRAFT:
                return SubscriptionStatus.TRIAL;
            case ATTENTION:
                return SubscriptionStatus.PAST_DUE;
            case SUSPENDED:
                return SubscriptionStatus.SUSPENDED;
            case CHURNED:
                return SubscriptionStatus.CANCELLED;
            case PILOT:
            case LIVE:
            case EXPANSION:
            default:
                return SubscriptionStatus.ACTIVE;
        }
    }

    private void requirePlatformOwner() {
        tenantAccessService.requirePlatformOwner(currentPharmaUserService.requireCurrentUser());
    }

    private String toLabel(String enumName) {
        return Arrays.stream(enumName.split("_"))
                .filter(token -> !token.isBlank())
                .map(token -> token.substring(0, 1) + token.substring(1).toLowerCase(Locale.ROOT))
                .collect(Collectors.joining(" "));
    }
}
