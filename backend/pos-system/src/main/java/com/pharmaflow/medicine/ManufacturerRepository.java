package com.pharmaflow.medicine;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ManufacturerRepository extends JpaRepository<Manufacturer, UUID> {

    Optional<Manufacturer> findFirstByShortCodeIgnoreCase(String shortCode);

    Optional<Manufacturer> findFirstByNameIgnoreCase(String name);

    @Query("select m from Manufacturer m " +
            "where (:query is null or :query = '' " +
            "or lower(coalesce(m.name, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.shortCode, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.gstin, '')) like lower(concat('%', :query, '%'))) " +
            "order by m.name asc")
    Page<Manufacturer> searchManufacturers(@Param("query") String query, Pageable pageable);
}
