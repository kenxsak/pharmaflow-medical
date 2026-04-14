package com.pharmaflow.tenant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Optional<Tenant> findBySlug(String slug);

    Optional<Tenant> findByTenantCode(String tenantCode);

    boolean existsBySlug(String slug);

    @Query("select t from Tenant t where (" +
            ":query is null or :query = '' or " +
            "lower(coalesce(t.brandName, '')) like lower(concat('%', :query, '%')) or " +
            "lower(coalesce(t.slug, '')) like lower(concat('%', :query, '%')) or " +
            "lower(coalesce(t.supportEmail, '')) like lower(concat('%', :query, '%')) or " +
            "lower(coalesce(t.billingEmail, '')) like lower(concat('%', :query, '%'))" +
            ") order by t.brandName asc")
    Page<Tenant> search(@Param("query") String query, Pageable pageable);
}
