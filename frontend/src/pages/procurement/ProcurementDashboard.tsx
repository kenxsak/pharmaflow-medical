import React, { useEffect, useMemo, useState } from 'react';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  CreditNoteResponse,
  InventoryAPI,
  PurchaseAPI,
  PurchaseImportRequest,
  PurchaseImportResponse,
  PurchaseOrderSummary,
  PurchaseImportRow,
  StockBatchResponse,
  SupplierCreateRequest,
  SupplierSummary,
} from '../../services/api';
import { usePharmaFlowContext } from '../../utils/pharmaflowContext';
import { downloadCsv } from '../../utils/exportCsv';

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
  freeQty: 0,
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
    summary: 'Use manual rows for a quick demo or CSV import for a realistic distributor file.',
    tone: 'border-violet-200 bg-violet-50 text-violet-900',
  },
];

interface ProcurementDashboardProps {
  embedded?: boolean;
}

const ProcurementDashboard: React.FC<ProcurementDashboardProps> = ({ embedded = false }) => {
  const context = usePharmaFlowContext();
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderSummary[]>([]);
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
  const [supplierDraft, setSupplierDraft] = useState<SupplierCreateRequest>({
    name: '',
    phone: '',
    gstin: '',
    contact: '',
  });
  const storeId = context.storeId;

  const loadData = async () => {
    try {
      const [supplierItems, orderItems, creditNoteItems] = await Promise.all([
        PurchaseAPI.listSuppliers(),
        PurchaseAPI.listPurchaseOrders(),
        PurchaseAPI.listCreditNotes(creditQuery, 50),
      ]);
      setSuppliers(supplierItems);
      setPurchaseOrders(orderItems);
      setCreditNotes(creditNoteItems);
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

  const recentPurchaseValue = useMemo(
    () => purchaseOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    [purchaseOrders]
  );

  const creditNotePreviewTotal = useMemo(
    () => creditItems.reduce((sum, item) => sum + (Number(item.mrp || 0) * Number(item.quantity || 0)), 0),
    [creditItems]
  );

  const recentCreditValue = useMemo(
    () => creditNotes.reduce((sum, note) => sum + Number(note.totalAmount || 0), 0),
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
    try {
      const payload: PurchaseImportRequest = {
        supplierId: selectedSupplierId,
        invoiceNumber,
        poNumber: poNumber || undefined,
        purchaseDate: purchaseDate ? new Date(`${purchaseDate}T00:00:00`).toISOString() : undefined,
        rows: rows.map((row) => ({
          ...row,
          brandName: row.brandName || undefined,
          barcode: row.barcode || undefined,
          manufactureDate: row.manufactureDate || undefined,
          freeQty: Number(row.freeQty) || 0,
          quantity: Number(row.quantity) || 0,
          purchaseRate: Number(row.purchaseRate) || 0,
          mrp: Number(row.mrp) || 0,
          gstRate: Number(row.gstRate) || 0,
        })),
      };

      const response = await PurchaseAPI.importJson(payload);
      setImportResult(response);
      setMessage(`Imported ${response.importedRows} rows successfully.`);
      resetManualForm();
      await loadData();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Unable to import purchase invoice.');
    }
  };

  const handleCsvImport = async () => {
    clearImportState();
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
          purchaseDate: purchaseDate ? new Date(`${purchaseDate}T00:00:00`).toISOString() : undefined,
        },
        csvFile
      );
      setImportResult(response);
      setMessage(`CSV import completed for invoice ${response.invoiceNumber}.`);
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
      setSupplierDraft({ name: '', phone: '', gstin: '', contact: '' });
      setMessage(`Supplier ${created.name} created.`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create supplier.');
    }
  };

  const handleCreateCreditNote = async () => {
    clearImportState();
    if (!selectedSupplierId) {
      setError('Choose a supplier before creating a credit note.');
      return;
    }
    if (!creditItems.length) {
      setError('Add at least one stock batch to the credit note.');
      return;
    }

    try {
      const response = await PurchaseAPI.createCreditNote({
        supplierId: selectedSupplierId,
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
        'freeQty',
        'purchaseRate',
        'mrp',
        'gstRate',
      ],
      [['Paracetamol 500mg', '', 'BATCH001', '2026-01-01', '2027-12-31', 10, 1, 8.5, 12, 12]]
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
                header, and then import the rows manually or through CSV. It is the fastest way to prove bulk inward
                handling in the demo.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Suppliers</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{suppliers.length}</div>
                <div className="mt-1 text-sm text-slate-500">Configured for this demo</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Purchase Orders</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{purchaseOrders.length}</div>
                <div className="mt-1 text-sm text-slate-500">Recent inward receipts available</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">PO + Credit Value</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">
                  ₹{(recentPurchaseValue + recentCreditValue).toFixed(2)}
                </div>
                <div className="mt-1 text-sm text-slate-500">Visible inward plus credit-note value</div>
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
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Supplier name</span>
                <input
                  type="text"
                  value={supplierDraft.name || ''}
                  onChange={(event) => setSupplierDraft((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Contact person</span>
                <input
                  type="text"
                  value={supplierDraft.contact || ''}
                  onChange={(event) => setSupplierDraft((prev) => ({ ...prev, contact: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Phone</span>
                <input
                  type="text"
                  value={supplierDraft.phone || ''}
                  onChange={(event) => setSupplierDraft((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">GSTIN</span>
                <input
                  type="text"
                  value={supplierDraft.gstin || ''}
                  onChange={(event) => setSupplierDraft((prev) => ({ ...prev, gstin: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleSupplierCreate}
              className="mt-4 rounded-2xl border border-slate-300 bg-slate-900 px-4 py-3 text-sm font-medium text-white"
            >
              Create Supplier
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
                <div className="mt-2">Rows imported: {importResult.importedRows}</div>
                <div>Created batches: {importResult.createdBatches}</div>
                <div>Updated batches: {importResult.updatedBatches}</div>
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
                Fast row-based entry for distributor invoices with hundreds of SKUs.
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
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Free</th>
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
                        value={row.freeQty || 0}
                        onChange={(event) => updateRow(index, { freeQty: Number(event.target.value) })}
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
            Best demo move: download the template, show the expected columns, then import a distributor file to
            prove bulk inward support.
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
              Use this area in the demo to show that RTV and supplier-credit workflows are now visible, not hidden work.
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Credit Note</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Total</th>
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
                      <td className="px-3 py-3 text-right">₹{Number(note.totalAmount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {!creditNotes.length && (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-slate-400">
                        No credit notes created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Recent Purchase Orders</h2>
              <p className="mt-1 text-sm text-slate-500">
                Use this list to show that inward imports are creating real purchase records.
              </p>
            </div>
            <div className="rounded-2xl bg-violet-50 px-4 py-2 text-sm text-violet-900">
              Total visible value: ₹{recentPurchaseValue.toFixed(2)}
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">PO</th>
                  <th className="px-3 py-2 text-left">Invoice</th>
                  <th className="px-3 py-2 text-left">Supplier</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((order) => (
                  <tr key={order.purchaseOrderId} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium">{order.poNumber}</td>
                    <td className="px-3 py-3">{order.invoiceNumber}</td>
                    <td className="px-3 py-3">{order.supplierName}</td>
                    <td className="px-3 py-3">
                      {new Date(order.poDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">₹{order.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
                {!purchaseOrders.length && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                      No purchase orders imported yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PharmaFlowShell>
  );
};

export default ProcurementDashboard;
