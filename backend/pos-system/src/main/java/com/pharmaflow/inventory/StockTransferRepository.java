package com.pharmaflow.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface StockTransferRepository extends JpaRepository<StockTransfer, UUID> {

    @Query("select st from StockTransfer st " +
            "where st.fromStore.storeId = :storeId or st.toStore.storeId = :storeId " +
            "order by st.createdAt desc")
    Page<StockTransfer> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    @Query("select st from StockTransfer st " +
            "left join st.medicine m " +
            "left join st.fromStore fs " +
            "left join st.toStore ts " +
            "left join st.batch b " +
            "where (st.fromStore.storeId = :storeId or st.toStore.storeId = :storeId) and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(m.brandName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.genericName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(b.batchNumber, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(fs.storeCode, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(ts.storeCode, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(st.status, '')) like lower(concat('%', :query, '%'))) " +
            "order by st.createdAt desc")
    Page<StockTransfer> searchByStoreId(@Param("storeId") UUID storeId,
                                        @Param("query") String query,
                                        Pageable pageable);

    @Query("select st from StockTransfer st " +
            "join fetch st.fromStore fs " +
            "join fetch st.toStore ts " +
            "join fetch st.medicine m " +
            "left join fetch st.batch b " +
            "where (fs.storeId in :storeIds or ts.storeId in :storeIds) " +
            "and (:status is null or lower(coalesce(st.status, '')) = lower(:status)) " +
            "order by st.createdAt desc")
    List<StockTransfer> findByStoreIds(@Param("storeIds") List<UUID> storeIds,
                                       @Param("status") String status);
}
