package com.pharmaflow.procurement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {

    long countByStoreStoreId(UUID storeId);

    boolean existsByPoNumber(String poNumber);

    @EntityGraph(attributePaths = {"supplier", "createdBy", "store"})
    PurchaseOrder findFirstByStoreStoreIdAndPoNumberIgnoreCase(UUID storeId, String poNumber);

    @EntityGraph(attributePaths = {"supplier", "createdBy", "store"})
    List<PurchaseOrder> findByStoreStoreIdOrderByPoDateDesc(UUID storeId, Pageable pageable);

    @EntityGraph(attributePaths = {"supplier", "createdBy", "store"})
    List<PurchaseOrder> findByStoreStoreIdInOrderByPoDateDesc(List<UUID> storeIds);

    @EntityGraph(attributePaths = {"supplier", "createdBy", "store"})
    @Query("select po from PurchaseOrder po where po.store.storeId = :storeId order by po.poDate desc")
    Page<PurchaseOrder> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    @EntityGraph(attributePaths = {"supplier", "createdBy", "store"})
    @Query("select po from PurchaseOrder po left join po.supplier s " +
            "where po.store.storeId = :storeId and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(po.poNumber, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(po.invoiceNumber, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(po.status, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.name, '')) like lower(concat('%', :query, '%'))) " +
            "order by po.poDate desc")
    Page<PurchaseOrder> searchByStoreId(@Param("storeId") UUID storeId,
                                        @Param("query") String query,
                                        Pageable pageable);
}
