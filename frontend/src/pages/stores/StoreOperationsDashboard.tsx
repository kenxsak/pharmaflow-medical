import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  InventoryAPI,
  type OperationsOverviewResponse,
  PurchaseAPI,
  ReportsAPI,
  type ReplenishmentInsightResponse,
  type ReplenishmentRecommendation,
  type StockTransferActionResponse,
  type TransferRecommendation,
} from '../../services/api';
import { useBranding } from '../../utils/branding';
import {
  announcePharmaFlowContextChange,
  canAccessCompanyControls,
  getPharmaFlowRoleLabel,
  usePharmaFlowContext,
} from '../../utils/pharmaflowContext';
import {
  formatPrimaryQuantity,
  formatSecondaryQuantity,
  getMedicineUnitProfile,
} from '../../utils/medicineUnits';

interface StoreOperationsDashboardProps {
  embedded?: boolean;
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDate = (value?: string) => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getTransferStatusTone = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'APPROVED':
      return 'bg-amber-100 text-amber-900';
    case 'IN_TRANSIT':
      return 'bg-sky-100 text-sky-900';
    case 'RECEIVED':
      return 'bg-emerald-100 text-emerald-900';
    case 'REJECTED':
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-900';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

const formatTransferQuantity = (transfer: StockTransferActionResponse) => {
  const primary = formatPrimaryQuantity(transfer.quantityStrips, transfer);
  if (!transfer.quantityLoose) {
    return primary;
  }
  return `${primary} + ${formatSecondaryQuantity(transfer.quantityLoose, transfer)}`;
};

const getScopeNote = (scopeLevel?: string) => {
  switch (scopeLevel) {
    case 'SAAS_ADMIN':
      return 'You are seeing the full platform network. Company performance and replenishment actions are aggregated across tenants.';
    case 'COMPANY':
      return 'You are seeing the full company network. Switch the active branch to focus transfers and purchase drafts on a specific store.';
    default:
      return 'You are seeing only your assigned branch. Transfers and reorders created here stay scoped to your store.';
  }
};

const StoreOperationsDashboard: React.FC<StoreOperationsDashboardProps> = ({ embedded = false }) => {
  const context = usePharmaFlowContext();
  const branding = useBranding();
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const canManageStores = canAccessCompanyControls(context);

  const [overview, setOverview] = useState<OperationsOverviewResponse | null>(null);
  const [insights, setInsights] = useState<ReplenishmentInsightResponse | null>(null);
  const [transfers, setTransfers] = useState<StockTransferActionResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [activeStoreId, setActiveStoreId] = useState(context.storeId);
  const [activeStoreCode, setActiveStoreCode] = useState(context.storeCode);

  useEffect(() => {
    setActiveStoreId(context.storeId);
    setActiveStoreCode(context.storeCode);
  }, [context.storeCode, context.storeId]);

  const loadDashboard = async () => {
    const focusStoreId = canManageStores ? activeStoreId || undefined : context.storeId || undefined;

    try {
      const [overviewResponse, insightResponse, transferResponse] = await Promise.all([
        ReportsAPI.getOperationsOverview(month, year),
        InventoryAPI.getReplenishmentInsights(focusStoreId, 15),
        InventoryAPI.getTransfers(focusStoreId, 12),
      ]);
      setOverview(overviewResponse);
      setInsights(insightResponse);
      setTransfers(transferResponse);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load operations data.');
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [activeStoreId, canManageStores, context.storeId, month, year]);

  const makeActive = (storeId: string, storeCode: string) => {
    setActiveStoreId(storeId);
    setActiveStoreCode(storeCode);
    localStorage.setItem('pharmaflow_store_id', storeId);
    localStorage.setItem('pharmaflow_store_code', storeCode);
    announcePharmaFlowContextChange();
    setActionMessage(`Active store switched to ${storeCode}.`);
  };

  const handleTransferLifecycle = async (
    transfer: StockTransferActionResponse,
    action: 'approve' | 'reject' | 'cancel' | 'dispatch' | 'receive'
  ) => {
    const actionLabel =
      action === 'approve'
        ? 'approve'
        : action === 'reject'
        ? 'reject'
        : action === 'cancel'
        ? 'cancel'
        : action === 'dispatch'
        ? 'dispatch'
        : 'receive';

    if (!window.confirm(`${actionLabel.charAt(0).toUpperCase()}${actionLabel.slice(1)} transfer ${transfer.transferId.slice(0, 8)} for ${transfer.brandName}?`)) {
      return;
    }

    try {
      setBusyKey(`transfer-action-${transfer.transferId}-${action}`);
      const response =
        action === 'approve'
          ? await InventoryAPI.approveTransfer(transfer.transferId)
          : action === 'reject'
          ? await InventoryAPI.rejectTransfer(transfer.transferId)
          : action === 'cancel'
          ? await InventoryAPI.cancelTransfer(transfer.transferId)
          : action === 'dispatch'
          ? await InventoryAPI.dispatchTransfer(transfer.transferId)
          : await InventoryAPI.receiveTransfer(transfer.transferId);

      const actionMessages = {
        approve: `Transfer ${response.transferId.slice(0, 8)} approved for dispatch from ${response.fromStoreCode}.`,
        reject: `Transfer ${response.transferId.slice(0, 8)} was rejected.`,
        cancel: `Transfer ${response.transferId.slice(0, 8)} was cancelled.`,
        dispatch: `Transfer ${response.transferId.slice(0, 8)} is now in transit to ${response.toStoreCode}.`,
        receive: `Transfer ${response.transferId.slice(0, 8)} was received into ${response.toStoreCode}.`,
      } as const;

      setActionMessage(actionMessages[action]);
      await loadDashboard();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update transfer.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleTransferRequest = async (
    recommendation: ReplenishmentRecommendation,
    option: TransferRecommendation
  ) => {
    const quantity = Math.min(
      recommendation.recommendedTransferQuantityStrips || recommendation.shortageQuantityStrips,
      option.transferableQuantityStrips
    );

    if (!window.confirm(`Create a transfer request for ${formatPrimaryQuantity(quantity, recommendation)} of ${recommendation.brandName}?`)) {
      return;
    }

    try {
      setBusyKey(`transfer-${recommendation.targetStoreId}-${recommendation.medicineId}`);
      const response = await InventoryAPI.requestTransfer({
        fromStoreId: option.fromStoreId,
        toStoreId: recommendation.targetStoreId,
        medicineId: recommendation.medicineId,
        batchId: option.batchId,
        quantityStrips: quantity,
      });
      setActionMessage(
        `Transfer request ${response.transferId.slice(0, 8)} created from ${response.fromStoreCode} to ${response.toStoreCode}.`
      );
      await loadDashboard();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to create transfer request.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleReorderDraft = async (recommendation: ReplenishmentRecommendation) => {
    const quantity = recommendation.recommendedOrderQuantityStrips || recommendation.shortageQuantityStrips;
    if (quantity <= 0) {
      setActionMessage('This item is already covered by transfer stock. No purchase draft was needed.');
      return;
    }

    if (!window.confirm(`Create a draft purchase order for ${formatPrimaryQuantity(quantity, recommendation)} of ${recommendation.brandName}?`)) {
      return;
    }

    try {
      setBusyKey(`reorder-${recommendation.targetStoreId}-${recommendation.medicineId}`);
      const response = await PurchaseAPI.createReorderDraft({
        storeId: recommendation.targetStoreId,
        medicineId: recommendation.medicineId,
        supplierId: recommendation.supplierId,
        quantity,
        notes: `Created from replenishment desk for ${recommendation.targetStoreCode}`,
      });
      setActionMessage(
        `Planned purchase order ${response.poNumber} created for ${response.brandName}${response.supplierName ? ` via ${response.supplierName}` : ''}${response.expectedDeliveryDate ? ` with ETA ${formatDate(response.expectedDeliveryDate)}` : ''}.`
      );
      await loadDashboard();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to create draft purchase order.');
    } finally {
      setBusyKey(null);
    }
  };

  const visibleRows = overview?.stores || [];
  const roleLabel = getPharmaFlowRoleLabel(context.role, context.platformOwner);
  const focusedStoreId = canManageStores ? activeStoreId || undefined : context.storeId || undefined;
  const pendingTransferCount = transfers.filter((transfer) =>
    ['PENDING', 'APPROVED'].includes((transfer.status || '').toUpperCase())
  ).length;
  const inTransitTransferCount = transfers.filter(
    (transfer) => (transfer.status || '').toUpperCase() === 'IN_TRANSIT'
  ).length;
  const receivedTransferCount = transfers.filter(
    (transfer) => (transfer.status || '').toUpperCase() === 'RECEIVED'
  ).length;

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Operations Command Center"
      description={`Network KPIs, branch health, transfer opportunities, and reorder actions for ${branding.brandName}.`}
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            to="/lifepill/help"
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            Open help center
          </Link>
          <Link
            to="/lifepill/billing"
            className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Open billing
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        )}

        {actionMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {actionMessage}
          </div>
        )}

        <section className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Scoped Access
                </div>
                <h2 className="mt-2 text-2xl font-semibold">{overview?.scopeLabel || roleLabel}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {getScopeNote(overview?.scopeLevel)}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</div>
                <div className="mt-1 font-semibold">{roleLabel}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="font-semibold">Sales this month</div>
                <div className="mt-2 text-3xl font-semibold">{formatCurrency(overview?.totalSalesMonth)}</div>
                <div className="mt-1 text-sm text-emerald-800">
                  {overview?.totalInvoiceCountMonth || 0} invoices across the visible network
                </div>
              </div>
              <div className="rounded-3xl bg-sky-50 p-4 text-sm text-sky-900">
                <div className="font-semibold">Sales today</div>
                <div className="mt-2 text-3xl font-semibold">{formatCurrency(overview?.totalSalesToday)}</div>
                <div className="mt-1 text-sm text-sky-800">Same-day visibility for owner, company, or store scope</div>
              </div>
              <div className="rounded-3xl bg-amber-50 p-4 text-sm text-amber-900">
                <div className="font-semibold">Low-stock SKUs</div>
                <div className="mt-2 text-3xl font-semibold">{overview?.lowStockSkuCount || 0}</div>
                <div className="mt-1 text-sm text-amber-800">
                  {insights?.recommendationCount || 0} replenishment actions ready now
                </div>
              </div>
              <div className="rounded-3xl bg-rose-50 p-4 text-sm text-rose-900">
                <div className="font-semibold">Near-expiry capital</div>
                <div className="mt-2 text-3xl font-semibold">{formatCurrency(overview?.nearExpiryValue)}</div>
                <div className="mt-1 text-sm text-rose-800">
                  {overview?.expiring30BatchCount || 0} batches expiring inside 30 days
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Network Snapshot</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Visible stores</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">{overview?.storeCount || 0}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Retail / Warehouse / HO</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {overview?.retailStoreCount || 0} / {overview?.warehouseCount || 0} / {overview?.headOfficeCount || 0}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Pending transfer requests</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">{overview?.pendingTransferCount || 0}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Stock capital</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(overview?.stockValue)}</div>
              </div>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-950 p-4 text-sm text-white">
              <div className="font-semibold">Active branch focus</div>
              <div className="mt-2 text-slate-200">
                {activeStoreCode || 'Not set'} {activeStoreId ? `• ${activeStoreId}` : ''}
              </div>
              <p className="mt-2 text-slate-300">
                Transfer and reorder actions below are focused on the active store when you have company-wide access.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Store Performance</h2>
              <p className="mt-1 text-sm text-slate-500">
                This is the real owner/company/store KPI view for the current scope, not a static readiness card.
              </p>
            </div>
            <div className="text-sm text-slate-500">
              Business date: <span className="font-medium text-slate-700">{formatDate(overview?.businessDate)}</span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Store</th>
                  <th className="px-3 py-2 text-left">Today</th>
                  <th className="px-3 py-2 text-left">Month</th>
                  <th className="px-3 py-2 text-left">Invoices</th>
                  <th className="px-3 py-2 text-left">Low stock</th>
                  <th className="px-3 py-2 text-left">Expiry 30d</th>
                  <th className="px-3 py-2 text-left">Transfers</th>
                  {canManageStores && <th className="px-3 py-2 text-right">Action</th>}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.storeId} className="border-t border-slate-100">
                    <td className="px-3 py-3">
                      <div className="font-medium">{row.storeName}</div>
                      <div className="text-xs text-slate-500">
                        {row.storeCode} • {row.storeType} • {row.city || '—'}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium">{formatCurrency(row.todaySales)}</td>
                    <td className="px-3 py-3">{formatCurrency(row.monthSales)}</td>
                    <td className="px-3 py-3">{row.monthInvoiceCount}</td>
                    <td className="px-3 py-3">{row.lowStockSkuCount}</td>
                    <td className="px-3 py-3">{row.expiring30BatchCount}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        In {row.pendingTransferIn}
                      </span>
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        Out {row.pendingTransferOut}
                      </span>
                    </td>
                    {canManageStores && (
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => makeActive(row.storeId, row.storeCode)}
                          className={`rounded-2xl px-3 py-2 text-sm font-medium ${
                            activeStoreId === row.storeId
                              ? 'bg-slate-900 text-white'
                              : 'border border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          {activeStoreId === row.storeId ? 'Active' : 'Focus'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {!visibleRows.length && (
                  <tr>
                    <td colSpan={canManageStores ? 8 : 7} className="px-3 py-10 text-center text-slate-400">
                      No store KPI rows are available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Transfer Desk</h2>
              <p className="mt-1 text-sm text-slate-500">
                Track branch-to-branch stock requests through approval, dispatch, and receipt inside the same operating screen.
              </p>
            </div>
            <div className="text-sm text-slate-500">
              Focused store:{' '}
              <span className="font-medium text-slate-700">{activeStoreCode || 'All visible stores'}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-amber-50 p-4">
              <div className="text-sm text-amber-800">Awaiting source action</div>
              <div className="mt-1 text-2xl font-semibold text-amber-950">{pendingTransferCount}</div>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <div className="text-sm text-sky-800">In transit</div>
              <div className="mt-1 text-2xl font-semibold text-sky-950">{inTransitTransferCount}</div>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <div className="text-sm text-emerald-800">Recently received in scope</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-950">{receivedTransferCount}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            {transfers.map((transfer) => {
              const normalizedStatus = (transfer.status || '').toUpperCase();
              const isSourceSide = !focusedStoreId || transfer.fromStoreId === focusedStoreId;
              const isDestinationSide = !focusedStoreId || transfer.toStoreId === focusedStoreId;
              const canApprove = isSourceSide && normalizedStatus === 'PENDING';
              const canReject = isSourceSide && ['PENDING', 'APPROVED'].includes(normalizedStatus);
              const canDispatch = isSourceSide && ['PENDING', 'APPROVED'].includes(normalizedStatus);
              const canCancel =
                ['PENDING', 'APPROVED'].includes(normalizedStatus) && (isSourceSide || isDestinationSide);
              const canReceive = isDestinationSide && normalizedStatus === 'IN_TRANSIT';

              return (
                <article
                  key={transfer.transferId}
                  className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {transfer.fromStoreCode} to {transfer.toStoreCode}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{transfer.brandName}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {transfer.genericName || 'Generic name unavailable'}
                        {transfer.packSizeLabel ? ` • ${transfer.packSizeLabel}` : ''}
                        {transfer.batchNumber ? ` • Batch ${transfer.batchNumber}` : ''}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${getTransferStatusTone(
                        transfer.status
                      )}`}
                    >
                      {normalizedStatus || 'PENDING'}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl bg-white p-4">
                      <div className="text-sm text-slate-500">Transfer quantity</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatTransferQuantity(transfer)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <div className="text-sm text-slate-500">Requested</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">
                        {formatDate(transfer.createdAt)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{transfer.requestedByName || 'System'}</div>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <div className="text-sm text-slate-500">Approved / dispatched</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">
                        {formatDate(transfer.dispatchedAt || transfer.approvedAt)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {transfer.approvedByName || 'Awaiting source confirmation'}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <div className="text-sm text-slate-500">Received</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">
                        {formatDate(transfer.completedAt)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {transfer.receivedByName || 'Awaiting destination receipt'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {canApprove && (
                      <button
                        type="button"
                        disabled={busyKey === `transfer-action-${transfer.transferId}-approve`}
                        onClick={() => handleTransferLifecycle(transfer, 'approve')}
                        className="rounded-2xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyKey === `transfer-action-${transfer.transferId}-approve` ? 'Approving…' : 'Approve'}
                      </button>
                    )}

                    {canDispatch && (
                      <button
                        type="button"
                        disabled={busyKey === `transfer-action-${transfer.transferId}-dispatch`}
                        onClick={() => handleTransferLifecycle(transfer, 'dispatch')}
                        className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyKey === `transfer-action-${transfer.transferId}-dispatch` ? 'Dispatching…' : 'Dispatch'}
                      </button>
                    )}

                    {canReceive && (
                      <button
                        type="button"
                        disabled={busyKey === `transfer-action-${transfer.transferId}-receive`}
                        onClick={() => handleTransferLifecycle(transfer, 'receive')}
                        className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyKey === `transfer-action-${transfer.transferId}-receive` ? 'Receiving…' : 'Receive into stock'}
                      </button>
                    )}

                    {canReject && (
                      <button
                        type="button"
                        disabled={busyKey === `transfer-action-${transfer.transferId}-reject`}
                        onClick={() => handleTransferLifecycle(transfer, 'reject')}
                        className="rounded-2xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyKey === `transfer-action-${transfer.transferId}-reject` ? 'Rejecting…' : 'Reject'}
                      </button>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        disabled={busyKey === `transfer-action-${transfer.transferId}-cancel`}
                        onClick={() => handleTransferLifecycle(transfer, 'cancel')}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyKey === `transfer-action-${transfer.transferId}-cancel` ? 'Cancelling…' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            {!transfers.length && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                No stock transfers are active for the current scope.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Replenishment Actions</h2>
              <p className="mt-1 text-sm text-slate-500">
                Low-stock items now suggest real intra-network transfers first, then purchase drafts when the shortage remains.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
              {insights?.recommendationCount || 0} actionable recommendations
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            {insights?.recommendations.map((recommendation) => {
              const transferBusy =
                busyKey === `transfer-${recommendation.targetStoreId}-${recommendation.medicineId}`;
              const reorderBusy =
                busyKey === `reorder-${recommendation.targetStoreId}-${recommendation.medicineId}`;

              return (
                <article
                  key={`${recommendation.targetStoreId}-${recommendation.medicineId}`}
                  className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5"
                >
                  {(() => {
                    const unitProfile = getMedicineUnitProfile(recommendation);
                    return (
                      <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {recommendation.targetStoreCode}
                      </div>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">{recommendation.brandName}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {recommendation.genericName || 'Generic name unavailable'}
                        {recommendation.manufacturerName ? ` • ${recommendation.manufacturerName}` : ''}
                        {unitProfile.packDisplayLabel ? ` • ${unitProfile.packDisplayLabel}` : ''}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        recommendation.preferredAction === 'TRANSFER'
                          ? 'bg-emerald-100 text-emerald-900'
                          : recommendation.preferredAction === 'HYBRID'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-sky-100 text-sky-900'
                      }`}
                    >
                      {recommendation.preferredAction}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl bg-white p-4">
                      <div className="text-sm text-slate-500">Current / reorder</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatPrimaryQuantity(recommendation.currentQuantityStrips, recommendation)} /{' '}
                        {formatPrimaryQuantity(recommendation.reorderLevel, recommendation)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <div className="text-sm text-slate-500">Shortage</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatPrimaryQuantity(recommendation.shortageQuantityStrips, recommendation)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <div className="text-sm text-slate-500">Transfer cover</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatPrimaryQuantity(recommendation.recommendedTransferQuantityStrips || 0, recommendation)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <div className="text-sm text-slate-500">Order draft</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {formatPrimaryQuantity(recommendation.recommendedOrderQuantityStrips || 0, recommendation)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
                    <div className="rounded-3xl bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Transfer options</div>
                      {recommendation.transferOptions.length ? (
                        <div className="mt-3 space-y-3">
                          {recommendation.transferOptions.map((option) => (
                            <div
                              key={option.batchId}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
                            >
                              <div className="text-sm text-slate-700">
                                <div className="font-medium">
                                  {option.fromStoreCode} • {option.fromStoreName}
                                </div>
                                <div className="mt-1 text-slate-500">
                                  Batch {option.batchNumber} • Exp {formatDate(option.expiryDate)} • Up to{' '}
                                  {formatPrimaryQuantity(option.transferableQuantityStrips, recommendation)}
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={transferBusy}
                                onClick={() => handleTransferRequest(recommendation, option)}
                                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {transferBusy ? 'Creating…' : 'Create transfer'}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">
                          No safe donor branch was found in the visible network. Use a purchase draft instead.
                        </p>
                      )}
                    </div>

                    <div className="rounded-3xl bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Supplier-led reorder</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div>
                          Preferred supplier:{' '}
                          <span className="font-medium text-slate-900">
                            {recommendation.supplierName || 'No supplier linked yet'}
                          </span>
                        </div>
                        <div>
                          Last purchase rate:{' '}
                          <span className="font-medium text-slate-900">
                            {formatCurrency(recommendation.lastPurchaseRate)}
                          </span>
                        </div>
                        <div>
                          Estimated order value:{' '}
                          <span className="font-medium text-slate-900">
                            {formatCurrency(recommendation.estimatedOrderValue)}
                          </span>
                        </div>
                        <div>
                          Nearest expiry in target store:{' '}
                          <span className="font-medium text-slate-900">
                            {formatDate(recommendation.nearestExpiryDate)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={reorderBusy || recommendation.recommendedOrderQuantityStrips <= 0}
                        onClick={() => handleReorderDraft(recommendation)}
                        className="mt-4 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {reorderBusy ? 'Creating…' : 'Create draft purchase order'}
                      </button>
                    </div>
                  </div>
                      </>
                    );
                  })()}
                </article>
              );
            })}

            {!insights?.recommendations.length && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                No replenishment actions are pending for the current scope.
              </div>
            )}
          </div>
        </section>
      </div>
    </PharmaFlowShell>
  );
};

export default StoreOperationsDashboard;
