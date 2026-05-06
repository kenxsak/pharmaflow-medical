package com.pharmaflow.delivery.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class DeliveryStatusUpdateRequest {

    @NotBlank
    private String status;

    private UUID deliveryBoyId;
    private BigDecimal amountCollected;

    @Size(max = 20)
    private String paymentMode;

    @Size(max = 255)
    private String notes;
}
