package com.pharmaflow.inventory;

import com.pharmaflow.auth.PharmaUser;
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
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_movements")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "movement_id")
    private UUID movementId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private InventoryBatch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private PharmaUser actor;

    @Column(name = "movement_type", nullable = false, length = 40)
    private String movementType;

    @Column(name = "reference_type", length = 40)
    private String referenceType;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "reason_code", length = 60)
    private String reasonCode;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "quantity_strips_delta", nullable = false)
    private Integer quantityStripsDelta;

    @Column(name = "quantity_loose_delta", nullable = false)
    private Integer quantityLooseDelta;

    @Column(name = "quantity_strips_after", nullable = false)
    private Integer quantityStripsAfter;

    @Column(name = "quantity_loose_after", nullable = false)
    private Integer quantityLooseAfter;

    @Column(name = "inventory_state_after", length = 30)
    private String inventoryStateAfter;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (quantityStripsDelta == null) {
            quantityStripsDelta = 0;
        }
        if (quantityLooseDelta == null) {
            quantityLooseDelta = 0;
        }
        if (quantityStripsAfter == null) {
            quantityStripsAfter = 0;
        }
        if (quantityLooseAfter == null) {
            quantityLooseAfter = 0;
        }
    }
}
