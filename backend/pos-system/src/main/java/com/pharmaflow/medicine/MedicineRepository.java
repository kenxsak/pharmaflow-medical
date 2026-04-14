package com.pharmaflow.medicine;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MedicineRepository extends JpaRepository<Medicine, UUID> {

    @Query("select distinct m from Medicine m " +
            "left join m.saltComposition s " +
            "where m.isActive = true and (" +
            "lower(m.brandName) like lower(concat('%', :query, '%')) or " +
            "lower(coalesce(m.genericName, '')) like lower(concat('%', :query, '%')) or " +
            "lower(coalesce(m.barcode, '')) like lower(concat('%', :query, '%')) or " +
            "lower(coalesce(s.saltName, '')) like lower(concat('%', :query, '%')) or " +
            "lower(coalesce(m.compositionSummary, '')) like lower(concat('%', :query, '%')) or " +
            "lower(coalesce(m.searchKeywords, '')) like lower(concat('%', :query, '%'))" +
            ") order by m.brandName asc")
    List<Medicine> searchActive(@Param("query") String query, Pageable pageable);

    @Query("select distinct m from Medicine m " +
            "left join m.saltComposition s " +
            "left join m.manufacturer mf " +
            "where m.isActive = true and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(m.brandName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.genericName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.barcode, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.saltName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.compositionSummary, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.searchKeywords, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(mf.name, '')) like lower(concat('%', :query, '%'))) " +
            "order by m.brandName asc")
    Page<Medicine> searchCatalog(@Param("query") String query, Pageable pageable);

    Optional<Medicine> findFirstByBarcodeIgnoreCase(String barcode);

    Optional<Medicine> findFirstByBrandNameIgnoreCase(String brandName);
}
