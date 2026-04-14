package com.pharmaflow.procurement;

import com.pharmaflow.inventory.InventoryBatch;
import com.pharmaflow.medicine.Medicine;
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
import javax.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "credit_note_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditNoteItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "cn_item_id")
    private UUID cnItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cn_id")
    private CreditNote creditNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private InventoryBatch batch;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 3)
    private BigDecimal quantity;

    @Column(name = "mrp", nullable = false, precision = 10, scale = 2)
    private BigDecimal mrp;

    @Column(name = "reason", length = 200)
    private String reason;
}
