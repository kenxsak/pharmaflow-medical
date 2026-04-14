import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  PharmaFlowNavStatus,
  pharmaFlowNavItems,
} from '../../components/pharmaflow/navigation';
import { AuthAPI, StoreAPI, StoreSummary } from '../../services/api';
import {
  BrandingSnapshot,
  resetBranding,
  saveBranding,
  useBranding,
} from '../../utils/branding';
import {
  announcePharmaFlowContextChange,
  usePharmaFlowContext,
} from '../../utils/pharmaflowContext';

interface FeatureRow {
  name: string;
  status: PharmaFlowNavStatus | 'Next';
  summary: string;
}

const featureRows: FeatureRow[] = [
  {
    name: 'White-labelling and buyer readiness',
    status: 'Live',
    summary: 'Tenant brand profile, support identity, deployment mode, and buyer-question coverage are now available from the workspace.',
  },
  {
    name: 'SaaS super-admin plans and pricing',
    status: 'Live',
    summary: 'Tenant roster, plan pricing, entitlements, and brand-level rollout control are now available from the SaaS Admin workspace.',
  },
  {
    name: 'Billing, GST, invoice creation',
    status: 'Live',
    summary: 'POS billing, GST reverse calculation, role-based price control, and credit limit blocking are active.',
  },
  {
    name: 'Expiry alerts and shortage',
    status: 'Live',
    summary: '30, 60, and 90-day expiry buckets plus shortage visibility and exports are ready.',
  },
  {
    name: 'Schedule H / H1 / X compliance',
    status: 'Live',
    summary: 'Controlled-drug register, patient and doctor capture, and narcotic reports are working.',
  },
  {
    name: 'Purchase import',
    status: 'Live',
    summary: 'Suppliers, manual inward entry, and CSV purchase import are available for day-one operations.',
  },
  {
    name: 'Multi-store operations',
    status: 'Partial',
    summary: 'Store entities, HO, warehouse context, and branch switching exist, with transfer orchestration as the next rollout layer.',
  },
  {
    name: 'Prescription digitization',
    status: 'Partial',
    summary: 'Prescription references are stored, while richer scan-and-upload rollout depends on deployment storage choices.',
  },
  {
    name: 'RTV, dump, and supplier credit notes',
    status: 'Partial',
    summary: 'Credit-note creation is visible in Purchases, with deeper RTV and reconciliation workflow ready for the next pass.',
  },
  {
    name: 'Profitability analytics and loyalty',
    status: 'Partial',
    summary: 'Daily sales, top sellers, slow movers, expiry loss, sales, and profit analytics are live, with cross-branch loyalty policy refinement still pending.',
  },
  {
    name: 'Customer history and credit visibility',
    status: 'Live',
    summary: 'Customer search, credit limit view, patient history, and quick customer creation are now available in one screen.',
  },
];

const statusClasses: Record<FeatureRow['status'], string> = {
  Live: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Partial: 'border-amber-200 bg-amber-50 text-amber-700',
  Next: 'border-slate-200 bg-slate-100 text-slate-700',
};

const launchModules = pharmaFlowNavItems.filter(
  (item) =>
    !['/pharmaflow/setup', '/pharmaflow/enterprise', '/pharmaflow/platform'].includes(item.path) &&
    item.status === 'Live'
);

interface PharmaFlowCommandCenterProps {
  embedded?: boolean;
}

const PharmaFlowCommandCenter: React.FC<PharmaFlowCommandCenterProps> = ({ embedded = false }) => {
  const context = usePharmaFlowContext();
  const branding = useBranding();
  const navigate = useNavigate();
  const [username, setUsername] = useState(localStorage.getItem('pharmaflow_username') || 'admin');
  const [password, setPassword] = useState('Admin@123');
  const [tenantSlug, setTenantSlug] = useState(localStorage.getItem('pharmaflow_tenant_slug') || '');
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState(localStorage.getItem('pharmaflow_store_id') || '');
  const [selectedStoreCode, setSelectedStoreCode] = useState(localStorage.getItem('pharmaflow_store_code') || '');
  const [brandDraft, setBrandDraft] = useState<BrandingSnapshot>(branding);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    setSelectedStoreId(context.storeId);
    setSelectedStoreCode(context.storeCode);
  }, [context.storeCode, context.storeId]);

  useEffect(() => {
    setBrandDraft(branding);
  }, [branding]);

  const currentStoreLabel = useMemo(() => {
    const matchedStore = stores.find((store) => store.storeId === selectedStoreId);
    if (matchedStore) {
      return `${matchedStore.storeName} (${matchedStore.storeCode})`;
    }
    if (selectedStoreCode) {
      return selectedStoreCode;
    }
    return 'No active store selected';
  }, [selectedStoreCode, selectedStoreId, stores]);

  useEffect(() => {
    if (!context.hasToken) {
      setStores([]);
      return;
    }

    StoreAPI.list()
      .then((items) => {
        setStores(items);
        if (!selectedStoreId && items.length > 0) {
          const firstStore = items[0];
          localStorage.setItem('pharmaflow_store_id', firstStore.storeId);
          localStorage.setItem('pharmaflow_store_code', firstStore.storeCode);
          setSelectedStoreId(firstStore.storeId);
          setSelectedStoreCode(firstStore.storeCode);
          announcePharmaFlowContextChange();
        }
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load stores.');
      });
  }, [context.hasToken, selectedStoreId]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setError(null);
    setMessage(null);

    try {
      const response = await AuthAPI.login(username, password, tenantSlug || undefined);
      localStorage.setItem('pharmaflow_token', response.token);
      localStorage.setItem('pharmaflow_username', response.username);
      localStorage.setItem('pharmaflow_full_name', response.fullName);
      localStorage.setItem('pharmaflow_role', response.role);
      if (response.tenantId) {
        localStorage.setItem('pharmaflow_tenant_id', response.tenantId);
      }
      if (response.tenantSlug) {
        localStorage.setItem('pharmaflow_tenant_slug', response.tenantSlug);
        setTenantSlug(response.tenantSlug);
      }
      if (response.storeId) {
        localStorage.setItem('pharmaflow_store_id', response.storeId);
        setSelectedStoreId(response.storeId);
      }
      if (response.storeCode) {
        localStorage.setItem('pharmaflow_store_code', response.storeCode);
        setSelectedStoreCode(response.storeCode);
      }
      saveBranding({
        brandName: response.brandName || brandDraft.brandName,
        tagline: response.brandTagline || brandDraft.tagline,
        supportEmail: response.supportEmail || brandDraft.supportEmail,
        supportPhone: response.supportPhone || brandDraft.supportPhone,
        deploymentMode: response.deploymentMode || brandDraft.deploymentMode,
      });
      announcePharmaFlowContextChange();
      setMessage(`Signed in as ${response.fullName}. Taking you to billing.`);
      navigate('/pharmaflow/billing');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStoreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStoreId = event.target.value;
    const nextStore = stores.find((store) => store.storeId === nextStoreId);
    localStorage.setItem('pharmaflow_store_id', nextStoreId);
    if (nextStore?.storeCode) {
      localStorage.setItem('pharmaflow_store_code', nextStore.storeCode);
      setSelectedStoreCode(nextStore.storeCode);
    }
    setSelectedStoreId(nextStoreId);
    announcePharmaFlowContextChange();
    setMessage(`Active branch switched to ${nextStore?.storeName || nextStoreId}.`);
  };

  const clearSession = () => {
    [
      'pharmaflow_token',
      'pharmaflow_username',
      'pharmaflow_full_name',
      'pharmaflow_role',
      'pharmaflow_store_id',
      'pharmaflow_store_code',
      'pharmaflow_tenant_id',
      'pharmaflow_tenant_slug',
    ].forEach((key) => localStorage.removeItem(key));
    setStores([]);
    setSelectedStoreId('');
    setSelectedStoreCode('');
    setMessage(`${branding.brandName} session cleared.`);
    announcePharmaFlowContextChange();
  };

  const updateBrandDraft = (key: keyof BrandingSnapshot, value: string) => {
    setBrandDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSaveBranding = () => {
    saveBranding(brandDraft);
    setMessage(`${brandDraft.brandName} branding profile saved.`);
    setError(null);
  };

  const handleResetBranding = () => {
    resetBranding();
    setMessage('Branding profile reset to deployment defaults.');
    setError(null);
  };

  const liveModuleCount = pharmaFlowNavItems.filter((item) => item.status === 'Live').length;

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Setup and Branch Control"
      description="Use this page only for sign-in, branch switching, and demo preparation. Once the session is ready, stay inside Counter, Stock, Purchases, and Compliance."
      actions={
        <Link
          to="/pharmaflow/billing"
          className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          Open counter
        </Link>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">
                First Store Launchpad
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Fastest path to billing, stock, compliance, and enterprise proof
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                {branding.brandName} is now organized around real pharmacy operations instead of scattered routes.
                If you only need one strong pilot branch first, start with billing, inventory, purchase
                import, compliance, and the enterprise buyer guide.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Live modules</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{liveModuleCount}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Current branch</div>
                <div className="mt-2 text-sm font-semibold text-slate-950">{currentStoreLabel}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">
                Ready Credentials
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Default {branding.brandName} admin</h2>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div>
                Username: <span className="font-semibold text-slate-950">admin</span>
              </div>
              <div className="mt-1">
                Password: <span className="font-semibold text-slate-950">Admin@123</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">User</div>
              <div className="mt-2 font-semibold text-slate-950">
                {context.fullName || 'Not signed in'}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Role</div>
              <div className="mt-2 font-semibold text-slate-950">{context.role || 'Not set'}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Token</div>
              <div className="mt-2 font-semibold text-slate-950">
                {context.hasToken ? 'Connected' : 'Missing'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">
                Session Setup
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Sign in and pick branch</h2>
            </div>
            <button
              type="button"
              onClick={clearSession}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Clear session
            </button>
          </div>

          <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleLogin}>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Tenant / brand slug</span>
              <input
                type="text"
                value={tenantSlug}
                onChange={(event) => setTenantSlug(event.target.value)}
                placeholder="Recommended for branded SaaS logins, for example posible-rx"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Active store</span>
              <select
                value={selectedStoreId}
                onChange={handleStoreChange}
                disabled={!stores.length}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 disabled:bg-slate-100"
              >
                <option value="">Select a store</option>
                {stores.map((store) => (
                  <option key={store.storeId} value={store.storeId}>
                    {store.storeName} ({store.storeCode})
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isLoggingIn}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoggingIn ? 'Signing in...' : 'Sign in and open billing'}
              </button>
              <Link
                to="/pharmaflow/stores"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
              >
                Open stores page
              </Link>
            </div>

            <div className="md:col-span-2 text-xs leading-5 text-slate-500">
              Leave tenant slug blank only if you are using the shared platform owner login. For branded tenant logins, using the slug keeps authentication properly scoped to that brand.
            </div>
          </form>

          {(message || error) && (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                error
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
              }`}
            >
              {error || message}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">
                Launch Modules
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Open the core pharmacy flows</h2>
            </div>
            <Link
              to="/legacy-login"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Legacy login
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {launchModules.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-white p-3 text-sky-700 shadow-sm">
                      <Icon size={20} />
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${statusClasses[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-4 text-lg font-semibold text-slate-950">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.summary}</p>
                  <div className="mt-4 text-sm font-medium text-sky-700">Open module</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">
                White-Label Profile
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Brand the workspace for a chain rollout</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Change the visible brand, support identity, and deployment note here. The shell updates immediately,
                and billing print, PDF, and WhatsApp now accept the same brand profile through the API layer.
              </p>
            </div>
            <Link
              to="/pharmaflow/enterprise"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Open buyer guide
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Brand name</span>
              <input
                type="text"
                value={brandDraft.brandName}
                onChange={(event) => updateBrandDraft('brandName', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Support phone</span>
              <input
                type="text"
                value={brandDraft.supportPhone}
                onChange={(event) => updateBrandDraft('supportPhone', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Tagline</span>
              <input
                type="text"
                value={brandDraft.tagline}
                onChange={(event) => updateBrandDraft('tagline', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Support email</span>
              <input
                type="email"
                value={brandDraft.supportEmail}
                onChange={(event) => updateBrandDraft('supportEmail', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Deployment mode</span>
              <input
                type="text"
                value={brandDraft.deploymentMode}
                onChange={(event) => updateBrandDraft('deploymentMode', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSaveBranding}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Save branding
            </button>
            <button
              type="button"
              onClick={handleResetBranding}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
            >
              Reset to defaults
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">
            Buyer Questions
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">Answer the entire shortlist from one screen</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            The new enterprise page maps the 43 buyer questions to real modules, current rollout depth, and the best
            route to open during the demo.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="font-semibold">Best for sales demos</div>
              <p className="mt-2">
                Open Enterprise first to answer white-label, support, deployment, integrations, and chain-wide rollout
                questions before jumping into live workflows.
              </p>
            </div>
            <div className="rounded-3xl bg-sky-50 p-4 text-sm text-sky-900">
              <div className="font-semibold">Best for implementation teams</div>
              <p className="mt-2">
                Use the same page after the demo to align rollout scope across HO, warehouse, branches, delivery, and
                integration requirements.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/pharmaflow/enterprise"
              className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white"
            >
              Open enterprise readiness
            </Link>
            <Link
              to="/pharmaflow/platform"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
            >
              Open SaaS Admin
            </Link>
            <Link
              to="/pharmaflow/stores"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
            >
              Open stores and rollout view
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr,1.15fr]">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">
            Store Rollout
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">What this supports today</h2>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="font-semibold">Strong for one pilot store right now</div>
              <p className="mt-2">
                Billing, stock visibility, inward entry, compliance, GST, and audit are already accessible from one workspace.
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-semibold">Multi-store foundation is present</div>
              <p className="mt-2">
                Store records, branch selection, HO, warehouse structure, and white-label tenant identity already exist so later rollout is additive, not a rewrite.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
              <div className="font-semibold">Next rollout wave</div>
              <p className="mt-2">
                Transfers, RTV orchestration, richer prescription upload, and offline conflict handling are the remaining scale-up layers.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">
            Coverage Snapshot
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">Implementation reality</h2>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Area</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Current state</th>
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row) => (
                  <tr key={row.name} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </PharmaFlowShell>
  );
};

export default PharmaFlowCommandCenter;
