package com.pharmaflow.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryDriverResponse {

    private UUID userId;
    private String fullName;
    private String phone;
    private String email;
    private String storeCode;
}
