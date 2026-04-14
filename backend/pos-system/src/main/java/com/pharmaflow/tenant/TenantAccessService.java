package com.pharmaflow.tenant;

import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.common.ForbiddenActionException;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantAccessService {

    private static final Collection<SubscriptionStatus> ACTIVE_STATUSES =
            Arrays.asList(SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL);

    private static final Map<String, Set<String>> PATH_FEATURES;

    static {
        Map<String, Set<String>> map = new LinkedHashMap<>();
        map.put("/api/v1/stores", Set.of(TenantFeatureCode.Q1_MULTI_LOCATION.getCode()));
        map.put("/api/v1/medicines", Set.of(
                TenantFeatureCode.Q4_SUBSTITUTES.getCode(),
                TenantFeatureCode.Q34_BARCODE.getCode(),
                TenantFeatureCode.Q36_TRIPLE_SEARCH.getCode()
        ));
        map.put("/api/v1/inventory", Set.of(
                TenantFeatureCode.Q2_EXPIRY_ALERTS.getCode(),
                TenantFeatureCode.Q6_BATCH_STRIP_FIFO.getCode(),
                TenantFeatureCode.Q16_SHORTAGE_REPORT.getCode(),
                TenantFeatureCode.Q30_BATCH_AUTO.getCode(),
                TenantFeatureCode.Q31_EXPIRED_BLOCK.getCode(),
                TenantFeatureCode.Q35_PARTIAL_STRIP.getCode()
        ));
        map.put("/api/v1/billing", Set.of(
                TenantFeatureCode.Q13_CREDIT_MANAGEMENT.getCode(),
                TenantFeatureCode.Q23_GST_INVOICE.getCode(),
                TenantFeatureCode.Q31_EXPIRED_BLOCK.getCode(),
                TenantFeatureCode.Q35_PARTIAL_STRIP.getCode(),
                TenantFeatureCode.Q40_BILL_AUDIT.getCode()
        ));
        map.put("/api/v1/customers", Set.of(
                TenantFeatureCode.Q9_LOYALTY.getCode(),
                TenantFeatureCode.Q13_CREDIT_MANAGEMENT.getCode(),
                TenantFeatureCode.Q22_PATIENT_HISTORY.getCode()
        ));
        map.put("/api/v1/compliance", Set.of(
                TenantFeatureCode.Q5_H1_NARCOTIC.getCode(),
                TenantFeatureCode.Q17_SCHEDULE_TRACKING.getCode(),
                TenantFeatureCode.Q18_DRUG_REGISTERS.getCode(),
                TenantFeatureCode.Q19_PHARMACIST_AUDIT.getCode(),
                TenantFeatureCode.Q20_INSPECTOR_REPORT.getCode(),
                TenantFeatureCode.Q21_DOCTOR_TRACKING.getCode()
        ));
        map.put("/api/v1/reports", Set.of(
                TenantFeatureCode.Q11_GST_REPORTS.getCode(),
                TenantFeatureCode.Q12_PROFIT_ANALYTICS.getCode(),
                TenantFeatureCode.Q16_SHORTAGE_REPORT.getCode(),
                TenantFeatureCode.Q37_ANALYTICS_EXPORT.getCode()
        ));
        map.put("/api/v1/purchases", Set.of(
                TenantFeatureCode.Q3_PURCHASE_IMPORT.getCode(),
                TenantFeatureCode.Q7_CREDIT_NOTE_WORKFLOW.getCode(),
                TenantFeatureCode.Q32_SCHEMES.getCode()
        ));
        map.put("/api/v1/audit", Set.of(
                TenantFeatureCode.Q19_PHARMACIST_AUDIT.getCode(),
                TenantFeatureCode.Q40_BILL_AUDIT.getCode(),
                TenantFeatureCode.Q41_ACTIVITY_AUDIT.getCode()
        ));
        PATH_FEATURES = Collections.unmodifiableMap(map);
    }

    private final StoreRepository storeRepository;
    private final TenantSubscriptionRepository tenantSubscriptionRepository;
    private final TenantFeatureOverrideRepository tenantFeatureOverrideRepository;

    public Tenant resolveTenantForUser(PharmaUser user) {
        if (user == null) {
            throw new ForbiddenActionException("Authenticated PharmaFlow user is required");
        }
        if (user.getTenant() != null) {
            return user.getTenant();
        }
        if (user.getStore() != null && user.getStore().getTenant() != null) {
            return user.getStore().getTenant();
        }
        throw new ForbiddenActionException("No tenant is assigned to the current user");
    }

    public TenantSubscription requireActiveSubscription(Tenant tenant) {
        TenantSubscription subscription = tenantSubscriptionRepository
                .findTopByTenantTenantIdAndStatusInOrderByCreatedAtDesc(tenant.getTenantId(), ACTIVE_STATUSES)
                .orElseThrow(() -> new ForbiddenActionException("No active subscription is assigned to tenant " + tenant.getBrandName()));

        if (!subscription.isActiveFor(LocalDate.now())) {
            throw new ForbiddenActionException("Tenant subscription is not active");
        }
        return subscription;
    }

    public Set<String> getEffectiveFeatureCodes(Tenant tenant, TenantSubscription subscription) {
        Set<String> codes = new LinkedHashSet<>();
        if (subscription != null && subscription.getPlan() != null && subscription.getPlan().getFeatureCodes() != null) {
            codes.addAll(subscription.getPlan().getFeatureCodes());
        }

        tenantFeatureOverrideRepository.findByTenantTenantId(tenant.getTenantId())
                .forEach(override -> {
                    if (Boolean.TRUE.equals(override.getEnabled())) {
                        codes.add(override.getFeatureCode());
                    } else {
                        codes.remove(override.getFeatureCode());
                    }
                });
        return codes;
    }

    public Store resolveScopedStore(Tenant tenant, String storeIdCandidate) {
        if (storeIdCandidate == null || storeIdCandidate.isBlank()) {
            return null;
        }
        UUID storeId;
        try {
            storeId = UUID.fromString(storeIdCandidate);
        } catch (IllegalArgumentException exception) {
            throw new BusinessRuleException("Invalid store identifier supplied");
        }

        return storeRepository.findByStoreIdAndTenantTenantId(storeId, tenant.getTenantId())
                .orElseThrow(() -> new ForbiddenActionException("Selected store does not belong to the active tenant"));
    }

    public TenantRequestContext buildContext(
            PharmaUser user,
            String requestPath,
            String storeIdCandidate,
            boolean platformEndpoint
    ) {
        if (platformEndpoint) {
            requirePlatformOwner(user);
            return TenantRequestContext.builder()
                    .user(user)
                    .tenant(resolveTenantForUser(user))
                    .build();
        }

        Tenant tenant = resolveTenantForUser(user);
        TenantSubscription subscription = requireActiveSubscription(tenant);
        Set<String> featureCodes = getEffectiveFeatureCodes(tenant, subscription);
        enforcePathFeatures(requestPath, featureCodes);
        Store scopedStore = resolveScopedStore(tenant, storeIdCandidate);

        return TenantRequestContext.builder()
                .user(user)
                .tenant(tenant)
                .subscription(subscription)
                .store(scopedStore)
                .build();
    }

    public void requirePlatformOwner(PharmaUser user) {
        if (user == null || !user.isPlatformOwner()) {
            throw new ForbiddenActionException("Platform super-admin access is required");
        }
    }

    private void enforcePathFeatures(String requestPath, Set<String> featureCodes) {
        String normalizedPath = requestPath == null ? "" : requestPath.toLowerCase(Locale.ROOT);

        PATH_FEATURES.forEach((prefix, requiredCodes) -> {
            if (normalizedPath.startsWith(prefix.toLowerCase(Locale.ROOT))
                    && requiredCodes.stream().noneMatch(featureCodes::contains)) {
                throw new ForbiddenActionException("Current tenant plan does not include the module required for " + requestPath);
            }
        });
    }
}
