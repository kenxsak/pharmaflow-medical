package com.pharmaflow.procurement;

import com.pharmaflow.auth.PharmaUser;
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
import javax.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "purchase_receipts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "receipt_id")
    private UUID receiptId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "po_id")
    private PurchaseOrder purchaseOrder;

    @Column(name = "receipt_number", nullable = false, unique = true, length = 80)
    private String receiptNumber;

    @Column(name = "supplier_invoice_number", length = 100)
    private String supplierInvoiceNumber;

    @Column(name = "receipt_date")
    private LocalDateTime receiptDate;

    @Column(name = "status", length = 30)
    private String status;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private PharmaUser createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (receiptDate == null) {
            receiptDate = LocalDateTime.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null || status.isBlank()) {
            status = "RECEIVED";
        }
    }
}
