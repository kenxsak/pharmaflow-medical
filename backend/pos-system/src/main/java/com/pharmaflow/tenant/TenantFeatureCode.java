package com.pharmaflow.tenant;

import java.util.Arrays;
import java.util.Optional;

public enum TenantFeatureCode {
    Q1_MULTI_LOCATION(1, "Q1_MULTI_LOCATION", "Multi-location management", FeatureGroup.PLATFORM, FeaturePriority.CORE, "HO, warehouse, and branch-aware operations."),
    Q2_EXPIRY_ALERTS(2, "Q2_EXPIRY_ALERTS", "Expiry alerts and dump workflow", FeatureGroup.OPERATIONS, FeaturePriority.CORE, "30, 60, and 90-day alerts plus dump and return-to-vendor workflow."),
    Q3_PURCHASE_IMPORT(3, "Q3_PURCHASE_IMPORT", "Bulk purchase import", FeatureGroup.OPERATIONS, FeaturePriority.CORE, "CSV and distributor invoice import for high-SKU inwarding."),
    Q4_SUBSTITUTES(4, "Q4_SUBSTITUTES", "Salt-to-brand substitute management", FeatureGroup.OPERATIONS, FeaturePriority.IMPORTANT, "Generic and branded substitute suggestions based on salt mapping."),
    Q5_H1_NARCOTIC(5, "Q5_H1_NARCOTIC", "H1 and narcotic tracking", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "Controlled drug traceability and reporting."),
    Q6_BATCH_STRIP_FIFO(6, "Q6_BATCH_STRIP_FIFO", "Batch, strip, and FIFO handling", FeatureGroup.OPERATIONS, FeaturePriority.CORE, "Loose tablet sales with oldest non-expired batch first."),
    Q7_CREDIT_NOTE_WORKFLOW(7, "Q7_CREDIT_NOTE_WORKFLOW", "Credit note follow-up", FeatureGroup.OPERATIONS, FeaturePriority.IMPORTANT, "Outlet return to supplier and credit note reconciliation."),
    Q8_RX_DIGITIZATION(8, "Q8_RX_DIGITIZATION", "Prescription digitization", FeatureGroup.COMPLIANCE, FeaturePriority.IMPORTANT, "Scan and attach prescription copies to transactions."),
    Q9_LOYALTY(9, "Q9_LOYALTY", "Centralized loyalty and discounts", FeatureGroup.COMMERCIAL, FeaturePriority.IMPORTANT, "Cross-branch loyalty earn and redeem support."),
    Q10_DELIVERY(10, "Q10_DELIVERY", "Home delivery integration", FeatureGroup.COMMERCIAL, FeaturePriority.OPTIONAL, "Delivery app and order collection handling."),
    Q11_GST_REPORTS(11, "Q11_GST_REPORTS", "GST and GSTR reports", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "GSTR-1 and GSTR-3B report generation."),
    Q12_PROFIT_ANALYTICS(12, "Q12_PROFIT_ANALYTICS", "Profitability analytics", FeatureGroup.COMMERCIAL, FeaturePriority.IMPORTANT, "Profit by manufacturer and category."),
    Q13_CREDIT_MANAGEMENT(13, "Q13_CREDIT_MANAGEMENT", "Credit management", FeatureGroup.COMMERCIAL, FeaturePriority.CORE, "Credit limits and billing block when exceeded."),
    Q14_HYBRID_DEPLOYMENT(14, "Q14_HYBRID_DEPLOYMENT", "Cloud and local hybrid mode", FeatureGroup.PLATFORM, FeaturePriority.CORE, "Branch-local continuity during connectivity issues."),
    Q15_SUPPORT_PACK(15, "Q15_SUPPORT_PACK", "24x7 support package", FeatureGroup.PLATFORM, FeaturePriority.OPTIONAL, "SLA-backed enterprise support."),
    Q16_SHORTAGE_REPORT(16, "Q16_SHORTAGE_REPORT", "Shortage and reorder report", FeatureGroup.OPERATIONS, FeaturePriority.CORE, "Auto-detect reorder needs using minimum stock levels."),
    Q17_SCHEDULE_TRACKING(17, "Q17_SCHEDULE_TRACKING", "Schedule H/H1/X tracking", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "Restricted medicine tracking across sale registers."),
    Q18_DRUG_REGISTERS(18, "Q18_DRUG_REGISTERS", "Mandatory sale registers", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "Controlled drug sale registers and exports."),
    Q19_PHARMACIST_AUDIT(19, "Q19_PHARMACIST_AUDIT", "Pharmacist login audit trail", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "Who dispensed what and when."),
    Q20_INSPECTOR_REPORT(20, "Q20_INSPECTOR_REPORT", "Drug Inspector reports", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "Instant monthly inspector-ready reports."),
    Q21_DOCTOR_TRACKING(21, "Q21_DOCTOR_TRACKING", "Doctor prescription tracking", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "Doctor name, registration, and restricted medicine linkage."),
    Q22_PATIENT_HISTORY(22, "Q22_PATIENT_HISTORY", "Patient history", FeatureGroup.COMMERCIAL, FeaturePriority.IMPORTANT, "Prescription-linked patient purchase history."),
    Q23_GST_INVOICE(23, "Q23_GST_INVOICE", "GST-compliant invoicing", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "India-specific tax invoicing and financial-year numbering."),
    Q24_DRUG_REGISTERS_REPEAT(24, "Q24_DRUG_REGISTERS_REPEAT", "Mandatory sale registers (repeat)", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "Duplicate buyer requirement for controlled registers."),
    Q25_PHARMACIST_AUDIT_REPEAT(25, "Q25_PHARMACIST_AUDIT_REPEAT", "Pharmacist audit trail (repeat)", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "Duplicate buyer requirement for pharmacist-level audit."),
    Q26_INSPECTOR_REPORT_REPEAT(26, "Q26_INSPECTOR_REPORT_REPEAT", "Drug Inspector reports (repeat)", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "Duplicate buyer requirement for inspector output."),
    Q27_DOCTOR_TRACKING_REPEAT(27, "Q27_DOCTOR_TRACKING_REPEAT", "Doctor tracking (repeat)", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "Duplicate buyer requirement for doctor-linked sales."),
    Q28_PATIENT_HISTORY_REPEAT(28, "Q28_PATIENT_HISTORY_REPEAT", "Patient history (repeat)", FeatureGroup.COMMERCIAL, FeaturePriority.IMPORTANT, "Duplicate buyer requirement for patient history."),
    Q29_GST_INVOICE_REPEAT(29, "Q29_GST_INVOICE_REPEAT", "GST invoicing (repeat)", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "Duplicate buyer requirement for GST invoices."),
    Q30_BATCH_AUTO(30, "Q30_BATCH_AUTO", "Automatic batch tracking", FeatureGroup.OPERATIONS, FeaturePriority.CORE, "Batch numbers captured automatically across stock and sale."),
    Q31_EXPIRED_BLOCK(31, "Q31_EXPIRED_BLOCK", "Prevent expired sale", FeatureGroup.OPERATIONS, FeaturePriority.CORE, "Expired stock blocked from billing."),
    Q32_SCHEMES(32, "Q32_SCHEMES", "Purchase scheme tracking", FeatureGroup.OPERATIONS, FeaturePriority.IMPORTANT, "Buy 10 Get 1 and free-quantity inward handling."),
    Q33_MARGIN(33, "Q33_MARGIN", "PTR / PTS / MRP margins", FeatureGroup.COMMERCIAL, FeaturePriority.IMPORTANT, "Margin visibility by retail and stockist pricing."),
    Q34_BARCODE(34, "Q34_BARCODE", "Barcode scanning", FeatureGroup.OPERATIONS, FeaturePriority.CORE, "Barcode-assisted billing and lookup."),
    Q35_PARTIAL_STRIP(35, "Q35_PARTIAL_STRIP", "Partial strip sales", FeatureGroup.OPERATIONS, FeaturePriority.CORE, "Tablet-level sale from strip inventory."),
    Q36_TRIPLE_SEARCH(36, "Q36_TRIPLE_SEARCH", "Brand, generic, and salt search", FeatureGroup.OPERATIONS, FeaturePriority.CORE, "Three-way medicine search for fast billing."),
    Q37_ANALYTICS_EXPORT(37, "Q37_ANALYTICS_EXPORT", "Daily sales and exportable analytics", FeatureGroup.COMMERCIAL, FeaturePriority.IMPORTANT, "Sales, top movers, profit, expiry loss, and exportable analytics."),
    Q38_ROLES(38, "Q38_ROLES", "Different user roles", FeatureGroup.PLATFORM, FeaturePriority.CORE, "Pharmacist, sales, manager, warehouse, and admin roles."),
    Q39_PRICE_RESTRICT(39, "Q39_PRICE_RESTRICT", "Restrict price editing", FeatureGroup.PLATFORM, FeaturePriority.CORE, "Role-guarded pricing changes."),
    Q40_BILL_AUDIT(40, "Q40_BILL_AUDIT", "Track bill edits", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "Invoice edit audit trail."),
    Q41_ACTIVITY_AUDIT(41, "Q41_ACTIVITY_AUDIT", "Activity audit log", FeatureGroup.COMPLIANCE, FeaturePriority.CORE, "Cross-module activity audit trail."),
    Q42_UNLIMITED_DOCS(42, "Q42_UNLIMITED_DOCS", "Unlimited invoices and documents", FeatureGroup.PLATFORM, FeaturePriority.CORE, "No hard limit on invoices, indents, purchases, or bills."),
    Q43_INTEGRATIONS(43, "Q43_INTEGRATIONS", "Integrations and notifications", FeatureGroup.INTEGRATIONS, FeaturePriority.IMPORTANT, "Tally, GST filing, WhatsApp, e-commerce, SMS, and future APIs.");

    private final int questionNumber;
    private final String code;
    private final String title;
    private final FeatureGroup group;
    private final FeaturePriority priority;
    private final String summary;

    TenantFeatureCode(int questionNumber, String code, String title, FeatureGroup group, FeaturePriority priority, String summary) {
        this.questionNumber = questionNumber;
        this.code = code;
        this.title = title;
        this.group = group;
        this.priority = priority;
        this.summary = summary;
    }

    public int getQuestionNumber() {
        return questionNumber;
    }

    public String getCode() {
        return code;
    }

    public String getTitle() {
        return title;
    }

    public FeatureGroup getGroup() {
        return group;
    }

    public FeaturePriority getPriority() {
        return priority;
    }

    public String getSummary() {
        return summary;
    }

    public static Optional<TenantFeatureCode> fromCode(String code) {
        return Arrays.stream(values())
                .filter(item -> item.code.equalsIgnoreCase(code) || item.name().equalsIgnoreCase(code))
                .findFirst();
    }
}
