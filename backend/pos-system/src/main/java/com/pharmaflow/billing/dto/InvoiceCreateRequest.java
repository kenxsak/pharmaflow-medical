package com.pharmaflow.billing.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class InvoiceCreateRequest {

    private UUID customerId;

    @Valid
    @NotEmpty
    private List<BillingItemRequest> items;

    @NotNull
    private String paymentMode;

    private String prescriptionUrl;
    private String doctorName;
    private String doctorRegNo;
    private String patientName;
    private Integer patientAge;
    private String patientAddress;
    private String customerState;
}
