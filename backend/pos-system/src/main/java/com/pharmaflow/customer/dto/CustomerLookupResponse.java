package com.pharmaflow.customer.dto;

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
public class CustomerLookupResponse {

    private UUID customerId;
    private String name;
    private String phone;
    private String email;
    private String address;
    private String doctorName;
    private BigDecimal creditLimit;
    private BigDecimal currentBalance;
    private BigDecimal availableCredit;
    private Integer loyaltyPoints;
    private Boolean blocked;
}
