package com.pharmaflow.tenant.dto;

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
public class PlatformFeatureResponse {

    private int id;
    private String code;
    private String title;
    private String group;
    private String priority;
    private String summary;
}
