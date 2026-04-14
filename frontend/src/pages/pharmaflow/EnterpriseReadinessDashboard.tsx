import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import { pharmaFlowNavItems } from '../../components/pharmaflow/navigation';
import { downloadCsv } from '../../utils/exportCsv';
import { getBrandInitials, useBranding } from '../../utils/branding';

type BuyerQuestionStatus = 'Live' | 'Partial' | 'Extension-ready' | 'Service pack';

interface BuyerQuestionRow {
  id: number;
  title: string;
  status: BuyerQuestionStatus;
  answer: string;
  routePath?: string;
  routeLabel?: string;
}

const statusClasses: Record<BuyerQuestionStatus, string> = {
  Live: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Partial: 'border-amber-200 bg-amber-50 text-amber-700',
  'Extension-ready': 'border-sky-200 bg-sky-50 text-sky-700',
  'Service pack': 'border-violet-200 bg-violet-50 text-violet-700',
};

const buyerQuestionRows: BuyerQuestionRow[] = [
  {
    id: 1,
    title: 'Multi-location management',
    status: 'Partial',
    answer:
      'Store, HO, and warehouse context switching are live now. Enterprise transfer sync and real-time inter-branch orchestration are the next rollout layer.',
    routePath: '/lifepill/stores',
    routeLabel: 'Stores',
  },
  {
    id: 2,
    title: 'Expiry alerts and dump / return workflow',
    status: 'Partial',
    answer:
      '30/60/90-day expiry visibility is live today. Dump, return-to-vendor, and closure workflow need deeper RTV orchestration on top of the credit-note flow.',
    routePath: '/lifepill/reports/expiry-alerts',
    routeLabel: 'Expiry',
  },
  {
    id: 3,
    title: 'Bulk purchase import',
    status: 'Live',
    answer: 'CSV purchase import, supplier setup, and manual inward entry are live for high-SKU distributor invoices.',
    routePath: '/lifepill/procurement',
    routeLabel: 'Purchases',
  },
  {
    id: 4,
    title: 'Salt-to-brand substitute suggestions',
    status: 'Live',
    answer: 'Triple medicine lookup and substitute suggestions are already exposed during billing.',
    routePath: '/lifepill/billing',
    routeLabel: 'Counter',
  },
  {
    id: 5,
    title: 'Schedule H1 and narcotic tracking',
    status: 'Live',
    answer: 'Schedule H / H1 / X capture, narcotic reporting, patient-doctor traceability, and inspector views are live.',
    routePath: '/lifepill/compliance',
    routeLabel: 'Compliance',
  },
  {
    id: 6,
    title: 'Batch and strip tracking with FIFO',
    status: 'Live',
    answer: 'Batch-aware stock, oldest-batch-first visibility, and strip/tablet handling are already supported in stock and billing flows.',
    routePath: '/lifepill/inventory',
    routeLabel: 'Stock',
  },
  {
    id: 7,
    title: 'Credit note follow-up across outlets and suppliers',
    status: 'Partial',
    answer:
      'Credit-note creation is live in Purchases, while outlet collection, supplier dispatch, and reconciliation milestones should be added as the next enterprise workflow.',
    routePath: '/lifepill/procurement',
    routeLabel: 'Purchases',
  },
  {
    id: 8,
    title: 'Prescription digitization',
    status: 'Partial',
    answer:
      'Prescription reference capture is live. Full scan-and-attach rollout depends on storage integration and upload workflow hardening.',
    routePath: '/lifepill/compliance',
    routeLabel: 'Compliance',
  },
  {
    id: 9,
    title: 'Centralized loyalty and discounts',
    status: 'Partial',
    answer:
      'Customer credit and loyalty are live today. Cross-branch earning and redemption policy should be finalized as part of enterprise rollout rules.',
    routePath: '/lifepill/customers',
    routeLabel: 'Customers',
  },
  {
    id: 10,
    title: 'Home delivery integration',
    status: 'Extension-ready',
    answer:
      'Delivery entities are present in the backend foundation, but the delivery boy app and dispatch workflow still need their rollout UI.',
    routePath: '/lifepill/enterprise',
    routeLabel: 'Enterprise',
  },
  {
    id: 11,
    title: 'GSTR-1 and GSTR-3B generation',
    status: 'Live',
    answer: 'GSTR-1, GSTR-3B, tax summary, and exportable reporting are live.',
    routePath: '/lifepill/reports/gst',
    routeLabel: 'GST Reports',
  },
  {
    id: 12,
    title: 'Profit by manufacturer or category',
    status: 'Live',
    answer: 'Estimated profit by manufacturer and category is available with monthly sales context.',
    routePath: '/lifepill/reports/profit',
    routeLabel: 'Profit',
  },
  {
    id: 13,
    title: 'Credit limits and billing block',
    status: 'Live',
    answer: 'Customer credit visibility and credit-limit validation are built into billing and customer views.',
    routePath: '/lifepill/customers',
    routeLabel: 'Customers',
  },
  {
    id: 14,
    title: 'Cloud versus local / unstable internet',
    status: 'Partial',
    answer:
      'The positioning is hybrid cloud plus branch-local operations. Advanced offline sync and conflict handling still need the next reliability pass.',
    routePath: '/lifepill/stores',
    routeLabel: 'Stores',
  },
  {
    id: 15,
    title: '24/7 support',
    status: 'Service pack',
    answer:
      'This is delivered as an operating SLA, not a screen. The product now exposes a tenant support identity so a branded support package can be attached to each deployment.',
    routePath: '/lifepill/setup',
    routeLabel: 'Company Setup',
  },
  {
    id: 16,
    title: 'Shortage report and reorder support',
    status: 'Live',
    answer: 'Shortage visibility and reorder-oriented reporting are already available and exportable.',
    routePath: '/lifepill/reports/expiry-alerts',
    routeLabel: 'Expiry',
  },
  {
    id: 17,
    title: 'Schedule H, H1, and X tracking',
    status: 'Live',
    answer: 'Tracked and reportable through the controlled-drug register.',
    routePath: '/lifepill/compliance',
    routeLabel: 'Compliance',
  },
  {
    id: 18,
    title: 'Mandatory sale registers for controlled drugs',
    status: 'Live',
    answer: 'Inspector-facing controlled-drug register export is live.',
    routePath: '/lifepill/compliance',
    routeLabel: 'Compliance',
  },
  {
    id: 19,
    title: 'Pharmacist login and audit trail for drug sales',
    status: 'Live',
    answer: 'Audit trail and controlled-sale capture are present in billing and compliance flows.',
    routePath: '/lifepill/billing-history',
    routeLabel: 'Bills',
  },
  {
    id: 20,
    title: 'Instant Drug Inspector reports',
    status: 'Live',
    answer: 'Drug Inspector register and monthly export flow are live.',
    routePath: '/lifepill/compliance',
    routeLabel: 'Compliance',
  },
  {
    id: 21,
    title: 'Doctor prescription tracking for restricted medicines',
    status: 'Live',
    answer: 'Patient, doctor, schedule, and prescription reference are all captured in compliance-linked billing.',
    routePath: '/lifepill/compliance',
    routeLabel: 'Compliance',
  },
  {
    id: 22,
    title: 'Patient history for prescription medicines',
    status: 'Live',
    answer: 'Customer and patient history are available from the customer workspace.',
    routePath: '/lifepill/customers',
    routeLabel: 'Customers',
  },
  {
    id: 23,
    title: 'GST-compliant invoicing',
    status: 'Live',
    answer: 'GST-inclusive billing, invoice numbering, print, PDF, and WhatsApp share are live.',
    routePath: '/lifepill/billing-history',
    routeLabel: 'Bills',
  },
  {
    id: 24,
    title: 'Mandatory sale registers for controlled drugs (repeat)',
    status: 'Live',
    answer: 'Same live capability as Q18 through the compliance register.',
    routePath: '/lifepill/compliance',
    routeLabel: 'Compliance',
  },
  {
    id: 25,
    title: 'Pharmacist audit trail for drug sales (repeat)',
    status: 'Live',
    answer: 'Same live capability as Q19 through billing audit and compliance history.',
    routePath: '/lifepill/billing-history',
    routeLabel: 'Bills',
  },
  {
    id: 26,
    title: 'Instant Drug Inspector reports (repeat)',
    status: 'Live',
    answer: 'Same live capability as Q20 through the compliance dashboard.',
    routePath: '/lifepill/compliance',
    routeLabel: 'Compliance',
  },
  {
    id: 27,
    title: 'Doctor prescription tracking (repeat)',
    status: 'Live',
    answer: 'Same live capability as Q21 through schedule-linked billing and reporting.',
    routePath: '/lifepill/compliance',
    routeLabel: 'Compliance',
  },
  {
    id: 28,
    title: 'Patient history (repeat)',
    status: 'Live',
    answer: 'Same live capability as Q22 through the customer workspace.',
    routePath: '/lifepill/customers',
    routeLabel: 'Customers',
  },
  {
    id: 29,
    title: 'GST-compliant invoicing (repeat)',
    status: 'Live',
    answer: 'Same live capability as Q23 through billing and receipt exports.',
    routePath: '/lifepill/billing-history',
    routeLabel: 'Bills',
  },
  {
    id: 30,
    title: 'Automatic batch tracking',
    status: 'Live',
    answer: 'Batch-aware billing and inventory detail are active.',
    routePath: '/lifepill/inventory',
    routeLabel: 'Stock',
  },
  {
    id: 31,
    title: 'Prevent sale of expired medicines',
    status: 'Live',
    answer: 'Expired-batch validation and expiry filtering are active.',
    routePath: '/lifepill/inventory',
    routeLabel: 'Stock',
  },
  {
    id: 32,
    title: 'Purchase scheme tracking (Buy 10 Get 1)',
    status: 'Partial',
    answer: 'Free-quantity support exists in purchase imports, while richer scheme management should be expanded during procurement rollout.',
    routePath: '/lifepill/procurement',
    routeLabel: 'Purchases',
  },
  {
    id: 33,
    title: 'PTR / PTS / MRP margin visibility',
    status: 'Partial',
    answer:
      'Margin fields and estimated profitability are present. Broader pricing analytics by PTR and PTS can be deepened in the reporting layer.',
    routePath: '/lifepill/reports/profit',
    routeLabel: 'Profit',
  },
  {
    id: 34,
    title: 'Barcode scanning',
    status: 'Live',
    answer: 'Billing supports barcode-aware medicine lookup.',
    routePath: '/lifepill/billing',
    routeLabel: 'Counter',
  },
  {
    id: 35,
    title: 'Partial strip sales',
    status: 'Live',
    answer: 'Strip and tablet-oriented quantity handling is already visible in billing.',
    routePath: '/lifepill/billing',
    routeLabel: 'Counter',
  },
  {
    id: 36,
    title: 'Search by brand, generic, and salt',
    status: 'Live',
    answer: 'Triple medicine search is live.',
    routePath: '/lifepill/billing',
    routeLabel: 'Counter',
  },
  {
    id: 37,
    title: 'Daily sales, top sellers, slow movers, profit, expiry loss, Excel export',
    status: 'Live',
    answer:
      'Daily sales, top sellers, slow movers, profit analytics, expiry loss visibility, and CSV export are now live in the reporting suite.',
    routePath: '/lifepill/reports/gst',
    routeLabel: 'GST Reports',
  },
  {
    id: 38,
    title: 'Different user roles',
    status: 'Live',
    answer: 'Role-based access and pharmacy-specific role structure are in place.',
    routePath: '/lifepill/setup',
    routeLabel: 'Company Setup',
  },
  {
    id: 39,
    title: 'Restrict price editing',
    status: 'Live',
    answer: 'Role-aware price-control behavior is already part of the billing model.',
    routePath: '/lifepill/billing',
    routeLabel: 'Counter',
  },
  {
    id: 40,
    title: 'Track who edited bills',
    status: 'Live',
    answer: 'Invoice-level audit visibility is live.',
    routePath: '/lifepill/billing-history',
    routeLabel: 'Bills',
  },
  {
    id: 41,
    title: 'Activity audit log',
    status: 'Live',
    answer: 'Store-level audit trail is live.',
    routePath: '/lifepill/billing-history',
    routeLabel: 'Bills',
  },
  {
    id: 42,
    title: 'Unlimited invoices and documents',
    status: 'Live',
    answer: 'No hard product limit is imposed in the current implementation.',
    routePath: '/lifepill/billing-history',
    routeLabel: 'Bills',
  },
  {
    id: 43,
    title: 'Integrations, WhatsApp, notifications, and future APIs',
    status: 'Partial',
    answer:
      'WhatsApp invoice sharing is live. Tally, GST filing connectors, e-commerce, online pharmacy, SMS, and custom APIs remain extension-ready integration tracks.',
    routePath: '/lifepill/enterprise',
    routeLabel: 'Enterprise',
  },
];

const demoRouteOrder = [
  '/lifepill/setup',
  '/lifepill/enterprise',
  '/lifepill/stores',
  '/lifepill/billing',
  '/lifepill/inventory',
  '/lifepill/procurement',
  '/lifepill/compliance',
  '/lifepill/reports/gst',
  '/lifepill/reports/profit',
  '/lifepill/customers',
  '/lifepill/billing-history',
];

interface EnterpriseReadinessDashboardProps {
  embedded?: boolean;
}

const EnterpriseReadinessDashboard: React.FC<EnterpriseReadinessDashboardProps> = ({ embedded = false }) => {
  const branding = useBranding();
  const brandInitials = getBrandInitials(branding.brandName);
  const demoPath = demoRouteOrder
    .map((path) => pharmaFlowNavItems.find((item) => item.path === path))
    .filter(Boolean);

  const statusSummary = useMemo(
    () =>
      buyerQuestionRows.reduce<Record<BuyerQuestionStatus, number>>(
        (summary, row) => ({
          ...summary,
          [row.status]: (summary[row.status] || 0) + 1,
        }),
        {
          Live: 0,
          Partial: 0,
          'Extension-ready': 0,
          'Service pack': 0,
        }
      ),
    []
  );

  const exportBuyerCoverage = () => {
    downloadCsv(
      `${branding.brandName.toLowerCase().replace(/\s+/g, '-')}-buyer-coverage.csv`,
      ['Q No', 'Question', 'Status', 'Current Answer', 'Best Demo Route'],
      buyerQuestionRows.map((row) => [
        row.id,
        row.title,
        row.status,
        row.answer,
        row.routeLabel || 'Commercial discussion',
      ])
    );
  };

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Enterprise Readiness and White Label"
      description="Answer buyer questions, show the recommended module walkthrough, and present the product as a tenant-branded pharmacy platform instead of a single-store tool."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            to="/lifepill/platform"
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            Open SaaS Admin
          </Link>
          <button
            type="button"
            onClick={exportBuyerCoverage}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            Export buyer coverage
          </button>
        </div>
      }
    >
      <section className="rounded-[2rem] border border-slate-200/70 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
              Enterprise Story
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Sell {branding.brandName} as a 300-store pharmacy platform
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
              This page turns the product into a buyer-facing walkthrough. Start here when the client asks about
              white-labelling, chain rollout, support model, integrations, or how each operational promise maps to a
              real screen.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-300">Questions Covered</div>
              <div className="mt-2 text-3xl font-semibold">{buyerQuestionRows.length}</div>
              <div className="mt-1 text-sm text-slate-300">Every buyer question is now mapped in-product</div>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-300">White-Label Status</div>
              <div className="mt-2 text-3xl font-semibold">Live</div>
              <div className="mt-1 text-sm text-slate-300">Workspace brand, support identity, and receipt branding are configurable</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">White-Label Snapshot</div>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">Current tenant profile</h2>

          <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 text-base font-semibold">
                {brandInitials}
              </div>
              <div>
                <div className="text-2xl font-semibold">{branding.brandName}</div>
                <div className="mt-1 text-sm text-slate-300">{branding.tagline}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4 text-sm">
                <div className="text-xs uppercase tracking-wide text-slate-300">Support Email</div>
                <div className="mt-2 break-all font-medium">{branding.supportEmail}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 text-sm">
                <div className="text-xs uppercase tracking-wide text-slate-300">Support Phone</div>
                <div className="mt-2 font-medium">{branding.supportPhone}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="font-semibold">Configurable today</div>
              <p className="mt-2">
                Workspace brand, support identity, tenant copy, receipt HTML, PDF, and WhatsApp receipt text.
              </p>
            </div>
            <div className="rounded-3xl bg-sky-50 p-4 text-sm text-sky-900">
              <div className="font-semibold">Deployment model</div>
              <p className="mt-2">{branding.deploymentMode}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Suggested Rollout Flow</div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Walk the client through the platform in this order</h2>
            </div>
            <Link
              to="/lifepill/setup"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Open company setup
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {demoPath.map((item, index) =>
              item ? (
                <Link
                  key={item.path}
                  to={item.path}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Step {index + 1}</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                </Link>
              ) : null
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {(Object.keys(statusSummary) as BuyerQuestionStatus[]).map((status) => (
          <div key={status} className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">{status}</div>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{statusSummary[status]}</div>
            <div className="mt-1 text-sm text-slate-500">Rollout questions in this state</div>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Question Matrix</div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">Question-by-question coverage</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use this table when the client asks how a requirement maps to the live product, the rollout plan, or a support package.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left">Q</th>
                <th className="px-3 py-3 text-left">Requirement</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left">Current answer</th>
                <th className="px-3 py-3 text-left">Best screen to show</th>
              </tr>
            </thead>
            <tbody>
              {buyerQuestionRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-3 font-semibold text-slate-900">{row.id}</td>
                  <td className="px-3 py-3 font-medium text-slate-900">{row.title}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{row.answer}</td>
                  <td className="px-3 py-3">
                    {row.routePath && row.routeLabel ? (
                      <Link to={row.routePath} className="text-sm font-medium text-sky-700 underline">
                        {row.routeLabel}
                      </Link>
                    ) : (
                      <span className="text-slate-400">Commercial discussion</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PharmaFlowShell>
  );
};

export default EnterpriseReadinessDashboard;
