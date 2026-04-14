package com.pharmaflow.billing;

import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.pharmaflow.audit.AuditLogService;
import com.pharmaflow.common.ForbiddenActionException;
import com.pharmaflow.tenant.TenantRequestContext;
import com.pharmaflow.tenant.TenantRequestContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PrintService {

    private static final DateTimeFormatter RECEIPT_DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd-MMM-yyyy hh:mm a", Locale.ENGLISH);
    private static final DateTimeFormatter EXPIRY_DATE_FORMAT =
            DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
    private static final String FONT_REGULAR = "/fonts/Poppins-Regular.ttf";
    private static final String FONT_SEMIBOLD = "/fonts/Poppins-SemiBold.ttf";

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final AuditLogService auditLogService;

    @Value("${pharmaflow.brand.name:PharmaFlow}")
    private String configuredBrandName;

    @Value("${pharmaflow.brand.tagline:Retail pharmacy operations, billing, and compliance workspace}")
    private String configuredTagline;

    @Value("${pharmaflow.brand.support-email:support@pharmaflow.in}")
    private String configuredSupportEmail;

    @Value("${pharmaflow.brand.support-phone:+91 44 4000 9000}")
    private String configuredSupportPhone;

    @Transactional(readOnly = true)
    public String generateReceiptHtml(UUID invoiceId) {
        return generateReceiptHtml(invoiceId, null);
    }

    @Transactional(readOnly = true)
    public String generateReceiptHtml(UUID invoiceId, ReceiptBranding overrideBranding) {
        Invoice invoice = loadInvoice(invoiceId);
        List<InvoiceItem> items = invoiceItemRepository.findByInvoiceInvoiceId(invoiceId);
        logPrintAudit(invoice, "INVOICE_PRINTED");
        return buildReceiptHtml(invoice, items, ReceiptRenderMode.PRINT, mergeBranding(invoice, overrideBranding));
    }

    @Transactional(readOnly = true)
    public byte[] generateReceiptPdf(UUID invoiceId) {
        return generateReceiptPdf(invoiceId, null);
    }

    @Transactional(readOnly = true)
    public byte[] generateReceiptPdf(UUID invoiceId, ReceiptBranding overrideBranding) {
        Invoice invoice = loadInvoice(invoiceId);
        List<InvoiceItem> items = invoiceItemRepository.findByInvoiceInvoiceId(invoiceId);
        logPrintAudit(invoice, "INVOICE_PDF_DOWNLOADED");
        return buildReceiptPdf(invoice, items, mergeBranding(invoice, overrideBranding));
    }

    @Transactional(readOnly = true)
    public String generateWhatsAppMessage(UUID invoiceId) {
        return generateWhatsAppMessage(invoiceId, null);
    }

    @Transactional(readOnly = true)
    public String generateWhatsAppMessage(UUID invoiceId, ReceiptBranding overrideBranding) {
        Invoice invoice = loadInvoice(invoiceId);
        logPrintAudit(invoice, "INVOICE_WHATSAPP_PREPARED");
        ReceiptBranding branding = mergeBranding(invoice, overrideBranding);

        String customerName = invoice.getCustomer() != null && invoice.getCustomer().getName() != null
                ? invoice.getCustomer().getName()
                : "Customer";
        String storeName = invoice.getStore() != null ? invoice.getStore().getStoreName() : branding.getBrandName();
        String total = safe(invoice.getTotalAmount()).setScale(2, RoundingMode.HALF_UP).toPlainString();
        String date = invoice.getInvoiceDate() != null ? invoice.getInvoiceDate().format(RECEIPT_DATE_FORMAT) : "";

        return "Hello " + customerName + ", your " + branding.getBrandName() + " bill " + invoice.getInvoiceNo()
                + " dated " + date
                + " for INR " + total
                + " is ready. Thank you for visiting " + storeName + ".";
    }

    private Invoice loadInvoice(UUID invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        TenantRequestContext context = TenantRequestContextHolder.get();
        if (context != null && context.getTenant() != null) {
            if (invoice.getStore() == null || invoice.getStore().getTenant() == null
                    || !context.getTenant().getTenantId().equals(invoice.getStore().getTenant().getTenantId())) {
                throw new ForbiddenActionException("Invoice does not belong to the active tenant");
            }
        }
        return invoice;
    }

    private void logPrintAudit(Invoice invoice, String action) {
        auditLogService.log(
                invoice.getStore(),
                invoice.getBilledBy(),
                action,
                "INVOICE",
                invoice.getInvoiceId().toString(),
                null,
                "{\"invoiceNo\":\"" + invoice.getInvoiceNo() + "\"}"
        );
    }

    private byte[] buildReceiptPdf(Invoice invoice, List<InvoiceItem> items, ReceiptBranding branding) {
        int pageHeightMm = estimatePageHeightMm(invoice, items);
        String html = buildReceiptHtml(invoice, items, ReceiptRenderMode.PDF, branding);

        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.useDefaultPageSize(80f, pageHeightMm, BaseRendererBuilder.PageSizeUnits.MM);
            builder.useFont(() -> loadFont(FONT_REGULAR), "Poppins", 400, BaseRendererBuilder.FontStyle.NORMAL, true);
            builder.useFont(() -> loadFont(FONT_SEMIBOLD), "Poppins", 600, BaseRendererBuilder.FontStyle.NORMAL, true);
            builder.withHtmlContent(html, null);
            builder.toStream(output);
            builder.run();
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to generate invoice PDF", exception);
        }
    }

    private InputStream loadFont(String resourcePath) {
        InputStream fontStream = PrintService.class.getResourceAsStream(resourcePath);
        if (fontStream == null) {
            throw new IllegalStateException("Missing receipt font resource: " + resourcePath);
        }
        return fontStream;
    }

    private String buildReceiptHtml(
            Invoice invoice,
            List<InvoiceItem> items,
            ReceiptRenderMode renderMode,
            ReceiptBranding branding
    ) {
        boolean pdfMode = renderMode == ReceiptRenderMode.PDF;
        int pageHeightMm = estimatePageHeightMm(invoice, items);
        String customerName = invoice.getCustomer() != null ? safeText(invoice.getCustomer().getName()) : "Walk-in customer";

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\" />");
        html.append("<title>").append(escapeHtml(invoice.getInvoiceNo())).append("</title>");
        html.append("<style>");
        html.append("@page{size:80mm ").append(pageHeightMm).append("mm;margin:4mm;}");
        html.append("body{margin:0;padding:")
                .append(pdfMode ? "0" : "20px")
                .append(";background:")
                .append(pdfMode ? "#ffffff" : "#f3f7fb")
                .append(";font-family:'Poppins',Arial,sans-serif;color:#0f172a;}");
        html.append(".receipt{width:100%;max-width:340px;margin:0 auto;background:#ffffff;border:1px solid #d7e2ee;border-radius:")
                .append(pdfMode ? "16px" : "20px")
                .append(";padding:18px 16px;box-shadow:")
                .append(pdfMode ? "none" : "0 18px 40px rgba(15,23,42,0.08)")
                .append(";}");
        html.append(".brand{text-align:center;font-size:24px;font-weight:600;letter-spacing:0.06em;}");
        html.append(".subtitle{text-align:center;color:#5f6f82;font-size:11px;line-height:1.6;}");
        html.append(".badge-row{text-align:center;margin-top:10px;}");
        html.append(".badge{display:inline-block;margin:0 4px 4px 0;padding:4px 8px;border-radius:999px;background:#eff6ff;border:1px solid #dbeafe;color:#1d4ed8;font-size:10px;font-weight:600;}");
        html.append(".badge.badge-warn{background:#ecfdf5;border-color:#ccead8;color:#047857;}");
        html.append(".rule{border-top:1px dashed #c7d4e2;margin:12px 0;}");
        html.append(".meta-table,.money-table,.item-header{width:100%;border-collapse:collapse;}");
        html.append(".meta-table td,.money-table td{padding:4px 0;font-size:12px;vertical-align:top;}");
        html.append(".meta-label{font-weight:600;color:#0f172a;}");
        html.append(".value{text-align:right;color:#0f172a;}");
        html.append(".item{padding:12px 0;border-top:1px solid #edf2f7;}");
        html.append(".item.first{border-top:none;padding-top:0;}");
        html.append(".item-name{font-size:14px;font-weight:600;color:#0f172a;}");
        html.append(".item-total{text-align:right;font-size:14px;font-weight:600;color:#0f172a;}");
        html.append(".item-meta{margin-top:4px;font-size:10px;line-height:1.55;color:#64748b;}");
        html.append(".item-meta strong{color:#334155;font-weight:600;}");
        html.append(".money-table .total-row td{padding-top:6px;font-size:18px;font-weight:600;color:#047857;}");
        html.append(".footer{text-align:center;font-size:10px;line-height:1.6;color:#64748b;}");
        html.append(".footer strong{color:#334155;font-weight:600;}");
        html.append("@media print{body{padding:0;background:#ffffff}.receipt{max-width:none;border:none;border-radius:0;box-shadow:none;padding:0}}");
        html.append("</style></head><body>");
        html.append("<div class=\"receipt\">");
        html.append("<div class=\"brand\">").append(escapeHtml(branding.getBrandName())).append("</div>");
        if (hasText(branding.getTagline())) {
            html.append("<div class=\"subtitle\">").append(escapeHtml(branding.getTagline())).append("</div>");
        }
        html.append("<div class=\"subtitle\">")
                .append(escapeHtml(invoice.getStore() != null ? safeText(invoice.getStore().getStoreName()) : branding.getBrandName()))
                .append("</div>");
        html.append("<div class=\"subtitle\">")
                .append(escapeHtml(buildStoreAddress(invoice)))
                .append("</div>");
        html.append("<div class=\"subtitle\">GSTIN: ")
                .append(escapeHtml(invoice.getStore() != null ? safeText(invoice.getStore().getGstin()) : "NA"))
                .append("</div>");
        if (invoice.getStore() != null && invoice.getStore().getDrugLicenseNo() != null) {
            html.append("<div class=\"subtitle\">Drug Lic: ")
                    .append(escapeHtml(invoice.getStore().getDrugLicenseNo()))
                    .append("</div>");
        }
        html.append("<div class=\"badge-row\">");
        html.append("<span class=\"badge\">").append(escapeHtml(safeText(invoice.getPaymentMode()))).append("</span>");
        if (Boolean.TRUE.equals(invoice.getPrescriptionAttached())) {
            html.append("<span class=\"badge badge-warn\">Prescription attached</span>");
        }
        html.append("</div>");
        html.append("<div class=\"rule\"></div>");
        html.append("<table class=\"meta-table\">");
        appendMetaRow(html, "Invoice", invoice.getInvoiceNo());
        appendMetaRow(html, "Date", formatDate(invoice.getInvoiceDate()));
        appendMetaRow(html, "Customer", customerName);
        if (invoice.getDoctorName() != null && !invoice.getDoctorName().isBlank()) {
            appendMetaRow(html, "Doctor", invoice.getDoctorName());
        }
        if (invoice.getBilledBy() != null && invoice.getBilledBy().getFullName() != null) {
            appendMetaRow(html, "Billed By", invoice.getBilledBy().getFullName());
        }
        html.append("</table>");
        html.append("<div class=\"rule\"></div>");

        boolean firstItem = true;
        for (InvoiceItem item : items) {
            String medicineName = safeText(item.getMedicineNameSnapshot());
            if (medicineName.isBlank()) {
                medicineName = item.getMedicine() != null ? safeText(item.getMedicine().getBrandName()) : "Medicine";
            }
            String batchNumber = safeText(item.getBatchNumberSnapshot());
            if (batchNumber.isBlank()) {
                batchNumber = item.getBatch() != null ? safeText(item.getBatch().getBatchNumber()) : "—";
            }
            LocalDate itemExpiryDate = item.getExpiryDateSnapshot() != null
                    ? item.getExpiryDateSnapshot()
                    : item.getBatch() != null ? item.getBatch().getExpiryDate() : null;
            String expiryDate = itemExpiryDate != null ? formatExpiry(itemExpiryDate) : "—";

            html.append("<div class=\"item").append(firstItem ? " first" : "").append("\">");
            html.append("<table class=\"item-header\"><tr><td class=\"item-name\">")
                    .append(escapeHtml(medicineName))
                    .append("</td><td class=\"item-total\">")
                    .append(escapeHtml(formatMoney(item.getTotal())))
                    .append("</td></tr></table>");
            html.append("<div class=\"item-meta\">Qty ")
                    .append(formatQuantity(item.getQuantity()))
                    .append(" ")
                    .append(escapeHtml(safeText(item.getUnitType())))
                    .append(" • <strong>Batch</strong> ")
                    .append(escapeHtml(batchNumber))
                    .append(" • <strong>Exp</strong> ")
                    .append(escapeHtml(expiryDate))
                    .append(" • <strong>GST</strong> ")
                    .append(safe(item.getGstRate()).setScale(0, RoundingMode.HALF_UP).toPlainString())
                    .append("%</div>");
            html.append("</div>");
            firstItem = false;
        }

        html.append("<div class=\"rule\"></div>");
        html.append("<table class=\"money-table\">");
        appendMoneyRow(html, "Subtotal", invoice.getSubtotal(), false);
        appendMoneyRow(html, "Discount", invoice.getDiscountAmount(), false);
        appendMoneyRow(html, "CGST", invoice.getCgstAmount(), false);
        appendMoneyRow(html, "SGST", invoice.getSgstAmount(), false);
        if (safe(invoice.getIgstAmount()).compareTo(BigDecimal.ZERO) > 0) {
            appendMoneyRow(html, "IGST", invoice.getIgstAmount(), false);
        }
        appendMoneyRow(html, "Total", invoice.getTotalAmount(), true);
        appendMoneyRow(html, "Paid", invoice.getAmountPaid(), false);
        appendMoneyRow(html, "Due", invoice.getAmountDue(), false);
        html.append("</table>");
        html.append("<div class=\"rule\"></div>");
        html.append("<div class=\"footer\"><strong>Thank you for choosing ")
                .append(escapeHtml(branding.getBrandName()))
                .append(".</strong><br />");
        html.append("MRP is GST-inclusive. Please retain this receipt for returns and compliance checks.");
        if (hasText(branding.getSupportPhone()) || hasText(branding.getSupportEmail())) {
            html.append("<br />Support: ").append(escapeHtml(buildSupportLine(branding)));
        }
        html.append("</div>");
        html.append("</div></body></html>");
        return html.toString();
    }

    private ReceiptBranding mergeBranding(Invoice invoice, ReceiptBranding overrideBranding) {
        String tenantBrandName = invoice.getStore() != null && invoice.getStore().getTenant() != null
                ? invoice.getStore().getTenant().getBrandName()
                : null;
        String tenantTagline = invoice.getStore() != null && invoice.getStore().getTenant() != null
                ? invoice.getStore().getTenant().getBrandTagline()
                : null;
        String tenantSupportEmail = invoice.getStore() != null && invoice.getStore().getTenant() != null
                ? invoice.getStore().getTenant().getSupportEmail()
                : null;
        String tenantSupportPhone = invoice.getStore() != null && invoice.getStore().getTenant() != null
                ? invoice.getStore().getTenant().getSupportPhone()
                : null;

        return ReceiptBranding.builder()
                .brandName(firstNonBlank(overrideBranding != null ? overrideBranding.getBrandName() : null, firstNonBlank(tenantBrandName, configuredBrandName)))
                .tagline(firstNonBlank(overrideBranding != null ? overrideBranding.getTagline() : null, firstNonBlank(tenantTagline, configuredTagline)))
                .supportEmail(firstNonBlank(overrideBranding != null ? overrideBranding.getSupportEmail() : null, firstNonBlank(tenantSupportEmail, configuredSupportEmail)))
                .supportPhone(firstNonBlank(overrideBranding != null ? overrideBranding.getSupportPhone() : null, firstNonBlank(tenantSupportPhone, configuredSupportPhone)))
                .build();
    }

    private String buildSupportLine(ReceiptBranding branding) {
        StringBuilder builder = new StringBuilder();
        if (hasText(branding.getSupportPhone())) {
            builder.append(branding.getSupportPhone().trim());
        }
        if (hasText(branding.getSupportEmail())) {
            if (builder.length() > 0) {
                builder.append(" • ");
            }
            builder.append(branding.getSupportEmail().trim());
        }
        return builder.toString();
    }

    private void appendMetaRow(StringBuilder html, String label, String value) {
        html.append("<tr><td class=\"meta-label\">")
                .append(escapeHtml(label))
                .append("</td><td class=\"value\">")
                .append(escapeHtml(safeText(value)))
                .append("</td></tr>");
    }

    private void appendMoneyRow(StringBuilder html, String label, BigDecimal value, boolean totalRow) {
        html.append("<tr").append(totalRow ? " class=\"total-row\"" : "").append("><td>")
                .append(escapeHtml(label))
                .append("</td><td class=\"value\">")
                .append(escapeHtml(formatMoney(value)))
                .append("</td></tr>");
    }

    private int estimatePageHeightMm(Invoice invoice, List<InvoiceItem> items) {
        int pageHeight = 118 + (items.size() * 18);
        if (invoice.getCustomer() != null) {
            pageHeight += 8;
        }
        if (invoice.getDoctorName() != null && !invoice.getDoctorName().isBlank()) {
            pageHeight += 8;
        }
        if (Boolean.TRUE.equals(invoice.getPrescriptionAttached())) {
            pageHeight += 8;
        }
        return Math.max(150, Math.min(pageHeight, 320));
    }

    private String buildStoreAddress(Invoice invoice) {
        if (invoice.getStore() == null) {
            return "Tamil Nadu, India";
        }

        StringBuilder address = new StringBuilder();
        appendAddressPart(address, invoice.getStore().getAddress());
        appendAddressPart(address, invoice.getStore().getCity());
        appendAddressPart(address, invoice.getStore().getState());
        appendAddressPart(address, invoice.getStore().getPincode());
        appendAddressPart(address, invoice.getStore().getPhone());
        return address.length() == 0 ? "Tamil Nadu, India" : address.toString();
    }

    private void appendAddressPart(StringBuilder address, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (address.length() > 0) {
            address.append(" • ");
        }
        address.append(value.trim());
    }

    private String formatMoney(BigDecimal value) {
        return "₹" + safe(value).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String formatQuantity(BigDecimal value) {
        return safe(value).stripTrailingZeros().toPlainString();
    }

    private String formatDate(LocalDateTime value) {
        return value != null ? value.format(RECEIPT_DATE_FORMAT) : "—";
    }

    private String formatExpiry(LocalDate value) {
        return value != null ? value.format(EXPIRY_DATE_FORMAT) : "—";
    }

    private String safeText(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String firstNonBlank(String primary, String fallback) {
        return hasText(primary) ? primary.trim() : fallback;
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private enum ReceiptRenderMode {
        PRINT,
        PDF
    }
}
