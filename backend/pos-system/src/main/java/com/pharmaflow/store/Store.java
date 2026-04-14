package com.pharmaflow.store;

import com.pharmaflow.tenant.Tenant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
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
@Table(name = "stores")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "store_id")
    private UUID storeId;

    @ManyToOne
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @Column(name = "store_code", nullable = false, unique = true, length = 20)
    private String storeCode;

    @Column(name = "store_name", nullable = false, length = 200)
    private String storeName;

    @Column(name = "store_type", nullable = false, length = 20)
    private String storeType;

    @Column(name = "address")
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "pincode", length = 10)
    private String pincode;

    @Column(name = "phone", length = 15)
    private String phone;

    @Column(name = "email", length = 200)
    private String email;

    @Column(name = "gstin", length = 20)
    private String gstin;

    @Column(name = "drug_license_no", length = 50)
    private String drugLicenseNo;

    @Column(name = "license_expiry")
    private java.time.LocalDate licenseExpiry;

    @Column(name = "is_24hr")
    private Boolean is24Hr;

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
        if (state == null || state.isBlank()) {
            state = "Tamil Nadu";
        }
    }
}
