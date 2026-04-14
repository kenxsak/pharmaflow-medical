package com.pharmaflow.compliance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ScheduleDrugRegisterRepository extends JpaRepository<ScheduleDrugRegister, UUID> {

    long countByStoreStoreId(UUID storeId);

    @Query("select s from ScheduleDrugRegister s where s.store.storeId = :storeId order by s.saleDate desc")
    Page<ScheduleDrugRegister> findByStoreId(@Param("storeId") UUID storeId, Pageable pageable);

    List<ScheduleDrugRegister> findByStoreStoreIdAndSaleDateBetweenAndScheduleTypeOrderBySaleDateDesc(
            UUID storeId,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            String scheduleType
    );

    List<ScheduleDrugRegister> findByStoreStoreIdAndSaleDateBetweenOrderBySaleDateDesc(
            UUID storeId,
            LocalDateTime fromDate,
            LocalDateTime toDate
    );

    @Query("select s from ScheduleDrugRegister s where s.store.storeId = :storeId and s.saleDate >= :start and s.saleDate < :end and s.medicine.isNarcotic = true order by s.saleDate desc")
    List<ScheduleDrugRegister> findNarcoticReport(@Param("storeId") UUID storeId,
                                                  @Param("start") LocalDateTime start,
                                                  @Param("end") LocalDateTime end);

    @Query("select s from ScheduleDrugRegister s " +
            "left join s.medicine m " +
            "where s.store.storeId = :storeId and " +
            "(:scheduleType is null or :scheduleType = '' or lower(s.scheduleType) = lower(:scheduleType)) and (" +
            ":query is null or :query = '' " +
            "or lower(coalesce(s.patientName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.doctorName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.batchNumber, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.brandName, '')) like lower(concat('%', :query, '%'))) " +
            "order by s.saleDate desc")
    Page<ScheduleDrugRegister> searchByStoreId(@Param("storeId") UUID storeId,
                                               @Param("scheduleType") String scheduleType,
                                               @Param("query") String query,
                                               Pageable pageable);
}
