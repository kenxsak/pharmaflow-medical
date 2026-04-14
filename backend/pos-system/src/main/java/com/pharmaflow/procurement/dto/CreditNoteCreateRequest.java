package com.pharmaflow.procurement.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class CreditNoteCreateRequest {

    private UUID supplierId;
    private UUID originalInvoiceId;
    private String cnNumber;
    private String cnType;
    private String notes;

    @Valid
    @NotEmpty
    private List<CreditNoteItemRequest> items;
}
