package com.pharmaflow.billing.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import java.util.List;

@Getter
@Setter
public class SalesReturnCreateRequest {

    private String settlementType;

    private String notes;

    @Valid
    @NotEmpty
    private List<SalesReturnItemRequest> items;
}
