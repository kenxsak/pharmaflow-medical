package com.pharmaflow.customer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, UUID> {

    @Query("select lt from LoyaltyTransaction lt where lt.store.storeId = :storeId order by lt.createdAt desc")
    Page<LoyaltyTransaction> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    Page<LoyaltyTransaction> findByCustomerCustomerIdOrderByCreatedAtDesc(UUID customerId, Pageable pageable);

    @Query("select lt from LoyaltyTransaction lt " +
            "left join lt.customer c " +
            "where lt.store.storeId = :storeId and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(c.name, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(c.phone, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(lt.description, '')) like lower(concat('%', :query, '%'))) " +
            "order by lt.createdAt desc")
    Page<LoyaltyTransaction> searchByStoreId(@Param("storeId") UUID storeId,
                                             @Param("query") String query,
                                             Pageable pageable);
}
