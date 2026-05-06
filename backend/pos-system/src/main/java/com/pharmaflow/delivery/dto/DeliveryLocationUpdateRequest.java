package com.pharmaflow.delivery.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Setter
public class DeliveryLocationUpdateRequest {

    @NotNull
    private BigDecimal latitude;

    @NotNull
    private BigDecimal longitude;

    private String locationLabel;
}
