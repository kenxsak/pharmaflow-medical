package com.pharmaflow.customer.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import java.math.BigDecimal;

@Getter
@Setter
public class CustomerCreateRequest {

    @NotBlank
    private String name;

    private String phone;
    private String email;
    private String address;
    private String doctorName;
    private BigDecimal creditLimit;
}
