package com.pharmaflow.reports;

import com.pharmaflow.inventory.dto.ExpiryAlertSummary;
import com.pharmaflow.inventory.dto.ExpiryActionQueueResponse;
import com.pharmaflow.inventory.dto.ShortageItemResponse;
import com.pharmaflow.reports.dto.GSTR1Row;
import com.pharmaflow.reports.dto.GSTR3BReport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GSTReportService {

    private final ReportService reportService;

    public List<GSTR1Row> generateGstr1(UUID storeId, int month, int year) {
        return reportService.getGstr1(storeId, month, year);
    }

    public GSTR3BReport generateGstr3b(UUID storeId, int month, int year) {
        return reportService.getGstr3b(storeId, month, year);
    }

    public ExpiryAlertSummary getExpiryAlerts(UUID storeId) {
        return reportService.getExpiryAlerts(storeId);
    }

    public ExpiryActionQueueResponse getExpiryActionQueue(UUID storeId, int limit) {
        return reportService.getExpiryActionQueue(storeId, limit);
    }

    public List<ShortageItemResponse> getShortageReport(UUID storeId) {
        return reportService.getShortageReport(storeId);
    }
}
