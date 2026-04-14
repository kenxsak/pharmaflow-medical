package com.pharmaflow.billing;

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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "invoice_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "item_id")
    private UUID itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private InventoryBatch batch;

    @Column(name = "quantity", precision = 10, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_type", length = 20)
    private String unitType;

    @Column(name = "mrp", precision = 10, scale = 2)
    private BigDecimal mrp;

    @Column(name = "medicine_name_snapshot", length = 300)
    private String medicineNameSnapshot;

    @Column(name = "generic_name_snapshot", length = 300)
    private String genericNameSnapshot;

    @Column(name = "manufacturer_name_snapshot", length = 300)
    private String manufacturerNameSnapshot;

    @Column(name = "hsn_code_snapshot", length = 20)
    private String hsnCodeSnapshot;

    @Column(name = "schedule_type_snapshot", length = 20)
    private String scheduleTypeSnapshot;

    @Column(name = "batch_number_snapshot", length = 100)
    private String batchNumberSnapshot;

    @Column(name = "expiry_date_snapshot")
    private LocalDate expiryDateSnapshot;

    @Column(name = "purchase_rate_snapshot", precision = 10, scale = 2)
    private BigDecimal purchaseRateSnapshot;

    @Column(name = "pack_size_snapshot")
    private Integer packSizeSnapshot;

    @Column(name = "discount_pct", precision = 5, scale = 2)
    private BigDecimal discountPct;

    @Column(name = "taxable_amount", precision = 12, scale = 2)
    private BigDecimal taxableAmount;

    @Column(name = "gst_rate", precision = 5, scale = 2)
    private BigDecimal gstRate;

    @Column(name = "cgst", precision = 10, scale = 2)
    private BigDecimal cgst;

    @Column(name = "sgst", precision = 10, scale = 2)
    private BigDecimal sgst;

    @Column(name = "igst", precision = 10, scale = 2)
    private BigDecimal igst;

    @Column(name = "total", precision = 12, scale = 2)
    private BigDecimal total;
}
