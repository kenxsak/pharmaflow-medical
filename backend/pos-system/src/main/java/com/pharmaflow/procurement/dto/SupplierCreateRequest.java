package com.pharmaflow.procurement.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;

@Getter
@Setter
public class SupplierCreateRequest {

    @NotBlank
    private String name;

    private String contact;
    private String phone;
    private String email;
    private String gstin;
    private String drugLicense;
    private String address;
    private Integer defaultLeadTimeDays;
}
