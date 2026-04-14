package com.pharmaflow.medicine;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface SaltCompositionRepository extends JpaRepository<SaltComposition, UUID> {

    Optional<SaltComposition> findFirstBySaltNameIgnoreCase(String saltName);

    @Query("select s from SaltComposition s " +
            "where (:query is null or :query = '' " +
            "or lower(coalesce(s.saltName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.genericName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.drugClass, '')) like lower(concat('%', :query, '%'))) " +
            "order by s.saltName asc")
    Page<SaltComposition> searchSaltCompositions(@Param("query") String query, Pageable pageable);
}
