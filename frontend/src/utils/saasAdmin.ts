import { saveBranding } from './branding';

export type TenantStatus =
  | 'Draft'
  | 'Pilot'
  | 'Live'
  | 'Expansion'
  | 'Attention'
  | 'Suspended'
  | 'Churned';
export type BillingCycle = 'Monthly' | 'Annual';
export type SupportTier = 'Business Hours' | 'Extended' | '24x7';
export type FeaturePriority = 'Core' | 'Important' | 'Optional';
export type FeatureGroup =
  | 'Operations'
  | 'Compliance'
  | 'Commercial'
  | 'Platform'
  | 'Integrations';

export interface FeatureCatalogItem {
  id: number;
  code: string;
  title: string;
  group: FeatureGroup;
  priority: FeaturePriority;
  summary: string;
}

export interface PlanRecord {
  id: string;
  planCode?: string;
  name: string;
  description: string;
  bestFor: string;
  monthlyPriceInr: number;
  annualPriceInr: number;
  onboardingFeeInr: number;
  perStoreOverageInr: number;
  perUserOverageInr: number;
  maxStores: number;
  maxUsers: number;
  supportTier: SupportTier;
  featureCodes: string[];
}

export interface TenantRecord {
  id: string;
  tenantCode?: string;
  brandName: string;
  legalName?: string;
  slug: string;
  status: TenantStatus;
  planId: string;
  planCode?: string;
  planName?: string;
  billingCycle: BillingCycle;
  storeCount: number;
  activeUsers: number;
  deploymentMode: string;
  supportEmail: string;
  supportPhone: string;
  billingEmail: string;
  gstin: string;
  renewalDate: string;
  monthlyRecurringRevenueInr: number;
  notes: string;
}

export interface SaaSAdminState {
  plans: PlanRecord[];
  tenants: TenantRecord[];
  selectedTenantId: string;
  selectedPlanId: string;
}

const SAAS_ADMIN_STORAGE_KEY = 'pharmaflow_saas_admin_state';

export const FEATURE_CATALOG: FeatureCatalogItem[] = [
  { id: 1, code: 'Q1_MULTI_LOCATION', title: 'Multi-location management', group: 'Platform', priority: 'Core', summary: 'HO, warehouse, and branch-aware operations.' },
  { id: 2, code: 'Q2_EXPIRY_ALERTS', title: 'Expiry alerts and dump workflow', group: 'Operations', priority: 'Core', summary: '30/60/90 day alerts plus dump/RTV workflow.' },
  { id: 3, code: 'Q3_PURCHASE_IMPORT', title: 'Bulk purchase import', group: 'Operations', priority: 'Core', summary: 'CSV and distributor invoice import for hundreds of SKUs.' },
  { id: 4, code: 'Q4_SUBSTITUTES', title: 'Salt-to-brand substitute management', group: 'Operations', priority: 'Important', summary: 'Generic and branded substitute suggestions.' },
  { id: 5, code: 'Q5_H1_NARCOTIC', title: 'H1 and narcotic tracking', group: 'Compliance', priority: 'Core', summary: 'Controlled drug traceability and reporting.' },
  { id: 6, code: 'Q6_BATCH_STRIP_FIFO', title: 'Batch, strip, and FIFO handling', group: 'Operations', priority: 'Core', summary: 'Loose tablet sales with oldest batch first.' },
  { id: 7, code: 'Q7_CREDIT_NOTE_WORKFLOW', title: 'Credit note follow-up', group: 'Operations', priority: 'Important', summary: 'Outlet return to supplier and credit note reconciliation.' },
  { id: 8, code: 'Q8_RX_DIGITIZATION', title: 'Prescription digitization', group: 'Compliance', priority: 'Important', summary: 'Scan and attach prescription copies to transactions.' },
  { id: 9, code: 'Q9_LOYALTY', title: 'Centralized loyalty and discounts', group: 'Commercial', priority: 'Important', summary: 'Cross-branch loyalty earn and redeem logic.' },
  { id: 10, code: 'Q10_DELIVERY', title: 'Home delivery integration', group: 'Commercial', priority: 'Optional', summary: 'Delivery boy app and collection handling.' },
  { id: 11, code: 'Q11_GST_REPORTS', title: 'GST and GSTR reports', group: 'Compliance', priority: 'Core', summary: 'GSTR-1 and GSTR-3B generation.' },
  { id: 12, code: 'Q12_PROFIT_ANALYTICS', title: 'Profitability analytics', group: 'Commercial', priority: 'Important', summary: 'Profit by manufacturer and category.' },
  { id: 13, code: 'Q13_CREDIT_MANAGEMENT', title: 'Credit management', group: 'Commercial', priority: 'Core', summary: 'Credit limits and bill blocking.' },
  { id: 14, code: 'Q14_HYBRID_DEPLOYMENT', title: 'Cloud and local hybrid mode', group: 'Platform', priority: 'Core', summary: 'Branch-local continuity during connectivity issues.' },
  { id: 15, code: 'Q15_SUPPORT_PACK', title: '24x7 support package', group: 'Platform', priority: 'Optional', summary: 'SLA-backed enterprise support model.' },
  { id: 16, code: 'Q16_SHORTAGE_REPORT', title: 'Shortage and reorder report', group: 'Operations', priority: 'Core', summary: 'Auto-detect reorder needs based on minimum stock.' },
  { id: 17, code: 'Q17_SCHEDULE_TRACKING', title: 'Schedule H/H1/X tracking', group: 'Compliance', priority: 'Core', summary: 'Restricted medicine tracking across registers.' },
  { id: 18, code: 'Q18_DRUG_REGISTERS', title: 'Mandatory sale registers', group: 'Compliance', priority: 'Core', summary: 'Controlled drug sale registers and exports.' },
  { id: 19, code: 'Q19_PHARMACIST_AUDIT', title: 'Pharmacist login audit trail', group: 'Compliance', priority: 'Core', summary: 'Who dispensed what and when.' },
  { id: 20, code: 'Q20_INSPECTOR_REPORT', title: 'Drug Inspector reports', group: 'Compliance', priority: 'Core', summary: 'Instant monthly inspector-ready reports.' },
  { id: 21, code: 'Q21_DOCTOR_TRACKING', title: 'Doctor prescription tracking', group: 'Compliance', priority: 'Core', summary: 'Doctor name, registration, and restricted medicine link.' },
  { id: 22, code: 'Q22_PATIENT_HISTORY', title: 'Patient history', group: 'Commercial', priority: 'Important', summary: 'Prescription-linked patient purchase history.' },
  { id: 23, code: 'Q23_GST_INVOICE', title: 'GST-compliant invoicing', group: 'Compliance', priority: 'Core', summary: 'India-specific tax invoicing and numbering.' },
  { id: 24, code: 'Q24_DRUG_REGISTERS_REPEAT', title: 'Mandatory sale registers (repeat)', group: 'Compliance', priority: 'Core', summary: 'Duplicate buyer requirement for controlled registers.' },
  { id: 25, code: 'Q25_PHARMACIST_AUDIT_REPEAT', title: 'Pharmacist audit trail (repeat)', group: 'Compliance', priority: 'Core', summary: 'Duplicate buyer requirement for pharmacist-level audit.' },
  { id: 26, code: 'Q26_INSPECTOR_REPORT_REPEAT', title: 'Drug Inspector reports (repeat)', group: 'Compliance', priority: 'Core', summary: 'Duplicate buyer requirement for inspector output.' },
  { id: 27, code: 'Q27_DOCTOR_TRACKING_REPEAT', title: 'Doctor tracking (repeat)', group: 'Compliance', priority: 'Core', summary: 'Duplicate buyer requirement for doctor-linked sales.' },
  { id: 28, code: 'Q28_PATIENT_HISTORY_REPEAT', title: 'Patient history (repeat)', group: 'Commercial', priority: 'Important', summary: 'Duplicate buyer requirement for patient history.' },
  { id: 29, code: 'Q29_GST_INVOICE_REPEAT', title: 'GST invoicing (repeat)', group: 'Compliance', priority: 'Core', summary: 'Duplicate buyer requirement for GST invoices.' },
  { id: 30, code: 'Q30_BATCH_AUTO', title: 'Automatic batch tracking', group: 'Operations', priority: 'Core', summary: 'Batch numbers captured automatically across stock and sale.' },
  { id: 31, code: 'Q31_EXPIRED_BLOCK', title: 'Prevent expired sale', group: 'Operations', priority: 'Core', summary: 'Expired stock blocked from billing.' },
  { id: 32, code: 'Q32_SCHEMES', title: 'Purchase scheme tracking', group: 'Operations', priority: 'Important', summary: 'Buy 10 Get 1 and free-quantity inward handling.' },
  { id: 33, code: 'Q33_MARGIN', title: 'PTR / PTS / MRP margins', group: 'Commercial', priority: 'Important', summary: 'Margin visibility by retail and stockist pricing.' },
  { id: 34, code: 'Q34_BARCODE', title: 'Barcode scanning', group: 'Operations', priority: 'Core', summary: 'Barcode-assisted billing and lookup.' },
  { id: 35, code: 'Q35_PARTIAL_STRIP', title: 'Partial strip sales', group: 'Operations', priority: 'Core', summary: 'Tablet-level sale from strip inventory.' },
  { id: 36, code: 'Q36_TRIPLE_SEARCH', title: 'Brand, generic, and salt search', group: 'Operations', priority: 'Core', summary: 'Three-way medicine search for fast billing.' },
  { id: 37, code: 'Q37_ANALYTICS_EXPORT', title: 'Daily sales and exportable analytics', group: 'Commercial', priority: 'Important', summary: 'Sales, top movers, profit, expiry loss, and Excel export.' },
  { id: 38, code: 'Q38_ROLES', title: 'Different user roles', group: 'Platform', priority: 'Core', summary: 'Pharmacist, sales, manager, warehouse, admin roles.' },
  { id: 39, code: 'Q39_PRICE_RESTRICT', title: 'Restrict price editing', group: 'Platform', priority: 'Core', summary: 'Role-guarded pricing changes.' },
  { id: 40, code: 'Q40_BILL_AUDIT', title: 'Track bill edits', group: 'Compliance', priority: 'Core', summary: 'Invoice edit audit trail.' },
  { id: 41, code: 'Q41_ACTIVITY_AUDIT', title: 'Activity audit log', group: 'Compliance', priority: 'Core', summary: 'Cross-module activity audit trail.' },
  { id: 42, code: 'Q42_UNLIMITED_DOCS', title: 'Unlimited invoices and documents', group: 'Platform', priority: 'Core', summary: 'No hard limit on invoices, indents, purchases, or bills.' },
  { id: 43, code: 'Q43_INTEGRATIONS', title: 'Integrations and notifications', group: 'Integrations', priority: 'Important', summary: 'Tally, GST filing, WhatsApp, e-commerce, online pharmacy, SMS, and future APIs.' },
];

const featureCodes = (ids: number[]) =>
  FEATURE_CATALOG.filter((feature) => ids.includes(feature.id)).map((feature) => feature.code);

const DEFAULT_PLANS: PlanRecord[] = [
  {
    id: 'launch',
    name: 'Launch',
    description: 'For a single pharmacy or a very small pilot rollout.',
    bestFor: '1 to 3 stores starting billing, inventory, and compliance.',
    monthlyPriceInr: 14999,
    annualPriceInr: 149990,
    onboardingFeeInr: 35000,
    perStoreOverageInr: 2500,
    perUserOverageInr: 1500,
    maxStores: 3,
    maxUsers: 20,
    supportTier: 'Business Hours',
    featureCodes: featureCodes([2, 3, 4, 5, 6, 8, 11, 13, 16, 17, 18, 19, 20, 21, 22, 23, 30, 31, 32, 34, 35, 36, 38, 39, 40, 41, 42]),
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For regional operators running multi-branch operations.',
    bestFor: '5 to 25 stores with HO oversight and cross-branch processes.',
    monthlyPriceInr: 39999,
    annualPriceInr: 399990,
    onboardingFeeInr: 90000,
    perStoreOverageInr: 2000,
    perUserOverageInr: 1250,
    maxStores: 25,
    maxUsers: 150,
    supportTier: 'Extended',
    featureCodes: featureCodes([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43]),
  },
  {
    id: 'chain',
    name: 'Chain',
    description: 'For large branded retail chains with warehouse and HO governance.',
    bestFor: '25 to 300 stores with stronger visibility and rollout support.',
    monthlyPriceInr: 99999,
    annualPriceInr: 999990,
    onboardingFeeInr: 250000,
    perStoreOverageInr: 1500,
    perUserOverageInr: 1000,
    maxStores: 300,
    maxUsers: 1200,
    supportTier: '24x7',
    featureCodes: featureCodes(Array.from({ length: 43 }, (_, index) => index + 1).filter((id) => id !== 10)),
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plus',
    description: 'For chains needing rollout services, delivery, integrations, and 24x7 coverage.',
    bestFor: '300+ stores or premium deployments with custom integration scope.',
    monthlyPriceInr: 199999,
    annualPriceInr: 1999990,
    onboardingFeeInr: 500000,
    perStoreOverageInr: 1250,
    perUserOverageInr: 800,
    maxStores: 9999,
    maxUsers: 5000,
    supportTier: '24x7',
    featureCodes: featureCodes(Array.from({ length: 43 }, (_, index) => index + 1)),
  },
];

const DEFAULT_TENANTS: TenantRecord[] = [
  {
    id: 'tenant-posible',
    brandName: 'Posible Rx',
    slug: 'posible-rx',
    status: 'Expansion',
    planId: 'chain',
    billingCycle: 'Annual',
    storeCount: 300,
    activeUsers: 1180,
    deploymentMode: 'Hybrid cloud + branch-local operations',
    supportEmail: 'support@posible.in',
    supportPhone: '+91 44 5555 0100',
    billingEmail: 'finance@posible.in',
    gstin: '33AABCP1234A1Z5',
    renewalDate: '2027-04-01',
    monthlyRecurringRevenueInr: 99999,
    notes: 'Tamil Nadu enterprise chain rollout with HO, warehouse, and branch expansion plan.',
  },
  {
    id: 'tenant-pharmaflow',
    brandName: 'PharmaFlow',
    slug: 'pharmaflow',
    status: 'Live',
    planId: 'enterprise',
    billingCycle: 'Annual',
    storeCount: 5,
    activeUsers: 65,
    deploymentMode: 'Hybrid cloud + branch-local operations',
    supportEmail: 'support@pharmaflow.in',
    supportPhone: '+91 44 4000 9000',
    billingEmail: 'finance@pharmaflow.in',
    gstin: '33AABCP1234A1Z5',
    renewalDate: '2027-03-31',
    monthlyRecurringRevenueInr: 199999,
    notes: 'Reference tenant for enterprise demo, receipts, and buyer walkthrough.',
  },
  {
    id: 'tenant-lifepill',
    brandName: 'LifePill Legacy',
    slug: 'lifepill-legacy',
    status: 'Pilot',
    planId: 'growth',
    billingCycle: 'Monthly',
    storeCount: 10,
    activeUsers: 96,
    deploymentMode: 'Legacy branch-first rollout',
    supportEmail: 'support@lifepill.com',
    supportPhone: '+94 11 700 5000',
    billingEmail: 'ops@lifepill.com',
    gstin: 'N/A',
    renewalDate: '2026-05-01',
    monthlyRecurringRevenueInr: 39999,
    notes: 'Legacy login and cashier flow used for compatibility demonstrations.',
  },
];

const DEFAULT_STATE: SaaSAdminState = {
  plans: DEFAULT_PLANS,
  tenants: DEFAULT_TENANTS,
  selectedTenantId: DEFAULT_TENANTS[0].id,
  selectedPlanId: DEFAULT_PLANS[2].id,
};

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const readSaasAdminState = (): SaaSAdminState => {
  if (!canUseStorage()) {
    return DEFAULT_STATE;
  }

  const rawValue = window.localStorage.getItem(SAAS_ADMIN_STORAGE_KEY);
  if (!rawValue) {
    return DEFAULT_STATE;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SaaSAdminState>;
    return {
      plans: parsed.plans?.length ? parsed.plans : DEFAULT_PLANS,
      tenants: parsed.tenants?.length ? parsed.tenants : DEFAULT_TENANTS,
      selectedTenantId: parsed.selectedTenantId || DEFAULT_TENANTS[0].id,
      selectedPlanId: parsed.selectedPlanId || DEFAULT_PLANS[2].id,
    };
  } catch (error) {
    console.error('Unable to parse SaaS admin state', error);
    return DEFAULT_STATE;
  }
};

export const saveSaasAdminState = (state: SaaSAdminState) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(SAAS_ADMIN_STORAGE_KEY, JSON.stringify(state));
};

export const createEmptyTenant = (
  seed: number,
  planId = 'launch',
  planCode = 'launch',
  planName = 'Launch',
  monthlyRecurringRevenueInr = 14999
): TenantRecord => ({
  id: `tenant-${seed}`,
  tenantCode: `TENANT-${seed}`,
  brandName: 'New Brand',
  legalName: '',
  slug: `new-brand-${seed}`,
  status: 'Pilot',
  planId,
  planCode,
  planName,
  billingCycle: 'Monthly',
  storeCount: 1,
  activeUsers: 5,
  deploymentMode: 'Hybrid cloud + branch-local operations',
  supportEmail: 'support@example.com',
  supportPhone: '+91 00000 00000',
  billingEmail: 'finance@example.com',
  gstin: '',
  renewalDate: new Date().toISOString().slice(0, 10),
  monthlyRecurringRevenueInr,
  notes: 'New tenant draft',
});

export const createEmptyPlan = (seed: number): PlanRecord => ({
  id: `plan-${seed}`,
  planCode: `plan-${seed}`,
  name: 'New plan',
  description: 'Tenant subscription plan',
  bestFor: 'Custom rollout',
  monthlyPriceInr: 0,
  annualPriceInr: 0,
  onboardingFeeInr: 0,
  perStoreOverageInr: 0,
  perUserOverageInr: 0,
  maxStores: 1,
  maxUsers: 5,
  supportTier: 'Business Hours',
  featureCodes: [],
});

export const applyTenantBranding = (tenant: TenantRecord) => {
  saveBranding({
    brandName: tenant.brandName,
    supportEmail: tenant.supportEmail,
    supportPhone: tenant.supportPhone,
    deploymentMode: tenant.deploymentMode,
    tagline: `Multi-store pharmacy SaaS for ${tenant.brandName}`,
  });
};

export const formatInr = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export const calculateAnnualRunRate = (mrr: number) => mrr * 12;

export const calculateTotalMrr = (tenants: TenantRecord[]) =>
  tenants.reduce((sum, tenant) => sum + tenant.monthlyRecurringRevenueInr, 0);

export const countEntitlements = (plan: PlanRecord) => plan.featureCodes.length;

export const isFeatureEnabledForPlan = (plan: PlanRecord, featureCode: string) =>
  plan.featureCodes.includes(featureCode);
