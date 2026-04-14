package com.pharmaflow.customer;

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
@Table(name = "customers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "customer_id")
    private UUID customerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "phone", unique = true, length = 15)
    private String phone;

    @Column(name = "email", length = 200)
    private String email;

    @Column(name = "address")
    private String address;

    @Column(name = "doctor_name", length = 200)
    private String doctorName;

    @Column(name = "credit_limit", precision = 10, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "current_balance", precision = 10, scale = 2)
    private BigDecimal currentBalance;

    @Column(name = "loyalty_points")
    private Integer loyaltyPoints;

    @Column(name = "is_blocked")
    private Boolean isBlocked;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isActive == null) {
            isActive = true;
        }
        if (creditLimit == null) {
            creditLimit = BigDecimal.ZERO;
        }
        if (currentBalance == null) {
            currentBalance = BigDecimal.ZERO;
        }
        if (loyaltyPoints == null) {
            loyaltyPoints = 0;
        }
        if (isBlocked == null) {
            isBlocked = false;
        }
    }
}
