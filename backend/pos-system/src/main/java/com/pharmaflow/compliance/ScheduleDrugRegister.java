package com.pharmaflow.compliance;

import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.billing.Invoice;
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
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "schedule_drug_register")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleDrugRegister {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "register_id")
    private UUID registerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    @Column(name = "schedule_type", nullable = false, length = 20)
    private String scheduleType;

    @Column(name = "sale_date")
    private LocalDateTime saleDate;

    @Column(name = "patient_name", nullable = false, length = 200)
    private String patientName;

    @Column(name = "patient_age")
    private Integer patientAge;

    @Column(name = "patient_gender", length = 10)
    private String patientGender;

    @Column(name = "patient_address")
    private String patientAddress;

    @Column(name = "doctor_name", nullable = false, length = 200)
    private String doctorName;

    @Column(name = "doctor_reg_no", length = 50)
    private String doctorRegNo;

    @Column(name = "quantity_sold", precision = 10, scale = 3)
    private BigDecimal quantitySold;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pharmacist_id")
    private PharmaUser pharmacist;

    @Column(name = "prescription_url")
    private String prescriptionUrl;

    @Column(name = "remarks")
    private String remarks;

    @PrePersist
    public void prePersist() {
        if (saleDate == null) {
            saleDate = LocalDateTime.now();
        }
    }
}
