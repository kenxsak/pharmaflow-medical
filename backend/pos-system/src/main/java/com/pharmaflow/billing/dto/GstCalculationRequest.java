package com.pharmaflow.billing.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import java.util.List;

@Getter
@Setter
public class GstCalculationRequest {

    @Valid
    @NotEmpty
    private List<BillingItemRequest> items;

    private String customerState;
}
