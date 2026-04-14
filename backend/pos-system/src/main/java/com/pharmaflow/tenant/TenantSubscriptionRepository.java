package com.pharmaflow.tenant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TenantSubscriptionRepository extends JpaRepository<TenantSubscription, UUID> {

    Optional<TenantSubscription> findTopByTenantTenantIdAndStatusInOrderByCreatedAtDesc(
            UUID tenantId,
            Collection<SubscriptionStatus> statuses
    );

    List<TenantSubscription> findByTenantTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
