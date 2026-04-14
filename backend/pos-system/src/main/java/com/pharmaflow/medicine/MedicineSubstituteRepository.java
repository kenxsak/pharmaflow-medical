package com.pharmaflow.medicine;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MedicineSubstituteRepository extends JpaRepository<MedicineSubstitute, Long> {

    List<MedicineSubstitute> findByMedicineMedicineId(UUID medicineId);

    boolean existsByMedicineMedicineIdAndSubstituteMedicineId(UUID medicineId, UUID substituteId);

    @Query("select ms from MedicineSubstitute ms where ms.medicine.medicineId = :medicineId order by ms.id desc")
    Page<MedicineSubstitute> findByMedicineId(@Param("medicineId") UUID medicineId, Pageable pageable);

    @Query("select ms from MedicineSubstitute ms " +
            "left join ms.medicine m " +
            "left join ms.substitute s " +
            "where (:query is null or :query = '' " +
            "or lower(coalesce(m.brandName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(m.genericName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.brandName, '')) like lower(concat('%', :query, '%')) " +
            "or lower(coalesce(s.genericName, '')) like lower(concat('%', :query, '%'))) " +
            "order by ms.id desc")
    Page<MedicineSubstitute> searchSubstitutes(@Param("query") String query, Pageable pageable);
}
