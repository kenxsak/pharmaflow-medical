package com.pharmaflow.procurement;

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
import javax.persistence.PrePersist;
import javax.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "purchase_order_plan_lines")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderPlanLine {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "po_plan_line_id")
    private UUID poPlanLineId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "po_id")
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "quantity_loose")
    private Integer quantityLoose;

    @Column(name = "purchase_rate", precision = 10, scale = 2)
    private BigDecimal purchaseRate;

    @Column(name = "mrp", precision = 10, scale = 2)
    private BigDecimal mrp;

    @Column(name = "gst_rate", precision = 5, scale = 2)
    private BigDecimal gstRate;

    @Column(name = "medicine_form", length = 60)
    private String medicineForm;

    @Column(name = "pack_size")
    private Integer packSize;

    @Column(name = "pack_size_label", length = 255)
    private String packSizeLabel;

    @Column(name = "line_status", length = 20)
    private String lineStatus;

    @Column(name = "notes", length = 500)
    private String notes;

    @PrePersist
    public void prePersist() {
        if (lineStatus == null || lineStatus.isBlank()) {
            lineStatus = "PLANNED";
        }
    }
}
