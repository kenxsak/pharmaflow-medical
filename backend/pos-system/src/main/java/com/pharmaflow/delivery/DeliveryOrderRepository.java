package com.pharmaflow.delivery;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, UUID> {

    @Query("select d from DeliveryOrder d where d.store.storeId = :storeId order by d.createdAt desc")
    Page<DeliveryOrder> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    @Query("select d from DeliveryOrder d " +
            "left join d.customer c " +
            "left join d.invoice i " +
            "left join d.deliveryBoy db " +
            "where d.store.storeId = :storeId and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(c.name, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(i.invoiceNo, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(db.fullName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(d.status, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(d.deliveryPhone, '')) like lower(concat('%', :query, '%'))) " +
            "order by d.createdAt desc")
    Page<DeliveryOrder> searchByStoreId(@Param("storeId") UUID storeId,
                                        @Param("query") String query,
                                        Pageable pageable);
}
