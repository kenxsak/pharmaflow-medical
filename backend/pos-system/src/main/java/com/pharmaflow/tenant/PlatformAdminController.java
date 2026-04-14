package com.pharmaflow.tenant;

import com.pharmaflow.tenant.dto.PlatformFeatureResponse;
import com.pharmaflow.tenant.dto.PlatformOverviewResponse;
import com.pharmaflow.tenant.dto.SubscriptionPlanRequest;
import com.pharmaflow.tenant.dto.SubscriptionPlanResponse;
import com.pharmaflow.tenant.dto.TenantContextResponse;
import com.pharmaflow.tenant.dto.TenantRequest;
import com.pharmaflow.tenant.dto.TenantResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@Validated
@RequestMapping("/api/v1/platform")
@RequiredArgsConstructor
public class PlatformAdminController {

    private final PlatformAdminService platformAdminService;

    @GetMapping("/overview")
    public PlatformOverviewResponse getOverview() {
        return platformAdminService.getOverview();
    }

    @GetMapping("/features")
    public List<PlatformFeatureResponse> listFeatures() {
        return platformAdminService.listFeatures();
    }

    @GetMapping("/plans")
    public List<SubscriptionPlanResponse> listPlans() {
        return platformAdminService.listPlans();
    }

    @PostMapping("/plans")
    public SubscriptionPlanResponse createPlan(@Valid @RequestBody SubscriptionPlanRequest request) {
        return platformAdminService.savePlan(null, request);
    }

    @PutMapping("/plans/{planId}")
    public SubscriptionPlanResponse updatePlan(
            @PathVariable UUID planId,
            @Valid @RequestBody SubscriptionPlanRequest request
    ) {
        return platformAdminService.savePlan(planId, request);
    }

    @GetMapping("/tenants")
    public List<TenantResponse> listTenants() {
        return platformAdminService.listTenants();
    }

    @PostMapping("/tenants")
    public TenantResponse createTenant(@Valid @RequestBody TenantRequest request) {
        return platformAdminService.saveTenant(null, request);
    }

    @PutMapping("/tenants/{tenantId}")
    public TenantResponse updateTenant(
            @PathVariable UUID tenantId,
            @Valid @RequestBody TenantRequest request
    ) {
        return platformAdminService.saveTenant(tenantId, request);
    }

    @GetMapping("/context")
    public TenantContextResponse getCurrentTenantContext() {
        return platformAdminService.getCurrentTenantContext();
    }
}
