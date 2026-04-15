package com.pharmaflow.inventory;

import com.pharmaflow.medicine.Medicine;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_batches")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "batch_id")
    private UUID batchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @Column(name = "batch_number", nullable = false, length = 100)
    private String batchNumber;

    @Column(name = "manufacture_date")
    private LocalDate manufactureDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "quantity_strips")
    private Integer quantityStrips;

    @Column(name = "quantity_loose")
    private Integer quantityLoose;

    @Column(name = "purchase_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal purchaseRate;

    @Column(name = "mrp", nullable = false, precision = 10, scale = 2)
    private BigDecimal mrp;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "inventory_state", nullable = false, length = 30)
    private String inventoryState;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (quantityStrips == null) {
            quantityStrips = 0;
        }
        if (quantityLoose == null) {
            quantityLoose = 0;
        }
        if (isActive == null) {
            isActive = true;
        }
        if (inventoryState == null || inventoryState.isBlank()) {
            inventoryState = "SELLABLE";
        }
    }
}
