package com.pharmaflow.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientHistoryResponse {

    private UUID historyId;
    private UUID customerId;
    private UUID medicineId;
    private String medicineName;
    private UUID invoiceId;
    private String doctorName;
    private String doctorRegNo;
    private String prescriptionUrl;
    private BigDecimal quantity;
    private String notes;
    private LocalDateTime createdAt;
}
