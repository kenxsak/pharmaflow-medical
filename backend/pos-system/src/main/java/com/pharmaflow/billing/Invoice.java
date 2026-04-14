package com.pharmaflow.billing;

import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.customer.Customer;
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
import javax.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "invoice_id")
    private UUID invoiceId;

    @Column(name = "invoice_no", nullable = false, unique = true, length = 50)
    private String invoiceNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "billed_by")
    private PharmaUser billedBy;

    @Column(name = "invoice_date")
    private LocalDateTime invoiceDate;

    @Column(name = "invoice_type", length = 20)
    private String invoiceType;

    @Column(name = "subtotal", precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "taxable_amount", precision = 12, scale = 2)
    private BigDecimal taxableAmount;

    @Column(name = "cgst_amount", precision = 12, scale = 2)
    private BigDecimal cgstAmount;

    @Column(name = "sgst_amount", precision = 12, scale = 2)
    private BigDecimal sgstAmount;

    @Column(name = "igst_amount", precision = 12, scale = 2)
    private BigDecimal igstAmount;

    @Column(name = "round_off", precision = 5, scale = 2)
    private BigDecimal roundOff;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "payment_mode", length = 20)
    private String paymentMode;

    @Column(name = "amount_paid", precision = 12, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "amount_due", precision = 12, scale = 2)
    private BigDecimal amountDue;

    @Column(name = "prescription_attached")
    private Boolean prescriptionAttached;

    @Column(name = "prescription_url")
    private String prescriptionUrl;

    @Column(name = "doctor_name", length = 200)
    private String doctorName;

    @Column(name = "is_cancelled")
    private Boolean isCancelled;

    @Column(name = "cancel_reason")
    private String cancelReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by")
    private PharmaUser cancelledBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (invoiceDate == null) {
            invoiceDate = LocalDateTime.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (invoiceType == null || invoiceType.isBlank()) {
            invoiceType = "SALE";
        }
        if (subtotal == null) {
            subtotal = BigDecimal.ZERO;
        }
        if (discountAmount == null) {
            discountAmount = BigDecimal.ZERO;
        }
        if (taxableAmount == null) {
            taxableAmount = BigDecimal.ZERO;
        }
        if (cgstAmount == null) {
            cgstAmount = BigDecimal.ZERO;
        }
        if (sgstAmount == null) {
            sgstAmount = BigDecimal.ZERO;
        }
        if (igstAmount == null) {
            igstAmount = BigDecimal.ZERO;
        }
        if (roundOff == null) {
            roundOff = BigDecimal.ZERO;
        }
        if (totalAmount == null) {
            totalAmount = BigDecimal.ZERO;
        }
        if (amountPaid == null) {
            amountPaid = BigDecimal.ZERO;
        }
        if (amountDue == null) {
            amountDue = BigDecimal.ZERO;
        }
        if (prescriptionAttached == null) {
            prescriptionAttached = false;
        }
        if (isCancelled == null) {
            isCancelled = false;
        }
    }
}
