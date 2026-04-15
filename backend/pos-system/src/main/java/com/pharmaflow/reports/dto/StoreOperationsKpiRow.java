package com.pharmaflow.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreOperationsKpiRow {

    private UUID storeId;
    private String storeCode;
    private String storeName;
    private String storeType;
    private UUID tenantId;
    private String tenantName;
    private String city;
    private String state;
    private BigDecimal todaySales;
    private BigDecimal monthSales;
    private long monthInvoiceCount;
    private int lowStockSkuCount;
    private int expiring30BatchCount;
    private BigDecimal stockValue;
    private BigDecimal nearExpiryValue;
    private int pendingTransferIn;
    private int pendingTransferOut;
}
