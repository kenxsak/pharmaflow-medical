package com.pharmaflow.billing;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, UUID> {

    List<InvoiceItem> findByInvoiceInvoiceId(UUID invoiceId);

    @Query("select ii from InvoiceItem ii join ii.invoice i where i.store.storeId = :storeId order by i.invoiceDate desc")
    Page<InvoiceItem> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    @Query("select ii from InvoiceItem ii " +
            "join ii.invoice i " +
            "left join ii.medicine m " +
            "left join ii.batch b " +
            "where i.store.storeId = :storeId and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(i.invoiceNo, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(ii.medicineNameSnapshot, m.brandName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(ii.genericNameSnapshot, m.genericName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(ii.batchNumberSnapshot, b.batchNumber, '')) like lower(concat('%', :query, '%'))) " +
            "order by i.invoiceDate desc")
    Page<InvoiceItem> searchByStoreId(@Param("storeId") UUID storeId,
                                      @Param("query") String query,
                                      Pageable pageable);

    @Query("select distinct m.medicineId from InvoiceItem ii " +
            "join ii.invoice i " +
            "join ii.medicine m " +
            "where i.store.storeId = :storeId")
    List<UUID> findDistinctMedicineIdsByStoreId(@Param("storeId") UUID storeId);

    @Query("select ii from InvoiceItem ii " +
            "join fetch ii.invoice i " +
            "left join fetch ii.medicine m " +
            "left join fetch m.manufacturer mf " +
            "left join fetch m.saltComposition sc " +
            "left join fetch ii.batch b " +
            "where i.store.storeId = :storeId and i.invoiceDate >= :start and i.invoiceDate < :end")
    List<InvoiceItem> findForStoreBetween(@Param("storeId") UUID storeId,
                                          @Param("start") LocalDateTime start,
                                          @Param("end") LocalDateTime end);

    @Query("select ii from InvoiceItem ii " +
            "join fetch ii.invoice i " +
            "left join fetch ii.medicine m " +
            "left join fetch m.manufacturer mf " +
            "left join fetch m.saltComposition sc " +
            "left join fetch ii.batch b " +
            "where i.store.storeId in :storeIds and i.invoiceDate >= :start and i.invoiceDate < :end")
    List<InvoiceItem> findForStoresBetween(@Param("storeIds") List<UUID> storeIds,
                                           @Param("start") LocalDateTime start,
                                           @Param("end") LocalDateTime end);
}
