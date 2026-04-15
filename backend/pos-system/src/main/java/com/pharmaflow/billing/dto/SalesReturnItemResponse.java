package com.pharmaflow.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesReturnItemResponse {

    private UUID returnItemId;
    private UUID invoiceItemId;
    private UUID medicineId;
    private String medicineName;
    private UUID batchId;
    private String batchNumber;
    private BigDecimal quantity;
    private String unitType;
    private BigDecimal lineTotal;
    private String reason;
}
