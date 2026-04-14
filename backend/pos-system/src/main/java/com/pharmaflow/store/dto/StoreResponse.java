package com.pharmaflow.store.dto;

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
public class StoreResponse {

    private UUID storeId;
    private String storeCode;
    private String storeName;
    private String storeType;
    private UUID tenantId;
    private String tenantSlug;
    private String tenantName;
    private String city;
    private String state;
    private String gstin;
}
