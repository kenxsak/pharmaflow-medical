import React, { useEffect, useMemo, useState } from 'react';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  CreditNoteResponse,
  InventoryAPI,
  PurchaseAPI,
  PurchaseImportRequest,
  PurchaseImportResponse,
  PurchaseOrderSummary,
  PurchaseReceiptSummary,
  PurchaseImportRow,
  StockBatchResponse,
  SupplierCreateRequest,
  SupplierSummary,
} from '../../services/api';
import LegacyModal from '../../shared/legacy/LegacyModal';
import { usePharmaFlowContext } from '../../utils/pharmaflowContext';
import { downloadCsv } from '../../utils/exportCsv';
import { formatDateAsStartOfDayLocalDateTime } from '../../utils/dateTime';

interface CreditDraftItem extends StockBatchResponse {
  quantity: number;
  unitType: 'STRIP' | 'TABLET';
  reason: string;
}

const createEmptyRow = (): PurchaseImportRow => ({
  brandName: '',
  barcode: '',
  batchNumber: '',
  manufactureDate: '',
  expiryDate: '',
  quantity: 1,
  quantityLoose: 0,
  freeQty: 0,
  freeQtyLoose: 0,
  purchaseRate: 0,
  mrp: 0,
  gstRate: 12,
});

const procurementSteps = [
  {
    title: 'Create or choose supplier',
    summary: 'Add the distributor once, then reuse the same supplier for every inward invoice.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  {
    title: 'Enter invoice details',
    summary: 'Set the supplier invoice number, PO number, and inward date before importing rows.',
    tone: 'border-sky-200 bg-sky-50 text-sky-900',
  },
  {
    title: 'Import rows or CSV',
    summary: 'Use manual rows for quick inward entry or upload a distributor CSV when the invoice is large.',
    tone: 'border-violet-200 bg-violet-50 text-violet-900',
  },
];

const formatDate = (value?: string) => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('en-IN', { dateStyle: 'medium' });
};

const getReceiptStateTone = (state?: string) => {
  switch ((state || '').toUpperCase()) {
    case 'RECEIVED':
      return 'bg-emerald-100 text-emerald-800';
    case 'PARTIALLY_RECEIVED':
      return 'bg-amber-100 text-amber-800';
    case 'SHORT_CLOSED':
      return 'bg-slate-200 text-slate-800';
    case 'PLANNED':
      return 'bg-violet-100 text-violet-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getInvoiceMatchTone = (state?: string) => {
  switch ((state || '').toUpperCase()) {
    case 'MATCHED':
      return 'bg-emerald-100 text-emerald-800';
    case 'PARTIALLY_MATCHED':
      return 'bg-amber-100 text-amber-800';
    case 'SHORT_CLOSED':
      return 'bg-slate-200 text-slate-800';
    case 'INVOICE_MISSING':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getSettlementTone = (state?: string) => {
  switch ((state || '').toUpperCase()) {
    case 'CURRENT':
      return 'bg-emerald-100 text-emerald-800';
    case 'RECEIPT_IN_PROGRESS':
      return 'bg-amber-100 text-amber-800';
    case 'CLAIM_PENDING':
      return 'bg-rose-100 text-rose-800';
    case 'SHORT_CLOSED':
      return 'bg-slate-200 text-slate-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

interface ProcurementDashboardProps {
  embedded?: boolean;
}

const ProcurementDashboard: React.FC<ProcurementDashboardProps> = ({ embedded = false }) => {
  const context = usePharmaFlowContext();
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderSummary[]>([]);
  const [purchaseReceipts, setPurchaseReceipts] = useState<PurchaseReceiptSummary[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNoteResponse[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [rows, setRows] = useState<PurchaseImportRow[]>([createEmptyRow()]);
  const [creditQuery, setCreditQuery] = useState('');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockSearchResults, setStockSearchResults] = useState<StockBatchResponse[]>([]);
  const [creditItems, setCreditItems] = useState<CreditDraftItem[]>([]);
  const [creditNoteNumber, setCreditNoteNumber] = useState('');
  const [creditNoteType, setCreditNoteType] = useState('VENDOR_RETURN');
  const [creditNoteNotes, setCreditNoteNotes] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<PurchaseImportResponse | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierDraft, setSupplierDraft] = useState<SupplierCreateRequest>({
    name: '',
    phone: '',
    gstin: '',
    contact: '',
    defaultLeadTimeDays: 2,
  });
  const storeId = context.storeId;

  const loadData = async () => {
    try {
      const [supplierItems, orderItems, creditNoteItems, receiptItems] = await Promise.all([
        PurchaseAPI.listSuppliers(),
        PurchaseAPI.listPurchaseOrders(),
        PurchaseAPI.listCreditNotes(creditQuery, 50),
        PurchaseAPI.listReceipts(),
      ]);
      setSuppliers(supplierItems);
      setPurchaseOrders(orderItems);
      setCreditNotes(creditNoteItems);
      setPurchaseReceipts(receiptItems);
      if (!selectedSupplierId && supplierItems.length > 0) {
        setSelectedSupplierId(supplierItems[0].supplierId);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load procurement data.');
    }
  };

  useEffect(() => {
    if (!storeId) {
      setSuppliers([]);
      setPurchaseOrders([]);
      setPurchaseReceipts([]);
      setCreditNotes([]);
      setSelectedSupplierId('');
      setStockSearchResults([]);
      setCreditItems([]);
      return;
    }

    void loadData();
  }, [creditQuery, storeId]);

  const totalPreview = useMemo(
    () =>
      rows.reduce(
        (sum, row) => sum + (Number(row.purchaseRate) || 0) * (Number(row.quantity) || 0),
        0
      ),
    [rows]
  );

  const creditNotePreviewTotal = useMemo(
    () => creditItems.reduce((sum, item) => sum + (Number(item.mrp || 0) * Number(item.quantity || 0)), 0),
    [creditItems]
  );

  const recentCreditValue = useMemo(
    () => creditNotes.reduce((sum, note) => sum + Number(note.totalAmount || 0), 0),
    [creditNotes]
  );

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.supplierId === selectedSupplierId) || null,
    [selectedSupplierId, suppliers]
  );

  const plannedOrders = useMemo(
    () =>
      purchaseOrders.filter(
        (order) =>
          order.orderType === 'PLANNED_ORDER' &&
          order.status !== 'RECEIVED' &&
          order.status !== 'CANCELLED' &&
          order.status !== 'SHORT_CLOSED'
      ),
    [purchaseOrders]
  );

  const plannedOrderValue = useMemo(
    () => plannedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    [plannedOrders]
  );

  const receivedPurchaseValue = useMemo(
    () => purchaseReceipts.reduce((sum, receipt) => sum + Number(receipt.totalAmount || 0), 0),
    [purchaseReceipts]
  );

  const partiallyReceivedOrders = useMemo(
    () =>
      purchaseOrders.filter(
        (order) => (order.receiptState || order.status || '').toUpperCase() === 'PARTIALLY_RECEIVED'
      ),
    [purchaseOrders]
  );

  const supplierSettlementReviewCount = useMemo(
    () =>
      purchaseOrders.filter(
        (order) => (order.supplierSettlementState || '').toUpperCase() === 'CLAIM_PENDING'
      ).length,
    [purchaseOrders]
  );

  const pendingClaimValue = useMemo(
    () =>
      creditNotes
        .filter((note) => !['SETTLED', 'CANCELLED', 'WRITEOFF'].includes((note.claimState || '').toUpperCase()))
        .reduce((sum, note) => sum + Number(note.claimAmount || note.totalAmount || 0), 0),
    [creditNotes]
  );

  const unresolvedCreditNotes = useMemo(
    () =>
      creditNotes.filter(
        (note) => !['SETTLED', 'CANCELLED', 'WRITEOFF'].includes((note.claimState || '').toUpperCase())
      ),
    [creditNotes]
  );

  const updateRow = (index: number, partial: Partial<PurchaseImportRow>) => {
    setRows((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, ...partial } : row))
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, rowIndex) => rowIndex !== index)));
  };

  const clearImportState = () => {
    setMessage(null);
    setError(null);
    setImportResult(null);
  };

  const resetManualForm = () => {
    setInvoiceNumber('');
    setPoNumber('');
    setPurchaseDate('');
    setRows([createEmptyRow()]);
  };

  const handleCreditBatchSearch = async (query: string) => {
    setStockSearchQuery(query);
    if (!storeId || query.trim().length < 2) {
      setStockSearchResults([]);
      return;
    }

    try {
      const items = await InventoryAPI.searchStock(storeId, query.trim(), 20);
      setStockSearchResults(items);
      setError(null);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Unable to search stock for credit note.');
    }
  };

  const addCreditItem = (item: StockBatchResponse) => {
    setCreditItems((prev) => {
      if (prev.some((row) => row.batchId === item.batchId)) {
        return prev;
      }
      return [
        ...prev,
        {
          ...item,
          quantity: 1,
          unitType: 'STRIP',
          reason: 'Vendor return',
        },
      ];
    });
    setStockSearchQuery('');
    setStockSearchResults([]);
  };

  const updateCreditItem = (batchId: string, partial: Partial<CreditDraftItem>) => {
    setCreditItems((prev) =>
      prev.map((item) => (item.batchId === batchId ? { ...item, ...partial } : item))
    );
  };

  const removeCreditItem = (batchId: string) => {
    setCreditItems((prev) => prev.filter((item) => item.batchId !== batchId));
  };

  const handleManualImport = async () => {
    clearImportState();
    if (!selectedSupplierId) {
      setError('Choose or create a supplier before importing stock.');
      return;
    }
    if (!invoiceNumber.trim()) {
      setError('Enter the supplier invoice number before importing stock.');
      return;
    }
    try {
      const payload: PurchaseImportRequest = {
        supplierId: selectedSupplierId,
        invoiceNumber,
        poNumber: poNumber || undefined,
        purchaseDate: purchaseDate ? formatDateAsStartOfDayLocalDateTime(purchaseDate) : undefined,
        rows: rows.map((row) => ({
          ...row,
          brandName: row.brandName || undefined,
          barcode: row.barcode || undefined,
          manufactureDate: row.manufactureDate || undefined,
          quantityLoose: Number(row.quantityLoose) || 0,
          freeQty: Number(row.freeQty) || 0,
          freeQtyLoose: Number(row.freeQtyLoose) || 0,
          quantity: Number(row.quantity) || 0,
          purchaseRate: Number(row.purchaseRate) || 0,
          mrp: Number(row.mrp) || 0,
          gstRate: Number(row.gstRate) || 0,
        })),
      };

      const response = await PurchaseAPI.importJson(payload);
      setImportResult(response);
      setMessage(
        response.linkedToExistingPlan
          ? response.receiptState === 'PARTIALLY_RECEIVED'
            ? `Receipt ${response.receiptNumber} posted to planned PO ${response.poNumber}. ${response.receivedLineCount || 0} lines are now received and ${response.pendingLineCount || 0} are still pending.`
            : `Receipt ${response.receiptNumber} completed planned PO ${response.poNumber}.`
          : `Receipt ${response.receiptNumber} posted successfully for invoice ${response.invoiceNumber}.`
      );
      resetManualForm();
      await loadData();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Unable to import purchase invoice.');
    }
  };

  const handleCsvImport = async () => {
    clearImportState();
    if (!selectedSupplierId) {
      setError('Choose or create a supplier before importing stock.');
      return;
    }
    if (!invoiceNumber.trim()) {
      setError('Enter the supplier invoice number before importing stock.');
      return;
    }
    if (!csvFile) {
      setError('Choose a CSV file before importing.');
      return;
    }

    try {
      const response = await PurchaseAPI.importCsv(
        {
          supplierId: selectedSupplierId,
          invoiceNumber,
          poNumber: poNumber || undefined,
          purchaseDate: purchaseDate ? formatDateAsStartOfDayLocalDateTime(purchaseDate) : undefined,
        },
        csvFile
      );
      setImportResult(response);
      setMessage(
        response.linkedToExistingPlan
          ? response.receiptState === 'PARTIALLY_RECEIVED'
            ? `CSV receipt ${response.receiptNumber} posted to planned PO ${response.poNumber}. ${response.pendingLineCount || 0} planned lines are still pending receipt.`
            : `CSV receipt ${response.receiptNumber} completed planned PO ${response.poNumber}.`
          : `CSV receipt ${response.receiptNumber} completed for invoice ${response.invoiceNumber}.`
      );
      setCsvFile(null);
      setInvoiceNumber('');
      setPoNumber('');
      setPurchaseDate('');
      await loadData();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Unable to import CSV.');
    }
  };

  const handleSupplierCreate = async () => {
    clearImportState();
    try {
      const created = await PurchaseAPI.createSupplier(supplierDraft);
      setSuppliers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedSupplierId(created.supplierId);
      setSupplierDraft({ name: '', phone: '', gstin: '', contact: '', defaultLeadTimeDays: 2 });
      setIsSupplierModalOpen(false);
      setMessage(`Supplier ${created.name} created.`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create supplier.');
    }
  };

  const handleCreateCreditNote = async () => {
    clearImportState();
    if (creditNoteType !== 'DUMP' && !selectedSupplierId) {
      setError('Choose a supplier before creating a credit note.');
      return;
    }
    if (!creditItems.length) {
      setError('Add at least one stock batch to the credit note.');
      return;
    }

    try {
      const response = await PurchaseAPI.createCreditNote({
        supplierId: creditNoteType === 'DUMP' ? undefined : selectedSupplierId,
        cnNumber: creditNoteNumber || undefined,
        cnType: creditNoteType,
        notes: creditNoteNotes || undefined,
        items: creditItems.map((item) => ({
          medicineId: item.medicineId,
          batchId: item.batchId,
          quantity: Number(item.quantity || 0),
          unitType: item.unitType,
          mrp: Number(item.mrp || 0),
          reason: item.reason || undefined,
        })),
      });
      setCreditNoteNumber('');
      setCreditNoteType('VENDOR_RETURN');
      setCreditNoteNotes('');
      setCreditItems([]);
      setMessage(`Credit note ${response.cnNumber} created successfully.`);
      await loadData();
    } catch (creditError) {
      setError(creditError instanceof Error ? creditError.message : 'Unable to create credit note.');
    }
  };

  const handleDispatchCreditNote = async (creditNoteId: string) => {
    clearImportState();
    try {
      const response = await PurchaseAPI.dispatchCreditNote(creditNoteId);
      setMessage(`Credit note ${response.cnNumber} dispatched to supplier.`);
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to dispatch credit note.');
    }
  };

  const handleAcknowledgeCreditNote = async (creditNoteId: string) => {
    clearImportState();
    try {
      const response = await PurchaseAPI.acknowledgeCreditNote(creditNoteId);
      setMessage(`Credit note ${response.cnNumber} acknowledged by supplier.`);
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to acknowledge credit note.');
    }
  };

  const handleSettleCreditNote = async (note: CreditNoteResponse) => {
    clearImportState();
    const defaultAmount = Number(note.claimAmount || note.totalAmount || 0).toFixed(2);
    const rawAmount = window.prompt(`Settled amount for ${note.cnNumber}`, defaultAmount);
    if (rawAmount === null) {
      return;
    }
    const rawNotes = window.prompt('Settlement notes (optional)') || undefined;
    try {
      const response = await PurchaseAPI.settleCreditNote(note.creditNoteId, {
        settledAmount: Number(rawAmount),
        notes: rawNotes,
      });
      setMessage(`Credit note ${response.cnNumber} settled.`);
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to settle credit note.');
    }
  };

  const handleCancelCreditNote = async (creditNoteId: string) => {
    clearImportState();
    try {
      const response = await PurchaseAPI.cancelCreditNote(creditNoteId);
      setMessage(`Credit note ${response.cnNumber} cancelled and stock restored.`);
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to cancel credit note.');
    }
  };

  const handleCloseShortReceipt = async (order: PurchaseOrderSummary) => {
    clearImportState();
    const reason = window.prompt(
      `Short-close reason for ${order.poNumber}`,
      order.closeReason || 'SHORT_SUPPLY'
    );
    if (reason === null) {
      return;
    }
    const notes = window.prompt('Short-close notes (optional)', order.notes || '') || undefined;
    try {
      const response = await PurchaseAPI.closeShortReceipt(order.purchaseOrderId, {
        reason,
        notes,
      });
      setMessage(
        `PO ${response.poNumber} short-closed with reason ${response.closeReason || 'SHORT_SUPPLY'}.`
      );
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to short-close purchase order.');
    }
  };

  const downloadTemplate = () => {
    downloadCsv(
      'purchase-import-template.csv',
      [
        'brandName',
        'barcode',
        'batchNumber',
        'manufactureDate',
        'expiryDate',
        'quantity',
        'quantityLoose',
        'freeQty',
        'freeQtyLoose',
        'purchaseRate',
        'mrp',
        'gstRate',
      ],
      [['Paracetamol 500mg', '', 'BATCH001', '2026-01-01', '2027-12-31', 10, 0, 1, 0, 8.5, 12, 12]]
    );
  };

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Purchases and Inward Stock"
      description="Create suppliers, import distributor invoices, and bring stock into the branch without manual bill-by-bill entry."
    >
      <div className="space-y-5">
        <section className="rounded-[2rem] border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-sky-50 p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">
                Procurement Desk
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Simple inward workflow for a first-store rollout
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                This page is designed for real pharmacy staff: create the supplier, enter the distributor invoice
                header, and then import the rows manually or through CSV. It keeps inward stock work organized for
                regular branch operations as well as rollout presentations.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Suppliers</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{suppliers.length}</div>
                <div className="mt-1 text-sm text-slate-500">Configured for the active workspace</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Planned Orders</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{plannedOrders.length}</div>
                <div className="mt-1 text-sm text-slate-500">Supplier orders waiting for inward receipt</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Partial Receipts</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{partiallyReceivedOrders.length}</div>
                <div className="mt-1 text-sm text-slate-500">Orders received in stages and still open</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Settlement Review</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{supplierSettlementReviewCount}</div>
                <div className="mt-1 text-sm text-slate-500">Supplier orders with unresolved claim follow-up</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Pipeline + Credit Value</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">
                  ₹{(plannedOrderValue + recentCreditValue).toFixed(2)}
                </div>
                <div className="mt-1 text-sm text-slate-500">Open supplier pipeline plus credit-note value</div>
              </div>
            </div>
          </div>
        </section>

        {(message || error) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              error
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}
          >
            {error || message}
          </div>
        )}

        {importResult && (
          <section className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <div className="font-semibold">Latest inward receipt</div>
            <div className="mt-1">
              Receipt {importResult.receiptNumber} • PO {importResult.poNumber} • {importResult.receiptState || importResult.status} • invoices{' '}
              {importResult.invoiceCount || 0} • received lines {importResult.receivedLineCount || importResult.importedRows}
              {typeof importResult.pendingLineCount === 'number' ? ` • pending lines ${importResult.pendingLineCount}` : ''}
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {procurementSteps.map((step, index) => (
            <div key={step.title} className={`rounded-3xl border p-5 ${step.tone}`}>
              <div className="text-sm font-semibold">Step {index + 1}</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">{step.title}</div>
              <div className="mt-1 text-sm leading-6 text-slate-600">{step.summary}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Supplier Setup</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create the supplier master once so inward invoices can be mapped correctly.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
                {suppliers.length} supplier{suppliers.length === 1 ? '' : 's'}
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-950">What this flow captures</div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600">
                  <div>Distributor name, contact person, phone, and GSTIN in one clean supplier master.</div>
                  <div>Reusable supplier selection for inward invoices, credit notes, and procurement history.</div>
                  <div>Consistent supplier mapping so branch teams do not retype vendor details every time.</div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-950">Current selection</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  {selectedSupplier
                    ? `${selectedSupplier.name}${selectedSupplier.contact ? ` • ${selectedSupplier.contact}` : ''}${selectedSupplier.phone ? ` • ${selectedSupplier.phone}` : ''}`
                    : 'No supplier selected yet. Add the first supplier or choose one from the import header.'}
                </div>
                {selectedSupplier && (
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      Open POs: <span className="font-semibold text-slate-900">{selectedSupplier.openPurchaseOrderCount || 0}</span>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      Received: <span className="font-semibold text-slate-900">{selectedSupplier.receivedPurchaseOrderCount || 0}</span>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      Last order: <span className="font-semibold text-slate-900">{selectedSupplier.lastOrderDate ? formatDate(selectedSupplier.lastOrderDate) : '—'}</span>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      Last receipt: <span className="font-semibold text-slate-900">{selectedSupplier.lastReceiptDate ? formatDate(selectedSupplier.lastReceiptDate) : '—'}</span>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      Configured lead time:{' '}
                      <span className="font-semibold text-slate-900">
                        {selectedSupplier.defaultLeadTimeDays ? `${selectedSupplier.defaultLeadTimeDays} day(s)` : '—'}
                      </span>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      Effective lead time:{' '}
                      <span className="font-semibold text-slate-900">
                        {selectedSupplier.effectiveLeadTimeDays ? `${selectedSupplier.effectiveLeadTimeDays} day(s)` : '—'}
                      </span>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      Observed lead time:{' '}
                      <span className="font-semibold text-slate-900">
                        {selectedSupplier.observedLeadTimeDays != null
                          ? selectedSupplier.observedLeadTimeDays === 0
                            ? 'Same day'
                            : `${selectedSupplier.observedLeadTimeDays} day(s)`
                          : '—'}
                      </span>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      Lead time samples:{' '}
                      <span className="font-semibold text-slate-900">
                        {selectedSupplier.leadTimeSampleCount || 0}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(true)}
              className="mt-4 rounded-2xl border border-slate-300 bg-slate-900 px-4 py-3 text-sm font-medium text-white"
            >
              Add Supplier
            </button>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Import Header</h2>
                <p className="mt-1 text-sm text-slate-500">
                  These invoice details are applied to the inward batch rows below.
                </p>
              </div>
              <div className="rounded-2xl bg-sky-50 px-4 py-2 text-sm text-sky-900">
                Store: {context.storeCode || 'Not selected'}
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Supplier</span>
                <select
                  value={selectedSupplierId}
                  onChange={(event) => setSelectedSupplierId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.supplierId} value={supplier.supplierId}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Supplier invoice number</span>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(event) => setInvoiceNumber(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">PO number</span>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(event) => setPoNumber(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                />
                <span className="text-xs text-slate-500">
                  If this matches a planned PO, the inward import will complete that supplier order instead of creating a separate receipt.
                </span>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Purchase date</span>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(event) => setPurchaseDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                />
              </label>
            </div>

            {importResult && (
              <div className="mt-4 rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="font-semibold">Last import summary</div>
                <div className="mt-2">Receipt: {importResult.receiptNumber}</div>
                <div className="mt-2">Rows imported: {importResult.importedRows}</div>
                <div>Created batches: {importResult.createdBatches}</div>
                <div>Updated batches: {importResult.updatedBatches}</div>
                <div>Status: {importResult.status}</div>
                <div>Source: {importResult.linkedToExistingPlan ? 'Matched planned PO' : 'Direct inward receipt'}</div>
                <div>Total value: ₹{importResult.totalAmount.toFixed(2)}</div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Manual Import</h2>
              <p className="mt-1 text-sm text-slate-500">
                Fast row-based entry for distributor invoices with bottles, strips, syrups, loose units, and bulk SKU loads.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
              Preview subtotal: ₹{totalPreview.toFixed(2)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Brand</th>
                  <th className="px-3 py-2 text-left">Barcode</th>
                  <th className="px-3 py-2 text-left">Batch</th>
                  <th className="px-3 py-2 text-left">Mfg</th>
                  <th className="px-3 py-2 text-left">Expiry</th>
                  <th className="px-3 py-2 text-right">Packs</th>
                  <th className="px-3 py-2 text-right">Loose</th>
                  <th className="px-3 py-2 text-right">Free Packs</th>
                  <th className="px-3 py-2 text-right">Free Loose</th>
                  <th className="px-3 py-2 text-right">PTR</th>
                  <th className="px-3 py-2 text-right">MRP</th>
                  <th className="px-3 py-2 text-right">GST%</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.brandName || ''}
                        onChange={(event) => updateRow(index, { brandName: event.target.value })}
                        className="w-40 rounded-xl border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.barcode || ''}
                        onChange={(event) => updateRow(index, { barcode: event.target.value })}
                        className="w-32 rounded-xl border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.batchNumber}
                        onChange={(event) => updateRow(index, { batchNumber: event.target.value })}
                        className="w-28 rounded-xl border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="date"
                        value={row.manufactureDate || ''}
                        onChange={(event) => updateRow(index, { manufactureDate: event.target.value })}
                        className="rounded-xl border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="date"
                        value={row.expiryDate}
                        onChange={(event) => updateRow(index, { expiryDate: event.target.value })}
                        className="rounded-xl border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(event) => updateRow(index, { quantity: Number(event.target.value) })}
                        className="w-20 rounded-xl border border-slate-300 px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <input
                        type="number"
                        value={row.quantityLoose || 0}
                        onChange={(event) => updateRow(index, { quantityLoose: Number(event.target.value) })}
                        className="w-20 rounded-xl border border-slate-300 px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <input
                        type="number"
                        value={row.freeQty || 0}
                        onChange={(event) => updateRow(index, { freeQty: Number(event.target.value) })}
                        className="w-20 rounded-xl border border-slate-300 px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <input
                        type="number"
                        value={row.freeQtyLoose || 0}
                        onChange={(event) => updateRow(index, { freeQtyLoose: Number(event.target.value) })}
                        className="w-20 rounded-xl border border-slate-300 px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={row.purchaseRate}
                        onChange={(event) => updateRow(index, { purchaseRate: Number(event.target.value) })}
                        className="w-24 rounded-xl border border-slate-300 px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={row.mrp}
                        onChange={(event) => updateRow(index, { mrp: Number(event.target.value) })}
                        className="w-24 rounded-xl border border-slate-300 px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={row.gstRate || 0}
                        onChange={(event) => updateRow(index, { gstRate: Number(event.target.value) })}
                        className="w-20 rounded-xl border border-slate-300 px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="rounded-full px-3 py-1 text-rose-600 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addRow}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium"
            >
              Add Row
            </button>
            <button
              type="button"
              onClick={handleManualImport}
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white"
            >
              Import Manual Rows
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">CSV Import</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload distributor files instead of manually entering hundreds of SKUs.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium"
            >
              Download Template
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="file"
              accept=".csv"
              onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
              className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleCsvImport}
              className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white"
            >
              Import CSV File
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            Recommended workflow: download the template, confirm the expected columns, then import a distributor
            file to show how bulk inward support works.
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Credit Note Builder</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search live stock, add return lines, and create a vendor return note from the purchase desk.
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 px-4 py-2 text-sm text-amber-900">
                Preview total: ₹{creditNotePreviewTotal.toFixed(2)}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Credit note number</span>
                <input
                  type="text"
                  value={creditNoteNumber}
                  onChange={(event) => setCreditNoteNumber(event.target.value)}
                  placeholder="Optional auto-generated if blank"
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Credit note type</span>
                <select
                  value={creditNoteType}
                  onChange={(event) => setCreditNoteType(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                >
                  <option value="VENDOR_RETURN">Vendor return</option>
                  <option value="EXPIRY_RETURN">Expiry return</option>
                  <option value="DAMAGE_RETURN">Damage return</option>
                </select>
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium text-slate-700">Search batch for credit note</span>
                <input
                  type="text"
                  value={stockSearchQuery}
                  onChange={(event) => void handleCreditBatchSearch(event.target.value)}
                  placeholder="Search by brand, generic, or batch number"
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium text-slate-700">Notes</span>
                <textarea
                  value={creditNoteNotes}
                  onChange={(event) => setCreditNoteNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                />
              </label>
            </div>

            {stockSearchResults.length > 0 && (
              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-950">Matching stock batches</div>
                <div className="mt-3 space-y-2">
                  {stockSearchResults.map((item) => (
                    <button
                      key={item.batchId}
                      type="button"
                      onClick={() => addCreditItem(item)}
                      className="flex w-full items-start justify-between rounded-2xl border border-white bg-white px-4 py-3 text-left shadow-sm"
                    >
                      <div>
                        <div className="font-medium text-slate-950">{item.brandName}</div>
                        <div className="text-sm text-slate-500">
                          Batch {item.batchNumber} • Exp {item.expiryDate} • {item.quantityStrips} strips
                        </div>
                      </div>
                      <div className="text-sm font-medium text-slate-700">Add line</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Medicine</th>
                    <th className="px-3 py-2 text-left">Batch</th>
                    <th className="px-3 py-2 text-right">Available</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-left">Reason</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {creditItems.map((item) => (
                    <tr key={item.batchId} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-medium">{item.brandName}</td>
                      <td className="px-3 py-3">{item.batchNumber}</td>
                      <td className="px-3 py-3 text-right">{item.quantityStrips}</td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          min={1}
                          step="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateCreditItem(item.batchId, { quantity: Number(event.target.value) || 1 })
                          }
                          className="w-20 rounded-xl border border-slate-300 px-2 py-1 text-right"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={item.unitType}
                          onChange={(event) =>
                            updateCreditItem(item.batchId, {
                              unitType: event.target.value as CreditDraftItem['unitType'],
                            })
                          }
                          className="rounded-xl border border-slate-300 px-2 py-1"
                        >
                          <option value="STRIP">Strip</option>
                          <option value="TABLET">Tablet</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={item.reason}
                          onChange={(event) => updateCreditItem(item.batchId, { reason: event.target.value })}
                          className="w-40 rounded-xl border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeCreditItem(item.batchId)}
                          className="rounded-full px-3 py-1 text-rose-600 hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!creditItems.length && (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-slate-400">
                        Search a live batch above to add the first credit-note line.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={handleCreateCreditNote}
              className="mt-4 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-medium text-white"
            >
              Create Credit Note
            </button>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Recent Credit Notes</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Vendor returns and stock reversals created from this store.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={creditQuery}
                  onChange={(event) => setCreditQuery(event.target.value)}
                  placeholder="Search credit notes"
                  className="rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              Use this area to show that RTV and supplier-credit workflows are visible operational steps, not hidden back-office work.
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="text-xs uppercase tracking-wide text-slate-500">Pending claim value</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">₹{pendingClaimValue.toFixed(2)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="text-xs uppercase tracking-wide text-slate-500">Unresolved actions</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{unresolvedCreditNotes.length}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="text-xs uppercase tracking-wide text-slate-500">Dump / write-off notes</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">
                  {creditNotes.filter((note) => note.cnType === 'DUMP').length}
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Credit Note</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Claim</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {creditNotes.map((note) => (
                    <tr key={note.creditNoteId} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-medium">{note.cnNumber}</td>
                      <td className="px-3 py-3">{note.cnType || '—'}</td>
                      <td className="px-3 py-3">
                        {new Date(note.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                          {note.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm font-medium text-slate-900">{note.claimState || '—'}</div>
                        <div className="text-xs text-slate-500">
                          Claim ₹{Number(note.claimAmount || note.totalAmount || 0).toFixed(2)}
                          {note.settledAmount ? ` • Settled ₹${Number(note.settledAmount || 0).toFixed(2)}` : ''}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">₹{Number(note.totalAmount || 0).toFixed(2)}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {note.cnType !== 'DUMP' && note.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => void handleDispatchCreditNote(note.creditNoteId)}
                                className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700"
                              >
                                Dispatch
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleCancelCreditNote(note.creditNoteId)}
                                className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {note.cnType !== 'DUMP' && note.status === 'DISPATCHED' && (
                            <>
                              <button
                                type="button"
                                onClick={() => void handleAcknowledgeCreditNote(note.creditNoteId)}
                                className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700"
                              >
                                Acknowledge
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleSettleCreditNote(note)}
                                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                              >
                                Settle
                              </button>
                            </>
                          )}
                          {note.cnType !== 'DUMP' && note.status === 'ACKNOWLEDGED' && (
                            <button
                              type="button"
                              onClick={() => void handleSettleCreditNote(note)}
                              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                            >
                              Settle
                            </button>
                          )}
                          {note.cnType === 'DUMP' && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              Write-off
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!creditNotes.length && (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-slate-400">
                        No credit notes created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr,1.05fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Supplier Order Pipeline</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Planned purchase orders can now be inwarded in stages against the same PO until every planned line is received.
                </p>
              </div>
              <div className="rounded-2xl bg-violet-50 px-4 py-2 text-sm text-violet-900">
                Open value: ₹{plannedOrderValue.toFixed(2)}
              </div>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
              Replenishment drafts now create proper planned purchase orders. Use the same PO number during inward receipt and the system will keep the PO open until all planned lines are received and invoice matched.
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">PO</th>
                    <th className="px-3 py-2 text-left">Supplier</th>
                    <th className="px-3 py-2 text-left">Line preview</th>
                    <th className="px-3 py-2 text-left">ETA</th>
                    <th className="px-3 py-2 text-left">Receipt</th>
                    <th className="px-3 py-2 text-left">Invoice match</th>
                    <th className="px-3 py-2 text-left">Settlement</th>
                    <th className="px-3 py-2 text-right">Action</th>
                    <th className="px-3 py-2 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {plannedOrders.map((order) => (
                    <tr key={order.purchaseOrderId} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-medium">
                        <div>{order.poNumber}</div>
                        <div className="text-xs text-slate-500">{formatDate(order.poDate)}</div>
                      </td>
                      <td className="px-3 py-3">{order.supplierName || 'No supplier linked'}</td>
                      <td className="px-3 py-3">
                        <div>{order.summaryText || `${order.itemCount || 0} items`}</div>
                        {order.notes && <div className="text-xs text-slate-500">{order.notes}</div>}
                        <div className="mt-1 text-xs text-slate-500">
                          Received {order.receivedLineCount || 0} / {order.itemCount || 0}
                          {typeof order.pendingLineCount === 'number' ? ` • Pending ${order.pendingLineCount}` : ''}
                        </div>
                      </td>
                      <td className="px-3 py-3">{order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getReceiptStateTone(order.receiptState || order.status)}`}>
                          {order.receiptState || order.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getInvoiceMatchTone(order.invoiceMatchState)}`}>
                          {order.invoiceMatchState || '—'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {order.invoiceCount || 0} invoices
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getSettlementTone(order.supplierSettlementState)}`}>
                          {order.supplierSettlementState || '—'}
                        </div>
                        {(order.unresolvedClaimAmount || 0) > 0 && (
                          <div className="mt-1 text-xs text-rose-600">
                            Claim ₹{Number(order.unresolvedClaimAmount || 0).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void handleCloseShortReceipt(order)}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          Close short
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right">₹{Number(order.totalAmount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {!plannedOrders.length && (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-slate-400">
                        No planned supplier orders are waiting right now.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Receipt Register</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Confirm that each inward event now has its own GRN-style receipt header instead of only showing rolled-up PO rows.
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
                Received value: ₹{receivedPurchaseValue.toFixed(2)}
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Receipt</th>
                    <th className="px-3 py-2 text-left">PO</th>
                    <th className="px-3 py-2 text-left">Invoice</th>
                    <th className="px-3 py-2 text-left">Supplier</th>
                    <th className="px-3 py-2 text-left">Received</th>
                    <th className="px-3 py-2 text-left">Lines</th>
                    <th className="px-3 py-2 text-left">Match</th>
                    <th className="px-3 py-2 text-left">Settlement</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseReceipts.map((receipt) => (
                    <tr key={receipt.receiptId} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-medium">
                        <div>{receipt.receiptNumber}</div>
                        <div className="text-xs text-slate-500">
                          <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${getReceiptStateTone(receipt.status)}`}>
                            {receipt.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div>{receipt.poNumber || '—'}</div>
                        <div className="text-xs text-slate-500">{receipt.summaryText || 'No inward lines'}</div>
                      </td>
                      <td className="px-3 py-3">{receipt.supplierInvoiceNumber || '—'}</td>
                      <td className="px-3 py-3">{receipt.supplierName || '—'}</td>
                      <td className="px-3 py-3">
                        <div>{formatDate(receipt.receiptDate)}</div>
                        <div className="text-xs text-slate-500">
                          {receipt.receivedByName || 'Recorded by system'}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {receipt.lineCount || 0}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getInvoiceMatchTone(receipt.invoiceMatchState)}`}>
                          {receipt.invoiceMatchState || receipt.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getSettlementTone(receipt.supplierSettlementState)}`}>
                          {receipt.supplierSettlementState || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">₹{Number(receipt.totalAmount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {!purchaseReceipts.length && (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-slate-400">
                        No inward receipts recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <LegacyModal
          open={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          title="Create Supplier"
          description="Add the distributor or vendor once, then reuse the supplier for inward invoices, return notes, and follow-up."
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSupplierCreate}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
              >
                Save supplier
              </button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Supplier name</span>
                <input
                  type="text"
                  value={supplierDraft.name || ''}
                  onChange={(event) => setSupplierDraft((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-3"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Contact person</span>
                <input
                  type="text"
                  value={supplierDraft.contact || ''}
                  onChange={(event) => setSupplierDraft((prev) => ({ ...prev, contact: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-3"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Phone</span>
                <input
                  type="text"
                  value={supplierDraft.phone || ''}
                  onChange={(event) => setSupplierDraft((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-3"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">GSTIN</span>
                <input
                  type="text"
                  value={supplierDraft.gstin || ''}
                  onChange={(event) => setSupplierDraft((prev) => ({ ...prev, gstin: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-3"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Default lead time (days)</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={supplierDraft.defaultLeadTimeDays ?? ''}
                  onChange={(event) =>
                    setSupplierDraft((prev) => ({
                      ...prev,
                      defaultLeadTimeDays: event.target.value ? Number(event.target.value) : undefined,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-3 py-3"
                />
              </label>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-950">Before you save</div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600">
                <div>Use the invoice-facing supplier name so the inward team can find it quickly later.</div>
                <div>Keep GSTIN ready for reconciliation, credit notes, and branch purchase documentation.</div>
                <div>Save the main contact so follow-ups stay simple during inward and return cycles.</div>
                <div>Set the default lead time so reorder planning can suggest when the team should place the order.</div>
              </div>
            </div>
          </div>
        </LegacyModal>
      </div>
    </PharmaFlowShell>
  );
};

export default ProcurementDashboard;
