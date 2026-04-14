package com.pharmaflow.tenant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {

    Optional<SubscriptionPlan> findByPlanCode(String planCode);

    @Query("select p from SubscriptionPlan p where (" +
            ":query is null or :query = '' or " +
            "lower(coalesce(p.planCode, '')) like lower(concat('%', :query, '%')) or " +
            "lower(coalesce(p.name, '')) like lower(concat('%', :query, '%')) or " +
            "lower(coalesce(p.bestFor, '')) like lower(concat('%', :query, '%'))" +
            ") order by p.monthlyPriceInr asc")
    Page<SubscriptionPlan> search(@Param("query") String query, Pageable pageable);
}
