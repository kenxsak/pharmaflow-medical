package com.pharmaflow.reports;

import com.pharmaflow.billing.Invoice;
import com.pharmaflow.billing.InvoiceItem;
import com.pharmaflow.billing.InvoiceItemRepository;
import com.pharmaflow.billing.InvoiceRepository;
import com.pharmaflow.inventory.InventoryBatch;
import com.pharmaflow.inventory.InventoryBatchRepository;
import com.pharmaflow.inventory.ExpiryAlertService;
import com.pharmaflow.inventory.dto.ExpiryAlertSummary;
import com.pharmaflow.inventory.dto.ExpiryActionQueueResponse;
import com.pharmaflow.inventory.dto.ShortageItemResponse;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.reports.dto.DailySalesRow;
import com.pharmaflow.reports.dto.ExpiryLossRow;
import com.pharmaflow.reports.dto.GSTR1Row;
import com.pharmaflow.reports.dto.GSTR3BReport;
import com.pharmaflow.reports.dto.MedicinePerformanceRow;
import com.pharmaflow.reports.dto.ProfitReportResponse;
import com.pharmaflow.reports.dto.ProfitReportRow;
import com.pharmaflow.reports.dto.SalesSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final ExpiryAlertService expiryAlertService;

    public List<GSTR1Row> getGstr1(UUID storeId, int month, int year) {
        return findInvoicesForMonth(storeId, month, year)
                .stream()
                .map(invoice -> GSTR1Row.builder()
                        .invoiceNo(invoice.getInvoiceNo())
                        .invoiceDate(invoice.getInvoiceDate())
                        .customerGSTIN("")
                        .taxableValue(invoice.getTaxableAmount())
                        .rate(calculateEffectiveRate(invoice))
                        .cgst(invoice.getCgstAmount())
                        .sgst(invoice.getSgstAmount())
                        .igst(invoice.getIgstAmount())
                        .totalAmount(invoice.getTotalAmount())
                        .build())
                .collect(Collectors.toList());
    }

    public GSTR3BReport getGstr3b(UUID storeId, int month, int year) {
        List<Invoice> invoices = findInvoicesForMonth(storeId, month, year);

        BigDecimal outwardTaxable = invoices.stream()
                .map(Invoice::getTaxableAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cgst = invoices.stream()
                .map(Invoice::getCgstAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal sgst = invoices.stream()
                .map(Invoice::getSgstAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal igst = invoices.stream()
                .map(Invoice::getIgstAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalInvoiceValue = invoices.stream()
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return GSTR3BReport.builder()
                .outwardTaxableValue(outwardTaxable)
                .cgst(cgst)
                .sgst(sgst)
                .igst(igst)
                .totalTax(cgst.add(sgst).add(igst))
                .totalInvoiceValue(totalInvoiceValue)
                .build();
    }

    public ExpiryAlertSummary getExpiryAlerts(UUID storeId) {
        return expiryAlertService.getExpiryAlerts(storeId);
    }

    public ExpiryActionQueueResponse getExpiryActionQueue(UUID storeId, int limit) {
        return expiryAlertService.getExpiryActionQueue(storeId, limit);
    }

    public List<ShortageItemResponse> getShortageReport(UUID storeId) {
        return expiryAlertService.getShortageReport(storeId);
    }

    public SalesSummaryResponse getSalesSummary(UUID storeId, int month, int year) {
        List<Invoice> invoices = findInvoicesForMonth(storeId, month, year);
        BigDecimal totalSales = invoices.stream().map(Invoice::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal creditSales = sumByPaymentMode(invoices, "CREDIT");
        BigDecimal cashSales = sumByPaymentMode(invoices, "CASH");
        BigDecimal upiSales = sumByPaymentMode(invoices, "UPI");
        BigDecimal cardSales = sumByPaymentMode(invoices, "CARD");
        BigDecimal averageBillValue = invoices.isEmpty()
                ? BigDecimal.ZERO
                : totalSales.divide(BigDecimal.valueOf(invoices.size()), 2, RoundingMode.HALF_UP);

        return SalesSummaryResponse.builder()
                .invoiceCount(invoices.size())
                .totalSales(totalSales)
                .creditSales(creditSales)
                .cashSales(cashSales)
                .upiSales(upiSales)
                .cardSales(cardSales)
                .averageBillValue(averageBillValue)
                .build();
    }

    public ProfitReportResponse getProfitReport(UUID storeId, int month, int year) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime start = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime end = yearMonth.plusMonths(1).atDay(1).atStartOfDay();
        List<InvoiceItem> items = invoiceItemRepository.findForStoreBetween(storeId, start, end);

        BigDecimal totalRevenue = items.stream().map(InvoiceItem::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalEstimatedCost = items.stream().map(this::estimatedCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalEstimatedProfit = totalRevenue.subtract(totalEstimatedCost);

        List<ProfitReportRow> byManufacturer = aggregateProfitRows(items,
                item -> item.getMedicine() != null && item.getMedicine().getManufacturer() != null
                        ? item.getMedicine().getManufacturer().getName()
                        : "Unknown Manufacturer");
        List<ProfitReportRow> byCategory = aggregateProfitRows(items,
                item -> item.getMedicine() != null && item.getMedicine().getSaltComposition() != null
                        ? defaultLabel(item.getMedicine().getSaltComposition().getDrugClass(), "Unclassified")
                        : "Unclassified");

        return ProfitReportResponse.builder()
                .totalRevenue(totalRevenue)
                .totalEstimatedCost(totalEstimatedCost)
                .totalEstimatedProfit(totalEstimatedProfit)
                .overallMarginPct(marginPct(totalEstimatedProfit, totalRevenue))
                .byManufacturer(byManufacturer)
                .byCategory(byCategory)
                .build();
    }

    public List<DailySalesRow> getDailySales(UUID storeId, int month, int year) {
        return findInvoicesForMonth(storeId, month, year)
                .stream()
                .collect(Collectors.groupingBy(invoice -> invoice.getInvoiceDate().toLocalDate()))
                .entrySet()
                .stream()
                .map(entry -> DailySalesRow.builder()
                        .saleDate(entry.getKey())
                        .invoiceCount(entry.getValue().size())
                        .totalSales(entry.getValue().stream().map(Invoice::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add))
                        .cashSales(sumByPaymentMode(entry.getValue(), "CASH"))
                        .upiSales(sumByPaymentMode(entry.getValue(), "UPI"))
                        .cardSales(sumByPaymentMode(entry.getValue(), "CARD"))
                        .creditSales(sumByPaymentMode(entry.getValue(), "CREDIT"))
                        .build())
                .sorted(Comparator.comparing(DailySalesRow::getSaleDate))
                .collect(Collectors.toList());
    }

    public List<MedicinePerformanceRow> getTopSellingMedicines(UUID storeId, int month, int year, int limit) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime start = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime end = yearMonth.plusMonths(1).atDay(1).atStartOfDay();
        List<InvoiceItem> items = invoiceItemRepository.findForStoreBetween(storeId, start, end);
        Map<UUID, StockAggregate> stockByMedicine = buildStockAggregateMap(inventoryBatchRepository.findActiveStockForStore(storeId));

        return items.stream()
                .filter(item -> item.getMedicine() != null && item.getMedicine().getMedicineId() != null)
                .collect(Collectors.groupingBy(item -> item.getMedicine().getMedicineId()))
                .values()
                .stream()
                .map(group -> toMedicinePerformanceRow(group, stockByMedicine))
                .filter(this::isKnownMedicineRow)
                .sorted(Comparator
                        .comparing(MedicinePerformanceRow::getSalesValue, Comparator.nullsFirst(BigDecimal::compareTo))
                        .reversed()
                        .thenComparing(MedicinePerformanceRow::getSoldQuantity, Comparator.nullsFirst(BigDecimal::compareTo)).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<MedicinePerformanceRow> getSlowMovingStock(UUID storeId, int month, int year, int limit) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime start = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime end = yearMonth.plusMonths(1).atDay(1).atStartOfDay();
        List<InvoiceItem> items = invoiceItemRepository.findForStoreBetween(storeId, start, end);
        Map<UUID, List<InvoiceItem>> soldItemsByMedicine = items.stream()
                .filter(item -> item.getMedicine() != null && item.getMedicine().getMedicineId() != null)
                .collect(Collectors.groupingBy(item -> item.getMedicine().getMedicineId()));
        Map<UUID, StockAggregate> stockByMedicine = buildStockAggregateMap(inventoryBatchRepository.findActiveStockForStore(storeId));

        List<MedicinePerformanceRow> rows = new ArrayList<>();
        for (StockAggregate stock : stockByMedicine.values()) {
            if (stock.totalStrips <= 0 && stock.totalLoose <= 0) {
                continue;
            }
            List<InvoiceItem> soldGroup = soldItemsByMedicine.getOrDefault(stock.medicine.getMedicineId(), List.of());
            rows.add(toMedicinePerformanceRow(soldGroup, stockByMedicine));
        }

        return rows.stream()
                .filter(this::isKnownMedicineRow)
                .sorted(Comparator
                        .comparing(MedicinePerformanceRow::getSoldQuantity, Comparator.nullsFirst(BigDecimal::compareTo))
                        .thenComparing(MedicinePerformanceRow::getCurrentStockStrips, Comparator.nullsFirst(Integer::compareTo)).reversed()
                        .thenComparing(MedicinePerformanceRow::getCurrentStockLoose, Comparator.nullsFirst(Integer::compareTo)).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<ExpiryLossRow> getExpiryLossReport(UUID storeId, int limit) {
        return inventoryBatchRepository.findExpiredStockForStore(storeId, LocalDate.now())
                .stream()
                .filter(batch -> batch.getMedicine() != null && batch.getMedicine().getMedicineId() != null)
                .collect(Collectors.groupingBy(batch -> batch.getMedicine().getMedicineId()))
                .values()
                .stream()
                .map(this::toExpiryLossRow)
                .sorted(Comparator
                        .comparing(ExpiryLossRow::getEstimatedLossValue, Comparator.nullsFirst(BigDecimal::compareTo))
                        .reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    private List<Invoice> findInvoicesForMonth(UUID storeId, int month, int year) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime start = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime end = yearMonth.plusMonths(1).atDay(1).atStartOfDay();
        return invoiceRepository.findActiveInvoices(storeId, start, end);
    }

    private BigDecimal calculateEffectiveRate(Invoice invoice) {
        if (invoice.getTaxableAmount() == null || BigDecimal.ZERO.compareTo(invoice.getTaxableAmount()) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal totalTax = safe(invoice.getCgstAmount()).add(safe(invoice.getSgstAmount())).add(safe(invoice.getIgstAmount()));
        return totalTax.multiply(BigDecimal.valueOf(100))
                .divide(invoice.getTaxableAmount(), 2, java.math.RoundingMode.HALF_UP);
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal sumByPaymentMode(List<Invoice> invoices, String paymentMode) {
        return invoices.stream()
                .filter(invoice -> paymentMode.equalsIgnoreCase(defaultLabel(invoice.getPaymentMode(), "")))
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<ProfitReportRow> aggregateProfitRows(List<InvoiceItem> items, Function<InvoiceItem, String> classifier) {
        Map<String, List<InvoiceItem>> grouped = items.stream()
                .collect(Collectors.groupingBy(classifier));

        return grouped.entrySet().stream()
                .map(entry -> {
                    BigDecimal revenue = entry.getValue().stream().map(InvoiceItem::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal cost = entry.getValue().stream().map(this::estimatedCost).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal quantity = entry.getValue().stream().map(item -> safe(item.getQuantity())).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal profit = revenue.subtract(cost);
                    return ProfitReportRow.builder()
                            .groupName(entry.getKey())
                            .revenue(revenue)
                            .estimatedCost(cost)
                            .estimatedProfit(profit)
                            .marginPct(marginPct(profit, revenue))
                            .quantity(quantity)
                            .build();
                })
                .sorted(Comparator.comparing(ProfitReportRow::getEstimatedProfit, Comparator.nullsFirst(BigDecimal::compareTo)).reversed())
                .collect(Collectors.toList());
    }

    private BigDecimal estimatedCost(InvoiceItem item) {
        BigDecimal quantity = safe(item.getQuantity());
        BigDecimal purchaseRatePerStrip = item.getPurchaseRateSnapshot() != null
                ? safe(item.getPurchaseRateSnapshot())
                : item.getBatch() != null ? safe(item.getBatch().getPurchaseRate()) : BigDecimal.ZERO;
        int packSize = item.getPackSizeSnapshot() != null && item.getPackSizeSnapshot() > 0
                ? item.getPackSizeSnapshot()
                : item.getMedicine() != null && item.getMedicine().getPackSize() != null && item.getMedicine().getPackSize() > 0
                ? item.getMedicine().getPackSize()
                : 1;

        if ("TABLET".equalsIgnoreCase(defaultLabel(item.getUnitType(), "STRIP"))) {
            return purchaseRatePerStrip
                    .divide(BigDecimal.valueOf(packSize), 4, RoundingMode.HALF_UP)
                    .multiply(quantity)
                    .setScale(2, RoundingMode.HALF_UP);
        }
        return purchaseRatePerStrip.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
    }

    private String defaultLabel(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private BigDecimal marginPct(BigDecimal profit, BigDecimal revenue) {
        if (revenue == null || revenue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return safe(profit)
                .multiply(BigDecimal.valueOf(100))
                .divide(revenue, 2, RoundingMode.HALF_UP);
    }

    private Map<UUID, StockAggregate> buildStockAggregateMap(List<InventoryBatch> batches) {
        return batches.stream()
                .filter(batch -> batch.getMedicine() != null && batch.getMedicine().getMedicineId() != null)
                .collect(Collectors.toMap(
                        batch -> batch.getMedicine().getMedicineId(),
                        this::toStockAggregate,
                        this::mergeStockAggregates
                ));
    }

    private StockAggregate toStockAggregate(InventoryBatch batch) {
        return new StockAggregate(
                batch.getMedicine(),
                batch.getQuantityStrips() == null ? 0 : batch.getQuantityStrips(),
                batch.getQuantityLoose() == null ? 0 : batch.getQuantityLoose()
        );
    }

    private StockAggregate mergeStockAggregates(StockAggregate left, StockAggregate right) {
        return new StockAggregate(
                left.medicine != null ? left.medicine : right.medicine,
                left.totalStrips + right.totalStrips,
                left.totalLoose + right.totalLoose
        );
    }

    private MedicinePerformanceRow toMedicinePerformanceRow(
            List<InvoiceItem> items,
            Map<UUID, StockAggregate> stockByMedicine
    ) {
        Medicine medicine = items.isEmpty() ? null : items.get(0).getMedicine();
        UUID medicineId = medicine != null ? medicine.getMedicineId() : null;
        StockAggregate stock = medicineId != null ? stockByMedicine.get(medicineId) : null;

        if (medicine == null && stock != null) {
            medicine = stock.medicine;
            medicineId = medicine != null ? medicine.getMedicineId() : null;
        }

        BigDecimal soldQuantity = items.stream().map(item -> safe(item.getQuantity())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal salesValue = items.stream().map(item -> safe(item.getTotal())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal estimatedProfit = items.stream()
                .map(item -> safe(item.getTotal()).subtract(estimatedCost(item)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return MedicinePerformanceRow.builder()
                .medicineId(medicineId)
                .brandName(medicine != null ? medicine.getBrandName() : defaultLabel(items.isEmpty() ? null : items.get(0).getMedicineNameSnapshot(), "Unknown Medicine"))
                .genericName(medicine != null ? medicine.getGenericName() : items.isEmpty() ? null : items.get(0).getGenericNameSnapshot())
                .manufacturerName(medicine != null && medicine.getManufacturer() != null
                        ? medicine.getManufacturer().getName()
                        : defaultLabel(items.isEmpty() ? null : items.get(0).getManufacturerNameSnapshot(), "Unknown Manufacturer"))
                .soldQuantity(soldQuantity)
                .salesValue(salesValue)
                .estimatedProfit(estimatedProfit)
                .currentStockStrips(stock != null ? stock.totalStrips : 0)
                .currentStockLoose(stock != null ? stock.totalLoose : 0)
                .velocityLabel(resolveVelocityLabel(soldQuantity))
                .build();
    }

    private String resolveVelocityLabel(BigDecimal soldQuantity) {
        if (soldQuantity == null || soldQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            return "No movement";
        }
        if (soldQuantity.compareTo(BigDecimal.valueOf(5)) <= 0) {
            return "Slow moving";
        }
        if (soldQuantity.compareTo(BigDecimal.valueOf(20)) <= 0) {
            return "Steady";
        }
        return "Fast moving";
    }

    private ExpiryLossRow toExpiryLossRow(List<InventoryBatch> batches) {
        InventoryBatch first = batches.get(0);
        Medicine medicine = first.getMedicine();
        int expiredStrips = batches.stream().mapToInt(batch -> batch.getQuantityStrips() == null ? 0 : batch.getQuantityStrips()).sum();
        int expiredLoose = batches.stream().mapToInt(batch -> batch.getQuantityLoose() == null ? 0 : batch.getQuantityLoose()).sum();
        BigDecimal estimatedLossValue = batches.stream()
                .map(this::estimatedExpiryLoss)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        LocalDate lastExpiryDate = batches.stream()
                .map(InventoryBatch::getExpiryDate)
                .max(LocalDate::compareTo)
                .orElse(null);

        return ExpiryLossRow.builder()
                .medicineId(medicine != null ? medicine.getMedicineId() : null)
                .brandName(medicine != null ? medicine.getBrandName() : "Unknown Medicine")
                .genericName(medicine != null ? medicine.getGenericName() : null)
                .manufacturerName(medicine != null && medicine.getManufacturer() != null
                        ? medicine.getManufacturer().getName()
                        : "Unknown Manufacturer")
                .expiredBatchCount(batches.size())
                .expiredStrips(expiredStrips)
                .expiredLoose(expiredLoose)
                .estimatedLossValue(estimatedLossValue.setScale(2, RoundingMode.HALF_UP))
                .lastExpiryDate(lastExpiryDate)
                .build();
    }

    private boolean isKnownMedicineRow(MedicinePerformanceRow row) {
        return row != null
                && row.getMedicineId() != null
                && row.getBrandName() != null
                && !row.getBrandName().isBlank()
                && !"Unknown Medicine".equalsIgnoreCase(row.getBrandName());
    }

    private BigDecimal estimatedExpiryLoss(InventoryBatch batch) {
        BigDecimal stripsValue = safe(batch.getPurchaseRate())
                .multiply(BigDecimal.valueOf(batch.getQuantityStrips() == null ? 0 : batch.getQuantityStrips()));
        int packSize = batch.getMedicine() != null && batch.getMedicine().getPackSize() != null && batch.getMedicine().getPackSize() > 0
                ? batch.getMedicine().getPackSize()
                : 1;
        BigDecimal looseValue = safe(batch.getPurchaseRate())
                .divide(BigDecimal.valueOf(packSize), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(batch.getQuantityLoose() == null ? 0 : batch.getQuantityLoose()));
        return stripsValue.add(looseValue);
    }

    private static final class StockAggregate {
        private final Medicine medicine;
        private final int totalStrips;
        private final int totalLoose;

        private StockAggregate(Medicine medicine, int totalStrips, int totalLoose) {
            this.medicine = medicine;
            this.totalStrips = totalStrips;
            this.totalLoose = totalLoose;
        }
    }
}
