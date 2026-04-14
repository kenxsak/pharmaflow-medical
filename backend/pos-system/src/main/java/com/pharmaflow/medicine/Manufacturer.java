package com.pharmaflow.medicine;

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
import javax.persistence.PrePersist;
import javax.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "manufacturers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Manufacturer {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "manufacturer_id")
    private UUID manufacturerId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "short_code", length = 20)
    private String shortCode;

    @Column(name = "address")
    private String address;

    @Column(name = "gstin", length = 20)
    private String gstin;

    @Column(name = "is_active")
    private Boolean isActive;

    @PrePersist
    public void prePersist() {
        if (isActive == null) {
            isActive = true;
        }
    }
}
