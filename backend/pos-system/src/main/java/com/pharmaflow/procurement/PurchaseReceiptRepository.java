package com.pharmaflow.procurement;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PurchaseReceiptRepository extends JpaRepository<PurchaseReceipt, UUID> {

    boolean existsByReceiptNumber(String receiptNumber);

    @EntityGraph(attributePaths = {"purchaseOrder", "purchaseOrder.supplier", "purchaseOrder.store", "createdBy"})
    List<PurchaseReceipt> findByPurchaseOrderPoIdOrderByReceiptDateDesc(UUID purchaseOrderId);

    @EntityGraph(attributePaths = {"purchaseOrder", "purchaseOrder.supplier", "purchaseOrder.store", "createdBy"})
    @Query("select pr from PurchaseReceipt pr " +
            "join pr.purchaseOrder po " +
            "where po.store.storeId = :storeId " +
            "order by coalesce(pr.receiptDate, pr.createdAt) desc")
    List<PurchaseReceipt> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);
}
