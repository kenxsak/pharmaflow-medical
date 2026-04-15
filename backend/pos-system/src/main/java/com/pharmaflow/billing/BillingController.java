package com.pharmaflow.billing;

import com.pharmaflow.billing.dto.GstCalculationRequest;
import com.pharmaflow.billing.dto.GstCalculationResponse;
import com.pharmaflow.billing.dto.InvoiceCreateRequest;
import com.pharmaflow.billing.dto.InvoiceHistoryItemResponse;
import com.pharmaflow.billing.dto.InvoiceResponse;
import com.pharmaflow.billing.dto.SalesReturnCreateRequest;
import com.pharmaflow.billing.dto.SalesReturnResponse;
import com.pharmaflow.audit.AuditLogService;
import com.pharmaflow.audit.dto.AuditLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.LinkedHashMap;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/billing")
@Validated
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;
    private final PrintService printService;
    private final AuditLogService auditLogService;

    @PostMapping("/calculate-gst")
    public GstCalculationResponse calculateGST(
            @RequestHeader(value = "X-Store-ID", required = false) UUID storeId,
            @Valid @RequestBody GstCalculationRequest request
    ) {
        return billingService.calculateGST(storeId, request);
    }

    @PostMapping("/invoice")
    public InvoiceResponse createInvoice(
            @RequestHeader("X-Store-ID") UUID storeId,
            @Valid @RequestBody InvoiceCreateRequest request
    ) {
        return billingService.createInvoice(storeId, request);
    }

    @GetMapping("/invoice/{invoiceId}")
    public InvoiceResponse getInvoice(@PathVariable UUID invoiceId) {
        return billingService.getInvoice(invoiceId);
    }

    @GetMapping("/invoice/{invoiceId}/returns")
    public List<SalesReturnResponse> listSalesReturns(@PathVariable UUID invoiceId) {
        return billingService.listSalesReturns(invoiceId);
    }

    @PostMapping("/invoice/{invoiceId}/returns")
    public SalesReturnResponse createSalesReturn(
            @PathVariable UUID invoiceId,
            @Valid @RequestBody SalesReturnCreateRequest request
    ) {
        return billingService.createSalesReturn(invoiceId, request);
    }

    @GetMapping("/invoices")
    public List<InvoiceHistoryItemResponse> listInvoices(
            @RequestHeader("X-Store-ID") UUID storeId,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "100") int limit
    ) {
        return billingService.listInvoices(storeId, from, to, query, limit);
    }

    @GetMapping("/invoice/{invoiceId}/print")
    public ResponseEntity<String> printInvoice(
            @PathVariable UUID invoiceId,
            @RequestHeader(value = "X-Brand-Name", required = false) String brandName,
            @RequestHeader(value = "X-Brand-Tagline", required = false) String brandTagline,
            @RequestHeader(value = "X-Brand-Support-Email", required = false) String supportEmail,
            @RequestHeader(value = "X-Brand-Support-Phone", required = false) String supportPhone
    ) {
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(printService.generateReceiptHtml(invoiceId, buildReceiptBranding(brandName, brandTagline, supportEmail, supportPhone)));
    }

    @GetMapping("/invoice/{invoiceId}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(
            @PathVariable UUID invoiceId,
            @RequestHeader(value = "X-Brand-Name", required = false) String brandName,
            @RequestHeader(value = "X-Brand-Tagline", required = false) String brandTagline,
            @RequestHeader(value = "X-Brand-Support-Email", required = false) String supportEmail,
            @RequestHeader(value = "X-Brand-Support-Phone", required = false) String supportPhone
    ) {
        byte[] pdf = printService.generateReceiptPdf(invoiceId, buildReceiptBranding(brandName, brandTagline, supportEmail, supportPhone));
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoice-" + invoiceId + ".pdf\"")
                .body(pdf);
    }

    @PostMapping("/invoice/{invoiceId}/whatsapp")
    public ResponseEntity<java.util.Map<String, Object>> prepareWhatsAppShare(
            @PathVariable UUID invoiceId,
            @RequestParam(required = false) String phone,
            @RequestHeader(value = "X-Brand-Name", required = false) String brandName,
            @RequestHeader(value = "X-Brand-Tagline", required = false) String brandTagline,
            @RequestHeader(value = "X-Brand-Support-Email", required = false) String supportEmail,
            @RequestHeader(value = "X-Brand-Support-Phone", required = false) String supportPhone
    ) {
        String message = printService.generateWhatsAppMessage(
                invoiceId,
                buildReceiptBranding(brandName, brandTagline, supportEmail, supportPhone)
        );
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("invoiceId", invoiceId);
        payload.put("phone", phone);
        payload.put("message", message);
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/invoice/{invoiceId}/audit")
    public List<AuditLogResponse> getInvoiceAudit(
            @RequestHeader("X-Store-ID") UUID storeId,
            @PathVariable UUID invoiceId,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return auditLogService.getEntityLogs(storeId, "INVOICE", invoiceId.toString(), limit);
    }

    private ReceiptBranding buildReceiptBranding(
            String brandName,
            String brandTagline,
            String supportEmail,
            String supportPhone
    ) {
        return ReceiptBranding.builder()
                .brandName(brandName)
                .tagline(brandTagline)
                .supportEmail(supportEmail)
                .supportPhone(supportPhone)
                .build();
    }
}
