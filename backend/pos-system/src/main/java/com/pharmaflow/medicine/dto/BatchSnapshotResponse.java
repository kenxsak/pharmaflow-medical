package com.pharmaflow.medicine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchSnapshotResponse {

    private UUID batchId;
    private String batchNumber;
    private LocalDate expiryDate;
    private Integer quantityStrips;
    private Integer quantityLoose;
    private String expiryStatus;
}
