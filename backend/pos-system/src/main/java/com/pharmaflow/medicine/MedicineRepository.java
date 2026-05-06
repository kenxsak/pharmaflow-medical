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

    @Query(value = "select m.* " +
            "from medicines m " +
            "left join salt_compositions s on s.salt_id = m.salt_id " +
            "left join manufacturers mf on mf.manufacturer_id = m.manufacturer_id " +
            "where m.is_active = true and (" +
            "lower(coalesce(m.brand_name, '')) like concat('%', lower(:prefix), '%') " +
            "or lower(coalesce(m.generic_name, '')) like concat('%', lower(:prefix), '%') " +
            "or lower(coalesce(m.barcode, '')) like concat('%', lower(:prefix), '%') " +
            "or lower(coalesce(s.salt_name, '')) like concat('%', lower(:prefix), '%') " +
            "or lower(coalesce(m.composition_summary, '')) like concat('%', lower(:prefix), '%') " +
            "or lower(coalesce(m.search_keywords, '')) like concat('%', lower(:prefix), '%') " +
            "or lower(coalesce(mf.name, '')) like concat('%', lower(:prefix), '%')" +
            ") " +
            "order by " +
            "case " +
            "when lower(coalesce(m.barcode, '')) = lower(:query) then 0 " +
            "when lower(coalesce(m.brand_name, '')) = lower(:query) then 1 " +
            "when lower(coalesce(m.brand_name, '')) like concat(lower(:query), '%') then 2 " +
            "when lower(coalesce(m.brand_name, '')) like concat('%', lower(:query), '%') then 3 " +
            "when lower(coalesce(m.brand_name, '')) like concat(lower(:prefix), '%') then 4 " +
            "else 5 end, " +
            "greatest(" +
            "similarity(lower(coalesce(m.brand_name, '')), lower(:query)), " +
            "similarity(lower(coalesce(m.generic_name, '')), lower(:query)), " +
            "similarity(lower(coalesce(s.salt_name, '')), lower(:query)), " +
            "word_similarity(lower(:query), lower(coalesce(m.brand_name, ''))), " +
            "word_similarity(lower(:query), lower(coalesce(m.generic_name, ''))), " +
            "word_similarity(lower(:query), lower(coalesce(m.search_keywords, '')))" +
            ") desc, " +
            "m.brand_name asc " +
            "limit :limit",
            nativeQuery = true)
    List<Medicine> searchCatalogFuzzy(@Param("query") String query, @Param("prefix") String prefix, @Param("limit") int limit);

    Optional<Medicine> findFirstByBarcodeIgnoreCase(String barcode);

    Optional<Medicine> findFirstByBrandNameIgnoreCase(String brandName);
}
