package com.pharmaflow.medicine;

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
@Table(name = "medicines")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "medicine_id")
    private UUID medicineId;

    @Column(name = "brand_name", nullable = false, length = 300)
    private String brandName;

    @Column(name = "generic_name", length = 300)
    private String genericName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salt_id")
    private SaltComposition saltComposition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturer_id")
    private Manufacturer manufacturer;

    @Column(name = "medicine_form", length = 50)
    private String medicineForm;

    @Column(name = "strength", length = 100)
    private String strength;

    @Column(name = "pack_size")
    private Integer packSize;

    @Column(name = "barcode", length = 100)
    private String barcode;

    @Column(name = "hsn_code", length = 20)
    private String hsnCode;

    @Column(name = "gst_rate", precision = 5, scale = 2)
    private BigDecimal gstRate;

    @Column(name = "mrp", nullable = false, precision = 10, scale = 2)
    private BigDecimal mrp;

    @Column(name = "ptr", precision = 10, scale = 2)
    private BigDecimal ptr;

    @Column(name = "pts", precision = 10, scale = 2)
    private BigDecimal pts;

    @Column(name = "schedule_type", length = 20)
    private String scheduleType;

    @Column(name = "is_narcotic")
    private Boolean isNarcotic;

    @Column(name = "is_psychotropic")
    private Boolean isPsychotropic;

    @Column(name = "requires_rx")
    private Boolean requiresRx;

    @Column(name = "reorder_level")
    private Integer reorderLevel;

    @Column(name = "pack_size_label", length = 200)
    private String packSizeLabel;

    @Column(name = "composition_summary", columnDefinition = "TEXT")
    private String compositionSummary;

    @Column(name = "search_keywords", columnDefinition = "TEXT")
    private String searchKeywords;

    @Column(name = "catalog_source", length = 50)
    private String catalogSource;

    @Column(name = "external_product_id", length = 100)
    private String externalProductId;

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
        if (isNarcotic == null) {
            isNarcotic = false;
        }
        if (isPsychotropic == null) {
            isPsychotropic = false;
        }
        if (requiresRx == null) {
            requiresRx = false;
        }
        if (reorderLevel == null) {
            reorderLevel = 10;
        }
        if (packSize == null) {
            packSize = 10;
        }
        if (catalogSource == null || catalogSource.isBlank()) {
            catalogSource = "MANUAL";
        }
    }
}
