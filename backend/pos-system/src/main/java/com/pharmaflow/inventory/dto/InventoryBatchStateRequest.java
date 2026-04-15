package com.pharmaflow.inventory.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;

@Getter
@Setter
public class InventoryBatchStateRequest {

    @NotBlank
    private String reasonCode;

    private String notes;
}
