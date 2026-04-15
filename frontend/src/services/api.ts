import { getPharmaFlowApiBaseUrl } from '../utils/apiBaseUrls';

const BASE_URL = getPharmaFlowApiBaseUrl();

const getBrandingHeaders = () => ({
  'X-Brand-Name':
    localStorage.getItem('pharmaflow_brand_name') ||
    process.env.REACT_APP_BRAND_NAME ||
    process.env.REACT_APP_STORE_NAME ||
    'LifePill',
  'X-Brand-Tagline':
    localStorage.getItem('pharmaflow_brand_tagline') ||
    process.env.REACT_APP_BRAND_TAGLINE ||
    'Simple pharmacy operations, billing, and compliance workspace',
  'X-Brand-Support-Email':
    localStorage.getItem('pharmaflow_brand_support_email') ||
    process.env.REACT_APP_BRAND_SUPPORT_EMAIL ||
    'support@lifepill.com',
  'X-Brand-Support-Phone':
    localStorage.getItem('pharmaflow_brand_support_phone') ||
    process.env.REACT_APP_BRAND_SUPPORT_PHONE ||
    '+91 44 4000 9000',
});

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('pharmaflow_token') || ''}`,
  'X-Store-ID': localStorage.getItem('pharmaflow_store_id') || '',
  'X-Tenant-ID': localStorage.getItem('pharmaflow_tenant_id') || '',
  'X-Tenant-Slug': localStorage.getItem('pharmaflow_tenant_slug') || '',
  ...getBrandingHeaders(),
});

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('pharmaflow_token') || ''}`,
  'X-Store-ID': localStorage.getItem('pharmaflow_store_id') || '',
  'X-Tenant-ID': localStorage.getItem('pharmaflow_tenant_id') || '',
  'X-Tenant-Slug': localStorage.getItem('pharmaflow_tenant_slug') || '',
  ...getBrandingHeaders(),
});

const extractErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json();
    if (payload?.message) {
      return payload.message as string;
    }
    if (payload?.data) {
      return payload.data as string;
    }
  } catch (error) {
    return response.statusText || 'Request failed';
  }

  return response.statusText || 'Request failed';
};

const fetchJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
};

const fetchText = async (input: RequestInfo | URL, init?: RequestInit): Promise<string> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.text();
};

export interface BatchSnapshot {
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantityStrips: number;
  quantityLoose: number;
  expiryStatus?: string;
}

export interface MedicineSearchResult {
  medicineId: string;
  brandName: string;
  genericName: string;
  barcode?: string;
  medicineForm: string;
  strength: string;
  packSizeLabel?: string;
  manufacturer: string;
  scheduleType?: string;
  requiresRx?: boolean;
  isNarcotic?: boolean;
  isPsychotropic?: boolean;
  packSize?: number;
  mrp: number;
  gstRate: number;
  currentBatch?: BatchSnapshot;
}

export interface SubstituteResult {
  medicineId: string;
  brandName: string;
  genericName: string;
  mrp: number;
  isGeneric: boolean;
  priceDiffPct?: number;
}

export interface StockBatchResponse {
  batchId: string;
  medicineId: string;
  brandName: string;
  genericName: string;
  batchNumber: string;
  expiryDate: string;
  quantityStrips: number;
  quantityLoose: number;
  purchaseRate: number;
  mrp: number;
  expiryStatus: string;
}

export interface BillingItem {
  medicineId: string;
  batchId: string;
  quantity: number;
  unitType: 'PACK' | 'STRIP' | 'TABLET' | 'CAPSULE' | 'ML' | 'GM' | 'UNIT';
  mrp: number;
  discountPercent: number;
  gstRate: number;
}

export interface WhatsAppShareResponse {
  invoiceId: string;
  phone?: string;
  message: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  fullName: string;
  role: string;
  storeId?: string;
  storeCode?: string;
  tenantId?: string;
  tenantSlug?: string;
  brandName?: string;
  brandTagline?: string;
  supportEmail?: string;
  supportPhone?: string;
  deploymentMode?: string;
  subscriptionPlanCode?: string;
  subscriptionPlanName?: string;
  platformOwner?: boolean;
}

export interface PlatformFeatureResponse {
  id: number;
  code: string;
  title: string;
  group: string;
  priority: string;
  summary: string;
}

export interface PlatformOverviewResponse {
  tenantCount: number;
  planCount: number;
  totalMonthlyRecurringRevenueInr: number;
  annualRunRateInr: number;
  enterprisePlanTenantCount: number;
  alwaysOnSupportPlanCount: number;
}

export interface PlatformPlanResponse {
  id: string;
  planCode: string;
  name: string;
  description: string;
  bestFor: string;
  monthlyPriceInr: number;
  annualPriceInr: number;
  onboardingFeeInr: number;
  perStoreOverageInr: number;
  perUserOverageInr?: number;
  maxStores: number;
  maxUsers: number;
  supportTier: string;
  featureCodes: string[];
}

export interface PlatformPlanRequest {
  planCode: string;
  name: string;
  description: string;
  bestFor: string;
  monthlyPriceInr: number;
  annualPriceInr: number;
  onboardingFeeInr: number;
  perStoreOverageInr: number;
  perUserOverageInr?: number;
  maxStores: number;
  maxUsers: number;
  supportTier: string;
  featureCodes: string[];
}

export interface PlatformTenantResponse {
  id: string;
  tenantCode: string;
  brandName: string;
  legalName?: string;
  slug: string;
  status: string;
  planId?: string;
  planCode?: string;
  planName?: string;
  billingCycle: string;
  storeCount: number;
  activeUsers: number;
  deploymentMode: string;
  supportEmail: string;
  supportPhone: string;
  billingEmail: string;
  gstin: string;
  renewalDate?: string;
  monthlyRecurringRevenueInr: number;
  notes?: string;
}

export interface PlatformTenantRequest {
  planId?: string;
  planCode?: string;
  tenantCode?: string;
  brandName: string;
  legalName?: string;
  slug: string;
  status: string;
  billingCycle: string;
  storeCount: number;
  activeUsers: number;
  deploymentMode: string;
  supportEmail: string;
  supportPhone: string;
  billingEmail: string;
  gstin: string;
  renewalDate?: string;
  monthlyRecurringRevenueInr: number;
  notes?: string;
}

export interface PlatformTenantContextResponse {
  tenantId: string;
  tenantCode: string;
  tenantSlug: string;
  brandName: string;
  brandTagline: string;
  supportEmail: string;
  supportPhone: string;
  deploymentMode: string;
  tenantStatus: string;
  planId?: string;
  planCode?: string;
  planName?: string;
  billingCycle?: string;
  subscriptionStatus?: string;
  platformOwner: boolean;
  featureCodes: string[];
}

export interface StoreSummary {
  storeId: string;
  storeCode: string;
  storeName: string;
  storeType: string;
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
  city?: string;
  state?: string;
  gstin?: string;
}

export interface StoreOperationsKpiRow {
  storeId: string;
  storeCode: string;
  storeName: string;
  storeType: string;
  tenantId?: string;
  tenantName?: string;
  city?: string;
  state?: string;
  todaySales: number;
  monthSales: number;
  monthInvoiceCount: number;
  lowStockSkuCount: number;
  expiring30BatchCount: number;
  stockValue: number;
  nearExpiryValue: number;
  pendingTransferIn: number;
  pendingTransferOut: number;
}

export interface OperationsOverviewResponse {
  scopeLevel: string;
  scopeLabel: string;
  businessDate: string;
  month: number;
  year: number;
  storeCount: number;
  retailStoreCount: number;
  warehouseCount: number;
  headOfficeCount: number;
  totalSalesMonth: number;
  totalSalesToday: number;
  totalInvoiceCountMonth: number;
  lowStockSkuCount: number;
  expiring30BatchCount: number;
  stockValue: number;
  nearExpiryValue: number;
  pendingTransferCount: number;
  stores: StoreOperationsKpiRow[];
}

export interface TransferRecommendation {
  fromStoreId: string;
  fromStoreCode: string;
  fromStoreName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  transferableQuantityStrips: number;
}

export interface ReplenishmentRecommendation {
  targetStoreId: string;
  targetStoreCode: string;
  targetStoreName: string;
  medicineId: string;
  brandName: string;
  genericName?: string;
  manufacturerName?: string;
  medicineForm?: string;
  packSize?: number;
  packSizeLabel?: string;
  reorderLevel: number;
  currentQuantityStrips: number;
  shortageQuantityStrips: number;
  nearestExpiryDate?: string;
  preferredAction: string;
  recommendedTransferQuantityStrips: number;
  recommendedOrderQuantityStrips: number;
  supplierId?: string;
  supplierName?: string;
  lastPurchaseRate?: number;
  mrp?: number;
  gstRate?: number;
  estimatedOrderValue?: number;
  transferOptions: TransferRecommendation[];
}

export interface ReplenishmentInsightResponse {
  scopeLevel: string;
  scopeLabel: string;
  businessDate: string;
  recommendationCount: number;
  recommendations: ReplenishmentRecommendation[];
}

export interface StockTransferCreateRequest {
  fromStoreId: string;
  toStoreId: string;
  medicineId: string;
  batchId: string;
  quantityStrips: number;
  quantityLoose?: number;
}

export interface StockTransferActionResponse {
  transferId: string;
  status: string;
  fromStoreId: string;
  fromStoreCode: string;
  toStoreId: string;
  toStoreCode: string;
  medicineId: string;
  brandName: string;
  batchId: string;
  batchNumber: string;
  quantityStrips: number;
  quantityLoose: number;
  createdAt: string;
}

export interface ReorderDraftRequest {
  storeId: string;
  medicineId: string;
  supplierId?: string;
  quantity: number;
  expectedDeliveryDate?: string;
  notes?: string;
}

export interface ReorderDraftResponse {
  purchaseOrderId: string;
  poNumber: string;
  poDate: string;
  expectedDeliveryDate?: string;
  status: string;
  orderType: string;
  storeId: string;
  storeCode: string;
  medicineId: string;
  brandName: string;
  supplierId?: string;
  supplierName?: string;
  quantity: number;
  itemCount?: number;
  purchaseRate: number;
  mrp: number;
  gstRate: number;
  subtotal: number;
  totalAmount: number;
  notes?: string;
}

export interface PharmaRoleOption {
  role: string;
  label: string;
  description: string;
  canEditPrice: boolean;
  canEditBills: boolean;
  canSellScheduleH: boolean;
  canViewReports: boolean;
  canManageInventory: boolean;
}

export interface PharmaUserRecord {
  userId: string;
  username: string;
  fullName: string;
  phone?: string;
  email?: string;
  role: string;
  roleLabel?: string;
  roleDescription?: string;
  storeId?: string;
  storeCode?: string;
  storeName?: string;
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
  active?: boolean;
  platformOwner?: boolean;
  pharmacistRegNo?: string;
  canEditPrice?: boolean;
  canEditBills?: boolean;
  canSellScheduleH?: boolean;
  canViewReports?: boolean;
  canManageInventory?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface PharmaUserRequest {
  username: string;
  password?: string;
  fullName: string;
  phone?: string;
  email?: string;
  role: string;
  storeId?: string;
  tenantId?: string;
  active?: boolean;
  platformOwner?: boolean;
  pharmacistRegNo?: string;
}

export interface InvoiceHistoryItem {
  invoiceId: string;
  invoiceNo: string;
  invoiceDate: string;
  customerName?: string;
  billedByName?: string;
  paymentMode?: string;
  totalAmount: number;
  amountDue: number;
  prescriptionAttached: boolean;
  cancelled: boolean;
}

export interface AuditLogEntry {
  logId: string;
  createdAt: string;
  action: string;
  entityType?: string;
  entityId?: string;
  userName?: string;
  storeCode?: string;
  oldValue?: string;
  newValue?: string;
}

export interface SupplierSummary {
  supplierId: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  drugLicense?: string;
  address?: string;
  openPurchaseOrderCount?: number;
  receivedPurchaseOrderCount?: number;
  lastOrderDate?: string;
  lastReceiptDate?: string;
  receivedValue?: number;
}

export interface SupplierCreateRequest {
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  drugLicense?: string;
  address?: string;
}

export interface PurchaseImportRow {
  medicineId?: string;
  barcode?: string;
  brandName?: string;
  batchNumber: string;
  manufactureDate?: string;
  expiryDate: string;
  quantity: number;
  quantityLoose?: number;
  freeQty?: number;
  freeQtyLoose?: number;
  purchaseRate: number;
  mrp: number;
  gstRate?: number;
}

export interface PurchaseImportRequest {
  supplierId: string;
  invoiceNumber: string;
  poNumber?: string;
  purchaseDate?: string;
  rows: PurchaseImportRow[];
}

export interface PurchaseImportResponse {
  purchaseOrderId: string;
  poNumber: string;
  invoiceNumber: string;
  status: string;
  orderType: string;
  linkedToExistingPlan: boolean;
  importedRows: number;
  createdBatches: number;
  updatedBatches: number;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
}

export interface PurchaseOrderSummary {
  purchaseOrderId: string;
  poNumber: string;
  poDate: string;
  receivedAt?: string;
  invoiceNumber: string;
  supplierName?: string;
  createdByName?: string;
  status: string;
  orderType: string;
  supplierReference?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  itemCount?: number;
  summaryText?: string;
  subtotal: number;
  totalAmount: number;
}

export interface InvoiceRequest {
  customerId?: string;
  items: BillingItem[];
  paymentMode: 'CASH' | 'CARD' | 'UPI' | 'CREDIT';
  prescriptionUrl?: string;
  doctorName?: string;
  patientName?: string;
  patientAge?: number;
  patientAddress?: string;
  doctorRegNo?: string;
  customerState?: string;
}

export interface GstLineItemResponse {
  medicineId: string;
  batchId: string;
  quantity: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface GstCalculationResponse {
  items: GstLineItemResponse[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface InvoiceItemResponse {
  itemId: string;
  medicineId?: string;
  medicineName?: string;
  batchId?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  unitType: string;
  mrp?: number;
  discountPct?: number;
  taxableAmount?: number;
  gstRate?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  total: number;
}

export interface InvoiceResponse {
  invoiceId: string;
  invoiceNo: string;
  invoiceDate: string;
  paymentMode: string;
  customerName?: string;
  billedByName?: string;
  doctorName?: string;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  prescriptionAttached?: boolean;
  prescriptionUrl?: string;
  items: InvoiceItemResponse[];
}

export interface ExpiryAlertSummary {
  expired: StockBatchResponse[];
  expiring30Days: StockBatchResponse[];
  expiring60Days: StockBatchResponse[];
  expiring90Days: StockBatchResponse[];
  totalExpiredValue: number;
  totalAtRiskValue: number;
}

export interface CustomerLookupResponse {
  customerId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  doctorName?: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  loyaltyPoints: number;
  blocked?: boolean;
}

export interface CustomerCreateRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  doctorName?: string;
  creditLimit?: number;
  blocked?: boolean;
}

export interface PatientHistoryResponse {
  historyId: string;
  customerId?: string;
  medicineId?: string;
  medicineName?: string;
  invoiceId?: string;
  doctorName?: string;
  doctorRegNo?: string;
  prescriptionUrl?: string;
  quantity?: number;
  notes?: string;
  createdAt: string;
}

export interface ScheduleRegisterResponse {
  registerId: string;
  invoiceId?: string;
  medicineId?: string;
  medicineName?: string;
  scheduleType: string;
  saleDate: string;
  patientName: string;
  patientAge?: number;
  patientAddress?: string;
  doctorName: string;
  doctorRegNo?: string;
  quantitySold: number;
  batchNumber?: string;
  pharmacistId?: string;
  prescriptionUrl?: string;
  remarks?: string;
}

export interface GSTR1Row {
  invoiceNo: string;
  invoiceDate: string;
  customerGSTIN: string;
  taxableValue: number;
  rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface GSTR3BReport {
  outwardTaxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalInvoiceValue: number;
}

export interface ShortageItemResponse {
  medicineId: string;
  brandName: string;
  genericName?: string;
  manufacturerName?: string;
  medicineForm?: string;
  packSize?: number;
  packSizeLabel?: string;
  reorderLevel: number;
  quantityStrips: number;
  quantityLoose: number;
  suggestedOrderQty?: number;
  nearestExpiryDate?: string;
}

export interface SalesSummaryResponse {
  invoiceCount: number;
  totalSales: number;
  creditSales: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  averageBillValue: number;
}

export interface DailySalesRow {
  saleDate: string;
  invoiceCount: number;
  totalSales: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  creditSales: number;
}

export interface MedicinePerformanceRow {
  medicineId?: string;
  brandName: string;
  genericName?: string;
  manufacturerName?: string;
  soldQuantity: number;
  salesValue: number;
  estimatedProfit: number;
  currentStockStrips: number;
  currentStockLoose: number;
  velocityLabel: string;
}

export interface ExpiryLossRow {
  medicineId?: string;
  brandName: string;
  genericName?: string;
  manufacturerName?: string;
  expiredBatchCount: number;
  expiredStrips: number;
  expiredLoose: number;
  estimatedLossValue: number;
  lastExpiryDate?: string;
}

export interface ProfitReportRow {
  groupName: string;
  revenue: number;
  estimatedCost: number;
  estimatedProfit: number;
  marginPct: number;
  quantity: number;
}

export interface ProfitReportResponse {
  totalRevenue: number;
  totalEstimatedCost: number;
  totalEstimatedProfit: number;
  overallMarginPct: number;
  byManufacturer: ProfitReportRow[];
  byCategory: ProfitReportRow[];
}

export interface CreditNoteItemRequest {
  medicineId: string;
  batchId: string;
  quantity: number;
  unitType?: string;
  mrp?: number;
  reason?: string;
}

export interface CreditNoteCreateRequest {
  supplierId?: string;
  originalInvoiceId?: string;
  cnNumber?: string;
  cnType?: string;
  notes?: string;
  items: CreditNoteItemRequest[];
}

export interface CreditNoteResponse {
  creditNoteId: string;
  cnNumber: string;
  cnType?: string;
  status: string;
  supplierId?: string;
  originalInvoiceId?: string;
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export const MedicineAPI = {
  search: (query: string): Promise<MedicineSearchResult[]> =>
    fetchJson(`${BASE_URL}/medicines/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders(),
    }),

  getSubstitutes: (medicineId: string): Promise<SubstituteResult[]> =>
    fetchJson(`${BASE_URL}/medicines/${medicineId}/substitutes`, {
      headers: getHeaders(),
    }),

  lookupByBarcode: (barcode: string): Promise<MedicineSearchResult> =>
    fetchJson(`${BASE_URL}/medicines/barcode/${encodeURIComponent(barcode)}`, {
      headers: getHeaders(),
    }),

  getStock: (medicineId: string, storeId: string): Promise<StockBatchResponse[]> =>
    fetchJson(`${BASE_URL}/inventory/stock/${medicineId}?storeId=${storeId}`, {
      headers: getHeaders(),
    }),
};

export const InventoryAPI = {
  searchStock: (storeId: string, query: string, limit = 50): Promise<StockBatchResponse[]> =>
    fetchJson(
      `${BASE_URL}/inventory/search?storeId=${storeId}&q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: getHeaders(),
      }
    ),

  getReplenishmentInsights: (
    storeId?: string,
    limit = 15
  ): Promise<ReplenishmentInsightResponse> =>
    fetchJson(
      `${BASE_URL}/inventory/replenishment?limit=${limit}${storeId ? `&storeId=${encodeURIComponent(storeId)}` : ''}`,
      {
        headers: getHeaders(),
      }
    ),

  requestTransfer: (
    payload: StockTransferCreateRequest
  ): Promise<StockTransferActionResponse> =>
    fetchJson(`${BASE_URL}/inventory/transfers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }),
};

export const BillingAPI = {
  calculateGST: (
    items: BillingItem[],
    customerState?: string
  ): Promise<GstCalculationResponse> =>
    fetchJson(`${BASE_URL}/billing/calculate-gst`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ items, customerState }),
    }),

  createInvoice: (invoiceData: InvoiceRequest): Promise<InvoiceResponse> =>
    fetchJson(`${BASE_URL}/billing/invoice`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(invoiceData),
    }),

  getInvoice: (invoiceId: string): Promise<InvoiceResponse> =>
    fetchJson(`${BASE_URL}/billing/invoice/${invoiceId}`, {
      headers: getHeaders(),
    }),

  printInvoice: (invoiceId: string): Promise<string> =>
    fetchText(`${BASE_URL}/billing/invoice/${invoiceId}/print`, {
      headers: getHeaders(),
    }),

  downloadInvoicePdf: async (invoiceId: string): Promise<Blob> => {
    const response = await fetch(`${BASE_URL}/billing/invoice/${invoiceId}/pdf`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }
    return response.blob();
  },

  shareInvoiceWhatsapp: (invoiceId: string, phone?: string): Promise<WhatsAppShareResponse> =>
    fetchJson(
      `${BASE_URL}/billing/invoice/${invoiceId}/whatsapp${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`,
      {
        method: 'POST',
        headers: getHeaders(),
      }
    ),

  getInvoiceAudit: (invoiceId: string, limit = 50): Promise<AuditLogEntry[]> =>
    fetchJson(`${BASE_URL}/billing/invoice/${invoiceId}/audit?limit=${limit}`, {
      headers: getHeaders(),
    }),

  listInvoices: (
    query?: string,
    from?: string,
    to?: string,
    limit = 100
  ): Promise<InvoiceHistoryItem[]> =>
    fetchJson(
      `${BASE_URL}/billing/invoices?limit=${limit}${query ? `&query=${encodeURIComponent(query)}` : ''}${
        from ? `&from=${from}` : ''
      }${to ? `&to=${to}` : ''}`,
      {
        headers: getHeaders(),
      }
    ),
};

export const AuthAPI = {
  login: (username: string, password: string, tenantSlug?: string): Promise<AuthResponse> =>
    fetchJson(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, tenantSlug }),
    }),
};

export const CustomerAPI = {
  lookupByPhone: (phone: string): Promise<CustomerLookupResponse> =>
    fetchJson(`${BASE_URL}/customers/lookup?phone=${encodeURIComponent(phone)}`, {
      headers: getHeaders(),
    }),

  search: (storeId: string, query?: string, limit = 50): Promise<CustomerLookupResponse[]> =>
    fetchJson(
      `${BASE_URL}/customers/search?storeId=${storeId}&limit=${limit}${
        query ? `&query=${encodeURIComponent(query)}` : ''
      }`,
      {
        headers: getHeaders(),
      }
    ),

  create: (storeId: string, payload: CustomerCreateRequest): Promise<CustomerLookupResponse> =>
    fetchJson(`${BASE_URL}/customers?storeId=${storeId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }),

  get: (customerId: string): Promise<CustomerLookupResponse> =>
    fetchJson(`${BASE_URL}/customers/${customerId}`, {
      headers: getHeaders(),
    }),

  update: (customerId: string, payload: CustomerCreateRequest): Promise<CustomerLookupResponse> =>
    fetchJson(`${BASE_URL}/customers/${customerId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }),

  getHistory: (customerId: string, limit = 50): Promise<PatientHistoryResponse[]> =>
    fetchJson(`${BASE_URL}/customers/${customerId}/history?limit=${limit}`, {
      headers: getHeaders(),
    }),

  validateCredit: (
    customerId: string,
    amount: number
  ): Promise<{ valid: boolean; customerId: string; amount: number }> =>
    fetchJson(`${BASE_URL}/customers/${customerId}/validate-credit?amount=${amount}`, {
      headers: getHeaders(),
    }),

  addLoyalty: (
    customerId: string,
    points: number,
    invoiceId?: string,
    description?: string
  ): Promise<CustomerLookupResponse> =>
    fetchJson(
      `${BASE_URL}/customers/${customerId}/loyalty?points=${points}${
        invoiceId ? `&invoiceId=${encodeURIComponent(invoiceId)}` : ''
      }${description ? `&description=${encodeURIComponent(description)}` : ''}`,
      {
        method: 'POST',
        headers: getHeaders(),
      }
    ),
};

export const StoreAPI = {
  list: (): Promise<StoreSummary[]> =>
    fetchJson(`${BASE_URL}/stores`, {
      headers: getHeaders(),
    }),
};

export const UserAPI = {
  list: (query?: string): Promise<PharmaUserRecord[]> =>
    fetchJson(
      `${BASE_URL}/users${query ? `?query=${encodeURIComponent(query)}` : ''}`,
      {
        headers: getHeaders(),
      }
    ),

  listRoles: (): Promise<PharmaRoleOption[]> =>
    fetchJson(`${BASE_URL}/users/roles`, {
      headers: getHeaders(),
    }),

  create: (payload: PharmaUserRequest): Promise<PharmaUserRecord> =>
    fetchJson(`${BASE_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }),

  update: (userId: string, payload: PharmaUserRequest): Promise<PharmaUserRecord> =>
    fetchJson(`${BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }),
};

export const AuditAPI = {
  getLogs: (
    entityType?: string,
    query?: string,
    limit = 100
  ): Promise<AuditLogEntry[]> =>
    fetchJson(
      `${BASE_URL}/audit/logs?limit=${limit}${entityType ? `&entityType=${encodeURIComponent(entityType)}` : ''}${
        query ? `&query=${encodeURIComponent(query)}` : ''
      }`,
      {
        headers: getHeaders(),
      }
    ),

  getEntityLogs: (
    entityType: string,
    entityId: string,
    limit = 100
  ): Promise<AuditLogEntry[]> =>
    fetchJson(
      `${BASE_URL}/audit/entity?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(
        entityId
      )}&limit=${limit}`,
      {
        headers: getHeaders(),
      }
    ),
};

export const ComplianceAPI = {
  getScheduleRegister: (
    storeId: string,
    from: string,
    to: string,
    schedule?: string
  ): Promise<ScheduleRegisterResponse[]> =>
    fetchJson(
      `${BASE_URL}/compliance/schedule-register?storeId=${storeId}&from=${from}&to=${to}${
        schedule ? `&schedule=${schedule}` : ''
      }`,
      {
        headers: getHeaders(),
      },
    ),

  getDrugInspectorReport: (
    storeId: string,
    month: number,
    year: number,
    schedule?: string
  ): Promise<ScheduleRegisterResponse[]> =>
    fetchJson(
      `${BASE_URL}/compliance/drug-inspector-report?storeId=${storeId}&month=${month}&year=${year}${
        schedule ? `&schedule=${schedule}` : ''
      }`,
      {
        headers: getHeaders(),
      },
    ),

  getNarcoticReport: (
    storeId: string,
    month: number,
    year: number
  ): Promise<ScheduleRegisterResponse[]> =>
    fetchJson(
      `${BASE_URL}/compliance/narcotic-report?storeId=${storeId}&month=${month}&year=${year}`,
      {
        headers: getHeaders(),
      },
    ),
};

export const ReportsAPI = {
  getOperationsOverview: (month: number, year: number): Promise<OperationsOverviewResponse> =>
    fetchJson(`${BASE_URL}/reports/operations-overview?month=${month}&year=${year}`, {
      headers: getHeaders(),
    }),

  getGSTR1: (storeId: string, month: number, year: number): Promise<GSTR1Row[]> =>
    fetchJson(`${BASE_URL}/reports/gstr1?storeId=${storeId}&month=${month}&year=${year}`, {
      headers: getHeaders(),
    }),

  getGSTR3B: (storeId: string, month: number, year: number): Promise<GSTR3BReport> =>
    fetchJson(`${BASE_URL}/reports/gstr3b?storeId=${storeId}&month=${month}&year=${year}`, {
      headers: getHeaders(),
    }),

  getExpiryAlerts: (storeId: string): Promise<ExpiryAlertSummary> =>
    fetchJson(`${BASE_URL}/reports/expiry-alerts?storeId=${storeId}`, {
      headers: getHeaders(),
    }),

  getShortageReport: (storeId: string): Promise<ShortageItemResponse[]> =>
    fetchJson(`${BASE_URL}/reports/shortage?storeId=${storeId}`, {
      headers: getHeaders(),
    }),

  getSalesSummary: (storeId: string, month: number, year: number): Promise<SalesSummaryResponse> =>
    fetchJson(`${BASE_URL}/reports/sales?storeId=${storeId}&month=${month}&year=${year}`, {
      headers: getHeaders(),
    }),

  getProfitReport: (storeId: string, month: number, year: number): Promise<ProfitReportResponse> =>
    fetchJson(`${BASE_URL}/reports/profit?storeId=${storeId}&month=${month}&year=${year}`, {
      headers: getHeaders(),
    }),

  getDailySales: (storeId: string, month: number, year: number): Promise<DailySalesRow[]> =>
    fetchJson(`${BASE_URL}/reports/daily-sales?storeId=${storeId}&month=${month}&year=${year}`, {
      headers: getHeaders(),
    }),

  getTopSelling: (
    storeId: string,
    month: number,
    year: number,
    limit = 10
  ): Promise<MedicinePerformanceRow[]> =>
    fetchJson(
      `${BASE_URL}/reports/top-selling?storeId=${storeId}&month=${month}&year=${year}&limit=${limit}`,
      {
        headers: getHeaders(),
      }
    ),

  getSlowMoving: (
    storeId: string,
    month: number,
    year: number,
    limit = 10
  ): Promise<MedicinePerformanceRow[]> =>
    fetchJson(
      `${BASE_URL}/reports/slow-moving?storeId=${storeId}&month=${month}&year=${year}&limit=${limit}`,
      {
        headers: getHeaders(),
      }
    ),

  getExpiryLoss: (storeId: string, limit = 10): Promise<ExpiryLossRow[]> =>
    fetchJson(`${BASE_URL}/reports/expiry-loss?storeId=${storeId}&limit=${limit}`, {
      headers: getHeaders(),
    }),
};

export const PurchaseAPI = {
  listSuppliers: (): Promise<SupplierSummary[]> =>
    fetchJson(`${BASE_URL}/purchases/suppliers`, {
      headers: getHeaders(),
    }),

  createSupplier: (payload: SupplierCreateRequest): Promise<SupplierSummary> =>
    fetchJson(`${BASE_URL}/purchases/suppliers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }),

  listPurchaseOrders: (limit = 50): Promise<PurchaseOrderSummary[]> =>
    fetchJson(`${BASE_URL}/purchases/orders?limit=${limit}`, {
      headers: getHeaders(),
    }),

  createReorderDraft: (payload: ReorderDraftRequest): Promise<ReorderDraftResponse> =>
    fetchJson(`${BASE_URL}/purchases/orders/draft`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }),

  importJson: (payload: PurchaseImportRequest): Promise<PurchaseImportResponse> =>
    fetchJson(`${BASE_URL}/purchases/import/json`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }),

  importCsv: async (
    meta: Omit<PurchaseImportRequest, 'rows'>,
    file: File
  ): Promise<PurchaseImportResponse> => {
    const formData = new FormData();
    formData.append(
      'meta',
      new Blob([JSON.stringify(meta)], { type: 'application/json' })
    );
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/purchases/import/csv`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }

    return response.json();
  },

  listCreditNotes: (query?: string, limit = 50): Promise<CreditNoteResponse[]> =>
    fetchJson(
      `${BASE_URL}/purchases/credit-notes?limit=${limit}${query ? `&query=${encodeURIComponent(query)}` : ''}`,
      {
        headers: getHeaders(),
      }
    ),

  createCreditNote: (payload: CreditNoteCreateRequest): Promise<CreditNoteResponse> =>
    fetchJson(`${BASE_URL}/purchases/credit-notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }),
};

export const PlatformAPI = {
  getOverview: (): Promise<PlatformOverviewResponse> =>
    fetchJson(`${BASE_URL}/platform/overview`, {
      headers: getHeaders(),
    }),

  listFeatures: (): Promise<PlatformFeatureResponse[]> =>
    fetchJson(`${BASE_URL}/platform/features`, {
      headers: getHeaders(),
    }),

  listPlans: (): Promise<PlatformPlanResponse[]> =>
    fetchJson(`${BASE_URL}/platform/plans`, {
      headers: getHeaders(),
    }),

  createPlan: (payload: PlatformPlanRequest): Promise<PlatformPlanResponse> =>
    fetchJson(`${BASE_URL}/platform/plans`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }),

  updatePlan: (planId: string, payload: PlatformPlanRequest): Promise<PlatformPlanResponse> =>
    fetchJson(`${BASE_URL}/platform/plans/${planId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }),

  listTenants: (): Promise<PlatformTenantResponse[]> =>
    fetchJson(`${BASE_URL}/platform/tenants`, {
      headers: getHeaders(),
    }),

  createTenant: (payload: PlatformTenantRequest): Promise<PlatformTenantResponse> =>
    fetchJson(`${BASE_URL}/platform/tenants`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }),

  updateTenant: (tenantId: string, payload: PlatformTenantRequest): Promise<PlatformTenantResponse> =>
    fetchJson(`${BASE_URL}/platform/tenants/${tenantId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }),

  getTenantContext: (): Promise<PlatformTenantContextResponse> =>
    fetchJson(`${BASE_URL}/platform/context`, {
      headers: getHeaders(),
    }),
};
