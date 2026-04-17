import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Building2, ChevronsLeftRight, CircleDot, LayoutDashboard, Sparkles } from 'lucide-react';
import { StoreAPI, StoreSummary } from '../../services/api';
import { getBrandInitials, useBranding } from '../../utils/branding';
import {
  announcePharmaFlowContextChange,
  canAccessCompanyControls,
  canSwitchStores,
  getVisibleStoresForContext,
  getPharmaFlowHomePath,
  getPharmaFlowPersona,
  getPharmaFlowRoleLabel,
  usePharmaFlowContext,
} from '../../utils/pharmaflowContext';
import { PharmaFlowNavItem, pharmaFlowNavGroups, pharmaFlowNavItems } from './navigation';

interface PharmaFlowShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  embedded?: boolean;
}

const statusClasses: Record<PharmaFlowNavItem['status'], string> = {
  Live: 'text-emerald-700',
  Partial: 'text-amber-700',
};

const topTabClasses = (isActive: boolean) =>
  [
    'inline-flex min-w-fit items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition',
    isActive
      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
  ].join(' ');

const sideLinkClasses = (isActive: boolean) =>
  [
    'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition',
    isActive
      ? 'border-slate-900 bg-slate-900 text-white'
      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
  ].join(' ');

const demoRoutePaths = [
  '/lifepill/billing',
  '/lifepill/inventory',
  '/lifepill/procurement',
  '/lifepill/compliance',
];

const PharmaFlowShell: React.FC<PharmaFlowShellProps> = ({
  title,
  description,
  children,
  actions,
  embedded = false,
}) => {
  const context = usePharmaFlowContext();
  const branding = useBranding();
  const location = useLocation();
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [storeLoadError, setStoreLoadError] = useState<string | null>(null);
  const persona = getPharmaFlowPersona(context);
  const homePath = getPharmaFlowHomePath(context);
  const roleLabel = getPharmaFlowRoleLabel(context.role, context.platformOwner);
  const companyControlsVisible = canAccessCompanyControls(context);
  const storeSwitcherEnabled = canSwitchStores(context);

  useEffect(() => {
    if (!context.hasToken || !storeSwitcherEnabled) {
      setStores([]);
      setStoreLoadError(null);
      return;
    }

    StoreAPI.list()
      .then((items) => {
        setStores(getVisibleStoresForContext(items, context));
        setStoreLoadError(null);
      })
      .catch((error) => {
        setStoreLoadError(error instanceof Error ? error.message : 'Unable to load stores.');
      });
  }, [context.hasToken, context.role, context.platformOwner, context.storeCode, context.storeId, context.tenantId, storeSwitcherEnabled]);

  const currentNavItem = useMemo(() => {
    const exact = pharmaFlowNavItems.find((item) => item.path === location.pathname);
    if (exact) {
      return exact;
    }

    return pharmaFlowNavItems.find((item) => location.pathname.startsWith(item.path));
  }, [location.pathname]);

  const currentStore = useMemo(
    () => stores.find((store) => store.storeId === context.storeId) || null,
    [context.storeId, stores]
  );

  const preferredCounterStore = useMemo(
    () =>
      stores.find((store) => store.storeCode === 'TN-STORE-001') ||
      stores.find((store) => store.storeType === 'STORE') ||
      null,
    [stores]
  );

  const currentStoreName = currentStore?.storeName || context.storeCode || 'No active store';
  const visibleNavItems =
    persona === 'guest'
      ? pharmaFlowNavItems.filter((item) =>
          ['/lifepill/legacy-home', '/lifepill/help'].includes(item.path)
        )
      : pharmaFlowNavItems.filter((item) => item.access.includes(persona));
  const demoRouteItems = visibleNavItems.filter((item) => demoRoutePaths.includes(item.path));
  const brandInitials = getBrandInitials(branding.brandName);
  const groupedNavItems = pharmaFlowNavGroups.map((group) => ({
    group,
    items: visibleNavItems.filter((item) => item.group === group),
  })).filter(({ items }) => items.length > 0);

  const contextWarnings = [
    !context.hasToken ? 'Sign in from the LifePill legacy login before opening billing, inventory, and reports.' : null,
    !context.storeId ? 'Choose an active branch so every screen opens the right store data.' : null,
    storeLoadError,
  ].filter(Boolean) as string[];

  const applyStoreSelection = (nextStoreId: string) => {
    const nextStore = stores.find((store) => store.storeId === nextStoreId);
    localStorage.setItem('pharmaflow_store_id', nextStoreId);
    if (nextStore?.storeCode) {
      localStorage.setItem('pharmaflow_store_code', nextStore.storeCode);
    }
    announcePharmaFlowContextChange();
  };

  const handleStoreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!storeSwitcherEnabled) {
      return;
    }
    applyStoreSelection(event.target.value);
  };

  if (embedded) {
    return (
      <div className="legacy-module-ui space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {branding.brandName} legacy module
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700">
                <Building2 size={16} />
                {currentStoreName}
              </div>
              {context.role && (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
                  <LayoutDashboard size={16} />
                  {roleLabel}
                </div>
              )}
              {actions}
            </div>
          </div>

          {contextWarnings.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="font-semibold">Setup attention needed</div>
              <div className="mt-2 space-y-1">
                {contextWarnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="space-y-5">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-poppins text-slate-900">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-3 py-3 xl:flex-row">
        <aside className="w-full shrink-0 space-y-4 xl:w-[310px]">
          <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                {brandInitials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <Sparkles size={14} />
                  {branding.brandName}
                </div>
                <div className="mt-1 truncate text-xs text-slate-500">{branding.tagline}</div>
              </div>
            </div>
            <div className="mt-4 text-2xl font-semibold leading-tight text-slate-950">
              Legacy pharmacy workspace
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              Simple screens for non-technical teams. Open billing first, then stock, purchases, compliance, reports,
              stores, and admin controls in the same easy flow.
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Active branch</div>
              <div className="mt-2 text-base font-semibold text-slate-950">{currentStoreName}</div>
              <div className="mt-1 text-xs text-slate-500">
                {roleLabel || 'Role not set'} {context.storeCode ? `• ${context.storeCode}` : ''}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                to={homePath}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                Home
              </Link>
              <Link
                to="/lifepill/billing"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
              >
                Billing
              </Link>
              {companyControlsVisible && (
                <Link
                  to="/lifepill/setup"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  Company Setup
                </Link>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              <div className="font-semibold uppercase tracking-[0.18em] text-slate-500">Support identity</div>
              <div className="mt-2 break-all">{branding.supportEmail}</div>
              <div className="mt-1">{branding.supportPhone}</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              <ChevronsLeftRight size={14} />
              Branch Control
            </div>
            {storeSwitcherEnabled ? (
              <label className="mt-4 block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Active store</span>
                <select
                  value={context.storeId}
                  onChange={handleStoreChange}
                  disabled={!context.hasToken || stores.length === 0}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"
                >
                  <option value="">Select a store</option>
                  {stores.map((store) => (
                    <option key={store.storeId} value={store.storeId}>
                      {store.storeName} ({store.storeCode})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="text-xs uppercase tracking-wide text-slate-400">Assigned store</div>
                <div className="mt-2 font-semibold text-slate-950">{currentStoreName}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Store logins stay locked to their own branch workspace.
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-400">User</div>
                <div className="mt-2 font-medium text-slate-900">
                  {context.fullName || context.username || 'Not signed in'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-400">Token</div>
                <div className={`mt-2 font-medium ${context.hasToken ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {context.hasToken ? 'Connected' : 'Missing'}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <Link
                to="/legacy-login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
              >
                Legacy login
              </Link>
              <Link
                to={persona === 'store-ops' ? '/lifepill/help' : '/lifepill/enterprise'}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              >
                {persona === 'store-ops' ? 'Help and FAQ' : 'Rollout and coverage guide'}
              </Link>
            </div>
          </div>

          {groupedNavItems.map(({ group, items }) => (
            <div key={group} className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{group}</div>
              <div className="mt-4 space-y-2">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink key={item.path} to={item.path} className={({ isActive }) => sideLinkClasses(isActive)}>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          location.pathname === item.path ? 'bg-white/10' : 'bg-slate-100'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{item.title}</div>
                          <span className={`text-xs font-medium ${statusClasses[item.status]}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className={`${location.pathname === item.path ? 'text-slate-200' : 'text-slate-500'} text-xs`}>
                          {item.shortSummary}
                        </div>
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Suggested Start Path
            </div>
            <div className="mt-4 space-y-2">
              {demoRouteItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">Step {index + 1}: {item.title}</div>
                      <div className="text-xs text-slate-500">{item.shortSummary}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-4">
          <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm xl:hidden">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                  {roleLabel || 'No role'}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                  {context.storeCode || 'No store'}
                </span>
                <Link
                  to={homePath}
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  Home
                </Link>
              </div>

              {storeSwitcherEnabled ? (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Active store</span>
                  <select
                    value={context.storeId}
                    onChange={handleStoreChange}
                    disabled={!context.hasToken || stores.length === 0}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 disabled:bg-slate-100"
                  >
                    <option value="">Select a store</option>
                    {stores.map((store) => (
                      <option key={store.storeId} value={store.storeId}>
                        {store.storeName} ({store.storeCode})
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Assigned store</div>
                  <div className="mt-2 font-semibold text-slate-950">{currentStoreName}</div>
                </div>
              )}
            </div>
          </section>

          <header className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <Link to={homePath} className="hover:text-slate-900">
                    {branding.brandName}
                  </Link>
                  <span className="text-slate-300">/</span>
                  <span className="truncate text-slate-500">{currentNavItem?.title || 'Workspace'}</span>
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700">
                  <Building2 size={16} />
                  {currentStoreName}
                </div>
                {context.role && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
                    <LayoutDashboard size={16} />
                    {roleLabel}
                  </div>
                )}
                {actions}
              </div>
            </div>
          </header>

          <section className="rounded-xl border border-slate-300 bg-white p-3 shadow-sm xl:hidden">
            <div className="flex gap-2 overflow-x-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.path} to={item.path} className={({ isActive }) => topTabClasses(isActive)}>
                    {({ isActive }) => (
                      <>
                        <Icon size={16} className={isActive ? 'text-sky-700' : 'text-slate-500'} />
                        <span>{item.title}</span>
                        <CircleDot size={12} className={statusClasses[item.status]} />
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </section>

          {contextWarnings.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-sm">
              <div className="font-semibold">Setup attention needed</div>
              <div className="mt-2 space-y-1">
                {contextWarnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            </section>
          )}

          {context.hasToken &&
            currentStore &&
            currentStore.storeType !== 'STORE' &&
            preferredCounterStore &&
            preferredCounterStore.storeId !== currentStore.storeId && (
              <section className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="font-semibold">Preferred counter branch</div>
                      <div className="mt-1">
                        You are on {currentStore.storeName}. Billing, stocked medicines, customers, invoices, and
                        compliance samples are preloaded in {preferredCounterStore.storeName}.
                      </div>
                    </div>
                  <button
                    type="button"
                    onClick={() => applyStoreSelection(preferredCounterStore.storeId)}
                    className="rounded-full bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Switch to {preferredCounterStore.storeCode}
                  </button>
                </div>
              </section>
            )}

          <div className="legacy-module-ui space-y-5">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default PharmaFlowShell;
