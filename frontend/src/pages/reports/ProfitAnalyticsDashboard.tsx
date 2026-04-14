import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  DailySalesRow,
  MedicinePerformanceRow,
  ProfitReportResponse,
  ProfitReportRow,
  ReportsAPI,
  SalesSummaryResponse,
} from '../../services/api';
import { usePharmaFlowContext } from '../../utils/pharmaflowContext';
import { downloadCsv } from '../../utils/exportCsv';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

const analyticsSteps = [
  {
    title: 'Pick month and year',
    summary: 'Keep the reporting window explicit so margin and sales numbers are easy to explain.',
    tone: 'border-sky-200 bg-sky-50 text-sky-900',
  },
  {
    title: 'Read the top summary',
    summary: 'Invoice count, sales, average bill, and estimated profit tell the story quickly.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  {
    title: 'Drill into manufacturer and category',
    summary: 'Show which brands or therapeutic groups are contributing the most margin.',
    tone: 'border-violet-200 bg-violet-50 text-violet-900',
  },
];

const DailySalesTable: React.FC<{
  rows: DailySalesRow[];
  onExport: () => void;
}> = ({ rows, onExport }) => (
  <section className="rounded-3xl bg-white p-5 shadow-sm">
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-lg font-semibold">Daily Sales by Date</h2>
        <p className="text-sm text-slate-500">Use this when HO asks how the month built up day by day.</p>
      </div>
      <button
        type="button"
        onClick={onExport}
        disabled={!rows.length}
        className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        Export CSV
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-right">Bills</th>
            <th className="px-3 py-2 text-right">Cash</th>
            <th className="px-3 py-2 text-right">UPI</th>
            <th className="px-3 py-2 text-right">Card</th>
            <th className="px-3 py-2 text-right">Credit</th>
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.saleDate} className="border-t border-slate-100">
              <td className="px-3 py-3 font-medium">
                {new Date(row.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
              <td className="px-3 py-3 text-right">{row.invoiceCount}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(Number(row.cashSales || 0))}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(Number(row.upiSales || 0))}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(Number(row.cardSales || 0))}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(Number(row.creditSales || 0))}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(Number(row.totalSales || 0))}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={7} className="px-3 py-10 text-center text-slate-400">
                No daily sales rows found for this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const MedicineMovementTable: React.FC<{
  title: string;
  subtitle: string;
  rows: MedicinePerformanceRow[];
  onExport: () => void;
}> = ({ title, subtitle, rows, onExport }) => (
  <section className="rounded-3xl bg-white p-5 shadow-sm">
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onExport}
        disabled={!rows.length}
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
            <th className="px-3 py-2 text-right">Sold Qty</th>
            <th className="px-3 py-2 text-right">Sales</th>
            <th className="px-3 py-2 text-right">Profit</th>
            <th className="px-3 py-2 text-right">Stock Strips</th>
            <th className="px-3 py-2 text-right">Stock Loose</th>
            <th className="px-3 py-2 text-left">Movement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${title}-${row.medicineId || row.brandName}`} className="border-t border-slate-100">
              <td className="px-3 py-3">
                <div className="font-medium">{row.brandName}</div>
                <div className="text-xs text-slate-500">{row.genericName || '—'}</div>
              </td>
              <td className="px-3 py-3">{row.manufacturerName || '—'}</td>
              <td className="px-3 py-3 text-right">{Number(row.soldQuantity || 0).toFixed(2)}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(Number(row.salesValue || 0))}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(Number(row.estimatedProfit || 0))}</td>
              <td className="px-3 py-3 text-right">{row.currentStockStrips || 0}</td>
              <td className="px-3 py-3 text-right">{row.currentStockLoose || 0}</td>
              <td className="px-3 py-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {row.velocityLabel}
                </span>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={8} className="px-3 py-10 text-center text-slate-400">
                No medicine movement rows found for this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const ProfitTable: React.FC<{
  title: string;
  rows: ProfitReportRow[];
  onExport: () => void;
}> = ({ title, rows, onExport }) => (
  <section className="rounded-3xl bg-white p-5 shadow-sm">
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-slate-500">Estimated profit grouped from billed quantities and batch purchase cost.</p>
      </div>
      <button
        type="button"
        onClick={onExport}
        disabled={!rows.length}
        className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        Export CSV
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">Group</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Revenue</th>
            <th className="px-3 py-2 text-right">Estimated Cost</th>
            <th className="px-3 py-2 text-right">Profit</th>
            <th className="px-3 py-2 text-right">Margin %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.groupName} className="border-t border-slate-100">
              <td className="px-3 py-3 font-medium">{row.groupName}</td>
              <td className="px-3 py-3 text-right">{Number(row.quantity || 0).toFixed(2)}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(Number(row.revenue || 0))}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(Number(row.estimatedCost || 0))}</td>
              <td className="px-3 py-3 text-right">{formatCurrency(Number(row.estimatedProfit || 0))}</td>
              <td className="px-3 py-3 text-right">{Number(row.marginPct || 0).toFixed(2)}%</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                No analytics rows found for this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

interface ProfitAnalyticsDashboardProps {
  embedded?: boolean;
}

const ProfitAnalyticsDashboard: React.FC<ProfitAnalyticsDashboardProps> = ({ embedded = false }) => {
  const context = usePharmaFlowContext();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [salesSummary, setSalesSummary] = useState<SalesSummaryResponse | null>(null);
  const [profitReport, setProfitReport] = useState<ProfitReportResponse | null>(null);
  const [dailySalesRows, setDailySalesRows] = useState<DailySalesRow[]>([]);
  const [topSellingRows, setTopSellingRows] = useState<MedicinePerformanceRow[]>([]);
  const [slowMovingRows, setSlowMovingRows] = useState<MedicinePerformanceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const storeId = context.storeId;

  useEffect(() => {
    if (!storeId) {
      setSalesSummary(null);
      setProfitReport(null);
      setError('Choose an active store from Setup before opening profit analytics.');
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      ReportsAPI.getSalesSummary(storeId, month, year),
      ReportsAPI.getProfitReport(storeId, month, year),
      ReportsAPI.getDailySales(storeId, month, year),
      ReportsAPI.getTopSelling(storeId, month, year),
      ReportsAPI.getSlowMoving(storeId, month, year),
    ])
      .then(([sales, profit, dailySales, topSelling, slowMoving]) => {
        setSalesSummary(sales);
        setProfitReport(profit);
        setDailySalesRows(dailySales);
        setTopSellingRows(topSelling);
        setSlowMovingRows(slowMoving);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load sales and profit analytics.');
      })
      .finally(() => setLoading(false));
  }, [month, storeId, year]);

  const exportRows = (fileName: string, rows: ProfitReportRow[]) => {
    downloadCsv(
      fileName,
      ['Group', 'Quantity', 'Revenue', 'Estimated Cost', 'Estimated Profit', 'Margin %'],
      rows.map((row) => [
        row.groupName,
        row.quantity,
        row.revenue,
        row.estimatedCost,
        row.estimatedProfit,
        row.marginPct,
      ])
    );
  };

  const exportDailySales = () => {
    downloadCsv(
      'daily-sales.csv',
      ['Date', 'Bills', 'Cash', 'UPI', 'Card', 'Credit', 'Total'],
      dailySalesRows.map((row) => [
        row.saleDate,
        row.invoiceCount,
        row.cashSales,
        row.upiSales,
        row.cardSales,
        row.creditSales,
        row.totalSales,
      ])
    );
  };

  const exportMovementRows = (fileName: string, rows: MedicinePerformanceRow[]) => {
    downloadCsv(
      fileName,
      ['Medicine', 'Generic', 'Manufacturer', 'Sold Qty', 'Sales Value', 'Estimated Profit', 'Stock Strips', 'Stock Loose', 'Movement'],
      rows.map((row) => [
        row.brandName,
        row.genericName,
        row.manufacturerName,
        row.soldQuantity,
        row.salesValue,
        row.estimatedProfit,
        row.currentStockStrips,
        row.currentStockLoose,
        row.velocityLabel,
      ])
    );
  };

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Sales and Profit Analytics"
      description="Review monthly sales mix, estimated margin, and profit contribution by manufacturer and category."
    >
      <div className="space-y-5">
        <section className="rounded-[2rem] border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">
                Profit Desk
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Margin analytics that still feel readable for store teams
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                This page turns invoice data into something operationally useful. It shows how much the store sold,
                the average bill size, and where estimated profit is coming from by manufacturer and therapeutic category.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Invoice Count</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{salesSummary?.invoiceCount || 0}</div>
                <div className="mt-1 text-sm text-slate-500">Bills in this reporting period</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Total Sales</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">
                  {formatCurrency(Number(salesSummary?.totalSales || 0))}
                </div>
                <div className="mt-1 text-sm text-slate-500">Selected store monthly sales</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Estimated Profit</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">
                  {formatCurrency(Number(profitReport?.totalEstimatedProfit || 0))}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Margin basis from billed quantity and purchase cost
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Reporting Filters</h2>
              <p className="text-sm text-slate-500">Change the reporting month or jump to GST reports from here.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/lifepill/reports/gst"
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Open GST reports
              </Link>
              <Link
                to="/lifepill/billing-history"
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Open billing history
              </Link>
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
          {analyticsSteps.map((step, index) => (
            <div key={step.title} className={`rounded-3xl border p-5 ${step.tone}`}>
              <div className="text-sm font-semibold">Step {index + 1}</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">{step.title}</div>
              <div className="mt-1 text-sm leading-6 text-slate-600">{step.summary}</div>
            </div>
          ))}
        </section>

        {salesSummary && profitReport && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Average Bill Value</div>
              <div className="mt-2 text-3xl font-semibold">
                {formatCurrency(Number(salesSummary.averageBillValue || 0))}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Cash + UPI Mix</div>
              <div className="mt-2 text-3xl font-semibold">
                {formatCurrency(Number(salesSummary.cashSales || 0) + Number(salesSummary.upiSales || 0))}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Credit Sales</div>
              <div className="mt-2 text-3xl font-semibold">
                {formatCurrency(Number(salesSummary.creditSales || 0))}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Overall Margin</div>
              <div className="mt-2 text-3xl font-semibold">
                {Number(profitReport.overallMarginPct || 0).toFixed(2)}%
              </div>
            </div>
          </section>
        )}

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Payment Mix Snapshot</h2>
              <p className="text-sm text-slate-500">Useful for explaining billing behaviour by collection mode.</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {[
              { label: 'Cash', value: Number(salesSummary?.cashSales || 0), tone: 'bg-emerald-50 text-emerald-900' },
              { label: 'UPI', value: Number(salesSummary?.upiSales || 0), tone: 'bg-sky-50 text-sky-900' },
              { label: 'Card', value: Number(salesSummary?.cardSales || 0), tone: 'bg-violet-50 text-violet-900' },
              { label: 'Credit', value: Number(salesSummary?.creditSales || 0), tone: 'bg-amber-50 text-amber-900' },
            ].map((tile) => (
              <div key={tile.label} className={`rounded-2xl p-4 ${tile.tone}`}>
                <div className="text-xs uppercase tracking-wide opacity-70">{tile.label}</div>
                <div className="mt-2 text-xl font-semibold">{formatCurrency(tile.value)}</div>
              </div>
            ))}
          </div>
        </section>

        <DailySalesTable rows={dailySalesRows} onExport={exportDailySales} />

        <MedicineMovementTable
          title="Top Selling Medicines"
          subtitle="Shows the fastest revenue and movement lines for the current month."
          rows={topSellingRows}
          onExport={() => exportMovementRows('top-selling-medicines.csv', topSellingRows)}
        />

        <MedicineMovementTable
          title="Slow Moving Stock"
          subtitle="Highlights stocked medicines with low movement so managers can reduce excess holding."
          rows={slowMovingRows}
          onExport={() => exportMovementRows('slow-moving-stock.csv', slowMovingRows)}
        />

        <ProfitTable
          title="Profit by Manufacturer"
          rows={profitReport?.byManufacturer || []}
          onExport={() => exportRows('profit-by-manufacturer.csv', profitReport?.byManufacturer || [])}
        />

        <ProfitTable
          title="Profit by Category"
          rows={profitReport?.byCategory || []}
          onExport={() => exportRows('profit-by-category.csv', profitReport?.byCategory || [])}
        />

        {loading && (
          <div className="rounded-3xl bg-white px-6 py-12 text-center text-sm text-slate-400 shadow-sm">
            Loading sales and profit analytics...
          </div>
        )}
      </div>
    </PharmaFlowShell>
  );
};

export default ProfitAnalyticsDashboard;
