package com.pharmaflow.procurement;

import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.billing.Invoice;
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
@Table(name = "credit_notes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditNote {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "cn_id")
    private UUID cnId;

    @Column(name = "cn_number", nullable = false, unique = true, length = 50)
    private String cnNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @Column(name = "supplier_id")
    private UUID supplierId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_invoice_id")
    private Invoice originalInvoice;

    @Column(name = "cn_type", length = 20)
    private String cnType;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "claim_state", nullable = false, length = 20)
    private String claimState;

    @Column(name = "claim_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal claimAmount;

    @Column(name = "settled_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal settledAmount;

    @Column(name = "notes")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private PharmaUser createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolution_notes", length = 500)
    private String resolutionNotes;

    @PrePersist
    public void prePersist() {
        if (cnType == null || cnType.isBlank()) {
            cnType = "VENDOR_RETURN";
        }
        if (status == null || status.isBlank()) {
            status = "PENDING";
        }
        if (claimState == null || claimState.isBlank()) {
            claimState = status;
        }
        if (claimAmount == null) {
            claimAmount = totalAmount == null ? BigDecimal.ZERO : totalAmount;
        }
        if (settledAmount == null) {
            settledAmount = BigDecimal.ZERO;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
