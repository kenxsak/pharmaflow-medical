package com.pharmaflow.customer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface PatientPrescriptionRepository extends JpaRepository<PatientPrescription, UUID> {

    Page<PatientPrescription> findByCustomerCustomerIdOrderByCreatedAtDesc(UUID customerId, Pageable pageable);

    @Query("select pp from PatientPrescription pp " +
            "left join pp.customer c " +
            "left join pp.medicine m " +
            "where (:query is null or :query = '' " +
            "or lower(coalesce(c.name, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(pp.doctorName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(pp.doctorRegNo, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.brandName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.genericName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(pp.notes, '')) like lower(concat('%', :query, '%'))) " +
            "order by pp.createdAt desc")
    Page<PatientPrescription> searchHistory(@Param("query") String query, Pageable pageable);
}
