package com.pharmaflow.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesReturnResponse {

    private UUID returnId;
    private String returnNumber;
    private UUID invoiceId;
    private String invoiceNo;
    private String settlementType;
    private String status;
    private BigDecimal totalAmount;
    private String notes;
    private String createdByName;
    private LocalDateTime createdAt;
    private List<SalesReturnItemResponse> items;
}
