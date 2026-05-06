package com.pharmaflow.delivery.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class DeliveryOrderRequest {

    private UUID invoiceId;
    private UUID customerId;
    private UUID deliveryBoyId;

    @NotBlank
    @Size(max = 255)
    private String deliveryAddress;

    @Size(max = 15)
    private String deliveryPhone;

    private BigDecimal amountToCollect;

    @Size(max = 20)
    private String paymentMode;

    @Size(max = 255)
    private String notes;
}
