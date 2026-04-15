package com.pharmaflow.reports;

import com.pharmaflow.inventory.dto.ExpiryAlertSummary;
import com.pharmaflow.inventory.dto.ExpiryActionQueueResponse;
import com.pharmaflow.inventory.dto.ShortageItemResponse;
import com.pharmaflow.reports.dto.DailySalesRow;
import com.pharmaflow.reports.dto.ExpiryLossRow;
import com.pharmaflow.reports.dto.GSTR1Row;
import com.pharmaflow.reports.dto.GSTR3BReport;
import com.pharmaflow.reports.dto.MedicinePerformanceRow;
import com.pharmaflow.reports.dto.OperationsOverviewResponse;
import com.pharmaflow.reports.dto.ProfitReportResponse;
import com.pharmaflow.reports.dto.SalesSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportsController {

    private final GSTReportService gstReportService;
    private final ReportService reportService;
    private final OperationsOverviewService operationsOverviewService;

    @GetMapping("/gstr1")
    public List<GSTR1Row> getGSTR1(
            @RequestParam UUID storeId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return gstReportService.generateGstr1(storeId, month, year);
    }

    @GetMapping("/gstr3b")
    public GSTR3BReport getGSTR3B(
            @RequestParam UUID storeId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return gstReportService.generateGstr3b(storeId, month, year);
    }

    @GetMapping("/gstr-1")
    public List<GSTR1Row> getGSTR1Alias(
            @RequestParam UUID storeId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return gstReportService.generateGstr1(storeId, month, year);
    }

    @GetMapping("/gstr-3b")
    public GSTR3BReport getGSTR3BAlias(
            @RequestParam UUID storeId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return gstReportService.generateGstr3b(storeId, month, year);
    }

    @GetMapping("/expiry-alerts")
    public ExpiryAlertSummary getExpiryAlerts(@RequestParam UUID storeId) {
        return gstReportService.getExpiryAlerts(storeId);
    }

    @GetMapping("/expiry-actions")
    public ExpiryActionQueueResponse getExpiryActionQueue(
            @RequestParam UUID storeId,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return gstReportService.getExpiryActionQueue(storeId, limit);
    }

    @GetMapping("/shortage")
    public List<ShortageItemResponse> getShortageReport(@RequestParam UUID storeId) {
        return gstReportService.getShortageReport(storeId);
    }

    @GetMapping("/sales")
    public SalesSummaryResponse getSalesSummary(
            @RequestParam UUID storeId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return reportService.getSalesSummary(storeId, month, year);
    }

    @GetMapping("/profit")
    public ProfitReportResponse getProfitReport(
            @RequestParam UUID storeId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return reportService.getProfitReport(storeId, month, year);
    }

    @GetMapping("/daily-sales")
    public List<DailySalesRow> getDailySales(
            @RequestParam UUID storeId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return reportService.getDailySales(storeId, month, year);
    }

    @GetMapping("/top-selling")
    public List<MedicinePerformanceRow> getTopSelling(
            @RequestParam UUID storeId,
            @RequestParam int month,
            @RequestParam int year,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return reportService.getTopSellingMedicines(storeId, month, year, limit);
    }

    @GetMapping("/slow-moving")
    public List<MedicinePerformanceRow> getSlowMoving(
            @RequestParam UUID storeId,
            @RequestParam int month,
            @RequestParam int year,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return reportService.getSlowMovingStock(storeId, month, year, limit);
    }

    @GetMapping("/expiry-loss")
    public List<ExpiryLossRow> getExpiryLoss(
            @RequestParam UUID storeId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return reportService.getExpiryLossReport(storeId, limit);
    }

    @GetMapping("/operations-overview")
    public OperationsOverviewResponse getOperationsOverview(
            @RequestParam int month,
            @RequestParam int year
    ) {
        return operationsOverviewService.getOverview(month, year);
    }
}
