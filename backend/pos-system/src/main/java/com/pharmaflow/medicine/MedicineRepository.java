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
    Page<Medicine> searchCatalogFast(@Param("query") String query, Pageable pageable);

    @Query(value = "select m.* from medicines m " +
            "left join (" +
            "select ib.medicine_id, sum(coalesce(ib.quantity_strips, 0)) as total_strips " +
            "from inventory_batches ib " +
            "where ib.store_id = :storeId " +
            "and ib.is_active = true " +
            "and upper(coalesce(ib.inventory_state, 'SELLABLE')) = 'SELLABLE' " +
            "and ib.expiry_date > :today " +
            "and (coalesce(ib.quantity_strips, 0) > 0 or coalesce(ib.quantity_loose, 0) > 0) " +
            "group by ib.medicine_id" +
            ") st on st.medicine_id = m.medicine_id " +
            "where m.is_active = true " +
            "and lower(m.brand_name || ' ' || coalesce(m.generic_name, '') || ' ' || coalesce(m.barcode, '') || ' ' || coalesce(m.search_keywords, '')) like concat('%', lower(:query), '%') " +
            "order by " +
            "case " +
            "when lower(coalesce(m.barcode, '')) = lower(:query) then 0 " +
            "when lower(m.brand_name) = lower(:query) then 1 " +
            "when lower(m.brand_name) like concat(lower(:query), ' %') then 2 " +
            "when lower(m.brand_name) like concat(lower(:query), '%') then 3 " +
            "when lower(coalesce(m.generic_name, '')) like concat(lower(:query), '%') then 4 " +
            "when lower(m.brand_name) like concat('%', lower(:query), '%') then 5 " +
            "when lower(coalesce(m.generic_name, '')) like concat('%', lower(:query), '%') then 6 " +
            "when lower(coalesce(m.search_keywords, '')) like concat('%', lower(:query), '%') then 7 " +
            "else 8 end, " +
            "case when coalesce(st.total_strips, 0) > 0 then 0 else 1 end, " +
            "m.brand_name asc " +
            "limit :limit",
            nativeQuery = true)
    List<Medicine> searchCatalogWithStore(@Param("storeId") UUID storeId,
                                          @Param("query") String query,
                                          @Param("today") LocalDate today,
                                          @Param("limit") int limit);

    @Query(value = "select m.* from medicines m " +
            "where m.is_active = true " +
            "and lower(m.brand_name || ' ' || coalesce(m.generic_name, '') || ' ' || coalesce(m.barcode, '') || ' ' || coalesce(m.search_keywords, '')) like concat('%', lower(:query), '%') " +
            "order by " +
            "case " +
            "when lower(coalesce(m.barcode, '')) = lower(:query) then 0 " +
            "when lower(m.brand_name) = lower(:query) then 1 " +
            "when lower(m.brand_name) like concat(lower(:query), ' %') then 2 " +
            "when lower(m.brand_name) like concat(lower(:query), '%') then 3 " +
            "when lower(coalesce(m.generic_name, '')) like concat(lower(:query), '%') then 4 " +
            "when lower(m.brand_name) like concat('%', lower(:query), '%') then 5 " +
            "when lower(coalesce(m.generic_name, '')) like concat('%', lower(:query), '%') then 6 " +
            "when lower(coalesce(m.search_keywords, '')) like concat('%', lower(:query), '%') then 7 " +
            "else 8 end, " +
            "m.brand_name asc " +
            "limit :limit",
            nativeQuery = true)
    List<Medicine> searchCatalogWithoutStore(@Param("query") String query,
                                             @Param("limit") int limit);

    @Query(value = "select m.* from medicines m " +
            "left join (" +
            "select ib.medicine_id, sum(coalesce(ib.quantity_strips, 0)) as total_strips " +
            "from inventory_batches ib " +
            "where ib.store_id = :storeId " +
            "and ib.is_active = true " +
            "and upper(coalesce(ib.inventory_state, 'SELLABLE')) = 'SELLABLE' " +
            "and ib.expiry_date > :today " +
            "and (coalesce(ib.quantity_strips, 0) > 0 or coalesce(ib.quantity_loose, 0) > 0) " +
            "group by ib.medicine_id" +
            ") st on st.medicine_id = m.medicine_id " +
            "where m.is_active = true and (" +
            "similarity(lower(m.brand_name), lower(:query)) > 0.3 " +
            "or similarity(lower(coalesce(m.generic_name, '')), lower(:query)) > 0.3 " +
            "or word_similarity(lower(:query), lower(m.brand_name)) > 0.4 " +
            "or word_similarity(lower(:query), lower(coalesce(m.generic_name, ''))) > 0.4" +
            ") " +
            "order by " +
            "greatest(" +
            "similarity(lower(m.brand_name), lower(:query)), " +
            "similarity(lower(coalesce(m.generic_name, '')), lower(:query)), " +
            "word_similarity(lower(:query), lower(m.brand_name)), " +
            "word_similarity(lower(:query), lower(coalesce(m.generic_name, '')))" +
            ") desc, " +
            "case when coalesce(st.total_strips, 0) > 0 then 0 else 1 end, " +
            "m.brand_name asc " +
            "limit :limit",
            nativeQuery = true)
    List<Medicine> searchCatalogFuzzyWithStore(@Param("storeId") UUID storeId,
                                               @Param("query") String query,
                                               @Param("today") LocalDate today,
                                               @Param("limit") int limit);

    @Query(value = "select m.* from medicines m " +
            "where m.is_active = true and (" +
            "similarity(lower(m.brand_name), lower(:query)) > 0.3 " +
            "or similarity(lower(coalesce(m.generic_name, '')), lower(:query)) > 0.3 " +
            "or word_similarity(lower(:query), lower(m.brand_name)) > 0.4 " +
            "or word_similarity(lower(:query), lower(coalesce(m.generic_name, ''))) > 0.4" +
            ") " +
            "order by " +
            "greatest(" +
            "similarity(lower(m.brand_name), lower(:query)), " +
            "similarity(lower(coalesce(m.generic_name, '')), lower(:query)), " +
            "word_similarity(lower(:query), lower(m.brand_name)), " +
            "word_similarity(lower(:query), lower(coalesce(m.generic_name, '')))" +
            ") desc, " +
            "m.brand_name asc " +
            "limit :limit",
            nativeQuery = true)
    List<Medicine> searchCatalogFuzzyWithoutStore(@Param("query") String query,
                                                  @Param("limit") int limit);

    Optional<Medicine> findFirstByBarcodeIgnoreCase(String barcode);

    Optional<Medicine> findFirstByBrandNameIgnoreCase(String brandName);
}
