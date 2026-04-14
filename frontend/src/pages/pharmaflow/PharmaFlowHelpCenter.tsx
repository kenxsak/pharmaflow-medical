import React from 'react';
import { Link } from 'react-router-dom';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
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
}

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
  },
];

const faqItems = [
  {
    question: 'Which login should I use?',
    answer:
      'SaaS Admin is for platform ownership. Company Admin is for one company or chain. Store Login is for day-to-day branch work.',
  },
  {
    question: 'Where do I create more users?',
    answer:
      'Open Users and Permissions. SaaS admins can create company admins. Company admins can create store operators and assign stores.',
  },
  {
    question: 'Where do I change plans, pricing, or feature access?',
    answer:
      'Open SaaS Admin. That area controls tenants, plans, pricing, feature entitlements, and platform-level rollout decisions.',
  },
  {
    question: 'Where do I switch stores?',
    answer:
      'Use the branch selector in the legacy workspace shell or the Setup page. The active store drives billing, stock, compliance, and report data.',
  },
  {
    question: 'Where do daily store teams spend most of their time?',
    answer:
      'Billing, Customers, Stock, Purchases, Compliance, and Reports. Those are the main daily-use areas for store operations.',
  },
  {
    question: 'Where are explanations and buyer-style notes kept now?',
    answer:
      'They live in Help and FAQ or in the Enterprise page, so the working screens stay focused on real operations instead of scattered explanatory notes.',
  },
];

const moduleMap = [
  ['Admin Control', 'Companies, plans, pricing, feature entitlements, rollout control', '/lifepill/platform'],
  ['Users and Permissions', 'Create company admins and store operators, assign stores, manage access', '/lifepill/users'],
  ['Billing', 'Invoices, GST, barcode, loose tablets, substitutes, WhatsApp/PDF/print', '/lifepill/billing'],
  ['Customers', 'Credit, loyalty, patient history, repeat customer lookup', '/lifepill/customers'],
  ['Inventory', 'Batches, stock visibility, shortage, expiry-safe stock review', '/lifepill/inventory'],
  ['Purchases', 'Suppliers, inward entry, purchase import, credit notes', '/lifepill/procurement'],
  ['Compliance', 'Schedule H/H1/X, doctor and patient capture, inspector-ready reporting', '/lifepill/compliance'],
  ['Reports', 'GST, profit, daily sales, top sellers, slow movers, expiry loss', '/lifepill/reports/gst'],
  ['Stores', 'Branch structure, store directory, HO and rollout view', '/lifepill/stores'],
];

const PharmaFlowHelpCenter: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const context = usePharmaFlowContext();
  const persona = getPharmaFlowPersona(context);
  const roleLabel = getPharmaFlowRoleLabel(context.role, context.platformOwner);

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Help and FAQ"
      description="Use this page for setup instructions, role-specific onboarding, and quick answers while keeping the working modules free of scattered explanatory notes."
      actions={
        <Link
          to="/lifepill/setup"
          className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          Open company setup
        </Link>
      }
    >
      <section className="rounded-[2rem] border border-sky-200 bg-sky-50 px-5 py-5 text-sm text-sky-950 shadow-sm">
        <div className="text-lg font-semibold">Current session</div>
        <p className="mt-2 max-w-3xl leading-6">
          You are currently signed in as <span className="font-semibold">{roleLabel}</span>.
          {persona === 'saas-admin' && ' Start in SaaS Admin, then create company admins and hand off stores.'}
          {persona === 'company-admin' && ' Start in Users and Permissions, then move into Stores, Billing, Inventory, Purchases, Compliance, and Reports.'}
          {persona === 'store-ops' && ' Start in Billing and keep the store workspace focused on daily operations.'}
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {setupCards.map((card) => (
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
            <Link
              to={card.route}
              className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              {card.routeLabel}
            </Link>
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
              {moduleMap.map(([title, summary, route]) => (
                <tr key={title} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{title}</td>
                  <td className="px-4 py-3 text-slate-600">{summary}</td>
                  <td className="px-4 py-3">
                    <Link to={route} className="text-sm font-medium text-sky-700">
                      Open
                    </Link>
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
          {faqItems.map((item) => (
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
