package com.pharmaflow.procurement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, UUID> {

    @Query("select poi from PurchaseOrderItem poi join poi.purchaseOrder po where po.store.storeId = :storeId order by po.poDate desc")
    Page<PurchaseOrderItem> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    @Query("select poi from PurchaseOrderItem poi " +
            "join poi.purchaseOrder po " +
            "left join poi.medicine m " +
            "where po.store.storeId = :storeId and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(po.poNumber, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(poi.batchNumber, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.brandName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.genericName, '')) like lower(concat('%', :query, '%'))) " +
            "order by po.poDate desc")
    Page<PurchaseOrderItem> searchByStoreId(@Param("storeId") UUID storeId,
                                            @Param("query") String query,
                                            Pageable pageable);
}
