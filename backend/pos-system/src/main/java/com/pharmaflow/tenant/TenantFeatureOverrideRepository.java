package com.pharmaflow.tenant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TenantFeatureOverrideRepository extends JpaRepository<TenantFeatureOverride, UUID> {

    List<TenantFeatureOverride> findByTenantTenantId(UUID tenantId);

    Optional<TenantFeatureOverride> findByTenantTenantIdAndFeatureCode(UUID tenantId, String featureCode);
}
