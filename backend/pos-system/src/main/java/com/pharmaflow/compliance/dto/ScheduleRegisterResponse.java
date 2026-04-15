package com.pharmaflow.compliance.dto;

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
public class ScheduleRegisterResponse {

    private UUID registerId;
    private UUID invoiceId;
    private UUID medicineId;
    private String medicineName;
    private String scheduleType;
    private LocalDateTime saleDate;
    private String patientName;
    private Integer patientAge;
    private String patientAddress;
    private String doctorName;
    private String doctorRegNo;
    private BigDecimal quantitySold;
    private String batchNumber;
    private UUID pharmacistId;
    private String pharmacistName;
    private String prescriptionUrl;
    private String remarks;
}
