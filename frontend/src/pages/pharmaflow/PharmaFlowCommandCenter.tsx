import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import { AuthAPI, StoreAPI, StoreSummary } from '../../services/api';
import { useUserContext } from '../../context/UserContext';
import { BrandingSnapshot, resetBranding, saveBranding, useBranding } from '../../utils/branding';
import {
  announcePharmaFlowContextChange,
  clearPharmaFlowSession,
  getVisibleStoresForContext,
  getPharmaFlowHomePath,
  getPharmaFlowRoleLabel,
  readPharmaFlowContext,
  savePharmaFlowSession,
  usePharmaFlowContext,
} from '../../utils/pharmaflowContext';

type AccessMode = 'saas-admin' | 'company-admin' | 'store-ops';

interface AccessPreset {
  mode: AccessMode;
  title: string;
  summary: string;
  username: string;
  password: string;
  tenantSlug: string;
  routeHint: string;
}

const accessPresets: AccessPreset[] = [
  {
    mode: 'saas-admin',
    title: 'SaaS Admin',
    summary: 'Platform owner for companies, stores, plans, pricing, and feature entitlements.',
    username: 'admin',
    password: 'Admin@123',
    tenantSlug: '',
    routeHint: 'Opens SaaS Admin first',
  },
  {
    mode: 'company-admin',
    title: 'Company Admin',
    summary: 'Manages stores, users, permissions, stock, billing, purchases, compliance, and reports for one company.',
    username: 'manager@pharmaflow.in',
    password: 'Company@123',
    tenantSlug: 'pharmaflow',
    routeHint: 'Opens the legacy company workspace',
  },
  {
    mode: 'store-ops',
    title: 'Store Login',
    summary: 'Runs daily branch operations including billing, customers, inventory, purchases, compliance, and reports.',
    username: 'store@pharmaflow.in',
    password: 'Store@123',
    tenantSlug: 'pharmaflow',
    routeHint: 'Opens the store workspace',
  },
];

const PharmaFlowCommandCenter: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { setCookie, setUser } = useUserContext();
  const context = usePharmaFlowContext();
  const branding = useBranding();
  const navigate = useNavigate();
  const [accessMode, setAccessMode] = useState<AccessMode>('saas-admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [tenantSlug, setTenantSlug] = useState('');
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState(localStorage.getItem('pharmaflow_store_id') || '');
  const [brandDraft, setBrandDraft] = useState<BrandingSnapshot>(branding);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const selectedPreset = useMemo(
    () => accessPresets.find((preset) => preset.mode === accessMode) || accessPresets[0],
    [accessMode]
  );
  const showAccessPanels = !context.hasToken;

  const currentStoreLabel = useMemo(() => {
    const selectedStore = stores.find((store) => store.storeId === selectedStoreId);
    if (selectedStore) {
      return `${selectedStore.storeName} (${selectedStore.storeCode})`;
    }
    if (context.storeCode) {
      return context.storeCode;
    }
    return 'No active store selected';
  }, [context.storeCode, selectedStoreId, stores]);

  useEffect(() => {
    setBrandDraft(branding);
  }, [branding]);

  useEffect(() => {
    setUsername(selectedPreset.username);
    setPassword(selectedPreset.password);
    setTenantSlug(selectedPreset.tenantSlug);
  }, [selectedPreset]);

  useEffect(() => {
    if (!context.hasToken) {
      setStores([]);
      return;
    }

    setIsLoadingStores(true);
    StoreAPI.list()
      .then((items) => {
        const scopedStores = getVisibleStoresForContext(items, context);
        setStores(scopedStores);
        if (!selectedStoreId && scopedStores.length > 0) {
          localStorage.setItem('pharmaflow_store_id', scopedStores[0].storeId);
          localStorage.setItem('pharmaflow_store_code', scopedStores[0].storeCode);
          setSelectedStoreId(scopedStores[0].storeId);
          announcePharmaFlowContextChange();
        }
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load stores.');
      })
      .finally(() => setIsLoadingStores(false));
  }, [context, selectedStoreId]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setError(null);
    setMessage(null);

    try {
      const response = await AuthAPI.login(username.trim(), password.trim(), tenantSlug.trim() || undefined);
      savePharmaFlowSession(response);
      saveBranding({
        brandName: response.brandName || branding.brandName,
        tagline: response.brandTagline || branding.tagline,
        supportEmail: response.supportEmail || branding.supportEmail,
        supportPhone: response.supportPhone || branding.supportPhone,
        deploymentMode: response.deploymentMode || branding.deploymentMode,
      });
      announcePharmaFlowContextChange();

      const destination = getPharmaFlowHomePath(readPharmaFlowContext());
      setMessage(
        `Signed in as ${response.fullName} (${getPharmaFlowRoleLabel(response.role, Boolean(response.platformOwner))}).`
      );
      navigate(destination);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStoreChange = (nextStoreId: string) => {
    const store = stores.find((item) => item.storeId === nextStoreId);
    localStorage.setItem('pharmaflow_store_id', nextStoreId);
    if (store?.storeCode) {
      localStorage.setItem('pharmaflow_store_code', store.storeCode);
    }
    setSelectedStoreId(nextStoreId);
    announcePharmaFlowContextChange();
    setMessage(`Active store switched to ${store?.storeName || nextStoreId}.`);
  };

  const handleLogout = () => {
    clearPharmaFlowSession();
    setUser(null);
    setCookie(null);
    setStores([]);
    setSelectedStoreId('');
    setMessage('Session cleared.');
    setError(null);
    announcePharmaFlowContextChange();
  };

  const updateBrandDraft = (key: keyof BrandingSnapshot, value: string) => {
    setBrandDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  if (!context.hasToken && !embedded) {
    return <Navigate to="/legacy-login" replace />;
  }

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Company Setup"
      description="Manage the active store, company branding, access model, and rollout configuration from inside the same legacy workspace instead of maintaining a second login system."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            to="/lifepill/help"
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            Open help
          </Link>
          {context.hasToken && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              Clear session
            </button>
          )}
        </div>
      }
    >
      {showAccessPanels && (
        <section className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Operational Access</div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Pick the account that matches the job</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Platform ownership, company management, and daily store work are separated cleanly so the software behaves
              like a real business system.
            </p>

            <div className="mt-5 grid gap-3">
              {accessPresets.map((preset) => (
                <button
                  key={preset.mode}
                  type="button"
                  onClick={() => setAccessMode(preset.mode)}
                  className={`rounded-[1.75rem] border px-5 py-5 text-left transition ${
                    accessMode === preset.mode
                      ? 'border-sky-200 bg-sky-50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:border-sky-200 hover:bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-slate-950">{preset.title}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-600">{preset.summary}</div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                      {preset.routeHint}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Ready Accounts</div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">Accounts prepared for business rollout</h2>
            <div className="mt-5 grid gap-3">
              {accessPresets.map((preset) => (
                <div key={preset.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-950">{preset.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{preset.summary}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAccessMode(preset.mode)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      Use
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-700">
                    <div>Username: <span className="font-semibold text-slate-950">{preset.username}</span></div>
                    <div>Password: <span className="font-semibold text-slate-950">{preset.password}</span></div>
                    <div>Tenant slug: <span className="font-semibold text-slate-950">{preset.tenantSlug || 'Leave blank'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
        {showAccessPanels ? (
          <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Sign In</div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">Access portal</h2>

            <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleLogin}>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium text-slate-700">Account type</span>
                <select
                  value={accessMode}
                  onChange={(event) => setAccessMode(event.target.value as AccessMode)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  {accessPresets.map((preset) => (
                    <option key={preset.mode} value={preset.mode}>
                      {preset.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Username</span>
                <input
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
                <span className="font-medium text-slate-700">Tenant slug</span>
                <input
                  value={tenantSlug}
                  onChange={(event) => setTenantSlug(event.target.value)}
                  placeholder="Leave blank for SaaS admin"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </label>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoggingIn ? 'Signing in...' : `Sign in as ${selectedPreset.title}`}
                </button>
                <Link
                  to="/legacy-login"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
                >
                  Legacy login
                </Link>
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
        ) : (
          <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Legacy Access</div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">The LifePill login is the main entry now</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Account switching happens from the legacy login screen. This setup page now stays inside the same
              software for store selection, branding, and operational rollout instead of acting like a second login
              portal.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Signed in account</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">
                  {context.fullName || context.username || 'Active user'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {getPharmaFlowRoleLabel(context.role, context.platformOwner)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Best next step</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">
                  {context.platformOwner ? 'Open Platform or Users' : 'Open Billing or Users'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Use Home for the easy launcher and Help for setup notes and FAQs.
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={getPharmaFlowHomePath(context)}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                Open legacy workspace
              </Link>
              <Link
                to="/legacy-login"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
              >
                Switch account
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Current Session</div>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">Who is using the system now</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Name</div>
              <div className="mt-2 font-semibold text-slate-950">
                {context.fullName || context.username || 'Not signed in'}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Role</div>
              <div className="mt-2 font-semibold text-slate-950">
                {getPharmaFlowRoleLabel(context.role, context.platformOwner)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Company</div>
              <div className="mt-2 font-semibold text-slate-950">{branding.brandName || 'LifePill'}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Active store</div>
              <div className="mt-2 font-semibold text-slate-950">{currentStoreLabel}</div>
            </div>
          </div>

          {context.hasToken && (
            <div className="mt-5 space-y-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Switch active store</span>
                <select
                  value={selectedStoreId}
                  onChange={(event) => handleStoreChange(event.target.value)}
                  disabled={isLoadingStores || stores.length === 0}
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

              <div className="flex flex-wrap gap-3">
                <Link
                  to={getPharmaFlowHomePath(context)}
                  className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white"
                >
                  Open my workspace
                </Link>
                <Link
                  to="/lifepill/help"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
                >
                  Help and FAQ
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.88fr,1.12fr]">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Branding</div>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">Company identity in one place</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Brand name</span>
              <input
                value={brandDraft.brandName}
                onChange={(event) => updateBrandDraft('brandName', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Tagline</span>
              <input
                value={brandDraft.tagline}
                onChange={(event) => updateBrandDraft('tagline', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Support email</span>
              <input
                value={brandDraft.supportEmail}
                onChange={(event) => updateBrandDraft('supportEmail', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Support phone</span>
              <input
                value={brandDraft.supportPhone}
                onChange={(event) => updateBrandDraft('supportPhone', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Deployment mode</span>
              <input
                value={brandDraft.deploymentMode}
                onChange={(event) => updateBrandDraft('deploymentMode', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                saveBranding(brandDraft);
                setMessage(`${brandDraft.brandName} branding updated.`);
                setError(null);
              }}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Save branding
            </button>
            <button
              type="button"
              onClick={() => {
                resetBranding();
                setMessage('Branding reset to defaults.');
                setError(null);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
            >
              Reset branding
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Access Model</div>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">What each login controls</h2>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <div className="font-semibold text-slate-950">SaaS Admin</div>
              Controls companies, stores, plans, pricing, feature entitlements, and who becomes a company admin.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <div className="font-semibold text-slate-950">Company Admin</div>
              Controls users, store assignments, branch operations, billing, stock, purchases, compliance, and reports for one company.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <div className="font-semibold text-slate-950">Store Login</div>
              Runs day-to-day branch operations from the legacy workspace without exposing platform or permission controls.
            </div>
          </div>
        </div>
      </section>
    </PharmaFlowShell>
  );
};

export default PharmaFlowCommandCenter;
