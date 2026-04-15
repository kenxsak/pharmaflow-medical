package com.pharmaflow.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplenishmentInsightResponse {

    private String scopeLevel;
    private String scopeLabel;
    private LocalDate businessDate;
    private int recommendationCount;
    private List<ReplenishmentRecommendationResponse> recommendations;
}
