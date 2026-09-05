package com.pharmaflow.inventory;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {

    @Query("select im from InventoryMovement im " +
           "left join fetch im.batch b " +
           "left join fetch im.medicine m " +
           "left join fetch im.actor a " +
           "where im.store.storeId = :storeId and b.batchId = :batchId " +
           "order by im.createdAt desc")
    List<InventoryMovement> findByStoreAndBatch(@Param("storeId") UUID storeId, @Param("batchId") UUID batchId, Pageable pageable);

    @Query("select im from InventoryMovement im " +
           "left join fetch im.batch b " +
           "left join fetch im.medicine m " +
           "left join fetch im.actor a " +
           "where im.store.storeId = :storeId and m.medicineId = :medicineId " +
           "order by im.createdAt desc")
    List<InventoryMovement> findByStoreAndMedicine(@Param("storeId") UUID storeId, @Param("medicineId") UUID medicineId, Pageable pageable);

    @Query("select im from InventoryMovement im " +
           "left join fetch im.batch b " +
           "left join fetch im.medicine m " +
           "left join fetch im.actor a " +
           "where im.store.storeId = :storeId " +
           "order by im.createdAt desc")
    List<InventoryMovement> findByStore(@Param("storeId") UUID storeId, Pageable pageable);
}
