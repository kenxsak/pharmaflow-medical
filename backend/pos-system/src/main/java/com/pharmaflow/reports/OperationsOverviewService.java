package com.pharmaflow.reports;

import com.pharmaflow.auth.CurrentPharmaUserService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.billing.Invoice;
import com.pharmaflow.billing.InvoiceRepository;
import com.pharmaflow.inventory.InventoryBatch;
import com.pharmaflow.inventory.InventoryBatchRepository;
import com.pharmaflow.inventory.StockTransfer;
import com.pharmaflow.inventory.StockTransferRepository;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.reports.dto.OperationsOverviewResponse;
import com.pharmaflow.reports.dto.StoreOperationsKpiRow;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreService;
import com.pharmaflow.tenant.Tenant;
import com.pharmaflow.tenant.TenantAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OperationsOverviewService {

    private final InvoiceRepository invoiceRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final StockTransferRepository stockTransferRepository;
    private final CurrentPharmaUserService currentPharmaUserService;
    private final StoreService storeService;
    private final TenantAccessService tenantAccessService;

    public OperationsOverviewResponse getOverview(int month, int year) {
        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();
        List<Store> stores = storeService.getAccessibleStoresForUser(currentUser);
        LocalDate today = LocalDate.now();

        if (stores.isEmpty()) {
            return OperationsOverviewResponse.builder()
                    .scopeLevel(resolveScopeLevel(currentUser))
                    .scopeLabel(resolveScopeLabel(currentUser))
                    .businessDate(today)
                    .month(month)
                    .year(year)
                    .stores(List.of())
                    .totalSalesMonth(BigDecimal.ZERO)
                    .totalSalesToday(BigDecimal.ZERO)
                    .stockValue(BigDecimal.ZERO)
                    .nearExpiryValue(BigDecimal.ZERO)
                    .build();
        }

        List<UUID> storeIds = stores.stream()
                .map(Store::getStoreId)
                .collect(Collectors.toList());
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime monthStart = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime monthEnd = yearMonth.plusMonths(1).atDay(1).atStartOfDay();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.plusDays(1).atStartOfDay();

        List<Invoice> monthInvoices = invoiceRepository.findActiveInvoicesForStores(storeIds, monthStart, monthEnd);
        List<Invoice> todayInvoices = invoiceRepository.findActiveInvoicesForStores(storeIds, dayStart, dayEnd);
        List<InventoryBatch> activeBatches = inventoryBatchRepository.findActiveStockForStores(storeIds);
        List<StockTransfer> pendingTransfers = stockTransferRepository.findByStoreIds(storeIds, "PENDING");

        Map<UUID, StoreAccumulator> storeAccumulators = new LinkedHashMap<>();
        for (Store store : stores) {
            storeAccumulators.put(store.getStoreId(), new StoreAccumulator(store));
        }

        for (Invoice invoice : monthInvoices) {
            if (invoice.getStore() == null || invoice.getStore().getStoreId() == null) {
                continue;
            }
            StoreAccumulator accumulator = storeAccumulators.get(invoice.getStore().getStoreId());
            if (accumulator == null) {
                continue;
            }
            accumulator.monthSales = accumulator.monthSales.add(safe(invoice.getTotalAmount()));
            accumulator.monthInvoiceCount++;
        }

        for (Invoice invoice : todayInvoices) {
            if (invoice.getStore() == null || invoice.getStore().getStoreId() == null) {
                continue;
            }
            StoreAccumulator accumulator = storeAccumulators.get(invoice.getStore().getStoreId());
            if (accumulator == null) {
                continue;
            }
            accumulator.todaySales = accumulator.todaySales.add(safe(invoice.getTotalAmount()));
        }

        for (StockTransfer transfer : pendingTransfers) {
            if (transfer.getFromStore() != null && transfer.getFromStore().getStoreId() != null) {
                StoreAccumulator fromAccumulator = storeAccumulators.get(transfer.getFromStore().getStoreId());
                if (fromAccumulator != null) {
                    fromAccumulator.pendingTransferOut++;
                }
            }
            if (transfer.getToStore() != null && transfer.getToStore().getStoreId() != null) {
                StoreAccumulator toAccumulator = storeAccumulators.get(transfer.getToStore().getStoreId());
                if (toAccumulator != null) {
                    toAccumulator.pendingTransferIn++;
                }
            }
        }

        for (InventoryBatch batch : activeBatches) {
            if (batch.getStore() == null || batch.getStore().getStoreId() == null) {
                continue;
            }
            StoreAccumulator accumulator = storeAccumulators.get(batch.getStore().getStoreId());
            if (accumulator == null) {
                continue;
            }

            BigDecimal batchValue = estimateInventoryValue(batch);
            accumulator.stockValue = accumulator.stockValue.add(batchValue);

            if (isWithinDays(batch, today, 30)) {
                accumulator.expiring30BatchCount++;
                accumulator.nearExpiryValue = accumulator.nearExpiryValue.add(batchValue);
            }

            if (!isSellable(batch, today) || batch.getMedicine() == null || batch.getMedicine().getMedicineId() == null) {
                continue;
            }

            MedicineStockAccumulator medicineAccumulator = accumulator.stockByMedicine.computeIfAbsent(
                    batch.getMedicine().getMedicineId(),
                    medicineId -> new MedicineStockAccumulator(batch.getMedicine())
            );
            medicineAccumulator.totalStrips += safe(batch.getQuantityStrips());
        }

        List<StoreOperationsKpiRow> rows = new ArrayList<>();
        for (StoreAccumulator accumulator : storeAccumulators.values()) {
            accumulator.lowStockSkuCount = (int) accumulator.stockByMedicine.values()
                    .stream()
                    .filter(this::isBelowReorderLevel)
                    .count();

            rows.add(StoreOperationsKpiRow.builder()
                    .storeId(accumulator.store.getStoreId())
                    .storeCode(accumulator.store.getStoreCode())
                    .storeName(accumulator.store.getStoreName())
                    .storeType(accumulator.store.getStoreType())
                    .tenantId(accumulator.store.getTenant() != null ? accumulator.store.getTenant().getTenantId() : null)
                    .tenantName(accumulator.store.getTenant() != null ? accumulator.store.getTenant().getBrandName() : null)
                    .city(accumulator.store.getCity())
                    .state(accumulator.store.getState())
                    .todaySales(scale(accumulator.todaySales))
                    .monthSales(scale(accumulator.monthSales))
                    .monthInvoiceCount(accumulator.monthInvoiceCount)
                    .lowStockSkuCount(accumulator.lowStockSkuCount)
                    .expiring30BatchCount(accumulator.expiring30BatchCount)
                    .stockValue(scale(accumulator.stockValue))
                    .nearExpiryValue(scale(accumulator.nearExpiryValue))
                    .pendingTransferIn(accumulator.pendingTransferIn)
                    .pendingTransferOut(accumulator.pendingTransferOut)
                    .build());
        }

        rows.sort(Comparator
                .comparing(StoreOperationsKpiRow::getStoreType, Comparator.nullsLast(String::compareToIgnoreCase))
                .thenComparing(StoreOperationsKpiRow::getStoreName, Comparator.nullsLast(String::compareToIgnoreCase)));

        return OperationsOverviewResponse.builder()
                .scopeLevel(resolveScopeLevel(currentUser))
                .scopeLabel(resolveScopeLabel(currentUser))
                .businessDate(today)
                .month(month)
                .year(year)
                .storeCount(stores.size())
                .retailStoreCount(countStoreType(stores, "STORE"))
                .warehouseCount(countStoreType(stores, "WAREHOUSE"))
                .headOfficeCount(countStoreType(stores, "HO"))
                .totalSalesMonth(scale(rows.stream().map(StoreOperationsKpiRow::getMonthSales).reduce(BigDecimal.ZERO, BigDecimal::add)))
                .totalSalesToday(scale(rows.stream().map(StoreOperationsKpiRow::getTodaySales).reduce(BigDecimal.ZERO, BigDecimal::add)))
                .totalInvoiceCountMonth(rows.stream().mapToLong(StoreOperationsKpiRow::getMonthInvoiceCount).sum())
                .lowStockSkuCount(rows.stream().mapToInt(StoreOperationsKpiRow::getLowStockSkuCount).sum())
                .expiring30BatchCount(rows.stream().mapToInt(StoreOperationsKpiRow::getExpiring30BatchCount).sum())
                .stockValue(scale(rows.stream().map(StoreOperationsKpiRow::getStockValue).reduce(BigDecimal.ZERO, BigDecimal::add)))
                .nearExpiryValue(scale(rows.stream().map(StoreOperationsKpiRow::getNearExpiryValue).reduce(BigDecimal.ZERO, BigDecimal::add)))
                .pendingTransferCount(pendingTransfers.size())
                .stores(rows)
                .build();
    }

    private boolean isSellable(InventoryBatch batch, LocalDate today) {
        return batch.getExpiryDate() != null
                && batch.getExpiryDate().isAfter(today)
                && safe(batch.getQuantityStrips()) > 0;
    }

    private boolean isWithinDays(InventoryBatch batch, LocalDate today, int days) {
        return batch.getExpiryDate() != null
                && !batch.getExpiryDate().isBefore(today)
                && batch.getExpiryDate().isBefore(today.plusDays(days));
    }

    private boolean isBelowReorderLevel(MedicineStockAccumulator accumulator) {
        int reorderLevel = accumulator.medicine != null && accumulator.medicine.getReorderLevel() != null
                ? accumulator.medicine.getReorderLevel()
                : 0;
        return accumulator.totalStrips < reorderLevel;
    }

    private BigDecimal estimateInventoryValue(InventoryBatch batch) {
        BigDecimal stripValue = safe(batch.getPurchaseRate())
                .multiply(BigDecimal.valueOf(safe(batch.getQuantityStrips())));
        int packSize = batch.getMedicine() != null
                && batch.getMedicine().getPackSize() != null
                && batch.getMedicine().getPackSize() > 0
                ? batch.getMedicine().getPackSize()
                : 1;
        BigDecimal looseValue = safe(batch.getPurchaseRate())
                .divide(BigDecimal.valueOf(packSize), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(safe(batch.getQuantityLoose())));
        return stripValue.add(looseValue);
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private BigDecimal scale(BigDecimal value) {
        return safe(value).setScale(2, RoundingMode.HALF_UP);
    }

    private int countStoreType(List<Store> stores, String storeType) {
        return (int) stores.stream()
                .filter(store -> storeType.equalsIgnoreCase(store.getStoreType()))
                .count();
    }

    private String resolveScopeLevel(PharmaUser currentUser) {
        if (currentUser.isPlatformOwner()) {
            return "SAAS_ADMIN";
        }
        if (storeService.hasTenantWideAccess(currentUser)) {
            return "COMPANY";
        }
        return "STORE";
    }

    private String resolveScopeLabel(PharmaUser currentUser) {
        if (currentUser.isPlatformOwner()) {
            return "All tenants and stores";
        }
        if (storeService.hasTenantWideAccess(currentUser)) {
            Tenant tenant = tenantAccessService.resolveTenantForUser(currentUser);
            return tenant.getBrandName() + " company operations";
        }
        if (currentUser.getStore() != null) {
            return currentUser.getStore().getStoreName();
        }
        return currentUser.getFullName();
    }

    private static final class StoreAccumulator {
        private final Store store;
        private BigDecimal todaySales = BigDecimal.ZERO;
        private BigDecimal monthSales = BigDecimal.ZERO;
        private long monthInvoiceCount = 0;
        private int lowStockSkuCount = 0;
        private int expiring30BatchCount = 0;
        private BigDecimal stockValue = BigDecimal.ZERO;
        private BigDecimal nearExpiryValue = BigDecimal.ZERO;
        private int pendingTransferIn = 0;
        private int pendingTransferOut = 0;
        private final Map<UUID, MedicineStockAccumulator> stockByMedicine = new LinkedHashMap<>();

        private StoreAccumulator(Store store) {
            this.store = store;
        }
    }

    private static final class MedicineStockAccumulator {
        private final Medicine medicine;
        private int totalStrips = 0;

        private MedicineStockAccumulator(Medicine medicine) {
            this.medicine = medicine;
        }
    }
}
