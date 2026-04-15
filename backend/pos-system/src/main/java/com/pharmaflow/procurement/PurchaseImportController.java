package com.pharmaflow.procurement;

import com.pharmaflow.procurement.dto.PurchaseImportRequest;
import com.pharmaflow.procurement.dto.PurchaseImportResponse;
import com.pharmaflow.procurement.dto.PurchaseImportRowRequest;
import com.pharmaflow.procurement.dto.PurchaseOrderCloseRequest;
import com.pharmaflow.procurement.dto.PurchaseOrderSummaryResponse;
import com.pharmaflow.procurement.dto.PurchaseReceiptSummaryResponse;
import com.pharmaflow.procurement.dto.CreditNoteCreateRequest;
import com.pharmaflow.procurement.dto.CreditNoteResponse;
import com.pharmaflow.procurement.dto.CreditNoteSettlementRequest;
import com.pharmaflow.procurement.dto.ReorderDraftRequest;
import com.pharmaflow.procurement.dto.ReorderDraftResponse;
import com.pharmaflow.procurement.dto.SupplierCreateRequest;
import com.pharmaflow.procurement.dto.SupplierResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/purchases")
@Validated
@RequiredArgsConstructor
public class PurchaseImportController {

    private final CSVImportService csvImportService;
    private final ProcurementService procurementService;
    private final CreditNoteService creditNoteService;

    @GetMapping("/suppliers")
    public List<SupplierResponse> listSuppliers() {
        return procurementService.listSuppliers();
    }

    @PostMapping("/suppliers")
    public SupplierResponse createSupplier(@Valid @RequestBody SupplierCreateRequest request) {
        return procurementService.createSupplier(request);
    }

    @GetMapping("/orders")
    public List<PurchaseOrderSummaryResponse> listPurchaseOrders(
            @RequestHeader("X-Store-ID") UUID storeId,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return procurementService.listPurchaseOrders(storeId, limit);
    }

    @GetMapping("/receipts")
    public List<PurchaseReceiptSummaryResponse> listPurchaseReceipts(
            @RequestHeader("X-Store-ID") UUID storeId,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return procurementService.listPurchaseReceipts(storeId, limit);
    }

    @PostMapping("/orders/draft")
    public ReorderDraftResponse createReorderDraft(@Valid @RequestBody ReorderDraftRequest request) {
        return procurementService.createReorderDraft(request);
    }

    @PostMapping("/orders/{purchaseOrderId}/close-short")
    public PurchaseOrderSummaryResponse closePurchaseOrderShort(
            @RequestHeader("X-Store-ID") UUID storeId,
            @PathVariable UUID purchaseOrderId,
            @RequestBody(required = false) PurchaseOrderCloseRequest request
    ) {
        return procurementService.closePurchaseOrderShort(storeId, purchaseOrderId, request);
    }

    @PostMapping("/import/json")
    public PurchaseImportResponse importFromJson(
            @RequestHeader("X-Store-ID") UUID storeId,
            @Valid @RequestBody PurchaseImportRequest request
    ) {
        return csvImportService.importPurchaseInvoice(storeId, request);
    }

    @PostMapping("/import/csv")
    public PurchaseImportResponse importFromCsv(
            @RequestHeader("X-Store-ID") UUID storeId,
            @RequestPart("meta") PurchaseImportRequest request,
            @RequestPart("file") MultipartFile file
    ) throws IOException {
        request.setRows(parseCsv(file));
        return csvImportService.importPurchaseInvoice(storeId, request);
    }

    @GetMapping("/credit-notes")
    public List<CreditNoteResponse> listCreditNotes(
            @RequestHeader("X-Store-ID") UUID storeId,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return creditNoteService.listCreditNotes(storeId, query, limit);
    }

    @PostMapping("/credit-notes")
    public CreditNoteResponse createCreditNote(
            @RequestHeader("X-Store-ID") UUID storeId,
            @Valid @RequestBody CreditNoteCreateRequest request
    ) {
        return creditNoteService.createCreditNote(storeId, request);
    }

    @PostMapping("/credit-notes/{creditNoteId}/dispatch")
    public CreditNoteResponse dispatchCreditNote(
            @RequestHeader("X-Store-ID") UUID storeId,
            @PathVariable UUID creditNoteId
    ) {
        return creditNoteService.dispatchCreditNote(storeId, creditNoteId);
    }

    @PostMapping("/credit-notes/{creditNoteId}/acknowledge")
    public CreditNoteResponse acknowledgeCreditNote(
            @RequestHeader("X-Store-ID") UUID storeId,
            @PathVariable UUID creditNoteId
    ) {
        return creditNoteService.acknowledgeCreditNote(storeId, creditNoteId);
    }

    @PostMapping("/credit-notes/{creditNoteId}/settle")
    public CreditNoteResponse settleCreditNote(
            @RequestHeader("X-Store-ID") UUID storeId,
            @PathVariable UUID creditNoteId,
            @Valid @RequestBody CreditNoteSettlementRequest request
    ) {
        return creditNoteService.settleCreditNote(storeId, creditNoteId, request);
    }

    @PostMapping("/credit-notes/{creditNoteId}/cancel")
    public CreditNoteResponse cancelCreditNote(
            @RequestHeader("X-Store-ID") UUID storeId,
            @PathVariable UUID creditNoteId
    ) {
        return creditNoteService.cancelCreditNote(storeId, creditNoteId);
    }

    private List<PurchaseImportRowRequest> parseCsv(MultipartFile file) throws IOException {
        List<PurchaseImportRowRequest> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.isBlank()) {
                return rows;
            }
            String[] headers = headerLine.split(",", -1);
            Map<String, Integer> indexByHeader = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                indexByHeader.put(headers[i].trim().toLowerCase(), i);
            }

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                String[] values = line.split(",", -1);
                PurchaseImportRowRequest row = new PurchaseImportRowRequest();
                row.setMedicineId(parseUuid(value(values, indexByHeader, "medicineid")));
                row.setBarcode(value(values, indexByHeader, "barcode"));
                row.setBrandName(value(values, indexByHeader, "brandname"));
                row.setBatchNumber(required(values, indexByHeader, "batchnumber"));
                row.setManufactureDate(parseDate(value(values, indexByHeader, "manufacturedate")));
                row.setExpiryDate(parseDate(required(values, indexByHeader, "expirydate")));
                row.setQuantity(parseInteger(required(values, indexByHeader, "quantity")));
                row.setQuantityLoose(parseInteger(value(values, indexByHeader, "quantityloose")));
                row.setFreeQty(parseInteger(value(values, indexByHeader, "freeqty")));
                row.setFreeQtyLoose(parseInteger(value(values, indexByHeader, "freeqtyloose")));
                row.setPurchaseRate(parseDecimal(required(values, indexByHeader, "purchaserate")));
                row.setMrp(parseDecimal(required(values, indexByHeader, "mrp")));
                row.setGstRate(parseDecimal(value(values, indexByHeader, "gstrate")));
                rows.add(row);
            }
        }
        return rows;
    }

    private String value(String[] values, Map<String, Integer> indexByHeader, String header) {
        Integer index = indexByHeader.get(header);
        if (index == null || index >= values.length) {
            return null;
        }
        String value = values[index].trim();
        return value.isEmpty() ? null : value;
    }

    private String required(String[] values, Map<String, Integer> indexByHeader, String header) {
        String value = value(values, indexByHeader, header);
        if (value == null) {
            throw new IllegalArgumentException("Missing required CSV column value for " + header);
        }
        return value;
    }

    private UUID parseUuid(String value) {
        return value == null ? null : UUID.fromString(value);
    }

    private LocalDate parseDate(String value) {
        return value == null ? null : LocalDate.parse(value);
    }

    private Integer parseInteger(String value) {
        return value == null ? null : Integer.parseInt(value);
    }

    private BigDecimal parseDecimal(String value) {
        return value == null ? null : new BigDecimal(value);
    }
}
