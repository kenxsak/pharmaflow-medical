import React, { useEffect, useMemo, useState } from 'react';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  ExpiryLossRow,
  GSTR1Row,
  GSTR3BReport,
  ReportsAPI,
  ShortageItemResponse,
} from '../../services/api';
import { usePharmaFlowContext } from '../../utils/pharmaflowContext';
import { downloadCsv } from '../../utils/exportCsv';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

const reportSteps = [
  {
    title: 'Pick month and year',
    summary: 'Change the reporting window first so GST and shortage data reflect the right period.',
    tone: 'border-sky-200 bg-sky-50 text-sky-900',
  },
  {
    title: 'Show GSTR summaries',
    summary: 'Use the KPI cards and GSTR-3B summary to explain tax payable at a glance.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  {
    title: 'Export when needed',
    summary: 'Download GSTR-1 or shortage CSV to show practical reporting output for operations.',
    tone: 'border-violet-200 bg-violet-50 text-violet-900',
  },
];

interface GSTReportsDashboardProps {
  embedded?: boolean;
}

const GSTReportsDashboard: React.FC<GSTReportsDashboardProps> = ({ embedded = false }) => {
  const context = usePharmaFlowContext();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [gstr1Rows, setGstr1Rows] = useState<GSTR1Row[]>([]);
  const [gstr3b, setGstr3b] = useState<GSTR3BReport | null>(null);
  const [shortageRows, setShortageRows] = useState<ShortageItemResponse[]>([]);
  const [expiryLossRows, setExpiryLossRows] = useState<ExpiryLossRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const storeId = context.storeId;

  useEffect(() => {
    if (!storeId) {
      setGstr1Rows([]);
      setGstr3b(null);
      setShortageRows([]);
      setExpiryLossRows([]);
      setError('Choose an active store from Setup to load GST reports.');
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      ReportsAPI.getGSTR1(storeId, month, year),
      ReportsAPI.getGSTR3B(storeId, month, year),
      ReportsAPI.getShortageReport(storeId),
      ReportsAPI.getExpiryLoss(storeId),
    ])
      .then(([gstr1Data, gstr3bData, shortageData, expiryLossData]) => {
        setGstr1Rows(gstr1Data);
        setGstr3b(gstr3bData);
        setShortageRows(shortageData);
        setExpiryLossRows(expiryLossData);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load report data.');
      })
      .finally(() => setLoading(false));
  }, [month, storeId, year]);

  const exportGstr1 = () => {
    downloadCsv(
      `gstr1-${year}-${String(month).padStart(2, '0')}.csv`,
      ['Invoice No', 'Invoice Date', 'Customer GSTIN', 'Taxable Value', 'Rate', 'CGST', 'SGST', 'IGST', 'Total'],
      gstr1Rows.map((row) => [
        row.invoiceNo,
        row.invoiceDate,
        row.customerGSTIN,
        row.taxableValue,
        row.rate,
        row.cgst,
        row.sgst,
        row.igst,
        row.totalAmount,
      ])
    );
  };

  const exportShortage = () => {
    downloadCsv(
      'shortage-report.csv',
      ['Medicine', 'Generic', 'Reorder Level', 'Strips in Stock', 'Loose Units', 'Nearest Expiry'],
      shortageRows.map((row) => [
        row.brandName,
        row.genericName,
        row.reorderLevel,
        row.quantityStrips,
        row.quantityLoose,
        row.nearestExpiryDate,
      ])
    );
  };

  const exportExpiryLoss = () => {
    downloadCsv(
      'expiry-loss-report.csv',
      ['Medicine', 'Generic', 'Manufacturer', 'Expired Batches', 'Expired Strips', 'Expired Loose', 'Estimated Loss', 'Last Expiry'],
      expiryLossRows.map((row) => [
        row.brandName,
        row.genericName,
        row.manufacturerName,
        row.expiredBatchCount,
        row.expiredStrips,
        row.expiredLoose,
        row.estimatedLossValue,
        row.lastExpiryDate,
      ])
    );
  };

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="GST and Operations Reports"
      description="Review GSTR-1, GSTR-3B, and replenishment risk for the selected store."
    >
      <div className="space-y-5">
        <section className="rounded-[2rem] border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-violet-50 p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Reports Desk
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                GST and branch reporting made presentation-ready
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                This page brings tax reports and shortage planning together so the team can move from counter billing
                into monthly compliance and branch replenishment without changing mental context.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">GSTR-1 Rows</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{gstr1Rows.length}</div>
                <div className="mt-1 text-sm text-slate-500">Invoice rows in the chosen month</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Shortage Lines</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{shortageRows.length}</div>
                <div className="mt-1 text-sm text-slate-500">Current reorder alerts in the store</div>
              </div>
                <div className="rounded-3xl bg-white p-4 shadow-sm">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Expiry Loss</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-950">{expiryLossRows.length}</div>
                  <div className="mt-1 text-sm text-slate-500">Expired stock lines with estimated loss value</div>
                </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Report Filters</h2>
              <p className="text-sm text-slate-500">Change the reporting month or year here.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Month</span>
              <select
                value={month}
                onChange={(event) => setMonth(parseInt(event.target.value, 10))}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Year</span>
              <input
                type="number"
                value={year}
                onChange={(event) => setYear(parseInt(event.target.value, 10) || today.getFullYear())}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {reportSteps.map((step, index) => (
            <div key={step.title} className={`rounded-3xl border p-5 ${step.tone}`}>
              <div className="text-sm font-semibold">Step {index + 1}</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">{step.title}</div>
              <div className="mt-1 text-sm leading-6 text-slate-600">{step.summary}</div>
            </div>
          ))}
        </section>

        {gstr3b && (
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Outward Taxable Value</div>
              <div className="mt-2 text-3xl font-semibold">{formatCurrency(gstr3b.outwardTaxableValue)}</div>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Total GST</div>
              <div className="mt-2 text-3xl font-semibold">{formatCurrency(gstr3b.totalTax)}</div>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Invoice Value</div>
              <div className="mt-2 text-3xl font-semibold">{formatCurrency(gstr3b.totalInvoiceValue)}</div>
            </div>
          </section>
        )}

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">GSTR-3B Summary</h2>
              <p className="text-sm text-slate-500">Monthly tax payable snapshot generated from invoices.</p>
            </div>
          </div>

          {gstr3b ? (
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">CGST</div>
                <div className="mt-2 text-xl font-semibold">{formatCurrency(gstr3b.cgst)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">SGST</div>
                <div className="mt-2 text-xl font-semibold">{formatCurrency(gstr3b.sgst)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">IGST</div>
                <div className="mt-2 text-xl font-semibold">{formatCurrency(gstr3b.igst)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Total Tax</div>
                <div className="mt-2 text-xl font-semibold">{formatCurrency(gstr3b.totalTax)}</div>
              </div>
            </div>
          ) : (
            !loading && <div className="text-sm text-slate-400">No GST summary available yet.</div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">GSTR-1 Invoice Register</h2>
              <p className="text-sm text-slate-500">
                Invoice-wise outward supply data for filing and audit review.
              </p>
            </div>
            <button
              type="button"
              onClick={exportGstr1}
              disabled={!gstr1Rows.length}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Invoice</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Taxable Value</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">CGST</th>
                  <th className="px-3 py-2 text-right">SGST</th>
                  <th className="px-3 py-2 text-right">IGST</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {gstr1Rows.map((row) => (
                  <tr key={row.invoiceNo} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium">{row.invoiceNo}</td>
                    <td className="px-3 py-3">
                      {new Date(row.invoiceDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-3 py-3 text-right">{formatCurrency(row.taxableValue)}</td>
                    <td className="px-3 py-3 text-right">{row.rate}%</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(row.cgst)}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(row.sgst)}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(row.igst)}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(row.totalAmount)}</td>
                  </tr>
                ))}
                {!loading && !gstr1Rows.length && (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-slate-400">
                      No invoices found for the selected month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Shortage Report</h2>
              <p className="text-sm text-slate-500">
                Medicines below reorder level so branches can raise indents before stock-outs.
              </p>
            </div>
            <button
              type="button"
              onClick={exportShortage}
              disabled={!shortageRows.length}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Medicine</th>
                  <th className="px-3 py-2 text-left">Generic</th>
                  <th className="px-3 py-2 text-right">Reorder Level</th>
                  <th className="px-3 py-2 text-right">Strips</th>
                  <th className="px-3 py-2 text-right">Loose</th>
                  <th className="px-3 py-2 text-left">Nearest Expiry</th>
                </tr>
              </thead>
              <tbody>
                {shortageRows.map((row) => (
                  <tr key={row.medicineId} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium">{row.brandName}</td>
                    <td className="px-3 py-3">{row.genericName || '—'}</td>
                    <td className="px-3 py-3 text-right">{row.reorderLevel}</td>
                    <td className="px-3 py-3 text-right">{row.quantityStrips}</td>
                    <td className="px-3 py-3 text-right">{row.quantityLoose}</td>
                    <td className="px-3 py-3">{row.nearestExpiryDate || '—'}</td>
                  </tr>
                ))}
                {!loading && !shortageRows.length && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                      No shortage items found for this store.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Expiry Loss Report</h2>
              <p className="text-sm text-slate-500">
                Quantify stock already lost to expiry so HO and branch teams can tighten vendor returns and shelf discipline.
              </p>
            </div>
            <button
              type="button"
              onClick={exportExpiryLoss}
              disabled={!expiryLossRows.length}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Medicine</th>
                  <th className="px-3 py-2 text-left">Manufacturer</th>
                  <th className="px-3 py-2 text-right">Expired Batches</th>
                  <th className="px-3 py-2 text-right">Strips</th>
                  <th className="px-3 py-2 text-right">Loose</th>
                  <th className="px-3 py-2 text-right">Loss Value</th>
                  <th className="px-3 py-2 text-left">Last Expiry</th>
                </tr>
              </thead>
              <tbody>
                {expiryLossRows.map((row) => (
                  <tr key={`${row.medicineId || row.brandName}-loss`} className="border-t border-slate-100">
                    <td className="px-3 py-3">
                      <div className="font-medium">{row.brandName}</div>
                      <div className="text-xs text-slate-500">{row.genericName || '—'}</div>
                    </td>
                    <td className="px-3 py-3">{row.manufacturerName || '—'}</td>
                    <td className="px-3 py-3 text-right">{row.expiredBatchCount}</td>
                    <td className="px-3 py-3 text-right">{row.expiredStrips}</td>
                    <td className="px-3 py-3 text-right">{row.expiredLoose}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(Number(row.estimatedLossValue || 0))}</td>
                    <td className="px-3 py-3">
                      {row.lastExpiryDate
                        ? new Date(row.lastExpiryDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                        : '—'}
                    </td>
                  </tr>
                ))}
                {!loading && !expiryLossRows.length && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-400">
                      No expired stock loss rows found for this store.
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

export default GSTReportsDashboard;
