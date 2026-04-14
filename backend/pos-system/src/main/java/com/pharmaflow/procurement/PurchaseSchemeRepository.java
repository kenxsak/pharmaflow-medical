package com.pharmaflow.procurement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface PurchaseSchemeRepository extends JpaRepository<PurchaseScheme, UUID> {

    Page<PurchaseScheme> findBySupplierSupplierId(UUID supplierId, Pageable pageable);

    @Query("select ps from PurchaseScheme ps " +
            "left join ps.supplier s " +
            "left join ps.medicine m " +
            "where (:query is null or :query = '' " +
            "or lower(coalesce(s.name, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.brandName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.genericName, '')) like lower(concat('%', :query, '%'))) " +
            "order by ps.createdAt desc")
    Page<PurchaseScheme> searchSchemes(@Param("query") String query, Pageable pageable);
}
