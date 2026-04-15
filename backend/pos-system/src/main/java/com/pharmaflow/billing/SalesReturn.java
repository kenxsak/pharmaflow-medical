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
@Table(name = "sales_returns")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesReturn {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "return_id")
    private UUID returnId;

    @Column(name = "return_number", nullable = false, unique = true, length = 50)
    private String returnNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "settlement_type", nullable = false, length = 30)
    private String settlementType;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private PharmaUser createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (settlementType == null || settlementType.isBlank()) {
            settlementType = "REFUND";
        }
        if (status == null || status.isBlank()) {
            status = "COMPLETED";
        }
        if (totalAmount == null) {
            totalAmount = BigDecimal.ZERO;
        }
    }
}
