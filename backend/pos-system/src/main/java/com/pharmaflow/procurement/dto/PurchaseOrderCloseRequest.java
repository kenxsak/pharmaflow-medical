package com.pharmaflow.procurement.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PurchaseOrderCloseRequest {

    private String reason;
    private String notes;
}
