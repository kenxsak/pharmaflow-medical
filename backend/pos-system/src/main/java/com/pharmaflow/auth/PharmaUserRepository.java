package com.pharmaflow.auth;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PharmaUserRepository extends JpaRepository<PharmaUser, UUID> {

    Optional<PharmaUser> findByUsername(String username);

    Optional<PharmaUser> findByUsernameAndIsActiveTrue(String username);

    Optional<PharmaUser> findByUsernameAndTenantTenantId(String username, UUID tenantId);

    boolean existsByUsername(String username);

    @Query("select u from PharmaUser u where u.store.storeId = :storeId order by u.fullName asc")
    Page<PharmaUser> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    @Query("select u from PharmaUser u left join u.store s " +
            "where u.store.storeId = :storeId and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(u.username, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(u.fullName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(u.phone, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(u.email, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.storeCode, '')) like lower(concat('%', :query, '%'))) " +
            "order by u.fullName asc")
    Page<PharmaUser> searchByStoreId(@Param("storeId") UUID storeId,
                                     @Param("query") String query,
                                     Pageable pageable);
}
