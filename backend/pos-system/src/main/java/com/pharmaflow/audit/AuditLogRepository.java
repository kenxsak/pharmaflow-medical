package com.pharmaflow.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    long countByStoreStoreId(UUID storeId);

    @EntityGraph(attributePaths = {"user", "store"})
    @Query("select a from AuditLog a where a.store.storeId = :storeId order by a.createdAt desc")
    Page<AuditLog> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "store"})
    @Query("select a from AuditLog a left join a.user u " +
            "where a.store.storeId = :storeId " +
            "and (:entityType is null or :entityType = '' or lower(coalesce(a.entityType, '')) = lower(:entityType)) " +
            "and (:query is null or :query = '' " +
            "or lower(a.action) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(a.entityType, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(a.entityId, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(u.fullName, '')) like lower(concat('%', :query, '%'))) " +
            "order by a.createdAt desc")
    List<AuditLog> searchLogs(@Param("storeId") UUID storeId,
                              @Param("entityType") String entityType,
                              @Param("query") String query,
                              Pageable pageable);

    @EntityGraph(attributePaths = {"user", "store"})
    @Query("select a from AuditLog a left join a.user u " +
            "where a.store.storeId = :storeId and (" +
            ":query is null or :query = '' " +
            "or lower(a.action) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(a.entityType, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(a.entityId, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(u.fullName, '')) like lower(concat('%', :query, '%'))) " +
            "order by a.createdAt desc")
    Page<AuditLog> searchByStoreId(@Param("storeId") UUID storeId,
                                   @Param("query") String query,
                                   Pageable pageable);

    @EntityGraph(attributePaths = {"user", "store"})
    List<AuditLog> findByStoreStoreIdAndEntityTypeIgnoreCaseAndEntityIdOrderByCreatedAtDesc(
            UUID storeId,
            String entityType,
            String entityId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"user", "store"})
    List<AuditLog> findByStoreStoreIdAndUserUserIdOrderByCreatedAtDesc(
            UUID storeId,
            UUID userId,
            Pageable pageable
    );
}
