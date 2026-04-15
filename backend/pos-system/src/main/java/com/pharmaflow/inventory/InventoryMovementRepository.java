package com.pharmaflow.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {

    @Query(
            value = "select im from InventoryMovement im " +
                    "left join fetch im.batch b " +
                    "left join fetch im.medicine m " +
                    "left join fetch im.actor a " +
                    "where im.store.storeId = :storeId " +
                    "and (:batchId is null or b.batchId = :batchId) " +
                    "and (:medicineId is null or m.medicineId = :medicineId) " +
                    "order by im.createdAt desc",
            countQuery = "select count(im) from InventoryMovement im " +
                    "left join im.batch b " +
                    "left join im.medicine m " +
                    "where im.store.storeId = :storeId " +
                    "and (:batchId is null or b.batchId = :batchId) " +
                    "and (:medicineId is null or m.medicineId = :medicineId)"
    )
    Page<InventoryMovement> searchByStore(@Param("storeId") UUID storeId,
                                          @Param("batchId") UUID batchId,
                                          @Param("medicineId") UUID medicineId,
                                          Pageable pageable);
}
