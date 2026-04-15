package com.pharmaflow.procurement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, UUID> {

    @Query("select poi from PurchaseOrderItem poi join poi.purchaseOrder po where po.store.storeId = :storeId order by po.poDate desc")
    Page<PurchaseOrderItem> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    List<PurchaseOrderItem> findByPurchaseOrderPoIdIn(List<UUID> purchaseOrderIds);

    List<PurchaseOrderItem> findByPurchaseReceiptReceiptIdIn(List<UUID> receiptIds);

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

    @Query("select distinct m.medicineId from PurchaseOrderItem poi " +
            "join poi.purchaseOrder po " +
            "join poi.medicine m " +
            "where po.store.storeId = :storeId")
    List<UUID> findDistinctMedicineIdsByStoreId(@Param("storeId") UUID storeId);

    @Query("select poi from PurchaseOrderItem poi " +
            "join fetch poi.purchaseOrder po " +
            "join fetch po.store st " +
            "left join fetch po.supplier s " +
            "where poi.medicine.medicineId = :medicineId " +
            "and st.tenant.tenantId = :tenantId " +
            "order by po.poDate desc")
    List<PurchaseOrderItem> findRecentByTenantAndMedicine(@Param("tenantId") UUID tenantId,
                                                          @Param("medicineId") UUID medicineId,
                                                          Pageable pageable);

    @Query("select poi from PurchaseOrderItem poi " +
            "join fetch poi.purchaseOrder po " +
            "join fetch po.store st " +
            "left join fetch po.supplier s " +
            "left join fetch poi.medicine m " +
            "where st.storeId in :storeIds " +
            "and po.receivedAt is not null " +
            "and po.receivedAt >= :start and po.receivedAt < :end")
    List<PurchaseOrderItem> findReceivedForStoresBetween(@Param("storeIds") List<UUID> storeIds,
                                                         @Param("start") LocalDateTime start,
                                                         @Param("end") LocalDateTime end);
}
