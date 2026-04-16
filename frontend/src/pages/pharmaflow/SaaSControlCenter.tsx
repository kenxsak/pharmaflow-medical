import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  PlatformAPI,
  PlatformFeatureResponse,
  PlatformOverviewResponse,
  PlatformPlanRequest,
  PlatformPlanResponse,
  PlatformRuntimeDatabaseDiagnosticsResponse,
  PlatformTenantContextResponse,
  PlatformTenantRequest,
  PlatformTenantResponse,
} from '../../services/api';
import { downloadCsv } from '../../utils/exportCsv';
import {
  applyTenantBranding,
  calculateAnnualRunRate,
  calculateTotalMrr,
  countEntitlements,
  createEmptyPlan,
  createEmptyTenant,
  FeatureCatalogItem,
  FEATURE_CATALOG,
  formatInr,
  isFeatureEnabledForPlan,
  PlanRecord,
  SaaSAdminState,
  TenantRecord,
} from '../../utils/saasAdmin';
import LegacyModal from '../../shared/legacy/LegacyModal';
import { getPharmaFlowPersona, usePharmaFlowContext } from '../../utils/pharmaflowContext';

const badgeClasses = {
  Draft: 'border-slate-200 bg-slate-50 text-slate-700',
  Live: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Pilot: 'border-sky-200 bg-sky-50 text-sky-700',
  Expansion: 'border-violet-200 bg-violet-50 text-violet-700',
  Attention: 'border-rose-200 bg-rose-50 text-rose-700',
  Suspended: 'border-amber-200 bg-amber-50 text-amber-800',
  Churned: 'border-rose-200 bg-rose-50 text-rose-800',
};

const runtimeStatusClasses: Record<string, string> = {
  HEALTHY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PRESSURED: 'border-amber-200 bg-amber-50 text-amber-800',
  DOWN: 'border-rose-200 bg-rose-50 text-rose-700',
  UNKNOWN: 'border-slate-200 bg-slate-100 text-slate-700',
};

const runtimeStatusCopy: Record<string, { label: string; summary: string }> = {
  HEALTHY: {
    label: 'Stable',
    summary: 'The backend and database pool look healthy right now.',
  },
  PRESSURED: {
    label: 'Needs attention',
    summary: 'The backend is still up, but the database pool is showing pressure and should be watched.',
  },
  DOWN: {
    label: 'Blocked',
    summary: 'The backend cannot reach the database right now. Store actions may fail until it recovers.',
  },
  UNKNOWN: {
    label: 'Checking',
    summary: 'Run a live check to confirm how the backend and database are behaving.',
  },
};

const formatRuntimeMs = (value?: number | null) => (typeof value === 'number' ? `${Math.round(value)} ms` : '--');

const formatRuntimePercent = (value?: number | null) =>
  typeof value === 'number' ? `${Math.round(value)}%` : '--';

const formatRuntimeCapturedAt = (value?: string | null) => {
  if (!value) {
    return 'Not checked yet';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Not checked yet';
  }

  return parsed.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const toFeatureCatalogItem = (feature: PlatformFeatureResponse) => ({
  id: feature.id,
  code: feature.code,
  title: feature.title,
  group: feature.group as (typeof FEATURE_CATALOG)[number]['group'],
  priority: feature.priority as (typeof FEATURE_CATALOG)[number]['priority'],
  summary: feature.summary,
});

const toPlanRecord = (plan: PlatformPlanResponse): PlanRecord => ({
  id: plan.id,
  planCode: plan.planCode,
  name: plan.name,
  description: plan.description,
  bestFor: plan.bestFor,
  monthlyPriceInr: Number(plan.monthlyPriceInr || 0),
  annualPriceInr: Number(plan.annualPriceInr || 0),
  onboardingFeeInr: Number(plan.onboardingFeeInr || 0),
  perStoreOverageInr: Number(plan.perStoreOverageInr || 0),
  perUserOverageInr: Number(plan.perUserOverageInr || 0),
  maxStores: Number(plan.maxStores || 0),
  maxUsers: Number(plan.maxUsers || 0),
  supportTier: plan.supportTier as PlanRecord['supportTier'],
  featureCodes: plan.featureCodes || [],
});

const toTenantRecord = (tenant: PlatformTenantResponse): TenantRecord => ({
  id: tenant.id,
  tenantCode: tenant.tenantCode,
  brandName: tenant.brandName,
  legalName: tenant.legalName || '',
  slug: tenant.slug,
  status: tenant.status as TenantRecord['status'],
  planId: tenant.planId || '',
  planCode: tenant.planCode || '',
  planName: tenant.planName || '',
  billingCycle: tenant.billingCycle as TenantRecord['billingCycle'],
  storeCount: Number(tenant.storeCount || 0),
  activeUsers: Number(tenant.activeUsers || 0),
  deploymentMode: tenant.deploymentMode || '',
  supportEmail: tenant.supportEmail || '',
  supportPhone: tenant.supportPhone || '',
  billingEmail: tenant.billingEmail || '',
  gstin: tenant.gstin || '',
  renewalDate: tenant.renewalDate || new Date().toISOString().slice(0, 10),
  monthlyRecurringRevenueInr: Number(tenant.monthlyRecurringRevenueInr || 0),
  notes: tenant.notes || '',
});

const toPlanRequest = (plan: PlanRecord): PlatformPlanRequest => ({
  planCode: plan.planCode || plan.id,
  name: plan.name,
  description: plan.description,
  bestFor: plan.bestFor,
  monthlyPriceInr: plan.monthlyPriceInr,
  annualPriceInr: plan.annualPriceInr,
  onboardingFeeInr: plan.onboardingFeeInr,
  perStoreOverageInr: plan.perStoreOverageInr,
  perUserOverageInr: plan.perUserOverageInr,
  maxStores: plan.maxStores,
  maxUsers: plan.maxUsers,
  supportTier: plan.supportTier,
  featureCodes: plan.featureCodes,
});

const toTenantRequest = (tenant: TenantRecord): PlatformTenantRequest => ({
  planId: tenant.planId || undefined,
  tenantCode: tenant.tenantCode || undefined,
  brandName: tenant.brandName,
  legalName: tenant.legalName || undefined,
  slug: tenant.slug,
  status: tenant.status,
  billingCycle: tenant.billingCycle,
  storeCount: tenant.storeCount,
  activeUsers: tenant.activeUsers,
  deploymentMode: tenant.deploymentMode,
  supportEmail: tenant.supportEmail,
  supportPhone: tenant.supportPhone,
  billingEmail: tenant.billingEmail,
  gstin: tenant.gstin,
  renewalDate: tenant.renewalDate,
  monthlyRecurringRevenueInr: tenant.monthlyRecurringRevenueInr,
  notes: tenant.notes,
});

const EMPTY_ADMIN_STATE: SaaSAdminState = {
  plans: [],
  tenants: [],
  selectedTenantId: '',
  selectedPlanId: '',
};

interface SaaSControlCenterProps {
  embedded?: boolean;
}

const SaaSControlCenter: React.FC<SaaSControlCenterProps> = ({ embedded = false }) => {
  const platformSession = usePharmaFlowContext();
  const canAccessPlatform = getPharmaFlowPersona(platformSession) === 'saas-admin';
  const [adminState, setAdminState] = useState<SaaSAdminState>(EMPTY_ADMIN_STATE);
  const [tenantDraft, setTenantDraft] = useState<TenantRecord>(() => createEmptyTenant(Date.now()));
  const [planDraft, setPlanDraft] = useState<PlanRecord>(() => createEmptyPlan(Date.now()));
  const [featureCatalog, setFeatureCatalog] = useState<FeatureCatalogItem[]>(FEATURE_CATALOG);
  const [overview, setOverview] = useState<PlatformOverviewResponse | null>(null);
  const [platformContext, setPlatformContext] = useState<PlatformTenantContextResponse | null>(null);
  const [runtimeSnapshot, setRuntimeSnapshot] = useState<PlatformRuntimeDatabaseDiagnosticsResponse | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isRuntimeLoading, setIsRuntimeLoading] = useState(false);
  const [runtimeRefreshNonce, setRuntimeRefreshNonce] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTenantEditorOpen, setIsTenantEditorOpen] = useState(false);
  const [isPlanEditorOpen, setIsPlanEditorOpen] = useState(false);

  const selectedTenant = useMemo(
    () => {
      if (!adminState.tenants.length) {
        return undefined;
      }
      if (!adminState.selectedTenantId) {
        return adminState.tenants[0];
      }
      return adminState.tenants.find((tenant) => tenant.id === adminState.selectedTenantId);
    },
    [adminState.selectedTenantId, adminState.tenants]
  );

  const selectedPlan = useMemo(
    () => {
      if (!adminState.plans.length) {
        return undefined;
      }
      if (!adminState.selectedPlanId) {
        return adminState.plans[0];
      }
      return adminState.plans.find((plan) => plan.id === adminState.selectedPlanId);
    },
    [adminState.plans, adminState.selectedPlanId]
  );

  useEffect(() => {
    if (selectedTenant) {
      setTenantDraft(selectedTenant);
    }
  }, [selectedTenant]);

  useEffect(() => {
    if (selectedPlan) {
      setPlanDraft(selectedPlan);
    }
  }, [selectedPlan]);

  useEffect(() => {
    let active = true;

    const loadPlatformState = async () => {
      if (!canAccessPlatform) {
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [features, plans, tenants, overviewResponse, contextResponse] = await Promise.all([
          PlatformAPI.listFeatures(),
          PlatformAPI.listPlans(),
          PlatformAPI.listTenants(),
          PlatformAPI.getOverview(),
          PlatformAPI.getTenantContext(),
        ]);

        if (!active) {
          return;
        }

        const mappedPlans = plans.map(toPlanRecord);
        const mappedTenants = tenants.map(toTenantRecord);
        const initialPlan = mappedPlans[0] || createEmptyPlan(Date.now());
        const initialTenant =
          mappedTenants[0] ||
          createEmptyTenant(Date.now(), initialPlan.id, initialPlan.planCode, initialPlan.name, initialPlan.monthlyPriceInr);

        setFeatureCatalog(features.map(toFeatureCatalogItem));
        setOverview(overviewResponse);
        setPlatformContext(contextResponse);
        setAdminState({
          plans: mappedPlans,
          tenants: mappedTenants,
          selectedTenantId: initialTenant.id,
          selectedPlanId: initialTenant.planId || initialPlan.id,
        });
        setTenantDraft(initialTenant);
        setPlanDraft(initialPlan);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : 'Unable to load SaaS admin state.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadPlatformState();

    return () => {
      active = false;
    };
  }, [canAccessPlatform]);

  useEffect(() => {
    let active = true;

    const loadRuntimeDiagnostics = async () => {
      if (!canAccessPlatform) {
        if (active) {
          setRuntimeSnapshot(null);
          setRuntimeError(null);
          setIsRuntimeLoading(false);
        }
        return;
      }

      setIsRuntimeLoading(true);
      setRuntimeError(null);
      try {
        const snapshot = await PlatformAPI.getRuntimeDatabaseDiagnostics();
        if (!active) {
          return;
        }
        setRuntimeSnapshot(snapshot);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setRuntimeError(loadError instanceof Error ? loadError.message : 'Unable to load runtime health.');
      } finally {
        if (active) {
          setIsRuntimeLoading(false);
        }
      }
    };

    loadRuntimeDiagnostics();

    return () => {
      active = false;
    };
  }, [canAccessPlatform, runtimeRefreshNonce]);

  if (!canAccessPlatform) {
    return (
      <PharmaFlowShell
        embedded={embedded}
        title="SaaS Super Admin"
        description="Platform controls are only available to the SaaS owner account."
      >
        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-sm">
          This login does not have SaaS platform access. Use the SaaS Admin account from the same LifePill login screen to manage tenants, plans, pricing, and entitlements.
        </section>
      </PharmaFlowShell>
    );
  }

  const totalMrr = useMemo(() => calculateTotalMrr(adminState.tenants), [adminState.tenants]);
  const annualRunRate = useMemo(() => calculateAnnualRunRate(totalMrr), [totalMrr]);
  const enterpriseCount = useMemo(
    () =>
      adminState.tenants.filter((tenant) =>
        ['chain', 'enterprise'].includes((tenant.planCode || '').toLowerCase())
      ).length,
    [adminState.tenants]
  );
  const alwaysOnSupportCount = useMemo(
    () => adminState.plans.filter((plan) => plan.supportTier === '24x7').length,
    [adminState.plans]
  );
  const runtimeStatus = runtimeSnapshot?.status || 'UNKNOWN';
  const runtimeStatusTone = runtimeStatusClasses[runtimeStatus] || runtimeStatusClasses.UNKNOWN;
  const runtimeStatusDetail = runtimeStatusCopy[runtimeStatus] || runtimeStatusCopy.UNKNOWN;

  const updateTenantDraft = (key: keyof TenantRecord, value: string | number) => {
    setTenantDraft((current) => {
      const nextDraft = {
        ...current,
        [key]: value,
      };

      if (key === 'planId') {
        const matchedPlan = adminState.plans.find((plan) => plan.id === value);
        if (matchedPlan) {
          nextDraft.monthlyRecurringRevenueInr = matchedPlan.monthlyPriceInr;
          nextDraft.planCode = matchedPlan.planCode || '';
          nextDraft.planName = matchedPlan.name;
        }
      }

      return nextDraft;
    });
  };

  const updatePlanDraft = (key: keyof PlanRecord, value: string | number | string[]) => {
    setPlanDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const saveTenant = async () => {
    try {
      setError(null);
      const tenantExists = adminState.tenants.some((tenant) => tenant.id === tenantDraft.id);
      const saved = tenantExists
        ? await PlatformAPI.updateTenant(tenantDraft.id, toTenantRequest(tenantDraft))
        : await PlatformAPI.createTenant(toTenantRequest(tenantDraft));

      const mappedTenant = toTenantRecord(saved);
      setAdminState((current) => {
        const nextTenants = tenantExists
          ? current.tenants.map((tenant) => (tenant.id === tenantDraft.id ? mappedTenant : tenant))
          : [...current.tenants, mappedTenant];

        return {
          ...current,
          tenants: nextTenants,
          selectedTenantId: mappedTenant.id,
          selectedPlanId: mappedTenant.planId || current.selectedPlanId,
        };
      });
      setTenantDraft(mappedTenant);
      setIsTenantEditorOpen(false);
      setOverview((current) =>
        current
          ? {
              ...current,
              tenantCount: tenantExists ? current.tenantCount : current.tenantCount + 1,
            }
          : current
      );
      setMessage(`Saved tenant ${mappedTenant.brandName}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save tenant.');
    }
  };

  const savePlan = async () => {
    try {
      setError(null);
      const planExists = adminState.plans.some((plan) => plan.id === planDraft.id);
      const saved = planExists
        ? await PlatformAPI.updatePlan(planDraft.id, toPlanRequest(planDraft))
        : await PlatformAPI.createPlan(toPlanRequest(planDraft));

      const mappedPlan = toPlanRecord(saved);
      setAdminState((current) => ({
        ...current,
        plans: planExists
          ? current.plans.map((plan) => (plan.id === planDraft.id ? mappedPlan : plan))
          : [...current.plans, mappedPlan],
        selectedPlanId: mappedPlan.id,
        tenants: current.tenants.map((tenant) =>
          tenant.planId === mappedPlan.id
            ? {
                ...tenant,
                planCode: mappedPlan.planCode || '',
                planName: mappedPlan.name,
                monthlyRecurringRevenueInr:
                  tenant.monthlyRecurringRevenueInr || mappedPlan.monthlyPriceInr,
              }
            : tenant
        ),
      }));
      setPlanDraft(mappedPlan);
      setIsPlanEditorOpen(false);
      setOverview((current) =>
        current
          ? {
              ...current,
              planCount: planExists ? current.planCount : current.planCount + 1,
            }
          : current
      );
      setMessage(`Saved pricing plan ${mappedPlan.name}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save pricing plan.');
    }
  };

  const createTenant = () => {
    const defaultPlan = selectedPlan || adminState.plans[0];
    const nextTenant = createEmptyTenant(
      Date.now(),
      defaultPlan?.id || '',
      defaultPlan?.planCode || '',
      defaultPlan?.name || '',
      defaultPlan?.monthlyPriceInr || 0
    );
    setTenantDraft(nextTenant);
    setAdminState((current) => ({
      ...current,
      selectedTenantId: nextTenant.id,
      selectedPlanId: nextTenant.planId || current.selectedPlanId,
    }));
    setIsTenantEditorOpen(true);
    setMessage('Started a new tenant draft. Save it when ready.');
  };

  const createPlan = () => {
    const nextPlan = createEmptyPlan(Date.now());
    setPlanDraft(nextPlan);
    setAdminState((current) => ({
      ...current,
      selectedPlanId: nextPlan.id,
    }));
    setIsPlanEditorOpen(true);
    setMessage('Started a new pricing plan draft. Save it when ready.');
  };

  const selectTenant = (tenant: TenantRecord) => {
    setAdminState((current) => ({
      ...current,
      selectedTenantId: tenant.id,
      selectedPlanId: tenant.planId || current.selectedPlanId,
    }));
    setMessage(null);
  };

  const selectPlan = (plan: PlanRecord) => {
    setAdminState((current) => ({
      ...current,
      selectedPlanId: plan.id,
    }));
    setMessage(null);
  };

  const toggleFeature = (featureCode: string) => {
    setPlanDraft((current) => {
      const enabled = current.featureCodes.includes(featureCode);
      return {
        ...current,
        featureCodes: enabled
          ? current.featureCodes.filter((item) => item !== featureCode)
          : [...current.featureCodes, featureCode],
      };
    });
  };

  const handleApplyBranding = () => {
    applyTenantBranding(tenantDraft);
    setMessage(`${tenantDraft.brandName} branding is now applied to the current workspace.`);
  };

  const exportTenantRoster = () => {
    downloadCsv(
      'tenant-roster.csv',
      ['Brand', 'Plan', 'Status', 'Stores', 'Users', 'MRR', 'Renewal', 'Support Email'],
      adminState.tenants.map((tenant) => {
        const tenantPlan = adminState.plans.find((plan) => plan.id === tenant.planId);
        return [
          tenant.brandName,
          tenant.planName || tenantPlan?.name || tenant.planCode || tenant.planId,
          tenant.status,
          tenant.storeCount,
          tenant.activeUsers,
          tenant.monthlyRecurringRevenueInr,
          tenant.renewalDate,
          tenant.supportEmail,
        ];
      })
    );
  };

  const exportPricingMatrix = () => {
    downloadCsv(
      'pricing-matrix.csv',
      ['Plan', 'Monthly INR', 'Annual INR', 'Onboarding INR', 'Per Store Overage', 'Per User Overage', 'Max Stores', 'Max Users', 'Support', 'Entitlements'],
      adminState.plans.map((plan) => [
        plan.name,
        plan.monthlyPriceInr,
        plan.annualPriceInr,
        plan.onboardingFeeInr,
        plan.perStoreOverageInr,
        plan.perUserOverageInr,
        plan.maxStores,
        plan.maxUsers,
        plan.supportTier,
        countEntitlements(plan),
      ])
    );
  };

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="SaaS Super Admin"
      description="Manage brands, plans, pricing, and feature entitlements from one multi-tenant control center so the product scales cleanly from one pharmacy to many branded companies."
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportTenantRoster}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            Export tenants
          </button>
          <button
            type="button"
            onClick={exportPricingMatrix}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            Export pricing
          </button>
        </div>
      }
    >
      {platformContext && (
        <section className="rounded-[2rem] border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-950 shadow-sm">
          Platform owner session is active for tenant <span className="font-semibold">{platformContext.brandName}</span>.
          Current tenant plan: <span className="font-semibold">{platformContext.planName || platformContext.planCode || 'Unassigned'}</span>.
          Feature entitlements loaded from the backend: <span className="font-semibold">{platformContext.featureCodes.length}</span>.
          {overview && (
            <>
              {' '}
              Backend overview is synchronized across <span className="font-semibold">{overview.tenantCount}</span> tenants and{' '}
              <span className="font-semibold">{overview.planCount}</span> plans.
            </>
          )}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Tenants</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{adminState.tenants.length}</div>
          <div className="mt-1 text-sm text-slate-500">Brands managed from super admin</div>
        </div>
        <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">MRR</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{formatInr(totalMrr)}</div>
          <div className="mt-1 text-sm text-slate-500">Monthly recurring revenue snapshot</div>
        </div>
        <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">ARR</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{formatInr(annualRunRate)}</div>
          <div className="mt-1 text-sm text-slate-500">Run-rate based on current tenants</div>
        </div>
        <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Enterprise plans</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{enterpriseCount}</div>
          <div className="mt-1 text-sm text-slate-500">
            {alwaysOnSupportCount} plans include 24x7 support
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Runtime Health</div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">Platform database heartbeat</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              This is the plain-language backend check for the SaaS owner. It shows whether the database is reachable,
              whether the connection pool is getting tight, and what to watch next before stores feel the issue.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRuntimeRefreshNonce((current) => current + 1)}
            disabled={isRuntimeLoading}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRuntimeLoading ? 'Refreshing check...' : 'Refresh check'}
          </button>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${runtimeStatusTone}`}>
                {runtimeStatusDetail.label}
              </span>
              <span className="text-sm text-slate-500">
                Last checked {formatRuntimeCapturedAt(runtimeSnapshot?.capturedAt)}
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-700">{runtimeStatusDetail.summary}</p>

            {isRuntimeLoading && !runtimeSnapshot && (
              <div className="mt-4 rounded-[1.25rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                Running the first live backend check now...
              </div>
            )}

            {runtimeError && !runtimeSnapshot && (
              <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                Runtime health could not be loaded yet. {runtimeError}
              </div>
            )}

            {runtimeError && runtimeSnapshot && (
              <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Showing the last successful snapshot. The latest refresh failed with: {runtimeError}
              </div>
            )}

            {runtimeSnapshot?.errorSummary && (
              <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                Latest backend note: {runtimeSnapshot.errorSummary}
              </div>
            )}

            <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Database</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">
                  {runtimeSnapshot ? (runtimeSnapshot.dbReachable ? 'Reachable' : 'Unavailable') : '--'}
                </dd>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Ping</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">{formatRuntimeMs(runtimeSnapshot?.dbPingMs)}</dd>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Pool use</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">
                  {runtimeSnapshot
                    ? `${runtimeSnapshot.activeConnections}/${runtimeSnapshot.maxConnections} (${formatRuntimePercent(runtimeSnapshot.utilizationPercent)})`
                    : '--'}
                </dd>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Waiting now</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">
                  {runtimeSnapshot ? runtimeSnapshot.pendingConnections : '--'}
                </dd>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Typical acquire</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">
                  {formatRuntimeMs(runtimeSnapshot?.acquireMeanMs)}
                </dd>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Timeouts</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">
                  {runtimeSnapshot ? runtimeSnapshot.timeoutCount : '--'}
                </dd>
              </div>
            </dl>

            {runtimeSnapshot && (
              <div className="mt-4 text-xs text-slate-500">
                Pool <span className="font-semibold text-slate-700">{runtimeSnapshot.poolName}</span> for app{' '}
                <span className="font-semibold text-slate-700">{runtimeSnapshot.applicationName}</span>
              </div>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold text-slate-950">What to watch next</div>
            <p className="mt-2 text-sm text-slate-500">
              Keep this simple: if waiting requests or timeouts rise, check request diagnostics and Render database load
              before the stores get slower.
            </p>
            <div className="mt-4 space-y-3">
              {(runtimeSnapshot?.advisory.length ? runtimeSnapshot.advisory : ['Run a refresh when you need a live runtime check.']).map(
                (item, index) => (
                  <div key={`${item}-${index}`} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {message && (
        <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 shadow-sm">
          {message}
        </section>
      )}

      {error && (
        <section className="rounded-[2rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900 shadow-sm">
          {error}
        </section>
      )}

      {isLoading && (
        <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          Loading tenant, plan, and entitlement data from the backend...
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Tenant Roster</div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Brands and subscriptions</h2>
            </div>
            <button
              type="button"
              onClick={createTenant}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              New tenant
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {adminState.tenants.map((tenant) => {
              const plan = adminState.plans.find((item) => item.id === tenant.planId);
              const isSelected = tenant.id === tenantDraft.id || tenant.id === adminState.selectedTenantId;

              return (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => selectTenant(tenant)}
                  className={`w-full rounded-[1.75rem] border px-4 py-4 text-left transition ${
                    isSelected
                      ? 'border-sky-200 bg-sky-50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:border-sky-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-slate-950">{tenant.brandName}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {tenant.planName || plan?.name || tenant.planCode || tenant.planId} • {tenant.storeCount} stores • {tenant.activeUsers} users
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${badgeClasses[tenant.status]}`}>
                      {tenant.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <div>MRR: {formatInr(tenant.monthlyRecurringRevenueInr)}</div>
                    <div>Renewal: {tenant.renewalDate}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Tenant Profile</div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Commercial and branding overview</h2>
              <p className="mt-2 text-sm text-slate-500">
                Keep the platform roster clean here, then open the guided editor only when you want to create or adjust a company profile.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsTenantEditorOpen(true)}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Edit tenant
              </button>
              <button
                type="button"
                onClick={handleApplyBranding}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                Apply branding
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm font-semibold text-slate-950">{tenantDraft.brandName || 'Tenant draft'}</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                {tenantDraft.planName || tenantDraft.planCode || 'No plan selected'} • {tenantDraft.storeCount} stores • {tenantDraft.activeUsers} users
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Status</div>
                  <div className="mt-2 text-base font-semibold text-slate-950">{tenantDraft.status}</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Billing</div>
                  <div className="mt-2 text-base font-semibold text-slate-950">{tenantDraft.billingCycle}</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">MRR</div>
                  <div className="mt-2 text-base font-semibold text-slate-950">{formatInr(tenantDraft.monthlyRecurringRevenueInr)}</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Renewal</div>
                  <div className="mt-2 text-base font-semibold text-slate-950">{tenantDraft.renewalDate || 'Not set'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <div className="text-sm font-semibold text-slate-950">Support identity</div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600">
                  <div>Email: {tenantDraft.supportEmail || 'Not set'}</div>
                  <div>Phone: {tenantDraft.supportPhone || 'Not set'}</div>
                  <div>Billing email: {tenantDraft.billingEmail || 'Not set'}</div>
                  <div>GSTIN: {tenantDraft.gstin || 'Not set'}</div>
                </div>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-semibold text-slate-950">Operating note</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  {tenantDraft.notes || 'Use notes for rollout commitments, onboarding reminders, support promises, or deployment-specific context.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Plan Catalog</div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">Pricing, support, and scale boundaries</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={createPlan}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              New plan
            </button>
            <Link
              to="/lifepill/enterprise"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Open rollout guide
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
          <div className="space-y-3">
            {adminState.plans.map((plan) => {
              const isSelected = plan.id === planDraft.id || plan.id === adminState.selectedPlanId;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => selectPlan(plan)}
                  className={`w-full rounded-[1.75rem] border px-4 py-4 text-left transition ${
                    isSelected
                      ? 'border-sky-200 bg-sky-50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:border-sky-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-slate-950">{plan.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{plan.bestFor}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-950">{formatInr(plan.monthlyPriceInr)}/mo</div>
                      <div className="text-xs text-slate-500">{plan.supportTier}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <div>Stores: {plan.maxStores >= 9999 ? 'Unlimited' : plan.maxStores}</div>
                    <div>Entitlements: {countEntitlements(plan)} / 43</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Selected plan overview</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Keep pricing and capacity easy to read here, then open the editor when you need to change plan rules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanEditorOpen(true)}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Edit pricing
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Plan</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">{planDraft.name}</div>
                <div className="mt-1 text-sm text-slate-500">{planDraft.bestFor}</div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Support tier</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">{planDraft.supportTier}</div>
                <div className="mt-1 text-sm text-slate-500">{countEntitlements(planDraft)} enabled capabilities</div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Monthly price</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">{formatInr(planDraft.monthlyPriceInr)}</div>
                <div className="mt-1 text-sm text-slate-500">Annual: {formatInr(planDraft.annualPriceInr)}</div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Capacity</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">
                  {planDraft.maxStores >= 9999 ? 'Unlimited stores' : `${planDraft.maxStores} stores`}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {planDraft.maxUsers >= 9999 ? 'Unlimited users' : `${planDraft.maxUsers} users`}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              {planDraft.description}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Feature Entitlements</div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">Capability matrix for the selected plan</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Toggle included capabilities here, then save the selected plan so pricing and access rules stay aligned.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              Editing: {planDraft.name}
            </div>
            <button
              type="button"
              onClick={savePlan}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Save plan changes
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left">Q</th>
                <th className="px-3 py-3 text-left">Feature</th>
                <th className="px-3 py-3 text-left">Group</th>
                <th className="px-3 py-3 text-left">Priority</th>
                <th className="px-3 py-3 text-left">Included</th>
              </tr>
            </thead>
            <tbody>
              {featureCatalog.map((feature) => {
                const enabled = isFeatureEnabledForPlan(planDraft, feature.code);
                return (
                  <tr key={feature.code} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-3 font-semibold text-slate-900">{feature.id}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{feature.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{feature.summary}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{feature.group}</td>
                    <td className="px-3 py-3 text-slate-600">{feature.priority}</td>
                    <td className="px-3 py-3">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => toggleFeature(feature.code)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        {enabled ? 'Included' : 'Not included'}
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <LegacyModal
        open={isTenantEditorOpen}
        onClose={() => setIsTenantEditorOpen(false)}
        title="Tenant Editor"
        description="Set the commercial profile, rollout status, contact identity, and branding details for a company account."
        size="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsTenantEditorOpen(false)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveTenant}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Save tenant
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Tenant code</span>
              <input
                value={tenantDraft.tenantCode || ''}
                onChange={(event) => updateTenantDraft('tenantCode', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Brand name</span>
              <input
                value={tenantDraft.brandName}
                onChange={(event) => updateTenantDraft('brandName', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Legal name</span>
              <input
                value={tenantDraft.legalName || ''}
                onChange={(event) => updateTenantDraft('legalName', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Slug</span>
              <input
                value={tenantDraft.slug}
                onChange={(event) => updateTenantDraft('slug', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Plan</span>
              <select
                value={tenantDraft.planId}
                onChange={(event) => updateTenantDraft('planId', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                {adminState.plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Tenant status</span>
              <select
                value={tenantDraft.status}
                onChange={(event) => updateTenantDraft('status', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="Draft">Draft</option>
                <option value="Pilot">Pilot</option>
                <option value="Live">Live</option>
                <option value="Expansion">Expansion</option>
                <option value="Attention">Attention</option>
                <option value="Suspended">Suspended</option>
                <option value="Churned">Churned</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Billing cycle</span>
              <select
                value={tenantDraft.billingCycle}
                onChange={(event) => updateTenantDraft('billingCycle', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Stores</span>
              <input
                type="number"
                value={tenantDraft.storeCount}
                onChange={(event) => updateTenantDraft('storeCount', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Active users</span>
              <input
                type="number"
                value={tenantDraft.activeUsers}
                onChange={(event) => updateTenantDraft('activeUsers', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">MRR (INR)</span>
              <input
                type="number"
                value={tenantDraft.monthlyRecurringRevenueInr}
                onChange={(event) => updateTenantDraft('monthlyRecurringRevenueInr', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Renewal date</span>
              <input
                type="date"
                value={tenantDraft.renewalDate}
                onChange={(event) => updateTenantDraft('renewalDate', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Deployment mode</span>
              <input
                value={tenantDraft.deploymentMode}
                onChange={(event) => updateTenantDraft('deploymentMode', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Support email</span>
              <input
                value={tenantDraft.supportEmail}
                onChange={(event) => updateTenantDraft('supportEmail', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Support phone</span>
              <input
                value={tenantDraft.supportPhone}
                onChange={(event) => updateTenantDraft('supportPhone', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Billing email</span>
              <input
                value={tenantDraft.billingEmail}
                onChange={(event) => updateTenantDraft('billingEmail', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">GSTIN</span>
              <input
                value={tenantDraft.gstin}
                onChange={(event) => updateTenantDraft('gstin', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Notes</span>
              <textarea
                value={tenantDraft.notes}
                onChange={(event) => updateTenantDraft('notes', event.target.value)}
                className="min-h-[110px] w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-950">What this controls</div>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <div>Brand identity used across the workspace, receipts, and support-facing communication.</div>
              <div>Commercial limits such as stores, active users, plan assignment, and renewal expectations.</div>
              <div>Support and billing contacts used during onboarding, renewal, and rollout follow-up.</div>
            </div>
          </div>
        </div>
      </LegacyModal>

      <LegacyModal
        open={isPlanEditorOpen}
        onClose={() => setIsPlanEditorOpen(false)}
        title="Pricing Plan Editor"
        description="Define pricing, support, scale limits, and commercial positioning for the selected SaaS plan."
        size="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsPlanEditorOpen(false)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={savePlan}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Save pricing plan
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Plan code</span>
              <input
                value={planDraft.planCode || ''}
                onChange={(event) => updatePlanDraft('planCode', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Plan name</span>
              <input
                value={planDraft.name}
                onChange={(event) => updatePlanDraft('name', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Support tier</span>
              <select
                value={planDraft.supportTier}
                onChange={(event) => updatePlanDraft('supportTier', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="Business Hours">Business Hours</option>
                <option value="Extended">Extended</option>
                <option value="24x7">24x7</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Monthly price (INR)</span>
              <input
                type="number"
                value={planDraft.monthlyPriceInr}
                onChange={(event) => updatePlanDraft('monthlyPriceInr', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Annual price (INR)</span>
              <input
                type="number"
                value={planDraft.annualPriceInr}
                onChange={(event) => updatePlanDraft('annualPriceInr', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Onboarding fee (INR)</span>
              <input
                type="number"
                value={planDraft.onboardingFeeInr}
                onChange={(event) => updatePlanDraft('onboardingFeeInr', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Per-store overage (INR)</span>
              <input
                type="number"
                value={planDraft.perStoreOverageInr}
                onChange={(event) => updatePlanDraft('perStoreOverageInr', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Per-user overage (INR)</span>
              <input
                type="number"
                value={planDraft.perUserOverageInr}
                onChange={(event) => updatePlanDraft('perUserOverageInr', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Max stores</span>
              <input
                type="number"
                value={planDraft.maxStores}
                onChange={(event) => updatePlanDraft('maxStores', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Max users</span>
              <input
                type="number"
                value={planDraft.maxUsers}
                onChange={(event) => updatePlanDraft('maxUsers', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Description</span>
              <input
                value={planDraft.description}
                onChange={(event) => updatePlanDraft('description', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Best for</span>
              <input
                value={planDraft.bestFor}
                onChange={(event) => updatePlanDraft('bestFor', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-950">Plan coverage</div>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <div>{countEntitlements(planDraft)} capabilities are currently enabled for this plan.</div>
              <div>Use the capability matrix behind the modal to control detailed feature entitlements.</div>
              <div>Pricing, support, and usage limits here drive how each company account is packaged.</div>
            </div>
          </div>
        </div>
      </LegacyModal>

      <section className="rounded-[2rem] border border-slate-200/70 bg-slate-950 p-6 text-white shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Legacy Compatibility</div>
            <h2 className="mt-3 text-xl font-semibold">LifePill login now uses its own API base again</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              The legacy LifePill route now resolves against the old `/lifepill/v1` backend instead of accidentally borrowing the retail `/api/v1` base.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Tenant Branding</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Pick a tenant here, apply the branding, and the shell plus receipts will switch to that brand across the workspace.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Commercial Story</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Use Launch, Growth, Chain, and Enterprise Plus to explain how pricing, support, stores, and premium features scale across brands.
            </p>
          </div>
        </div>
      </section>
    </PharmaFlowShell>
  );
};

export default SaaSControlCenter;
