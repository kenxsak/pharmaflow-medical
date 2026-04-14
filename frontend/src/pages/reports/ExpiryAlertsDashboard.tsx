import React, { useEffect, useState } from 'react';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  ExpiryAlertSummary,
  ReportsAPI,
  ShortageItemResponse,
  StockBatchResponse,
} from '../../services/api';
import { usePharmaFlowContext } from '../../utils/pharmaflowContext';
import { downloadCsv } from '../../utils/exportCsv';

const sectionStyles: Record<string, string> = {
  expired: 'border-rose-200 bg-rose-50 text-rose-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
};

const expirySteps = [
  {
    title: 'Check expired stock first',
    summary: 'Use the red bucket to identify items that must be removed from sale immediately.',
    tone: 'border-rose-200 bg-rose-50 text-rose-900',
  },
  {
    title: 'Review 30 / 60 / 90 day risk',
    summary: 'Show proactive expiry visibility instead of finding problems only after stock ages out.',
    tone: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  {
    title: 'Use shortage with expiry',
    summary: 'Pair expiry buckets with reorder alerts to make smarter inward decisions.',
    tone: 'border-sky-200 bg-sky-50 text-sky-900',
  },
];

const AlertSection: React.FC<{
  title: string;
  items: StockBatchResponse[];
  tone: keyof typeof sectionStyles;
  onExport: () => void;
}> = ({ title, items, tone, onExport }) => (
  <section className={`rounded-3xl border p-5 shadow-sm ${sectionStyles[tone]}`}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-1 text-xs opacity-70">{items.length} items in this bucket</div>
      </div>
      <button
        type="button"
        onClick={onExport}
        disabled={!items.length}
        className="rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        Export CSV
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide opacity-70">
            <th className="px-3 py-2">Medicine</th>
            <th className="px-3 py-2">Batch</th>
            <th className="px-3 py-2">Expiry</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.batchId} className="border-t border-black/5">
              <td className="px-3 py-3 font-medium">{item.brandName}</td>
              <td className="px-3 py-3">{item.batchNumber}</td>
              <td className="px-3 py-3">{item.expiryDate}</td>
              <td className="px-3 py-3 text-right">{item.quantityStrips}</td>
              <td className="px-3 py-3 text-right">
                ₹{(item.quantityStrips * item.mrp).toFixed(2)}
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td className="px-3 py-6 text-center opacity-70" colSpan={5}>
                No items in this bucket.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const exportBatchBucket = (fileName: string, items: StockBatchResponse[]) => {
  downloadCsv(
    fileName,
    ['Medicine', 'Generic', 'Batch', 'Expiry Date', 'Strips', 'Loose', 'MRP', 'Status'],
    items.map((item) => [
      item.brandName,
      item.genericName,
      item.batchNumber,
      item.expiryDate,
      item.quantityStrips,
      item.quantityLoose,
      item.mrp,
      item.expiryStatus,
    ])
  );
};

interface ExpiryAlertsDashboardProps {
  embedded?: boolean;
}

const ExpiryAlertsDashboard: React.FC<ExpiryAlertsDashboardProps> = ({
  embedded = false,
}) => {
  const context = usePharmaFlowContext();
  const [alerts, setAlerts] = useState<ExpiryAlertSummary | null>(null);
  const [shortageItems, setShortageItems] = useState<ShortageItemResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const storeId = context.storeId;

  useEffect(() => {
    if (!storeId) {
      setAlerts(null);
      setShortageItems([]);
      setError('Choose an active store from Setup to load expiry alerts.');
      return;
    }

    Promise.all([ReportsAPI.getExpiryAlerts(storeId), ReportsAPI.getShortageReport(storeId)])
      .then(([expirySummary, shortageSummary]) => {
        setAlerts(expirySummary);
        setShortageItems(shortageSummary);
        setError(null);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load expiry alerts right now.');
      });
  }, [storeId]);

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Expiry Management Dashboard"
      description="Monitor expiring stock, expiry exposure, and replenishment gaps across the selected store."
    >
      <div className="space-y-5">
        <section className="rounded-[2rem] border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-rose-50 p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                Expiry Desk
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Easy visibility into expiry exposure and reorder risk
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                This is the page to prove proactive expiry management. Show the red bucket first, then move through
                the 30, 60, and 90 day windows and finish with the shortage list for branch action.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">Expired Value</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">
                  ₹{(alerts?.totalExpiredValue ?? 0).toFixed(2)}
                </div>
                <div className="mt-1 text-sm text-slate-500">Current expired stock exposure</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">30-Day Risk</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">
                  ₹{(alerts?.totalAtRiskValue ?? 0).toFixed(2)}
                </div>
                <div className="mt-1 text-sm text-slate-500">Value at near-term expiry risk</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Shortage Items</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{shortageItems.length}</div>
                <div className="mt-1 text-sm text-slate-500">Reorder alerts in the active store</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {expirySteps.map((step, index) => (
            <div key={step.title} className={`rounded-3xl border p-5 ${step.tone}`}>
              <div className="text-sm font-semibold">Step {index + 1}</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">{step.title}</div>
              <div className="mt-1 text-sm leading-6 text-slate-600">{step.summary}</div>
            </div>
          ))}
        </section>

        {alerts && (
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Expired Stock Value</div>
              <div className="mt-2 text-3xl font-semibold">₹{alerts.totalExpiredValue.toFixed(2)}</div>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">30-Day At-Risk Value</div>
              <div className="mt-2 text-3xl font-semibold">₹{alerts.totalAtRiskValue.toFixed(2)}</div>
            </div>
          </section>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        )}

        {!alerts && !error && (
          <div className="rounded-3xl bg-white px-6 py-16 text-center text-slate-400 shadow-sm">
            Loading expiry alerts...
          </div>
        )}

        {alerts && (
          <div className="grid gap-5">
            <AlertSection
              title="Expired"
              items={alerts.expired}
              tone="expired"
              onExport={() => exportBatchBucket('expired-stock.csv', alerts.expired)}
            />
            <AlertSection
              title="Expiring within 30 days"
              items={alerts.expiring30Days}
              tone="warning"
              onExport={() => exportBatchBucket('expiring-30-days.csv', alerts.expiring30Days)}
            />
            <AlertSection
              title="Expiring within 60 days"
              items={alerts.expiring60Days}
              tone="info"
              onExport={() => exportBatchBucket('expiring-60-days.csv', alerts.expiring60Days)}
            />
            <AlertSection
              title="Expiring within 90 days"
              items={alerts.expiring90Days}
              tone="info"
              onExport={() => exportBatchBucket('expiring-90-days.csv', alerts.expiring90Days)}
            />
          </div>
        )}

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Shortage Report</h2>
              <p className="text-sm text-slate-500">
                Medicines below reorder level so the branch can place replenishment orders in time.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  'shortage-report.csv',
                  ['Medicine', 'Generic', 'Reorder Level', 'Strips', 'Loose', 'Nearest Expiry'],
                  shortageItems.map((item) => [
                    item.brandName,
                    item.genericName,
                    item.reorderLevel,
                    item.quantityStrips,
                    item.quantityLoose,
                    item.nearestExpiryDate,
                  ])
                )
              }
              disabled={!shortageItems.length}
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
                {shortageItems.map((item) => (
                  <tr key={item.medicineId} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium">{item.brandName}</td>
                    <td className="px-3 py-3">{item.genericName || '—'}</td>
                    <td className="px-3 py-3 text-right">{item.reorderLevel}</td>
                    <td className="px-3 py-3 text-right">{item.quantityStrips}</td>
                    <td className="px-3 py-3 text-right">{item.quantityLoose}</td>
                    <td className="px-3 py-3">{item.nearestExpiryDate || '—'}</td>
                  </tr>
                ))}
                {!shortageItems.length && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                      No shortage items found for the selected store.
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

export default ExpiryAlertsDashboard;
