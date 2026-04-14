package com.pharmaflow.delivery;

import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.billing.Invoice;
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
@Table(name = "delivery_orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "delivery_id")
    private UUID deliveryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_boy_id")
    private PharmaUser deliveryBoy;

    @Column(name = "delivery_address", nullable = false)
    private String deliveryAddress;

    @Column(name = "delivery_phone", length = 15)
    private String deliveryPhone;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "amount_to_collect", precision = 12, scale = 2)
    private BigDecimal amountToCollect;

    @Column(name = "amount_collected", precision = 12, scale = 2)
    private BigDecimal amountCollected;

    @Column(name = "payment_mode", length = 20)
    private String paymentMode;

    @Column(name = "notes")
    private String notes;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (status == null || status.isBlank()) {
            status = "PENDING";
        }
        if (amountToCollect == null) {
            amountToCollect = BigDecimal.ZERO;
        }
        if (amountCollected == null) {
            amountCollected = BigDecimal.ZERO;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
