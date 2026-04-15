package com.pharmaflow.billing;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    long countByStoreStoreId(UUID storeId);

    @Query("select count(i) from Invoice i where i.store.storeId = :storeId and i.invoiceDate >= :start and i.invoiceDate < :end")
    long countByStoreAndPeriod(@Param("storeId") UUID storeId,
                               @Param("start") LocalDateTime start,
                               @Param("end") LocalDateTime end);

    @Query("select i from Invoice i where i.store.storeId = :storeId and i.invoiceDate >= :start and i.invoiceDate < :end and i.isCancelled = false order by i.invoiceDate desc")
    List<Invoice> findActiveInvoices(@Param("storeId") UUID storeId,
                                     @Param("start") LocalDateTime start,
                                     @Param("end") LocalDateTime end);

    @Query("select i from Invoice i " +
            "join fetch i.store s " +
            "where s.storeId in :storeIds " +
            "and i.invoiceDate >= :start " +
            "and i.invoiceDate < :end " +
            "and i.isCancelled = false " +
            "order by i.invoiceDate desc")
    List<Invoice> findActiveInvoicesForStores(@Param("storeIds") List<UUID> storeIds,
                                              @Param("start") LocalDateTime start,
                                              @Param("end") LocalDateTime end);

    @EntityGraph(attributePaths = {"customer", "billedBy", "store"})
    List<Invoice> findByStoreStoreIdOrderByInvoiceDateDesc(UUID storeId, Pageable pageable);

    @EntityGraph(attributePaths = {"customer", "billedBy", "store"})
    @Query("select i from Invoice i where i.store.storeId = :storeId order by i.invoiceDate desc")
    Page<Invoice> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    Optional<Invoice> findFirstByInvoiceNo(String invoiceNo);

    @EntityGraph(attributePaths = {"customer", "billedBy", "store"})
    @Query("select i from Invoice i " +
            "left join i.customer c " +
            "left join i.billedBy b " +
            "where i.store.storeId = :storeId and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(i.invoiceNo, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(i.paymentMode, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(i.doctorName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(c.name, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(b.fullName, '')) like lower(concat('%', :query, '%'))) " +
            "order by i.invoiceDate desc")
    Page<Invoice> searchByStoreId(@Param("storeId") UUID storeId,
                                  @Param("query") String query,
                                  Pageable pageable);
}
