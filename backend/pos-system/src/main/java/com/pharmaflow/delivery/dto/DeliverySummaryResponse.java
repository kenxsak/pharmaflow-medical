package com.pharmaflow.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliverySummaryResponse {

    private long total;
    private long pending;
    private long assigned;
    private long outForDelivery;
    private long delivered;
}
