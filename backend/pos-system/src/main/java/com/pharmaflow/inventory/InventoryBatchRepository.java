package com.pharmaflow.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select ib from InventoryBatch ib where ib.batchId = :batchId")
    Optional<InventoryBatch> findByIdForUpdate(@Param("batchId") UUID batchId);

    @Query("select ib from InventoryBatch ib where ib.store.storeId = :storeId order by ib.expiryDate asc")
    Page<InventoryBatch> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    Optional<InventoryBatch> findFirstByStoreStoreIdAndMedicineMedicineIdAndIsActiveTrueAndExpiryDateGreaterThanEqualOrderByExpiryDateAsc(
            UUID storeId,
            UUID medicineId,
            LocalDate expiryDate
    );

    Optional<InventoryBatch> findFirstByMedicineMedicineIdAndIsActiveTrueAndExpiryDateGreaterThanEqualOrderByExpiryDateAsc(
            UUID medicineId,
            LocalDate expiryDate
    );

    Optional<InventoryBatch> findByStoreStoreIdAndMedicineMedicineIdAndBatchNumberIgnoreCase(
            UUID storeId,
            UUID medicineId,
            String batchNumber
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select ib from InventoryBatch ib " +
            "where ib.store.storeId = :storeId " +
            "and ib.medicine.medicineId = :medicineId " +
            "and lower(ib.batchNumber) = lower(:batchNumber)")
    Optional<InventoryBatch> findByStoreAndMedicineAndBatchNumberForUpdate(@Param("storeId") UUID storeId,
                                                                           @Param("medicineId") UUID medicineId,
                                                                           @Param("batchNumber") String batchNumber);

    List<InventoryBatch> findByStoreStoreIdAndMedicineMedicineIdAndIsActiveTrueOrderByExpiryDateAsc(UUID storeId, UUID medicineId);

    @Query("select ib from InventoryBatch ib " +
            "where ib.store.storeId = :storeId " +
            "and ib.medicine.medicineId = :medicineId " +
            "and ib.isActive = true " +
            "and upper(coalesce(ib.inventoryState, 'SELLABLE')) = 'SELLABLE' " +
            "and ib.expiryDate > :today " +
            "and (coalesce(ib.quantityStrips, 0) > 0 or coalesce(ib.quantityLoose, 0) > 0) " +
            "order by ib.expiryDate asc, ib.createdAt asc")
    List<InventoryBatch> findSellableBatches(@Param("storeId") UUID storeId,
                                             @Param("medicineId") UUID medicineId,
                                             @Param("today") LocalDate today);

    @Query(value = "select ranked.* from (" +
            "select ib.*, row_number() over (" +
            "partition by ib.medicine_id order by ib.expiry_date asc, ib.created_at asc, ib.batch_id asc" +
            ") as row_rank " +
            "from inventory_batches ib " +
            "where ib.store_id = :storeId " +
            "and ib.medicine_id in (:medicineIds) " +
            "and ib.is_active = true " +
            "and upper(coalesce(ib.inventory_state, 'SELLABLE')) = 'SELLABLE' " +
            "and ib.expiry_date > :today " +
            "and (coalesce(ib.quantity_strips, 0) > 0 or coalesce(ib.quantity_loose, 0) > 0)" +
            ") ranked where ranked.row_rank = 1",
            nativeQuery = true)
    List<InventoryBatch> findCurrentSellableBatches(@Param("storeId") UUID storeId,
                                                    @Param("medicineIds") List<UUID> medicineIds,
                                                    @Param("today") LocalDate today);

    @Query(value = "select ranked.* from (" +
            "select ib.*, row_number() over (" +
            "partition by ib.medicine_id order by ib.expiry_date asc, ib.created_at asc, ib.batch_id asc" +
            ") as row_rank " +
            "from inventory_batches ib " +
            "where ib.medicine_id in (:medicineIds) " +
            "and ib.is_active = true " +
            "and upper(coalesce(ib.inventory_state, 'SELLABLE')) = 'SELLABLE' " +
            "and ib.expiry_date > :today " +
            "and (coalesce(ib.quantity_strips, 0) > 0 or coalesce(ib.quantity_loose, 0) > 0)" +
            ") ranked where ranked.row_rank = 1",
            nativeQuery = true)
    List<InventoryBatch> findCurrentSellableBatches(@Param("medicineIds") List<UUID> medicineIds,
                                                    @Param("today") LocalDate today);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select ib from InventoryBatch ib " +
            "where ib.store.storeId = :storeId " +
            "and ib.medicine.medicineId = :medicineId " +
            "and ib.isActive = true " +
            "and upper(coalesce(ib.inventoryState, 'SELLABLE')) = 'SELLABLE' " +
            "and ib.expiryDate > :today " +
            "and (coalesce(ib.quantityStrips, 0) > 0 or coalesce(ib.quantityLoose, 0) > 0) " +
            "order by ib.expiryDate asc, ib.createdAt asc")
    List<InventoryBatch> findSellableBatchesForUpdate(@Param("storeId") UUID storeId,
                                                      @Param("medicineId") UUID medicineId,
                                                      @Param("today") LocalDate today);

    @Query("select ib from InventoryBatch ib " +
            "join fetch ib.medicine m " +
            "join fetch ib.store s " +
            "left join fetch m.manufacturer mf " +
            "left join fetch m.saltComposition sc " +
            "where ib.store.storeId = :storeId and ib.isActive = true " +
            "order by ib.expiryDate asc")
    List<InventoryBatch> findActiveStockForStore(@Param("storeId") UUID storeId);

    @Query("select ib from InventoryBatch ib " +
            "join fetch ib.store s " +
            "join fetch ib.medicine m " +
            "left join fetch m.manufacturer mf " +
            "left join fetch m.saltComposition sc " +
            "where s.storeId in :storeIds and ib.isActive = true " +
            "order by s.storeCode asc, ib.expiryDate asc")
    List<InventoryBatch> findActiveStockForStores(@Param("storeIds") List<UUID> storeIds);

    @Query("select ib from InventoryBatch ib where ib.store.storeId = :storeId and ib.expiryDate < :today and ib.isActive = true order by ib.expiryDate asc")
    List<InventoryBatch> findExpiredBatches(@Param("storeId") UUID storeId, @Param("today") LocalDate today);

    @Query("select ib from InventoryBatch ib " +
            "join fetch ib.medicine m " +
            "left join fetch m.manufacturer mf " +
            "left join fetch m.saltComposition sc " +
            "where ib.store.storeId = :storeId and ib.expiryDate < :today and ib.isActive = true " +
            "order by ib.expiryDate asc")
    List<InventoryBatch> findExpiredStockForStore(@Param("storeId") UUID storeId, @Param("today") LocalDate today);

    @Query("select ib from InventoryBatch ib where ib.store.storeId = :storeId and ib.expiryDate >= :from and ib.expiryDate < :to and ib.isActive = true order by ib.expiryDate asc")
    List<InventoryBatch> findBatchesExpiringBetween(
            @Param("storeId") UUID storeId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("select ib from InventoryBatch ib join ib.medicine m where ib.store.storeId = :storeId and ib.isActive = true and upper(coalesce(ib.inventoryState, 'SELLABLE')) = 'SELLABLE' and ib.quantityStrips <= coalesce(m.reorderLevel, 0) order by ib.expiryDate asc")
    List<InventoryBatch> findStockBelowReorderLevel(@Param("storeId") UUID storeId);

    @Query("select ib from InventoryBatch ib " +
            "join ib.medicine m " +
            "left join m.manufacturer mf " +
            "where ib.store.storeId = :storeId and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(ib.batchNumber, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.brandName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.genericName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.barcode, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(mf.name, '')) like lower(concat('%', :query, '%'))) " +
            "order by ib.expiryDate asc")
    Page<InventoryBatch> searchByStoreId(@Param("storeId") UUID storeId,
                                         @Param("query") String query,
                                         Pageable pageable);
}
