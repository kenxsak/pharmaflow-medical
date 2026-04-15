package com.pharmaflow.procurement.dto;

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
public class SupplierResponse {

    private UUID supplierId;
    private String name;
    private String contact;
    private String phone;
    private String email;
    private String gstin;
    private String drugLicense;
    private String address;
    private Integer defaultLeadTimeDays;
    private Integer observedLeadTimeDays;
    private Integer effectiveLeadTimeDays;
    private Integer leadTimeSampleCount;
    private Integer lastLeadTimeDays;
    private Integer openPurchaseOrderCount;
    private Integer receivedPurchaseOrderCount;
    private LocalDateTime lastOrderDate;
    private LocalDateTime lastReceiptDate;
    private BigDecimal receivedValue;
}
