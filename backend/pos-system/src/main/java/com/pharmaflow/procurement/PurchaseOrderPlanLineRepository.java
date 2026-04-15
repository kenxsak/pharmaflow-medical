package com.pharmaflow.procurement;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PurchaseOrderPlanLineRepository extends JpaRepository<PurchaseOrderPlanLine, UUID> {

    List<PurchaseOrderPlanLine> findByPurchaseOrderPoIdIn(List<UUID> purchaseOrderIds);

    List<PurchaseOrderPlanLine> findByPurchaseOrderPoId(UUID purchaseOrderId);

    @Query("select pol from PurchaseOrderPlanLine pol " +
            "join fetch pol.purchaseOrder po " +
            "join fetch po.store st " +
            "left join fetch po.supplier s " +
            "where pol.medicine.medicineId = :medicineId " +
            "and st.tenant.tenantId = :tenantId " +
            "order by po.poDate desc")
    List<PurchaseOrderPlanLine> findRecentByTenantAndMedicine(@Param("tenantId") UUID tenantId,
                                                              @Param("medicineId") UUID medicineId,
                                                              Pageable pageable);
}
