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
public class CreditNoteResponse {

    private UUID creditNoteId;
    private String cnNumber;
    private String cnType;
    private String status;
    private String claimState;
    private UUID supplierId;
    private UUID originalInvoiceId;
    private BigDecimal totalAmount;
    private BigDecimal claimAmount;
    private BigDecimal settledAmount;
    private String notes;
    private LocalDateTime dispatchedAt;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime resolvedAt;
    private String resolutionNotes;
    private LocalDateTime createdAt;
}
