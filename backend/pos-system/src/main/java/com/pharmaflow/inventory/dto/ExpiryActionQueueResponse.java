package com.pharmaflow.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpiryActionQueueResponse {

    private Integer recommendationCount;
    private Integer immediateActionCount;
    private Integer quarantineCandidateCount;
    private BigDecimal rtvCandidateValue;
    private BigDecimal dumpCandidateValue;
    private List<ExpiryActionRecommendationResponse> recommendations;
}
