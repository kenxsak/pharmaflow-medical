package com.pharmaflow.billing;

import com.pharmaflow.audit.AuditLogService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.auth.PharmaUserRepository;
import com.pharmaflow.billing.dto.BillingItemRequest;
import com.pharmaflow.billing.dto.GstCalculationRequest;
import com.pharmaflow.billing.dto.GstCalculationResponse;
import com.pharmaflow.billing.dto.GstLineItemResponse;
import com.pharmaflow.billing.dto.InvoiceCreateRequest;
import com.pharmaflow.billing.dto.InvoiceHistoryItemResponse;
import com.pharmaflow.billing.dto.InvoiceItemResponse;
import com.pharmaflow.billing.dto.InvoiceResponse;
import com.pharmaflow.billing.dto.SalesReturnCreateRequest;
import com.pharmaflow.billing.dto.SalesReturnItemRequest;
import com.pharmaflow.billing.dto.SalesReturnItemResponse;
import com.pharmaflow.billing.dto.SalesReturnResponse;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.common.ForbiddenActionException;
import com.pharmaflow.compliance.ScheduleHComplianceService;
import com.pharmaflow.customer.Customer;
import com.pharmaflow.customer.CustomerRepository;
import com.pharmaflow.customer.PatientPrescription;
import com.pharmaflow.customer.PatientPrescriptionRepository;
import com.pharmaflow.inventory.InventoryBatch;
import com.pharmaflow.inventory.InventoryBatchRepository;
import com.pharmaflow.inventory.InventoryMovementService;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.medicine.MedicineRepository;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import com.pharmaflow.tenant.TenantRequestContext;
import com.pharmaflow.tenant.TenantRequestContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final StoreRepository storeRepository;
    private final CustomerRepository customerRepository;
    private final MedicineRepository medicineRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final GSTCalculationService gstCalculationService;
    private final ScheduleHComplianceService scheduleHComplianceService;
    private final PharmaUserRepository pharmaUserRepository;
    private final AuditLogService auditLogService;
    private final PatientPrescriptionRepository patientPrescriptionRepository;
    private final SalesReturnRepository salesReturnRepository;
    private final SalesReturnItemRepository salesReturnItemRepository;
    private final InventoryMovementService inventoryMovementService;

    @Value("${pharmaflow.invoice.prefix:TN}")
    private String invoicePrefix;

    @Value("${pharmaflow.gst.state-name:Tamil Nadu}")
    private String defaultCustomerState;

    public GstCalculationResponse calculateGST(UUID storeId, GstCalculationRequest request) {
        PharmaUser currentUser = getCurrentPharmaUser();
        List<GstLineItemResponse> itemResponses = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal taxableAmount = BigDecimal.ZERO;
        BigDecimal cgst = BigDecimal.ZERO;
        BigDecimal sgst = BigDecimal.ZERO;
        BigDecimal igst = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (BillingItemRequest item : request.getItems()) {
            Medicine medicine = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new IllegalArgumentException("Medicine not found"));
            List<BatchAllocationPlan> allocations = planBatchAllocations(
                    currentUser,
                    storeId,
                    item,
                    medicine,
                    request.getCustomerState(),
                    false
            );

            for (BatchAllocationPlan allocation : allocations) {
                subtotal = subtotal.add(allocation.lineMrp());
                discountAmount = discountAmount.add(allocation.breakdown().getDiscountAmount());
                taxableAmount = taxableAmount.add(allocation.breakdown().getTaxableAmount());
                cgst = cgst.add(allocation.breakdown().getCgst());
                sgst = sgst.add(allocation.breakdown().getSgst());
                igst = igst.add(allocation.breakdown().getIgst());
                totalAmount = totalAmount.add(allocation.breakdown().getTotalAmount());

                itemResponses.add(
                        GstLineItemResponse.builder()
                                .medicineId(item.getMedicineId())
                                .batchId(allocation.batch().getBatchId())
                                .quantity(allocation.quantity())
                                .discountAmount(allocation.breakdown().getDiscountAmount())
                                .taxableAmount(allocation.breakdown().getTaxableAmount())
                                .cgst(allocation.breakdown().getCgst())
                                .sgst(allocation.breakdown().getSgst())
                                .igst(allocation.breakdown().getIgst())
                                .totalAmount(allocation.breakdown().getTotalAmount())
                                .build()
                );
            }
        }

        return GstCalculationResponse.builder()
                .items(itemResponses)
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .taxableAmount(taxableAmount)
                .cgst(cgst)
                .sgst(sgst)
                .igst(igst)
                .totalAmount(totalAmount)
                .build();
    }

    @Transactional
    public InvoiceResponse createInvoice(UUID storeId, InvoiceCreateRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("At least one item is required");
        }

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found"));
        Customer customer = request.getCustomerId() != null
                ? customerRepository.findById(request.getCustomerId()).orElse(null)
                : null;
        PharmaUser currentUser = getCurrentPharmaUser();
        if (currentUser == null) {
            throw new ForbiddenActionException("Authenticated PharmaFlow user is required for billing");
        }

        LocalDateTime now = LocalDateTime.now();
        Invoice invoice = Invoice.builder()
                .invoiceNo(generateInvoiceNo(store, now.toLocalDate()))
                .store(store)
                .customer(customer)
                .billedBy(currentUser)
                .invoiceDate(now)
                .paymentMode(request.getPaymentMode())
                .prescriptionUrl(request.getPrescriptionUrl())
                .doctorName(request.getDoctorName())
                .prescriptionAttached(request.getPrescriptionUrl() != null && !request.getPrescriptionUrl().isBlank())
                .build();
        invoice = invoiceRepository.save(invoice);

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal taxableAmount = BigDecimal.ZERO;
        BigDecimal cgst = BigDecimal.ZERO;
        BigDecimal sgst = BigDecimal.ZERO;
        BigDecimal igst = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;

        List<InvoiceItemResponse> itemResponses = new ArrayList<>();

        for (BillingItemRequest itemRequest : request.getItems()) {
            Medicine medicine = medicineRepository.findById(itemRequest.getMedicineId())
                    .orElseThrow(() -> new IllegalArgumentException("Medicine not found"));
            List<BatchAllocationPlan> allocations = planBatchAllocations(
                    currentUser,
                    storeId,
                    itemRequest,
                    medicine,
                    request.getCustomerState(),
                    true
            );

            for (BatchAllocationPlan allocation : allocations) {
                InventoryBatch batch = allocation.batch();
                inventoryMovementService.applyQuantity(
                        batch.getBatchId(),
                        allocation.quantity().negate(),
                        itemRequest.getUnitType(),
                        "SALE",
                        "POS_BILLING",
                        "INVOICE",
                        invoice.getInvoiceId().toString(),
                        "Invoice " + invoice.getInvoiceNo(),
                        currentUser
                );

                InvoiceItem savedItem = invoiceItemRepository.save(
                        InvoiceItem.builder()
                                .invoice(invoice)
                                .medicine(medicine)
                                .batch(batch)
                                .quantity(allocation.quantity())
                                .unitType(itemRequest.getUnitType())
                                .mrp(resolvePackMrp(itemRequest, medicine, batch))
                                .medicineNameSnapshot(medicine.getBrandName())
                                .genericNameSnapshot(medicine.getGenericName())
                                .manufacturerNameSnapshot(medicine.getManufacturer() != null ? medicine.getManufacturer().getName() : null)
                                .hsnCodeSnapshot(medicine.getHsnCode())
                                .scheduleTypeSnapshot(medicine.getScheduleType())
                                .batchNumberSnapshot(batch.getBatchNumber())
                                .expiryDateSnapshot(batch.getExpiryDate())
                                .purchaseRateSnapshot(batch.getPurchaseRate())
                                .packSizeSnapshot(medicine.getPackSize())
                                .discountPct(safe(itemRequest.getDiscountPercent()))
                                .taxableAmount(allocation.breakdown().getTaxableAmount())
                                .gstRate(allocation.gstRate())
                                .cgst(allocation.breakdown().getCgst())
                                .sgst(allocation.breakdown().getSgst())
                                .igst(allocation.breakdown().getIgst())
                                .total(allocation.breakdown().getTotalAmount())
                                .build()
                );

                if (scheduleHComplianceService.requiresComplianceRecord(medicine.getScheduleType())) {
                    scheduleHComplianceService.recordScheduleSale(
                            store,
                            invoice,
                            medicine,
                            medicine.getScheduleType(),
                            resolvePatientName(request, customer),
                            request.getPatientAge(),
                            request.getPatientAddress(),
                            resolveDoctorName(request, customer),
                            request.getDoctorRegNo(),
                            allocation.quantity(),
                            batch.getBatchNumber(),
                            currentUser,
                            request.getPrescriptionUrl()
                    );
                }

                recordPatientHistory(customer, invoice, medicine, allocation.quantity(), request);

                subtotal = subtotal.add(allocation.lineMrp());
                discountAmount = discountAmount.add(allocation.breakdown().getDiscountAmount());
                taxableAmount = taxableAmount.add(allocation.breakdown().getTaxableAmount());
                cgst = cgst.add(allocation.breakdown().getCgst());
                sgst = sgst.add(allocation.breakdown().getSgst());
                igst = igst.add(allocation.breakdown().getIgst());
                totalAmount = totalAmount.add(allocation.breakdown().getTotalAmount());

                itemResponses.add(toInvoiceItemResponse(savedItem));

                if (itemRequest.getMrp() != null && batch.getMrp() != null && itemRequest.getMrp().compareTo(batch.getMrp()) != 0) {
                    auditLogService.log(
                            store,
                            currentUser,
                            "PRICE_OVERRIDE",
                            "INVOICE_ITEM",
                            savedItem.getItemId().toString(),
                            "{\"batchMrp\":\"" + batch.getMrp() + "\"}",
                            "{\"invoiceMrp\":\"" + itemRequest.getMrp() + "\"}"
                    );
                }
            }
        }

        validateCreditLimit(customer, request.getPaymentMode(), totalAmount);
        if ("CREDIT".equalsIgnoreCase(request.getPaymentMode())) {
            customer.setCurrentBalance(safe(customer.getCurrentBalance()).add(totalAmount));
            customerRepository.save(customer);
        }

        invoice.setSubtotal(subtotal);
        invoice.setDiscountAmount(discountAmount);
        invoice.setTaxableAmount(taxableAmount);
        invoice.setCgstAmount(cgst);
        invoice.setSgstAmount(sgst);
        invoice.setIgstAmount(igst);
        invoice.setTotalAmount(totalAmount);
        if ("CREDIT".equalsIgnoreCase(request.getPaymentMode())) {
            invoice.setAmountPaid(BigDecimal.ZERO);
            invoice.setAmountDue(totalAmount);
        } else {
            invoice.setAmountPaid(totalAmount);
            invoice.setAmountDue(BigDecimal.ZERO);
        }
        invoiceRepository.save(invoice);

        auditLogService.log(
                store,
                currentUser,
                "INVOICE_CREATED",
                "INVOICE",
                invoice.getInvoiceId().toString(),
                null,
                "{\"invoiceNo\":\"" + invoice.getInvoiceNo() + "\",\"totalAmount\":\"" + totalAmount + "\"}"
        );

        return toInvoiceResponse(invoice, itemResponses);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(UUID invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        ensureInvoiceInTenantScope(invoice);
        List<InvoiceItemResponse> items = invoiceItemRepository.findByInvoiceInvoiceId(invoiceId)
                .stream()
                .map(this::toInvoiceItemResponse)
                .collect(Collectors.toList());

        return toInvoiceResponse(invoice, items);
    }

    @Transactional
    public SalesReturnResponse createSalesReturn(UUID invoiceId, SalesReturnCreateRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Sales return must contain at least one item");
        }

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        ensureInvoiceInTenantScope(invoice);
        if (Boolean.TRUE.equals(invoice.getIsCancelled())) {
            throw new BusinessRuleException("Cancelled invoices cannot be returned");
        }

        PharmaUser currentUser = getCurrentPharmaUser();
        if (currentUser == null) {
            throw new ForbiddenActionException("Authenticated PharmaFlow user is required for sales returns");
        }

        List<InvoiceItem> invoiceItems = invoiceItemRepository.findByInvoiceInvoiceId(invoiceId);
        java.util.Map<UUID, InvoiceItem> invoiceItemsById = invoiceItems.stream()
                .collect(Collectors.toMap(InvoiceItem::getItemId, item -> item));

        SalesReturn salesReturn = salesReturnRepository.save(
                SalesReturn.builder()
                        .returnNumber(generateSalesReturnNo(invoice.getStore()))
                        .store(invoice.getStore())
                        .invoice(invoice)
                        .customer(invoice.getCustomer())
                        .settlementType(request.getSettlementType())
                        .notes(request.getNotes())
                        .createdBy(currentUser)
                        .build()
        );

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<SalesReturnItemResponse> itemResponses = new ArrayList<>();

        for (SalesReturnItemRequest itemRequest : request.getItems()) {
            InvoiceItem invoiceItem = invoiceItemsById.get(itemRequest.getInvoiceItemId());
            if (invoiceItem == null) {
                throw new BusinessRuleException("Invoice item does not belong to the selected invoice");
            }
            if (invoiceItem.getBatch() == null || invoiceItem.getBatch().getBatchId() == null) {
                throw new BusinessRuleException("Invoice item is missing its original batch reference");
            }

            BigDecimal soldQuantity = safe(invoiceItem.getQuantity());
            BigDecimal alreadyReturned = safe(salesReturnItemRepository.sumReturnedQuantityByInvoiceItem(invoiceItem.getItemId()));
            BigDecimal requestedQuantity = safe(itemRequest.getQuantity());
            if (requestedQuantity.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessRuleException("Return quantity must be greater than zero");
            }
            if (alreadyReturned.add(requestedQuantity).compareTo(soldQuantity) > 0) {
                throw new BusinessRuleException("Return quantity exceeds the unreturned sold quantity");
            }

            inventoryMovementService.applyQuantity(
                    invoiceItem.getBatch().getBatchId(),
                    requestedQuantity,
                    invoiceItem.getUnitType(),
                    "SALE_RETURN",
                    "CUSTOMER_RETURN",
                    "SALES_RETURN",
                    salesReturn.getReturnId().toString(),
                    itemRequest.getReason(),
                    currentUser
            );

            BigDecimal lineTotal = calculateReturnLineTotal(invoiceItem, requestedQuantity);
            SalesReturnItem savedItem = salesReturnItemRepository.save(
                    SalesReturnItem.builder()
                            .salesReturn(salesReturn)
                            .invoiceItem(invoiceItem)
                            .medicine(invoiceItem.getMedicine())
                            .batch(invoiceItem.getBatch())
                            .quantity(requestedQuantity)
                            .unitType(invoiceItem.getUnitType())
                            .lineTotal(lineTotal)
                            .reason(trim(itemRequest.getReason()))
                            .build()
            );

            totalAmount = totalAmount.add(lineTotal);
            itemResponses.add(toSalesReturnItemResponse(savedItem));
        }

        salesReturn.setTotalAmount(totalAmount.setScale(2, RoundingMode.HALF_UP));
        salesReturnRepository.save(salesReturn);

        if ("CREDIT".equalsIgnoreCase(invoice.getPaymentMode()) && invoice.getCustomer() != null) {
            Customer customer = invoice.getCustomer();
            customer.setCurrentBalance(safe(customer.getCurrentBalance()).subtract(totalAmount).max(BigDecimal.ZERO));
            customerRepository.save(customer);
        }

        auditLogService.log(
                invoice.getStore(),
                currentUser,
                "SALES_RETURN_CREATED",
                "INVOICE",
                invoice.getInvoiceId().toString(),
                null,
                "{\"returnNumber\":\"" + salesReturn.getReturnNumber() + "\",\"totalAmount\":\"" + totalAmount + "\"}"
        );

        return toSalesReturnResponse(salesReturn, itemResponses);
    }

    @Transactional(readOnly = true)
    public List<SalesReturnResponse> listSalesReturns(UUID invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        ensureInvoiceInTenantScope(invoice);

        return salesReturnRepository.findByInvoiceInvoiceIdOrderByCreatedAtDesc(invoiceId)
                .stream()
                .map(salesReturn -> {
                    List<SalesReturnItemResponse> items = salesReturnItemRepository.findBySalesReturnReturnId(salesReturn.getReturnId())
                            .stream()
                            .map(this::toSalesReturnItemResponse)
                            .collect(Collectors.toList());
                    return toSalesReturnResponse(salesReturn, items);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceHistoryItemResponse> listInvoices(
            UUID storeId,
            LocalDate from,
            LocalDate to,
            String query,
            int limit
    ) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        LocalDateTime fromDate = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDate = to != null ? to.plusDays(1).atStartOfDay() : null;
        String normalizedQuery = query == null ? null : query.trim().toLowerCase(Locale.ROOT);

        return invoiceRepository.findByStoreStoreIdOrderByInvoiceDateDesc(storeId, PageRequest.of(0, safeLimit))
                .stream()
                .filter(invoice -> matchesInvoice(invoice, fromDate, toDate, normalizedQuery))
                .map(invoice -> InvoiceHistoryItemResponse.builder()
                        .invoiceId(invoice.getInvoiceId())
                        .invoiceNo(invoice.getInvoiceNo())
                        .invoiceDate(invoice.getInvoiceDate())
                        .customerName(invoice.getCustomer() != null ? invoice.getCustomer().getName() : null)
                        .billedByName(invoice.getBilledBy() != null ? invoice.getBilledBy().getFullName() : null)
                        .paymentMode(invoice.getPaymentMode())
                        .totalAmount(invoice.getTotalAmount())
                        .amountDue(invoice.getAmountDue())
                        .prescriptionAttached(invoice.getPrescriptionAttached())
                        .cancelled(invoice.getIsCancelled())
                        .build())
                .collect(Collectors.toList());
    }

    private InvoiceResponse toInvoiceResponse(Invoice invoice, List<InvoiceItemResponse> items) {
        return InvoiceResponse.builder()
                .invoiceId(invoice.getInvoiceId())
                .invoiceNo(invoice.getInvoiceNo())
                .invoiceDate(invoice.getInvoiceDate())
                .paymentMode(invoice.getPaymentMode())
                .customerName(invoice.getCustomer() != null ? invoice.getCustomer().getName() : null)
                .billedByName(invoice.getBilledBy() != null ? invoice.getBilledBy().getFullName() : null)
                .doctorName(invoice.getDoctorName())
                .subtotal(invoice.getSubtotal())
                .discountAmount(invoice.getDiscountAmount())
                .taxableAmount(invoice.getTaxableAmount())
                .cgstAmount(invoice.getCgstAmount())
                .sgstAmount(invoice.getSgstAmount())
                .igstAmount(invoice.getIgstAmount())
                .totalAmount(invoice.getTotalAmount())
                .amountPaid(invoice.getAmountPaid())
                .amountDue(invoice.getAmountDue())
                .prescriptionAttached(invoice.getPrescriptionAttached())
                .prescriptionUrl(invoice.getPrescriptionUrl())
                .items(items)
                .build();
    }

    private boolean matchesInvoice(Invoice invoice, LocalDateTime fromDate, LocalDateTime toDate, String normalizedQuery) {
        LocalDateTime invoiceDate = invoice.getInvoiceDate();
        if (fromDate != null && (invoiceDate == null || invoiceDate.isBefore(fromDate))) {
            return false;
        }
        if (toDate != null && (invoiceDate == null || !invoiceDate.isBefore(toDate))) {
            return false;
        }
        if (normalizedQuery == null || normalizedQuery.isBlank()) {
            return true;
        }

        return containsIgnoreCase(invoice.getInvoiceNo(), normalizedQuery)
                || containsIgnoreCase(invoice.getPaymentMode(), normalizedQuery)
                || containsIgnoreCase(invoice.getCustomer() != null ? invoice.getCustomer().getName() : null, normalizedQuery)
                || containsIgnoreCase(invoice.getBilledBy() != null ? invoice.getBilledBy().getFullName() : null, normalizedQuery);
    }

    private boolean containsIgnoreCase(String value, String normalizedQuery) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(normalizedQuery);
    }

    private void ensureInvoiceInTenantScope(Invoice invoice) {
        TenantRequestContext context = TenantRequestContextHolder.get();
        if (context == null || context.getTenant() == null) {
            return;
        }
        if (invoice.getStore() == null || invoice.getStore().getTenant() == null) {
            throw new ForbiddenActionException("Invoice is not linked to an active tenant");
        }
        if (!context.getTenant().getTenantId().equals(invoice.getStore().getTenant().getTenantId())) {
            throw new ForbiddenActionException("Invoice does not belong to the active tenant");
        }
    }

    private String generateInvoiceNo(Store store, LocalDate invoiceDate) {
        LocalDate financialYearStart = invoiceDate.getMonthValue() >= 4
                ? LocalDate.of(invoiceDate.getYear(), 4, 1)
                : LocalDate.of(invoiceDate.getYear() - 1, 4, 1);
        LocalDateTime start = financialYearStart.atStartOfDay();
        LocalDateTime end = financialYearStart.plusYears(1).atStartOfDay();
        long sequence = invoiceRepository.countByStoreAndPeriod(store.getStoreId(), start, end) + 1;

        String normalizedStoreCode = store.getStoreCode().replaceAll("[^A-Za-z0-9]", "");
        String financialYear = String.format("%d-%02d", financialYearStart.getYear(), (financialYearStart.getYear() + 1) % 100);

        String invoiceStoreCode = normalizedStoreCode.startsWith(invoicePrefix)
                ? normalizedStoreCode
                : invoicePrefix + normalizedStoreCode;

        return invoiceStoreCode + "/" + financialYear + "/" + String.format("%05d", sequence);
    }

    private List<BatchAllocationPlan> planBatchAllocations(
            PharmaUser currentUser,
            UUID storeId,
            BillingItemRequest itemRequest,
            Medicine medicine,
            String customerState,
            boolean lockBatches
    ) {
        if (itemRequest.getQuantity() == null || itemRequest.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Billing quantity must be greater than zero");
        }

        List<InventoryBatch> candidateBatches = (lockBatches
                ? inventoryBatchRepository.findSellableBatchesForUpdate(storeId, medicine.getMedicineId(), LocalDate.now())
                : inventoryBatchRepository.findSellableBatches(storeId, medicine.getMedicineId(), LocalDate.now()))
                .stream()
                .sorted(Comparator
                        .comparing((InventoryBatch batch) -> itemRequest.getBatchId() != null && itemRequest.getBatchId().equals(batch.getBatchId()) ? 0 : 1)
                        .thenComparing(InventoryBatch::getExpiryDate)
                        .thenComparing(InventoryBatch::getCreatedAt))
                .collect(Collectors.toList());

        if (candidateBatches.isEmpty()) {
            throw new BusinessRuleException("No sellable stock found for " + medicine.getBrandName());
        }

        int remainingLooseUnits = toLooseUnits(itemRequest.getQuantity(), itemRequest.getUnitType(), medicine);
        if (remainingLooseUnits <= 0) {
            throw new IllegalArgumentException("Billing quantity must be greater than zero");
        }

        BigDecimal resolvedGstRate = resolveGstRate(itemRequest, medicine);
        String effectiveCustomerState = customerState == null || customerState.isBlank()
                ? defaultCustomerState
                : customerState;
        List<BatchAllocationPlan> allocations = new ArrayList<>();

        for (InventoryBatch batch : candidateBatches) {
            if (remainingLooseUnits <= 0) {
                break;
            }

            validateCartItem(currentUser, batch, medicine, itemRequest, storeId);
            int availableLooseUnits = calculateAvailableLooseUnits(batch, medicine);
            if (availableLooseUnits <= 0) {
                continue;
            }

            int allocatedLooseUnits = Math.min(remainingLooseUnits, availableLooseUnits);
            BigDecimal allocatedQuantity = toDisplayQuantity(allocatedLooseUnits, itemRequest.getUnitType(), medicine);
            BigDecimal lineMrp = resolveLineMrp(itemRequest, medicine, batch, allocatedQuantity);
            GSTBreakdown breakdown = gstCalculationService.calculate(
                    lineMrp,
                    safe(itemRequest.getDiscountPercent()),
                    resolvedGstRate,
                    effectiveCustomerState
            );

            allocations.add(new BatchAllocationPlan(batch, allocatedQuantity, resolvedGstRate, lineMrp, breakdown));
            remainingLooseUnits -= allocatedLooseUnits;
        }

        if (remainingLooseUnits > 0) {
            throw new BusinessRuleException("Insufficient sellable stock for " + medicine.getBrandName());
        }

        return allocations;
    }

    private BigDecimal resolveLineMrp(BillingItemRequest itemRequest, Medicine medicine, InventoryBatch batch) {
        return resolveLineMrp(itemRequest, medicine, batch, itemRequest.getQuantity());
    }

    private BigDecimal resolveLineMrp(BillingItemRequest itemRequest, Medicine medicine, InventoryBatch batch, BigDecimal quantity) {
        BigDecimal packMrp = resolvePackMrp(itemRequest, medicine, batch);
        if (packMrp == null) {
            return BigDecimal.ZERO;
        }

        if (!isPackUnitType(itemRequest.getUnitType())) {
            int packSize = medicine.getPackSize() == null || medicine.getPackSize() <= 0 ? 1 : medicine.getPackSize();
            return packMrp
                    .divide(BigDecimal.valueOf(packSize), 4, RoundingMode.HALF_UP)
                    .multiply(quantity)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return packMrp.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal resolvePackMrp(BillingItemRequest itemRequest, Medicine medicine, InventoryBatch batch) {
        return itemRequest.getMrp() != null
                ? itemRequest.getMrp()
                : batch.getMrp() != null ? batch.getMrp() : medicine.getMrp();
    }

    private void validateCartItem(
            PharmaUser currentUser,
            InventoryBatch batch,
            Medicine medicine,
            BillingItemRequest itemRequest,
            UUID storeId
    ) {
        if (storeId != null && !storeId.equals(batch.getStore().getStoreId())) {
            throw new IllegalArgumentException("Inventory batch does not belong to the selected store");
        }
        if (!medicine.getMedicineId().equals(batch.getMedicine().getMedicineId())) {
            throw new IllegalArgumentException("Selected medicine does not match the inventory batch");
        }
        if (itemRequest.getQuantity() == null || itemRequest.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Billing quantity must be greater than zero");
        }
        if (!Boolean.TRUE.equals(batch.getIsActive())) {
            throw new BusinessRuleException("Batch " + batch.getBatchNumber() + " is inactive and cannot be billed");
        }
        if (batch.getExpiryDate() == null || !batch.getExpiryDate().isAfter(LocalDate.now())) {
            throw new BusinessRuleException("Batch " + batch.getBatchNumber() + " is expired and cannot be billed");
        }
        if (currentUser != null && itemRequest.getMrp() != null && batch.getMrp() != null
                && itemRequest.getMrp().compareTo(batch.getMrp()) != 0
                && !currentUser.canEditPrice()) {
            throw new ForbiddenActionException("Your role is not allowed to edit medicine pricing");
        }
    }

    private BigDecimal resolveGstRate(BillingItemRequest itemRequest, Medicine medicine) {
        if (itemRequest.getGstRate() != null) {
            return itemRequest.getGstRate();
        }
        return medicine.getGstRate() != null ? medicine.getGstRate() : BigDecimal.ZERO;
    }

    private int calculateAvailableLooseUnits(InventoryBatch batch, Medicine medicine) {
        int packSize = medicine.getPackSize() == null || medicine.getPackSize() <= 0 ? 1 : medicine.getPackSize();
        return safe(batch.getQuantityStrips()) * packSize + safe(batch.getQuantityLoose());
    }

    private int toLooseUnits(BigDecimal quantity, String unitType, Medicine medicine) {
        int packSize = medicine.getPackSize() == null || medicine.getPackSize() <= 0 ? 1 : medicine.getPackSize();
        if (isPackUnitType(unitType)) {
            return quantity.multiply(BigDecimal.valueOf(packSize))
                    .setScale(0, RoundingMode.HALF_UP)
                    .intValueExact();
        }
        return quantity.setScale(0, RoundingMode.HALF_UP).intValueExact();
    }

    private BigDecimal toDisplayQuantity(int looseUnits, String unitType, Medicine medicine) {
        int packSize = medicine.getPackSize() == null || medicine.getPackSize() <= 0 ? 1 : medicine.getPackSize();
        if (isPackUnitType(unitType)) {
            return BigDecimal.valueOf(looseUnits)
                    .divide(BigDecimal.valueOf(packSize), 3, RoundingMode.HALF_UP)
                    .stripTrailingZeros();
        }
        return BigDecimal.valueOf(looseUnits);
    }

    private boolean isPackUnitType(String unitType) {
        return "PACK".equalsIgnoreCase(unitType) || "STRIP".equalsIgnoreCase(unitType);
    }

    private InvoiceItemResponse toInvoiceItemResponse(InvoiceItem item) {
        return InvoiceItemResponse.builder()
                .itemId(item.getItemId())
                .medicineId(item.getMedicine() != null ? item.getMedicine().getMedicineId() : null)
                .medicineName(item.getMedicineNameSnapshot() != null ? item.getMedicineNameSnapshot() : item.getMedicine() != null ? item.getMedicine().getBrandName() : null)
                .genericName(item.getGenericNameSnapshot() != null ? item.getGenericNameSnapshot() : item.getMedicine() != null ? item.getMedicine().getGenericName() : null)
                .manufacturerName(item.getManufacturerNameSnapshot() != null ? item.getManufacturerNameSnapshot() : item.getMedicine() != null && item.getMedicine().getManufacturer() != null ? item.getMedicine().getManufacturer().getName() : null)
                .hsnCode(item.getHsnCodeSnapshot() != null ? item.getHsnCodeSnapshot() : item.getMedicine() != null ? item.getMedicine().getHsnCode() : null)
                .batchId(item.getBatch() != null ? item.getBatch().getBatchId() : null)
                .batchNumber(item.getBatchNumberSnapshot() != null ? item.getBatchNumberSnapshot() : item.getBatch() != null ? item.getBatch().getBatchNumber() : null)
                .expiryDate(item.getExpiryDateSnapshot() != null ? item.getExpiryDateSnapshot() : item.getBatch() != null ? item.getBatch().getExpiryDate() : null)
                .purchaseRate(item.getPurchaseRateSnapshot() != null ? item.getPurchaseRateSnapshot() : item.getBatch() != null ? item.getBatch().getPurchaseRate() : null)
                .quantity(item.getQuantity())
                .unitType(item.getUnitType())
                .mrp(item.getMrp())
                .discountPct(item.getDiscountPct())
                .taxableAmount(item.getTaxableAmount())
                .gstRate(item.getGstRate())
                .cgst(item.getCgst())
                .sgst(item.getSgst())
                .igst(item.getIgst())
                .total(item.getTotal())
                .build();
    }

    private void validateCreditLimit(Customer customer, String paymentMode, BigDecimal totalAmount) {
        if (!"CREDIT".equalsIgnoreCase(paymentMode)) {
            return;
        }
        if (customer == null) {
            throw new BusinessRuleException("Customer selection is required for credit billing");
        }

        BigDecimal creditLimit = safe(customer.getCreditLimit());
        BigDecimal currentBalance = safe(customer.getCurrentBalance());
        BigDecimal projectedBalance = currentBalance.add(totalAmount);
        if (projectedBalance.compareTo(creditLimit) > 0) {
            throw new BusinessRuleException(
                    "Credit limit exceeded. Available credit is ₹" + creditLimit.subtract(currentBalance).max(BigDecimal.ZERO)
            );
        }
    }

    private PharmaUser getCurrentPharmaUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return pharmaUserRepository.findByUsername(authentication.getName()).orElse(null);
    }

    private String resolvePatientName(InvoiceCreateRequest request, Customer customer) {
        if (request.getPatientName() != null && !request.getPatientName().isBlank()) {
            return request.getPatientName();
        }
        return customer != null ? customer.getName() : null;
    }

    private String resolveDoctorName(InvoiceCreateRequest request, Customer customer) {
        if (request.getDoctorName() != null && !request.getDoctorName().isBlank()) {
            return request.getDoctorName();
        }
        return customer != null ? customer.getDoctorName() : null;
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private Integer safe(Integer value) {
        return value == null ? 0 : value;
    }

    private void recordPatientHistory(
            Customer customer,
            Invoice invoice,
            Medicine medicine,
            BigDecimal quantity,
            InvoiceCreateRequest request
    ) {
        if (customer == null || medicine == null) {
            return;
        }

        boolean shouldPersist = scheduleHComplianceService.requiresComplianceRecord(medicine.getScheduleType())
                || Boolean.TRUE.equals(medicine.getRequiresRx())
                || (request.getPrescriptionUrl() != null && !request.getPrescriptionUrl().isBlank())
                || (request.getDoctorName() != null && !request.getDoctorName().isBlank());

        if (!shouldPersist) {
            return;
        }

        patientPrescriptionRepository.save(
                PatientPrescription.builder()
                        .customer(customer)
                        .medicine(medicine)
                        .invoiceId(invoice.getInvoiceId())
                        .doctorName(resolveDoctorName(request, customer))
                        .doctorRegNo(request.getDoctorRegNo())
                        .prescriptionUrl(request.getPrescriptionUrl())
                        .quantity(quantity)
                        .notes("Captured from POS billing invoice " + invoice.getInvoiceNo())
                        .build()
        );
    }

    private String generateSalesReturnNo(Store store) {
        String storeCode = store != null && store.getStoreCode() != null
                ? store.getStoreCode().replaceAll("[^A-Za-z0-9]", "")
                : "STORE";
        return storeCode + "/SR/" + System.currentTimeMillis();
    }

    private BigDecimal calculateReturnLineTotal(InvoiceItem invoiceItem, BigDecimal requestedQuantity) {
        BigDecimal soldQuantity = safe(invoiceItem.getQuantity());
        if (soldQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            return safe(invoiceItem.getTotal()).setScale(2, RoundingMode.HALF_UP);
        }
        return safe(invoiceItem.getTotal())
                .multiply(requestedQuantity)
                .divide(soldQuantity, 2, RoundingMode.HALF_UP);
    }

    private SalesReturnResponse toSalesReturnResponse(SalesReturn salesReturn, List<SalesReturnItemResponse> items) {
        return SalesReturnResponse.builder()
                .returnId(salesReturn.getReturnId())
                .returnNumber(salesReturn.getReturnNumber())
                .invoiceId(salesReturn.getInvoice() != null ? salesReturn.getInvoice().getInvoiceId() : null)
                .invoiceNo(salesReturn.getInvoice() != null ? salesReturn.getInvoice().getInvoiceNo() : null)
                .settlementType(salesReturn.getSettlementType())
                .status(salesReturn.getStatus())
                .totalAmount(salesReturn.getTotalAmount())
                .notes(salesReturn.getNotes())
                .createdByName(salesReturn.getCreatedBy() != null ? salesReturn.getCreatedBy().getFullName() : null)
                .createdAt(salesReturn.getCreatedAt())
                .items(items)
                .build();
    }

    private SalesReturnItemResponse toSalesReturnItemResponse(SalesReturnItem item) {
        return SalesReturnItemResponse.builder()
                .returnItemId(item.getReturnItemId())
                .invoiceItemId(item.getInvoiceItem() != null ? item.getInvoiceItem().getItemId() : null)
                .medicineId(item.getMedicine() != null ? item.getMedicine().getMedicineId() : null)
                .medicineName(item.getMedicine() != null ? item.getMedicine().getBrandName() : null)
                .batchId(item.getBatch() != null ? item.getBatch().getBatchId() : null)
                .batchNumber(item.getBatch() != null ? item.getBatch().getBatchNumber() : null)
                .quantity(item.getQuantity())
                .unitType(item.getUnitType())
                .lineTotal(item.getLineTotal())
                .reason(item.getReason())
                .build();
    }

    private String trim(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record BatchAllocationPlan(
            InventoryBatch batch,
            BigDecimal quantity,
            BigDecimal gstRate,
            BigDecimal lineMrp,
            GSTBreakdown breakdown
    ) {
    }
}
