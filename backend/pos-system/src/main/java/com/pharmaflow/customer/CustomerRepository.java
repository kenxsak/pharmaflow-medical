package com.pharmaflow.customer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Optional<Customer> findByPhone(String phone);

    Optional<Customer> findByPhoneAndIsActiveTrue(String phone);

    @Query("select c from Customer c where c.store.storeId = :storeId order by c.name asc")
    Page<Customer> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    @Query("select c from Customer c where c.store.storeId = :storeId and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(c.name, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(c.phone, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(c.email, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(c.doctorName, '')) like lower(concat('%', :query, '%'))) " +
            "order by c.name asc")
    Page<Customer> searchByStoreId(@Param("storeId") UUID storeId,
                                   @Param("query") String query,
                                   Pageable pageable);
}
