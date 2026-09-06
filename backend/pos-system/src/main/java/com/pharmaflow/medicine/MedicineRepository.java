package com.pharmaflow.medicine;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
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

    @Query("select distinct m from Medicine m " +
            "where m.isActive = true and (" +
            "lower(coalesce(m.brandName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.genericName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.barcode, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.searchKeywords, '')) like lower(concat('%', :query, '%'))) " +
            "order by m.brandName asc")
    @Query(value = "SELECT m.* FROM medicines m " +
            "WHERE m.is_active = true AND (" +
            "m.brand_name ILIKE CONCAT('%', :query, '%') " +
            "OR m.barcode = :query " +
            "OR m.generic_name ILIKE CONCAT('%', :query, '%') " +
            "OR m.search_keywords ILIKE CONCAT('%', :query, '%')" +
            ") " +
            "ORDER BY " +
            "CASE " +
            "WHEN lower(coalesce(m.barcode, '')) = lower(:query) THEN 0 " +
            "WHEN lower(m.brand_name) = lower(:query) THEN 1 " +
            "WHEN lower(m.brand_name) LIKE lower(CONCAT(:query, '%')) THEN 2 " +
            "WHEN lower(coalesce(m.generic_name, '')) LIKE lower(CONCAT(:query, '%')) THEN 3 " +
            "ELSE 4 END, " +
            "m.brand_name ASC " +
            "LIMIT :limit",
            nativeQuery = true)
    List<Medicine> searchCatalogFast(@Param("query") String query,
                                     @Param("limit") int limit);

    @Query(value = "SELECT m.* FROM medicines m " +
            "WHERE m.is_active = true AND (" +
            "similarity(m.brand_name, :query) > 0.25 " +
            "OR similarity(coalesce(m.generic_name, ''), :query) > 0.25" +
            ") " +
            "ORDER BY greatest(similarity(m.brand_name, :query), similarity(coalesce(m.generic_name, ''), :query)) DESC, " +
            "m.brand_name ASC " +
            "LIMIT :limit",
            nativeQuery = true)
    List<Medicine> searchCatalogFuzzyFast(@Param("query") String query,
                                          @Param("limit") int limit);

    @Query(value = "SELECT m.* FROM medicines m " +
            "WHERE m.is_active = true AND (" +
            "m.brand_name ILIKE CONCAT('%', :query, '%') " +
            "OR m.barcode = :query " +
            "OR m.generic_name ILIKE CONCAT('%', :query, '%') " +
            "OR m.search_keywords ILIKE CONCAT('%', :query, '%')" +
            ") " +
            "ORDER BY " +
            "CASE " +
            "WHEN lower(coalesce(m.barcode, '')) = lower(:query) THEN 0 " +
            "WHEN lower(m.brand_name) = lower(:query) THEN 1 " +
            "WHEN lower(m.brand_name) LIKE lower(CONCAT(:query, '%')) THEN 2 " +
            "WHEN lower(coalesce(m.generic_name, '')) LIKE lower(CONCAT(:query, '%')) THEN 3 " +
            "ELSE 4 END, " +
            "m.brand_name ASC " +
            "LIMIT :limit",
            nativeQuery = true)
    List<Medicine> searchCatalogWithStore(@Param("storeId") UUID storeId,
                                          @Param("query") String query,
                                          @Param("today") LocalDate today,
                                          @Param("limit") int limit);

    @Query(value = "SELECT m.* FROM medicines m " +
            "WHERE m.is_active = true AND (" +
            "m.brand_name ILIKE CONCAT('%', :query, '%') " +
            "OR m.barcode = :query " +
            "OR m.generic_name ILIKE CONCAT('%', :query, '%') " +
            "OR m.search_keywords ILIKE CONCAT('%', :query, '%')" +
            ") " +
            "ORDER BY " +
            "CASE " +
            "WHEN lower(coalesce(m.barcode, '')) = lower(:query) THEN 0 " +
            "WHEN lower(m.brand_name) = lower(:query) THEN 1 " +
            "WHEN lower(m.brand_name) LIKE lower(CONCAT(:query, '%')) THEN 2 " +
            "WHEN lower(coalesce(m.generic_name, '')) LIKE lower(CONCAT(:query, '%')) THEN 3 " +
            "ELSE 4 END, " +
            "m.brand_name ASC " +
            "LIMIT :limit",
            nativeQuery = true)
    List<Medicine> searchCatalogWithoutStore(@Param("query") String query,
                                             @Param("limit") int limit);

    @Query(value = "SELECT m.* FROM medicines m " +
            "WHERE m.is_active = true AND (" +
            "similarity(m.brand_name, :query) > 0.25 " +
            "OR similarity(coalesce(m.generic_name, ''), :query) > 0.25" +
            ") " +
            "ORDER BY greatest(similarity(m.brand_name, :query), similarity(coalesce(m.generic_name, ''), :query)) DESC, " +
            "m.brand_name ASC " +
            "LIMIT :limit",
            nativeQuery = true)
    List<Medicine> searchCatalogFuzzyWithStore(@Param("storeId") UUID storeId,
                                               @Param("query") String query,
                                               @Param("today") LocalDate today,
                                               @Param("limit") int limit);

    @Query(value = "SELECT m.* FROM medicines m " +
            "WHERE m.is_active = true AND (" +
            "similarity(m.brand_name, :query) > 0.25 " +
            "OR similarity(coalesce(m.generic_name, ''), :query) > 0.25" +
            ") " +
            "ORDER BY greatest(similarity(m.brand_name, :query), similarity(coalesce(m.generic_name, ''), :query)) DESC, " +
            "m.brand_name ASC " +
            "LIMIT :limit",
            nativeQuery = true)
    List<Medicine> searchCatalogFuzzyWithoutStore(@Param("query") String query,
                                                  @Param("limit") int limit);

    Optional<Medicine> findFirstByBarcodeIgnoreCase(String barcode);

    Optional<Medicine> findFirstByBrandNameIgnoreCase(String brandName);
}
