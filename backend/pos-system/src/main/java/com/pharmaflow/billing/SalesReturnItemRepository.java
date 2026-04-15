package com.pharmaflow.billing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface SalesReturnItemRepository extends JpaRepository<SalesReturnItem, UUID> {

    List<SalesReturnItem> findBySalesReturnReturnId(UUID returnId);

    @Query("select coalesce(sum(sri.quantity), 0) from SalesReturnItem sri where sri.invoiceItem.itemId = :invoiceItemId")
    BigDecimal sumReturnedQuantityByInvoiceItem(@Param("invoiceItemId") UUID invoiceItemId);
}
