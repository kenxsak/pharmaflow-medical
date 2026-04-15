package com.pharmaflow.procurement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CreditNoteRepository extends JpaRepository<CreditNote, UUID> {

    @Query("select cn from CreditNote cn where cn.store.storeId = :storeId order by cn.createdAt desc")
    java.util.List<CreditNote> findByStoreStoreIdOrderByCreatedAtDesc(@Param("storeId") UUID storeId);

    @Query("select cn from CreditNote cn where cn.store.storeId = :storeId order by cn.createdAt desc")
    Page<CreditNote> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    @Query("select cn from CreditNote cn " +
            "where cn.store.storeId = :storeId and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(cn.cnNumber, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(cn.cnType, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(cn.status, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(cn.notes, '')) like lower(concat('%', :query, '%'))) " +
            "order by cn.createdAt desc")
    Page<CreditNote> searchByStoreId(@Param("storeId") UUID storeId,
                                     @Param("query") String query,
                                     Pageable pageable);

    @Query("select cn from CreditNote cn where cn.store.storeId in :storeIds order by cn.createdAt desc")
    List<CreditNote> findByStoreStoreIdInOrderByCreatedAtDesc(@Param("storeIds") List<UUID> storeIds);
}
