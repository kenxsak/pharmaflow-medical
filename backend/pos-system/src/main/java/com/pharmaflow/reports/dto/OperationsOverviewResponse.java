package com.pharmaflow.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationsOverviewResponse {

    private String scopeLevel;
    private String scopeLabel;
    private LocalDate businessDate;
    private int month;
    private int year;
    private int storeCount;
    private int retailStoreCount;
    private int warehouseCount;
    private int headOfficeCount;
    private BigDecimal totalSalesMonth;
    private BigDecimal totalSalesToday;
    private long totalInvoiceCountMonth;
    private int lowStockSkuCount;
    private int expiring30BatchCount;
    private BigDecimal stockValue;
    private BigDecimal nearExpiryValue;
    private int pendingTransferCount;
    private int pendingReceiptCount;
    private int pendingRtvCount;
    private int unresolvedCreditNoteCount;
    private BigDecimal unresolvedCreditNoteValue;
    private List<StoreOperationsKpiRow> stores;
}
