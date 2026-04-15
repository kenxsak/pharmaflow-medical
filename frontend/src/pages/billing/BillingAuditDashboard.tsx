import React, { useEffect, useMemo, useState } from 'react';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import LegacyModal from '../../shared/legacy/LegacyModal';
import {
  AuditAPI,
  AuditLogEntry,
  BillingAPI,
  DocumentAPI,
  InvoiceHistoryItem,
  InvoiceResponse,
  SalesReturnResponse,
} from '../../services/api';
import { usePharmaFlowContext } from '../../utils/pharmaflowContext';

const tryFormatJson = (value?: string) => {
  if (!value) {
    return '—';
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch (error) {
    return value;
  }
};

const billingHistorySteps = [
  {
    title: 'Search bill history',
    summary: 'Find invoices by invoice number, customer, or payment mode from one clean history desk.',
    tone: 'border-sky-200 bg-sky-50 text-sky-900',
  },
  {
    title: 'Open one invoice',
    summary: 'Show tax breakup, line items, and total from the right-side invoice detail panel.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  {
    title: 'Check the audit trail',
    summary: 'Prove who created or edited important records across invoices and inventory.',
    tone: 'border-violet-200 bg-violet-50 text-violet-900',
  },
];

interface BillingAuditDashboardProps {
  embedded?: boolean;
}

const BillingAuditDashboard: React.FC<BillingAuditDashboardProps> = ({ embedded = false }) => {
  const context = usePharmaFlowContext();
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [auditQuery, setAuditQuery] = useState('');
  const [auditEntityType, setAuditEntityType] = useState('');
  const [invoices, setInvoices] = useState<InvoiceHistoryItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedInvoiceAudit, setSelectedInvoiceAudit] = useState<AuditLogEntry[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceResponse | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [salesReturns, setSalesReturns] = useState<SalesReturnResponse[]>([]);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');
  const [returnSettlementType, setReturnSettlementType] = useState('RESTOCK');
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const storeId = context.storeId;

  const totalSales = useMemo(
    () => invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0),
    [invoices]
  );

  const totalDue = useMemo(
    () => invoices.reduce((sum, invoice) => sum + (invoice.amountDue || 0), 0),
    [invoices]
  );

  const loadInvoices = async () => {
    try {
      const invoiceItems = await BillingAPI.listInvoices(invoiceQuery);
      setInvoices(invoiceItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load invoice history.');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const logItems = await AuditAPI.getLogs(auditEntityType || undefined, auditQuery);
      setAuditLogs(logItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load audit logs.');
    }
  };

  useEffect(() => {
    if (!storeId) {
      setInvoices([]);
      setAuditLogs([]);
      setSelectedInvoiceAudit([]);
      setSelectedInvoice(null);
      setSelectedInvoiceId(null);
      setSalesReturns([]);
      return;
    }

    void Promise.all([loadInvoices(), loadAuditLogs()]);
  }, [storeId]);

  const openInvoice = async (invoiceId: string) => {
    try {
      const [invoice, invoiceAudit, invoiceReturns] = await Promise.all([
        BillingAPI.getInvoice(invoiceId),
        BillingAPI.getInvoiceAudit(invoiceId),
        BillingAPI.listSalesReturns(invoiceId),
      ]);
      setSelectedInvoice(invoice);
      setSelectedInvoiceId(invoiceId);
      setSelectedInvoiceAudit(invoiceAudit);
      setSalesReturns(invoiceReturns);
      setReturnQuantities(
        Object.fromEntries(
          invoice.items.map((item) => [item.itemId, 0])
        )
      );
      setReturnNotes('');
      setReturnSettlementType('RESTOCK');
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load invoice details.');
    }
  };

  const handlePrintInvoice = async () => {
    if (!selectedInvoice) {
      return;
    }

    try {
      const html = await BillingAPI.printInvoice(selectedInvoice.invoiceId);
      const printWindow = window.open('', '_blank', 'width=480,height=720');
      if (!printWindow) {
        throw new Error('Unable to open print window.');
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } catch (printError) {
      setError(printError instanceof Error ? printError.message : 'Unable to print invoice.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedInvoice) {
      return;
    }

    try {
      const blob = await BillingAPI.downloadInvoicePdf(selectedInvoice.invoiceId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${selectedInvoice.invoiceNo}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Unable to download invoice PDF.');
    }
  };

  const handleShareWhatsApp = async () => {
    if (!selectedInvoice) {
      return;
    }

    try {
      const phone = window.prompt('Customer WhatsApp number (optional):') || undefined;
      const payload = await BillingAPI.shareInvoiceWhatsapp(selectedInvoice.invoiceId, phone);
      const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : '';
      const whatsappUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(payload.message)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(payload.message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : 'Unable to prepare WhatsApp share.');
    }
  };

  const openReturnModal = () => {
    if (!selectedInvoice) {
      return;
    }
    setReturnQuantities(
      Object.fromEntries(selectedInvoice.items.map((item) => [item.itemId, 0]))
    );
    setReturnNotes('');
    setReturnSettlementType('RESTOCK');
    setIsReturnModalOpen(true);
  };

  const handleCreateSalesReturn = async () => {
    if (!selectedInvoice) {
      return;
    }

    const items = Object.entries(returnQuantities)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([invoiceItemId, quantity]) => ({
        invoiceItemId,
        quantity: Number(quantity),
        reason: returnNotes || undefined,
      }));

    if (!items.length) {
      setError('Enter at least one return quantity before saving the sales return.');
      return;
    }

    try {
      await BillingAPI.createSalesReturn(selectedInvoice.invoiceId, {
        settlementType: returnSettlementType,
        notes: returnNotes || undefined,
        items,
      });
      const [invoice, invoiceReturns, invoiceAudit] = await Promise.all([
        BillingAPI.getInvoice(selectedInvoice.invoiceId),
        BillingAPI.listSalesReturns(selectedInvoice.invoiceId),
        BillingAPI.getInvoiceAudit(selectedInvoice.invoiceId),
      ]);
      setSelectedInvoice(invoice);
      setSalesReturns(invoiceReturns);
      setSelectedInvoiceAudit(invoiceAudit);
      setIsReturnModalOpen(false);
      setError(null);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create sales return.');
    }
  };

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Bills and Activity Audit"
      description="Review recent bills, inspect invoice detail, and prove who changed what in the selected store."
    >
      <div className="space-y-5">
        <section className="rounded-[2rem] border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Billing Control Desk
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Clear bill history and audit visibility for managers
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Open invoice history to show bill lookup, then switch to the audit trail to prove traceability of
                invoice creation, stock events, and user actions.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Recent Invoices</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{invoices.length}</div>
                <div className="mt-1 text-sm text-slate-500">Loaded for the active store</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Visible Sales</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">₹{totalSales.toFixed(2)}</div>
                <div className="mt-1 text-sm text-slate-500">Total bill value in the list</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Audit Events</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{auditLogs.length}</div>
                <div className="mt-1 text-sm text-slate-500">Store-level events currently visible</div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {billingHistorySteps.map((step, index) => (
            <div key={step.title} className={`rounded-3xl border p-5 ${step.tone}`}>
              <div className="text-sm font-semibold">Step {index + 1}</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">{step.title}</div>
              <div className="mt-1 text-sm leading-6 text-slate-600">{step.summary}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Outstanding Credit</div>
            <div className="mt-2 text-3xl font-semibold">₹{totalDue.toFixed(2)}</div>
            <div className="mt-1 text-sm text-slate-500">Useful for reviewing customer credit exposure</div>
          </div>
          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Selected Store</div>
            <div className="mt-2 text-3xl font-semibold">{context.storeCode || 'Not selected'}</div>
            <div className="mt-1 text-sm text-slate-500">Bill history always follows the active branch context</div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Invoice History</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search by invoice number, customer, or payment mode.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={invoiceQuery}
                  onChange={(event) => setInvoiceQuery(event.target.value)}
                  placeholder="Search invoices"
                  className="rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void loadInvoices()}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Invoice</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Billed By</th>
                    <th className="px-3 py-2 text-left">Mode</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-right">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.invoiceId}
                      className={`border-t border-slate-100 cursor-pointer hover:bg-sky-50 ${
                        selectedInvoiceId === invoice.invoiceId ? 'bg-sky-50' : ''
                      }`}
                      onClick={() => void openInvoice(invoice.invoiceId)}
                    >
                      <td className="px-3 py-3 font-medium">{invoice.invoiceNo}</td>
                      <td className="px-3 py-3">
                        {new Date(invoice.invoiceDate).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-3 py-3">{invoice.customerName || 'Walk-in'}</td>
                      <td className="px-3 py-3">{invoice.billedByName || '—'}</td>
                      <td className="px-3 py-3">{invoice.paymentMode || '—'}</td>
                      <td className="px-3 py-3 text-right">₹{invoice.totalAmount.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right">₹{invoice.amountDue.toFixed(2)}</td>
                    </tr>
                  ))}
                  {!invoices.length && (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-slate-400">
                        No invoices found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Invoice Detail</h2>
            {!selectedInvoice && (
              <div className="mt-6 rounded-3xl bg-slate-50 px-4 py-12 text-center text-sm text-slate-400">
                Select an invoice from the list to inspect line items and tax breakdown.
              </div>
            )}

            {selectedInvoice && (
              <div className="mt-4 space-y-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="font-semibold">{selectedInvoice.invoiceNo}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {selectedInvoice.customerName || 'Walk-in customer'} • {selectedInvoice.paymentMode}
                      </div>
                      {selectedInvoice.billedByName && (
                        <div className="mt-1 text-xs text-slate-500">Billed by {selectedInvoice.billedByName}</div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handlePrintInvoice()}
                        className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                      >
                        Print
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDownloadPdf()}
                        className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium"
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleShareWhatsApp()}
                        className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800"
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={openReturnModal}
                        className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800"
                      >
                        Sales return
                      </button>
                    </div>
                  </div>
                  {(selectedInvoice.doctorName || selectedInvoice.prescriptionAttached) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedInvoice.doctorName && (
                        <div className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-800">
                          Doctor: {selectedInvoice.doctorName}
                        </div>
                      )}
                      {selectedInvoice.prescriptionAttached && (
                        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                          Prescription attached
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>Subtotal: ₹{selectedInvoice.subtotal.toFixed(2)}</div>
                    <div>Discount: ₹{selectedInvoice.discountAmount.toFixed(2)}</div>
                    <div>CGST: ₹{selectedInvoice.cgstAmount.toFixed(2)}</div>
                    <div>SGST: ₹{selectedInvoice.sgstAmount.toFixed(2)}</div>
                    <div>IGST: ₹{selectedInvoice.igstAmount.toFixed(2)}</div>
                    <div className="font-medium">Total: ₹{selectedInvoice.totalAmount.toFixed(2)}</div>
                    <div>Paid: ₹{selectedInvoice.amountPaid.toFixed(2)}</div>
                    <div>Due: ₹{selectedInvoice.amountDue.toFixed(2)}</div>
                  </div>
                  {selectedInvoice.prescriptionUrl && (
                    <button
                      type="button"
                      onClick={() => void DocumentAPI.openProtectedDocument(selectedInvoice.prescriptionUrl!)}
                      className="mt-3 inline-flex text-sm font-medium text-sky-700 underline"
                    >
                      Open prescription reference
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Medicine</th>
                        <th className="px-3 py-2 text-left">Batch</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">GST</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.itemId} className="border-t border-slate-100">
                          <td className="px-3 py-3">
                            <div className="font-medium">{item.medicineName}</div>
                            <div className="text-xs text-slate-500">
                              {item.unitType} • MRP ₹{Number(item.mrp || 0).toFixed(2)} • Disc{' '}
                              {Number(item.discountPct || 0).toFixed(0)}%
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            <div>{item.batchNumber || '—'}</div>
                            <div className="text-xs text-slate-500">{item.expiryDate || '—'}</div>
                          </td>
                          <td className="px-3 py-3 text-right">{item.quantity}</td>
                          <td className="px-3 py-3 text-right">{Number(item.gstRate || 0).toFixed(0)}%</td>
                          <td className="px-3 py-3 text-right">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">Sales Return Ledger</div>
                      <div className="mt-1 text-xs text-slate-600">
                        Linked returns restore stock against the original invoice items.
                      </div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs text-slate-600">
                      {salesReturns.length} return{salesReturns.length === 1 ? '' : 's'}
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {salesReturns.map((salesReturn) => (
                      <div key={salesReturn.returnId} className="rounded-2xl bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-slate-900">{salesReturn.returnNumber}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {new Date(salesReturn.createdAt).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}{' '}
                              • {salesReturn.createdByName || 'System'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">
                              ₹{Number(salesReturn.totalAmount || 0).toFixed(2)}
                            </div>
                            <div className="text-xs text-slate-500">{salesReturn.status}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-600">
                          {salesReturn.items
                            .map((item) => `${item.medicineName || 'Item'} x ${Number(item.quantity || 0)}`)
                            .join(', ')}
                        </div>
                      </div>
                    ))}
                    {!salesReturns.length && (
                      <div className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-slate-400">
                        No sales returns created yet for this invoice.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">Invoice Audit</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Actions related to this invoice only.
                      </div>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {selectedInvoiceAudit.length} events
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {selectedInvoiceAudit.map((log) => (
                      <div key={log.logId} className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-slate-900">{log.action}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {new Date(log.createdAt).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">{log.userName || 'System'}</div>
                        </div>
                      </div>
                    ))}
                    {!selectedInvoiceAudit.length && (
                      <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                        No invoice-specific audit entries yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Audit Trail</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search recent store-level actions such as invoice creation, price override, and purchase imports.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={auditEntityType}
                onChange={(event) => setAuditEntityType(event.target.value)}
                className="rounded-2xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">All entity types</option>
                <option value="INVOICE">Invoice</option>
                <option value="INVOICE_ITEM">Invoice item</option>
                <option value="INVENTORY_BATCH">Inventory batch</option>
              </select>
              <input
                type="text"
                value={auditQuery}
                onChange={(event) => setAuditQuery(event.target.value)}
                placeholder="Search action or user"
                className="rounded-2xl border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void loadAuditLogs()}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {auditLogs.map((log) => (
              <div key={log.logId} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{log.action}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </div>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs text-slate-600">
                    {log.entityType || 'General'}
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  <div>User: {log.userName || 'System'}</div>
                  <div>Entity ID: {log.entityId || '—'}</div>
                  <div>Store: {log.storeCode || '—'}</div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Old</div>
                    <pre className="max-h-48 overflow-auto rounded-2xl bg-white p-3 text-xs text-slate-700">
                      {tryFormatJson(log.oldValue)}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">New</div>
                    <pre className="max-h-48 overflow-auto rounded-2xl bg-white p-3 text-xs text-slate-700">
                      {tryFormatJson(log.newValue)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!auditLogs.length && (
            <div className="mt-4 rounded-3xl bg-slate-50 px-4 py-12 text-center text-sm text-slate-400">
              No audit logs found for the selected filters.
            </div>
          )}
        </section>
      </div>

      <LegacyModal
        open={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Create sales return"
        description="Select the original invoice lines and the quantity being returned. Stock will be restored against the original batch."
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsReturnModalOpen(false)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleCreateSalesReturn()}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Save return
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Settlement type</span>
              <select
                value={returnSettlementType}
                onChange={(event) => setReturnSettlementType(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-3 py-3"
              >
                <option value="RESTOCK">Restock</option>
                <option value="REFUND">Refund</option>
                <option value="CREDIT_NOTE">Credit note</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Return notes</span>
              <input
                type="text"
                value={returnNotes}
                onChange={(event) => setReturnNotes(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-3 py-3"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Medicine</th>
                  <th className="px-3 py-2 text-left">Batch</th>
                  <th className="px-3 py-2 text-right">Sold qty</th>
                  <th className="px-3 py-2 text-right">Return qty</th>
                </tr>
              </thead>
              <tbody>
                {(selectedInvoice?.items || []).map((item) => (
                  <tr key={item.itemId} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium">{item.medicineName}</td>
                    <td className="px-3 py-3">{item.batchNumber || '—'}</td>
                    <td className="px-3 py-3 text-right">{item.quantity}</td>
                    <td className="px-3 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        step="0.001"
                        value={returnQuantities[item.itemId] ?? 0}
                        onChange={(event) =>
                          setReturnQuantities((current) => ({
                            ...current,
                            [item.itemId]: Number(event.target.value) || 0,
                          }))
                        }
                        className="w-24 rounded-xl border border-slate-300 px-2 py-1 text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </LegacyModal>
    </PharmaFlowShell>
  );
};

export default BillingAuditDashboard;
