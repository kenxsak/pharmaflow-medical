package com.pharmaflow.procurement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PharmaSupplierRepository extends JpaRepository<Supplier, UUID> {

    List<Supplier> findAllByIsActiveTrueOrderByNameAsc();

    Optional<Supplier> findFirstByNameIgnoreCase(String name);

    @Query("select s from PharmaFlowSupplier s where s.isActive = true order by s.name asc")
    Page<Supplier> findActive(Pageable pageable);

    @Query("select s from PharmaFlowSupplier s " +
            "where (:query is null or :query = '' " +
            "or lower(coalesce(s.name, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.contact, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.phone, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.email, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.gstin, '')) like lower(concat('%', :query, '%'))) " +
            "order by s.name asc")
    Page<Supplier> searchSuppliers(@Param("query") String query, Pageable pageable);
}
