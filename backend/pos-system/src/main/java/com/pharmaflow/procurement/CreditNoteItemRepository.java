package com.pharmaflow.procurement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface CreditNoteItemRepository extends JpaRepository<CreditNoteItem, UUID> {

    @Query("select cni from CreditNoteItem cni join cni.creditNote cn where cn.store.storeId = :storeId order by cn.createdAt desc")
    Page<CreditNoteItem> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    @Query("select cni from CreditNoteItem cni " +
            "join cni.creditNote cn " +
            "left join cni.medicine m " +
            "where cn.store.storeId = :storeId and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(cn.cnNumber, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.brandName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.genericName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(cni.reason, '')) like lower(concat('%', :query, '%'))) " +
            "order by cn.createdAt desc")
    Page<CreditNoteItem> searchByStoreId(@Param("storeId") UUID storeId,
                                         @Param("query") String query,
                                         Pageable pageable);
}
