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
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "salt_compositions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaltComposition {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "salt_id")
    private UUID saltId;

    @Column(name = "salt_name", nullable = false, length = 300)
    private String saltName;

    @Column(name = "generic_name", length = 300)
    private String genericName;

    @Column(name = "drug_class", length = 200)
    private String drugClass;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
