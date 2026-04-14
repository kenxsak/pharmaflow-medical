import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import { StoreAPI, StoreSummary } from '../../services/api';
import { useBranding } from '../../utils/branding';
import {
  announcePharmaFlowContextChange,
  usePharmaFlowContext,
} from '../../utils/pharmaflowContext';

interface StoreOperationsDashboardProps {
  embedded?: boolean;
}

const StoreOperationsDashboard: React.FC<StoreOperationsDashboardProps> = ({ embedded = false }) => {
  const context = usePharmaFlowContext();
  const branding = useBranding();
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeStoreId, setActiveStoreId] = useState(context.storeId);
  const [activeStoreCode, setActiveStoreCode] = useState(context.storeCode);

  const storeCount = stores.filter((store) => store.storeType === 'STORE').length;
  const warehouseCount = stores.filter((store) => store.storeType === 'WAREHOUSE').length;
  const headOfficeCount = stores.filter((store) => store.storeType === 'HO').length;

  useEffect(() => {
    setActiveStoreId(context.storeId);
    setActiveStoreCode(context.storeCode);
  }, [context.storeCode, context.storeId]);

  useEffect(() => {
    StoreAPI.list()
      .then((items) => {
        setStores(items);
        setError(null);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load store list.');
      });
  }, []);

  const makeActive = (store: StoreSummary) => {
    setActiveStoreId(store.storeId);
    setActiveStoreCode(store.storeCode);
    localStorage.setItem('pharmaflow_store_id', store.storeId);
    localStorage.setItem('pharmaflow_store_code', store.storeCode);
    announcePharmaFlowContextChange();
  };

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Multi-Store Operations"
      description={`Central store directory, tenant rollout view, and active branch context for ${branding.brandName}.`}
      actions={
        <Link
          to="/lifepill/enterprise"
          className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          Open enterprise guide
        </Link>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Retail Branches</div>
            <div className="mt-2 text-3xl font-semibold">{storeCount}</div>
            <div className="mt-1 text-sm text-slate-500">Store locations configured today</div>
          </div>
          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Warehouse / HO</div>
            <div className="mt-2 text-3xl font-semibold">
              {warehouseCount + headOfficeCount}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {warehouseCount} warehouse, {headOfficeCount} head office
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Active Store</div>
            <div className="mt-2 text-3xl font-semibold">{activeStoreCode || 'Not set'}</div>
            <div className="mt-1 text-sm text-slate-500">{activeStoreId || 'No active store selected'}</div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Rollout Story for Chain Management</h2>
            <p className="mt-2 text-sm text-slate-500">
              Use this view when the client asks whether the platform can support HO, warehouse, and a large branch network.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="font-semibold">Live now</div>
                <p className="mt-2">
                  Branch switching, store-scoped inventory, store-scoped billing, GST reports, compliance, and audit visibility.
                </p>
              </div>
              <div className="rounded-3xl bg-sky-50 p-4 text-sm text-sky-900">
                <div className="font-semibold">White-label ready</div>
                <p className="mt-2">
                  {branding.brandName} branding, support identity, and tenant-facing workspace copy are configurable per deployment.
                </p>
              </div>
              <div className="rounded-3xl bg-violet-50 p-4 text-sm text-violet-900">
                <div className="font-semibold">Deployment positioning</div>
                <p className="mt-2">{branding.deploymentMode}</p>
              </div>
              <div className="rounded-3xl bg-amber-50 p-4 text-sm text-amber-900">
                <div className="font-semibold">Next scale-up layer</div>
                <p className="mt-2">
                  Inter-branch transfers, indent approvals, and deeper sync automation should be added as the enterprise rollout layer.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Operations Overview</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                Multi-location management: show HO, warehouse, branch directory, and active-branch switching.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                Cloud vs local: position the rollout as hybrid cloud plus branch-local operations.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                White-labelling: show that the product can carry the chain brand, support contact, and deployment identity.
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/lifepill/enterprise"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                Open rollout guide
              </Link>
              <Link
                to="/lifepill/billing"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
              >
                Open counter workspace
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Store Directory</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use this as the central chain directory for branch context, HO visibility, and rollout conversations.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Store</th>
                  <th className="px-3 py-2 text-left">Code</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">City</th>
                  <th className="px-3 py-2 text-left">State</th>
                  <th className="px-3 py-2 text-left">GSTIN</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.storeId} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium">{store.storeName}</td>
                    <td className="px-3 py-3">{store.storeCode}</td>
                    <td className="px-3 py-3">{store.storeType}</td>
                    <td className="px-3 py-3">{store.city || '—'}</td>
                    <td className="px-3 py-3">{store.state || '—'}</td>
                    <td className="px-3 py-3">{store.gstin || '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => makeActive(store)}
                        className={`rounded-2xl px-3 py-2 text-sm font-medium ${
                          activeStoreId === store.storeId
                            ? 'bg-slate-900 text-white'
                            : 'border border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        {activeStoreId === store.storeId ? 'Active' : 'Set Active'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!stores.length && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-400">
                      No stores loaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Current Multi-Store Readiness</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="font-semibold">Available now</div>
              <p className="mt-2">
                Store-scoped inventory, billing, reports, and role-aware access with active store switching.
              </p>
            </div>
            <div className="rounded-3xl bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-semibold">Partially available</div>
              <p className="mt-2">
                HO and warehouse entities exist, but the operational dashboards are still early.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-100 p-4 text-sm text-slate-700">
              <div className="font-semibold">Still to build</div>
              <p className="mt-2">
                Real-time stock synchronization, transfer workflow depth, indent approval, and offline branch conflict handling.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PharmaFlowShell>
  );
};

export default StoreOperationsDashboard;
