package com.pharmaflow.procurement;

import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.store.Store;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.Table;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "purchase_orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "po_id")
    private UUID poId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(name = "po_number", nullable = false, unique = true, length = 50)
    private String poNumber;

    @Column(name = "po_date")
    private LocalDateTime poDate;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "order_type", length = 30)
    private String orderType;

    @Column(name = "supplier_reference", length = 100)
    private String supplierReference;

    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "subtotal", precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "cgst_amount", precision = 12, scale = 2)
    private BigDecimal cgstAmount;

    @Column(name = "sgst_amount", precision = 12, scale = 2)
    private BigDecimal sgstAmount;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "status", length = 20)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private PharmaUser createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (poDate == null) {
            poDate = LocalDateTime.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null || status.isBlank()) {
            status = "PENDING";
        }
        if (orderType == null || orderType.isBlank()) {
            orderType = "DIRECT_RECEIPT";
        }
        if ("RECEIVED".equalsIgnoreCase(status) && receivedAt == null) {
            receivedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        if ("RECEIVED".equalsIgnoreCase(status) && receivedAt == null) {
            receivedAt = LocalDateTime.now();
        }
    }
}
