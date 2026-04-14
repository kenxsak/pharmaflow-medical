package com.pharmaflow.store;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StoreRepository extends JpaRepository<Store, UUID> {

    Optional<Store> findByStoreId(UUID storeId);

    Optional<Store> findByStoreCode(String storeCode);

    Optional<Store> findByStoreIdAndTenantTenantId(UUID storeId, UUID tenantId);

    Optional<Store> findFirstByStoreTypeIgnoreCaseAndIsActiveTrueOrderByStoreNameAsc(String storeType);

    Optional<Store> findFirstByTenantTenantIdAndStoreTypeIgnoreCaseAndIsActiveTrueOrderByStoreNameAsc(UUID tenantId, String storeType);

    List<Store> findAllByIsActiveTrueOrderByStoreNameAsc();

    List<Store> findAllByTenantTenantIdAndIsActiveTrueOrderByStoreNameAsc(UUID tenantId);

    @Query("select s from Store s " +
            "where (:query is null or :query = '' " +
            "or lower(coalesce(s.storeCode, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.storeName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.city, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.gstin, '')) like lower(concat('%', :query, '%'))) " +
            "order by s.storeName asc")
    Page<Store> searchStores(@Param("query") String query, Pageable pageable);
}
