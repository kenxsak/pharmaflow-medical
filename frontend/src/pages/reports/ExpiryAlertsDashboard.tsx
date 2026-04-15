import React, { useEffect, useMemo, useState } from 'react';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  CreditNoteItemRequest,
  ExpiryAlertSummary,
  ExpiryActionQueueResponse,
  ExpiryActionRecommendation,
  InventoryAPI,
  PurchaseAPI,
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

const actionSeverityStyles: Record<string, string> = {
  HIGH: 'border-rose-200 bg-rose-50 text-rose-900',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-900',
  LOW: 'border-sky-200 bg-sky-50 text-sky-900',
};

const actionButtonStyles = 'rounded-2xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50';

const formatDaysToExpiry = (daysToExpiry: number) => {
  if (daysToExpiry < 0) {
    return `${Math.abs(daysToExpiry)} days overdue`;
  }
  if (daysToExpiry === 0) {
    return 'Expires today';
  }
  if (daysToExpiry === 1) {
    return '1 day left';
  }
  return `${daysToExpiry} days left`;
};

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
  const [actionQueue, setActionQueue] = useState<ExpiryActionQueueResponse | null>(null);
  const [shortageItems, setShortageItems] = useState<ShortageItemResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const storeId = context.storeId;

  const loadDashboard = async () => {
    if (!storeId) {
      setAlerts(null);
      setActionQueue(null);
      setShortageItems([]);
      setError('Choose an active store from Setup to load expiry alerts.');
      return;
    }

    try {
      const [expirySummary, shortageSummary, expiryActionSummary] = await Promise.all([
        ReportsAPI.getExpiryAlerts(storeId),
        ReportsAPI.getShortageReport(storeId),
        ReportsAPI.getExpiryActionQueue(storeId, 16),
      ]);
      setAlerts(expirySummary);
      setShortageItems(shortageSummary);
      setActionQueue(expiryActionSummary);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load expiry alerts right now.');
    }
  };

  useEffect(() => {
    if (!storeId) {
      void loadDashboard();
      return;
    }

    void loadDashboard();
  }, [storeId]);

  const immediateActions = useMemo(
    () =>
      (actionQueue?.recommendations || []).filter((recommendation) =>
        ['QUARANTINE_NOW', 'RTV_NOW', 'DUMP_NOW'].includes(recommendation.recommendedAction)
      ),
    [actionQueue]
  );

  const planningActions = useMemo(
    () =>
      (actionQueue?.recommendations || []).filter(
        (recommendation) => !['QUARANTINE_NOW', 'RTV_NOW', 'DUMP_NOW'].includes(recommendation.recommendedAction)
      ),
    [actionQueue]
  );

  const buildCreditNoteItems = (recommendation: ExpiryActionRecommendation): CreditNoteItemRequest[] => {
    const items: CreditNoteItemRequest[] = [];
    if (recommendation.quantityStrips > 0) {
      items.push({
        medicineId: recommendation.medicineId,
        batchId: recommendation.batchId,
        quantity: recommendation.quantityStrips,
        unitType: 'STRIP',
        mrp: recommendation.mrp,
        reason: recommendation.recommendedAction === 'RTV_NOW' ? 'NEAR_EXPIRY_SUPPLIER_RETURN' : 'EXPIRY_WRITE_OFF',
      });
    }
    if (recommendation.quantityLoose > 0) {
      items.push({
        medicineId: recommendation.medicineId,
        batchId: recommendation.batchId,
        quantity: recommendation.quantityLoose,
        unitType: 'UNIT',
        mrp: recommendation.mrp,
        reason: recommendation.recommendedAction === 'RTV_NOW' ? 'NEAR_EXPIRY_SUPPLIER_RETURN' : 'EXPIRY_WRITE_OFF',
      });
    }
    return items;
  };

  const handleQuarantine = async (recommendation: ExpiryActionRecommendation) => {
    try {
      setBusyKey(`quarantine-${recommendation.batchId}`);
      await InventoryAPI.quarantineBatch(recommendation.batchId, {
        reasonCode: 'EXPIRY_BLOCK',
        notes: 'Blocked from sale via expiry action cockpit.',
      });
      setMessage(`Batch ${recommendation.batchNumber} was quarantined from the expiry dashboard.`);
      setError(null);
      await loadDashboard();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to quarantine batch.');
      setMessage(null);
    } finally {
      setBusyKey(null);
    }
  };

  const handleCreateCreditNote = async (
    recommendation: ExpiryActionRecommendation,
    cnType: 'VENDOR_RETURN' | 'DUMP'
  ) => {
    try {
      setBusyKey(`${cnType}-${recommendation.batchId}`);
      await PurchaseAPI.createCreditNote({
        supplierId: cnType === 'VENDOR_RETURN' ? recommendation.suggestedSupplierId : undefined,
        cnType,
        notes:
          cnType === 'VENDOR_RETURN'
            ? 'Created from expiry action cockpit to recover near-expiry stock.'
            : 'Created from expiry action cockpit to write off unrecoverable stock.',
        items: buildCreditNoteItems(recommendation),
      });
      setMessage(
        cnType === 'VENDOR_RETURN'
          ? `RTV claim created for batch ${recommendation.batchNumber}.`
          : `Dump note created for batch ${recommendation.batchNumber}.`
      );
      setError(null);
      await loadDashboard();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to create expiry action note.');
      setMessage(null);
    } finally {
      setBusyKey(null);
    }
  };

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
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Urgent Recovery Actions</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">
                  {actionQueue?.immediateActionCount ?? 0}
                </div>
                <div className="mt-1 text-sm text-slate-500">Batches needing quarantine, RTV, or dump now</div>
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

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </div>
        )}

        {!alerts && !error && (
          <div className="rounded-3xl bg-white px-6 py-16 text-center text-slate-400 shadow-sm">
            Loading expiry alerts...
          </div>
        )}

        {actionQueue && (
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Expiry Action Queue</h2>
                <p className="text-sm text-slate-500">
                  Convert visibility into action: block expired stock, raise RTV claims, and write off unrecoverable batches.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Quarantine now</div>
                  <div className="mt-1 text-xl font-semibold text-slate-950">
                    {actionQueue.quarantineCandidateCount}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">RTV candidate value</div>
                  <div className="mt-1 text-xl font-semibold text-slate-950">
                    ₹{actionQueue.rtvCandidateValue.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Dump candidate value</div>
                  <div className="mt-1 text-xl font-semibold text-slate-950">
                    ₹{actionQueue.dumpCandidateValue.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Immediate action
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {immediateActions.map((recommendation) => {
                    const quarantineBusy = busyKey === `quarantine-${recommendation.batchId}`;
                    const rtvBusy = busyKey === `VENDOR_RETURN-${recommendation.batchId}`;
                    const dumpBusy = busyKey === `DUMP-${recommendation.batchId}`;
                    return (
                      <div
                        key={recommendation.batchId}
                        className={`rounded-3xl border p-5 ${
                          actionSeverityStyles[recommendation.actionSeverity] || actionSeverityStyles.HIGH
                        }`}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="text-lg font-semibold text-slate-950">{recommendation.brandName}</div>
                            <div className="mt-1 text-sm text-slate-600">
                              Batch {recommendation.batchNumber} • {recommendation.expiryDate} •{' '}
                              {formatDaysToExpiry(recommendation.daysToExpiry)}
                            </div>
                            <div className="mt-2 text-sm text-slate-600">
                              Qty {recommendation.quantityStrips} strips / {recommendation.quantityLoose} loose • Value ₹
                              {recommendation.stockValue.toFixed(2)}
                            </div>
                            <div className="mt-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                              {recommendation.actionLabel}
                            </div>
                          </div>
                          <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-700">
                            <div className="font-semibold">{recommendation.inventoryState}</div>
                            <div className="mt-1">{recommendation.expiryStatus}</div>
                            {recommendation.suggestedSupplierName && (
                              <div className="mt-2">Supplier: {recommendation.suggestedSupplierName}</div>
                            )}
                          </div>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-700">{recommendation.actionReason}</p>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {recommendation.canQuarantine && (
                            <button
                              type="button"
                              onClick={() => void handleQuarantine(recommendation)}
                              disabled={quarantineBusy}
                              className={`${actionButtonStyles} border-rose-300 bg-white text-rose-900`}
                            >
                              {quarantineBusy ? 'Blocking…' : 'Block from sale'}
                            </button>
                          )}
                          {recommendation.canCreateRtv && (
                            <button
                              type="button"
                              onClick={() => void handleCreateCreditNote(recommendation, 'VENDOR_RETURN')}
                              disabled={rtvBusy || !recommendation.suggestedSupplierId}
                              className={`${actionButtonStyles} border-amber-300 bg-white text-amber-900`}
                            >
                              {rtvBusy ? 'Creating RTV…' : 'Create RTV claim'}
                            </button>
                          )}
                          {recommendation.canCreateDump && (
                            <button
                              type="button"
                              onClick={() => void handleCreateCreditNote(recommendation, 'DUMP')}
                              disabled={dumpBusy}
                              className={`${actionButtonStyles} border-slate-300 bg-white text-slate-900`}
                            >
                              {dumpBusy ? 'Writing off…' : 'Create dump note'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {!immediateActions.length && (
                    <div className="rounded-3xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500 lg:col-span-2">
                      No urgent expiry actions are currently queued for this store.
                    </div>
                  )}
                </div>
              </div>

              {!!planningActions.length && (
                <div>
                  <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Planning and review
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {planningActions.map((recommendation) => (
                      <div key={recommendation.batchId} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-base font-semibold text-slate-950">{recommendation.brandName}</div>
                            <div className="mt-1 text-sm text-slate-600">
                              Batch {recommendation.batchNumber} • {recommendation.expiryDate} •{' '}
                              {formatDaysToExpiry(recommendation.daysToExpiry)}
                            </div>
                          </div>
                          <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {recommendation.actionLabel}
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{recommendation.actionReason}</p>
                        {recommendation.suggestedSupplierName && (
                          <div className="mt-3 text-sm text-slate-500">
                            Recent supplier context: {recommendation.suggestedSupplierName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
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
