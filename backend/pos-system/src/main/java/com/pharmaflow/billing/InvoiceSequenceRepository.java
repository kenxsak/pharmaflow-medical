package com.pharmaflow.billing;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface InvoiceSequenceRepository extends JpaRepository<InvoiceSequence, InvoiceSequenceId> {

    @Query("select seq from InvoiceSequence seq where seq.store.storeId = :storeId order by seq.id.financialYear desc")
    Page<InvoiceSequence> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    Optional<InvoiceSequence> findByIdStoreIdAndIdFinancialYear(UUID storeId, String financialYear);

    @Query("select seq from InvoiceSequence seq " +
            "where seq.store.storeId = :storeId and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(seq.id.financialYear, '')) like lower(concat('%', :query, '%'))) " +
            "order by seq.id.financialYear desc")
    Page<InvoiceSequence> searchByStoreId(@Param("storeId") UUID storeId,
                                          @Param("query") String query,
                                          Pageable pageable);
}
