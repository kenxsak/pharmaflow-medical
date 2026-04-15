import React from 'react';
import { Link } from 'react-router-dom';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  canAccessCompanyControls,
  canAccessPlatformControls,
  getPharmaFlowPersona,
  getPharmaFlowRoleLabel,
  usePharmaFlowContext,
} from '../../utils/pharmaflowContext';

interface HelpCard {
  title: string;
  who: string;
  route: string;
  routeLabel: string;
  checklist: string[];
  audiences: Array<'saas-admin' | 'company-admin' | 'store-ops'>;
}

interface HelpFaqItem {
  question: string;
  answer: string;
  audiences: Array<'saas-admin' | 'company-admin' | 'store-ops'>;
}

const resolveHelpWorkspaceKey = (route: string) => {
  if (route === '/cashier-dashboard') {
    return 'Billing';
  }
  if (route.includes('/billing-history')) {
    return 'Bills';
  }
  if (route.includes('/billing')) {
    return 'Billing';
  }
  if (route.includes('/customers')) {
    return 'Customers';
  }
  if (route.includes('/inventory')) {
    return 'Inventory';
  }
  if (route.includes('/procurement')) {
    return 'Purchases';
  }
  if (route.includes('/compliance')) {
    return 'Compliance';
  }
  if (route.includes('/reports')) {
    return 'Reports';
  }
  if (route.includes('/stores')) {
    return 'Stores';
  }
  if (route.includes('/platform')) {
    return 'Platform';
  }
  if (route.includes('/users')) {
    return 'Users';
  }
  if (route.includes('/enterprise')) {
    return 'Enterprise';
  }
  if (route.includes('/setup')) {
    return 'Setup';
  }
  if (route.includes('/help')) {
    return 'Help';
  }

  return 'Dashboard';
};

const setupCards: HelpCard[] = [
  {
    title: 'SaaS Admin Setup',
    who: 'Use this when you own the platform and need to manage companies, plans, pricing, and feature entitlements.',
    route: '/lifepill/platform',
    routeLabel: 'Open SaaS Admin',
    checklist: [
      'Create or review the company tenant and select the right pricing plan.',
      'Confirm store count, active users, billing cycle, deployment mode, and renewal date.',
      'Review feature entitlements before onboarding the company.',
      'Create the first company admin from Users and Permissions.',
    ],
    audiences: ['saas-admin'],
  },
  {
    title: 'Company Admin Setup',
    who: 'Use this when you run one company or chain and need to manage stores, users, permissions, and daily operations.',
    route: '/lifepill/users',
    routeLabel: 'Open Users and Access',
    checklist: [
      'Create store operators and assign each user to the correct store.',
      'Open Stores to confirm the active branches and operating structure.',
      'Use Billing, Inventory, Purchases, Compliance, and Reports as the working modules.',
      'Keep Help open for FAQs and onboarding during rollout.',
    ],
    audiences: ['saas-admin', 'company-admin'],
  },
  {
    title: 'Store Login Setup',
    who: 'Use this for daily counter and store operations such as billing, stock checks, customer history, compliance, purchases, and reports.',
    route: '/cashier-dashboard',
    routeLabel: 'Open Store Workspace',
    checklist: [
      'Check the active store at the top before starting the day.',
      'Use Billing for invoices, barcode search, and prescription-aware selling.',
      'Use Customers for history, credit, and loyalty visibility.',
      'Use Stock, Purchases, Compliance, and Reports for daily branch operations.',
    ],
    audiences: ['saas-admin', 'company-admin', 'store-ops'],
  },
];

const faqItems: HelpFaqItem[] = [
  {
    question: 'What does SaaS Admin control?',
    answer:
      'Use SaaS Admin for platform ownership: tenants, plans, pricing, feature entitlements, company onboarding, and cross-company rollout control.',
    audiences: ['saas-admin'],
  },
  {
    question: 'Where do I change plans, pricing, or feature access?',
    answer:
      'Open SaaS Admin. That area controls tenants, plans, pricing, feature entitlements, and platform-level rollout decisions.',
    audiences: ['saas-admin'],
  },
  {
    question: 'What does Company Admin control?',
    answer:
      'Company admins manage their own company only: users, stores, permissions, billing operations, stock, purchases, compliance, reports, and daily branch rollout.',
    audiences: ['saas-admin', 'company-admin'],
  },
  {
    question: 'Where do I create more users?',
    answer:
      'Open Users and Permissions. SaaS admins can create company admins. Company admins can create store operators and assign stores.',
    audiences: ['saas-admin', 'company-admin'],
  },
  {
    question: 'Where do I switch between company stores?',
    answer:
      'Use the store selector in the legacy workspace shell. SaaS admins can switch across companies and stores, while company admins can switch only within their own company stores.',
    audiences: ['saas-admin', 'company-admin'],
  },
  {
    question: 'What does Store Login control?',
    answer:
      'Store logins stay focused on one assigned branch. Use them for billing, customers, stock lookup, inward stock, compliance, purchase entry, and store-level reports.',
    audiences: ['saas-admin', 'company-admin', 'store-ops'],
  },
  {
    question: 'Can a store login manage other stores, users, or pricing?',
    answer:
      'No. Store logins do not manage company setup, plan pricing, or cross-store controls. Those actions stay with company admins or SaaS admins.',
    audiences: ['saas-admin', 'company-admin', 'store-ops'],
  },
  {
    question: 'Where do daily store teams spend most of their time?',
    answer:
      'Billing, Customers, Stock, Purchases, Compliance, and Reports. Those are the main daily-use areas for store operations.',
    audiences: ['saas-admin', 'company-admin', 'store-ops'],
  },
  {
    question: 'Where are explanations and rollout notes kept now?',
    answer:
      'They stay in Help and FAQ or in the Enterprise page, so the working screens stay focused on real operations instead of scattered explanatory notes.',
    audiences: ['saas-admin', 'company-admin'],
  },
];

const moduleMap = [
  {
    title: 'Admin Control',
    summary: 'Companies, plans, pricing, feature entitlements, rollout control',
    route: '/lifepill/platform',
    audiences: ['saas-admin'] as Array<'saas-admin' | 'company-admin' | 'store-ops'>,
  },
  {
    title: 'Users and Permissions',
    summary: 'Create company admins and store operators, assign stores, manage access',
    route: '/lifepill/users',
    audiences: ['saas-admin', 'company-admin'] as Array<'saas-admin' | 'company-admin' | 'store-ops'>,
  },
  {
    title: 'Billing',
    summary: 'Invoices, GST, barcode, loose tablets, substitutes, WhatsApp/PDF/print',
    route: '/lifepill/billing',
    audiences: ['saas-admin', 'company-admin', 'store-ops'] as Array<'saas-admin' | 'company-admin' | 'store-ops'>,
  },
  {
    title: 'Customers',
    summary: 'Credit, loyalty, patient history, repeat customer lookup',
    route: '/lifepill/customers',
    audiences: ['saas-admin', 'company-admin', 'store-ops'] as Array<'saas-admin' | 'company-admin' | 'store-ops'>,
  },
  {
    title: 'Inventory',
    summary: 'Batches, stock visibility, shortage, expiry-safe stock review',
    route: '/lifepill/inventory',
    audiences: ['saas-admin', 'company-admin', 'store-ops'] as Array<'saas-admin' | 'company-admin' | 'store-ops'>,
  },
  {
    title: 'Purchases',
    summary: 'Suppliers, inward entry, purchase import, credit notes',
    route: '/lifepill/procurement',
    audiences: ['saas-admin', 'company-admin', 'store-ops'] as Array<'saas-admin' | 'company-admin' | 'store-ops'>,
  },
  {
    title: 'Compliance',
    summary: 'Schedule H/H1/X, doctor and patient capture, inspector-ready reporting',
    route: '/lifepill/compliance',
    audiences: ['saas-admin', 'company-admin', 'store-ops'] as Array<'saas-admin' | 'company-admin' | 'store-ops'>,
  },
  {
    title: 'Reports',
    summary: 'GST, profit, daily sales, top sellers, slow movers, expiry loss',
    route: '/lifepill/reports/gst',
    audiences: ['saas-admin', 'company-admin', 'store-ops'] as Array<'saas-admin' | 'company-admin' | 'store-ops'>,
  },
  {
    title: 'Stores',
    summary: 'Branch structure, store directory, HO and rollout view',
    route: '/lifepill/stores',
    audiences: ['saas-admin', 'company-admin'] as Array<'saas-admin' | 'company-admin' | 'store-ops'>,
  },
];

const PharmaFlowHelpCenter: React.FC<{
  embedded?: boolean;
  onOpenWorkspace?: (workspaceKey: string) => void;
}> = ({ embedded = false, onOpenWorkspace }) => {
  const context = usePharmaFlowContext();
  const persona = getPharmaFlowPersona(context);
  const roleLabel = getPharmaFlowRoleLabel(context.role, context.platformOwner);
  const visibleSetupCards =
    persona === 'guest'
      ? setupCards
      : setupCards.filter((card) => card.audiences.includes(persona));
  const visibleFaqItems =
    persona === 'guest'
      ? faqItems
      : faqItems.filter((item) => item.audiences.includes(persona));
  const visibleModuleMap =
    persona === 'guest'
      ? moduleMap
      : moduleMap.filter((item) => item.audiences.includes(persona));
  const primaryAction = canAccessPlatformControls(context)
    ? { route: '/lifepill/platform', label: 'Open SaaS Admin' }
    : canAccessCompanyControls(context)
      ? { route: '/lifepill/users', label: 'Open users and access' }
      : { route: '/lifepill/billing', label: 'Open store workspace' };
  const renderWorkspaceAction = (
    route: string,
    label: string,
    className: string
  ) => {
    const workspaceKey = resolveHelpWorkspaceKey(route);
    const shouldOpenInline = embedded && Boolean(onOpenWorkspace);

    if (shouldOpenInline) {
      return (
        <button
          type="button"
          onClick={() => onOpenWorkspace?.(workspaceKey)}
          className={className}
        >
          {label}
        </button>
      );
    }

    return (
      <Link to={route} className={className}>
        {label}
      </Link>
    );
  };

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Help and FAQ"
      description="Use this page for setup instructions, role-specific onboarding, and quick answers while keeping the working modules free of scattered explanatory notes."
      actions={renderWorkspaceAction(
        primaryAction.route,
        primaryAction.label,
        'rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700'
      )}
    >
      <section className="rounded-[2rem] border border-sky-200 bg-sky-50 px-5 py-5 text-sm text-sky-950 shadow-sm">
        <div className="text-lg font-semibold">Current session</div>
        <p className="mt-2 max-w-3xl leading-6">
          You are currently signed in as <span className="font-semibold">{roleLabel}</span>.
          {persona === 'saas-admin' && ' You can control platform, company, and store layers from here.'}
          {persona === 'company-admin' && ' You can control your company and its stores, but not the SaaS platform layer.'}
          {persona === 'store-ops' && ' Your workspace stays focused on your own store, daily billing, stock, customers, compliance, and reports.'}
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {visibleSetupCards.map((card) => (
          <div key={card.title} className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Quick Start</div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{card.who}</p>
            <div className="mt-5 space-y-2">
              {card.checklist.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </div>
            {renderWorkspaceAction(
              card.route,
              card.routeLabel,
              'mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white'
            )}
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Module Map</div>
        <h2 className="mt-3 text-xl font-semibold text-slate-950">Where each major job is done</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Module</th>
                <th className="px-4 py-3 text-left">Use it for</th>
                <th className="px-4 py-3 text-left">Open</th>
              </tr>
            </thead>
            <tbody>
              {visibleModuleMap.map((item) => (
                <tr key={item.title} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                  <td className="px-4 py-3 text-slate-600">{item.summary}</td>
                  <td className="px-4 py-3">
                    {renderWorkspaceAction(item.route, 'Open', 'text-sm font-medium text-sky-700')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">FAQ</div>
        <h2 className="mt-3 text-xl font-semibold text-slate-950">Common setup and access questions</h2>
        <div className="mt-5 grid gap-3">
          {visibleFaqItems.map((item) => (
            <div key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-base font-semibold text-slate-950">{item.question}</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </PharmaFlowShell>
  );
};

export default PharmaFlowHelpCenter;
