import React from 'react';
import { Link } from 'react-router-dom';
import { readBranding } from '../../utils/branding';

interface FeatureModule {
  title: string;
  path: string;
  summary: string;
  accent: string;
  cta: string;
}

interface FeatureGroup {
  title: string;
  summary: string;
  modules: FeatureModule[];
}

interface RequirementCoverageItem {
  code: string;
  title: string;
  summary: string;
  path: string;
  workspace: string;
}

interface RequirementCoverageGroup {
  title: string;
  summary: string;
  items: RequirementCoverageItem[];
}

interface LegacyFeatureHubProps {
  title?: string;
  description?: string;
  onOpenWorkspace?: (workspaceKey: string) => void;
}

const resolveLegacyWorkspaceKey = (path: string, workspace?: string) => {
  const normalizedWorkspace = workspace?.trim().toLowerCase();

  if (path.includes('/billing-history')) {
    return 'Bills';
  }
  if (path.includes('/billing')) {
    return 'Billing';
  }
  if (path.includes('/customers')) {
    return 'Customers';
  }
  if (path.includes('/inventory')) {
    return 'Inventory';
  }
  if (path.includes('/procurement')) {
    return 'Purchases';
  }
  if (path.includes('/compliance')) {
    return 'Compliance';
  }
  if (path.includes('/reports/profit')) {
    return 'Reports:Profit';
  }
  if (path.includes('/reports/expiry-alerts')) {
    return 'Reports:Expiry';
  }
  if (path.includes('/reports')) {
    return 'Reports';
  }
  if (path.includes('/stores')) {
    return 'Stores';
  }
  if (path.includes('/platform')) {
    return 'Platform';
  }
  if (path.includes('/enterprise')) {
    return 'Enterprise';
  }
  if (path.includes('/setup')) {
    return 'Setup';
  }
  if (path.includes('/legacy-login')) {
    return 'Dashboard';
  }

  switch (normalizedWorkspace) {
    case 'bill history':
      return 'Bills';
    case 'billing':
      return 'Billing';
    case 'customers':
      return 'Customers';
    case 'inventory':
      return 'Inventory';
    case 'purchases':
      return 'Purchases';
    case 'compliance':
      return 'Compliance';
    case 'gst reports':
      return 'Reports';
    case 'profit':
      return 'Reports:Profit';
    case 'expiry alerts':
      return 'Reports:Expiry';
    case 'stores':
      return 'Stores';
    case 'saas admin':
      return 'Platform';
    case 'setup':
      return 'Setup';
    case 'enterprise':
      return 'Enterprise';
    default:
      return 'Dashboard';
  }
};

const featureGroups: FeatureGroup[] = [
  {
    title: 'Counter and Customer',
    summary: 'Keep the most-used pharmacy work front and center for quick daily use.',
    modules: [
      {
        title: 'Billing Counter',
        path: '/pharmaflow/billing',
        summary: 'Create bills, split strips, scan barcodes, and complete GST-ready checkout.',
        accent: 'border-emerald-200 bg-emerald-50',
        cta: 'Open billing',
      },
      {
        title: 'Barcode and Triple Search',
        path: '/pharmaflow/billing',
        summary: 'Find medicines by brand, generic, salt, or barcode from the same simple counter flow.',
        accent: 'border-green-200 bg-green-50',
        cta: 'Open search',
      },
      {
        title: 'Substitutes and Rx Capture',
        path: '/pharmaflow/billing',
        summary: 'Support substitute suggestions, doctor details, and prescription-aware selling.',
        accent: 'border-lime-200 bg-lime-50',
        cta: 'Open counter tools',
      },
      {
        title: 'Bill History and Audit',
        path: '/pharmaflow/billing-history',
        summary: 'Reprint, download PDF, send WhatsApp, and inspect who changed what.',
        accent: 'border-cyan-200 bg-cyan-50',
        cta: 'Open bills',
      },
      {
        title: 'Customers and Loyalty',
        path: '/pharmaflow/customers',
        summary: 'Manage loyalty points, customer credit, repeat buyers, and branch-wide customer lookup.',
        accent: 'border-sky-200 bg-sky-50',
        cta: 'Open customers',
      },
      {
        title: 'Patient History',
        path: '/pharmaflow/customers',
        summary: 'View patient prescriptions and purchase history from one easy customer screen.',
        accent: 'border-blue-200 bg-blue-50',
        cta: 'Open patient history',
      },
    ],
  },
  {
    title: 'Stock and Purchase',
    summary: 'Keep inward stock, expiry work, shortage planning, and vendor follow-up easy to open.',
    modules: [
      {
        title: 'Inventory Dashboard',
        path: '/pharmaflow/inventory',
        summary: 'See available stock, batches, current quantity, and store-level medicine status.',
        accent: 'border-violet-200 bg-violet-50',
        cta: 'Open inventory',
      },
      {
        title: 'Expiry Alerts',
        path: '/pharmaflow/reports/expiry-alerts',
        summary: 'Review 30, 60, and 90 day expiry buckets and work the action list quickly.',
        accent: 'border-amber-200 bg-amber-50',
        cta: 'Open expiry',
      },
      {
        title: 'Shortage and Reorder',
        path: '/pharmaflow/inventory',
        summary: 'Use reorder visibility and shortage reporting from the stock dashboard.',
        accent: 'border-yellow-200 bg-yellow-50',
        cta: 'Open shortage view',
      },
      {
        title: 'Purchase Import',
        path: '/pharmaflow/procurement',
        summary: 'Open CSV import, inward entry, supplier details, and purchase posting.',
        accent: 'border-fuchsia-200 bg-fuchsia-50',
        cta: 'Open purchases',
      },
      {
        title: 'Credit Notes and Returns',
        path: '/pharmaflow/procurement',
        summary: 'Track outlet returns, vendor follow-up, and credit notes from one procurement area.',
        accent: 'border-rose-200 bg-rose-50',
        cta: 'Open credit notes',
      },
      {
        title: 'FIFO and Batch Control',
        path: '/pharmaflow/inventory',
        summary: 'Use batch visibility, FIFO stock flow, and expiry protection from the inventory side.',
        accent: 'border-purple-200 bg-purple-50',
        cta: 'Open batch control',
      },
    ],
  },
  {
    title: 'Compliance and Reports',
    summary: 'Put all regulated drug work and management reporting in one easy zone.',
    modules: [
      {
        title: 'Compliance Register',
        path: '/pharmaflow/compliance',
        summary: 'Handle Schedule H, H1, X, narcotic, doctor, and patient record workflows.',
        accent: 'border-red-200 bg-red-50',
        cta: 'Open compliance',
      },
      {
        title: 'Drug Inspector Report',
        path: '/pharmaflow/compliance',
        summary: 'Open the controlled-drug view used for inspector-ready monthly reporting.',
        accent: 'border-orange-200 bg-orange-50',
        cta: 'Open inspector view',
      },
      {
        title: 'GST Reports',
        path: '/pharmaflow/reports/gst',
        summary: 'Open GSTR-1, GSTR-3B, sales summaries, and export-ready report views.',
        accent: 'border-teal-200 bg-teal-50',
        cta: 'Open GST',
      },
      {
        title: 'Profit and Margin',
        path: '/pharmaflow/reports/profit',
        summary: 'See profit by category, manufacturer, and margin visibility for management review.',
        accent: 'border-pink-200 bg-pink-50',
        cta: 'Open profit',
      },
      {
        title: 'Bill Edit Audit',
        path: '/pharmaflow/billing-history',
        summary: 'Track print counts, returns, cancellations, and invoice-level audit trails.',
        accent: 'border-indigo-200 bg-indigo-50',
        cta: 'Open audit',
      },
      {
        title: 'Store Operations',
        path: '/pharmaflow/stores',
        summary: 'Open branch and HO oversight when reporting needs to move beyond one store.',
        accent: 'border-slate-200 bg-slate-100',
        cta: 'Open stores',
      },
    ],
  },
  {
    title: 'Platform and SaaS Control',
    summary: 'Keep the chain, tenant, and rollout controls available without leaving the simple home.',
    modules: [
      {
        title: 'Stores and HO',
        path: '/pharmaflow/stores',
        summary: 'Manage store visibility, branch control, warehouse thinking, and HO oversight.',
        accent: 'border-slate-200 bg-slate-100',
        cta: 'Open stores',
      },
      {
        title: 'White Label Branding',
        path: '/pharmaflow/setup',
        summary: 'Set brand name, tagline, support details, and tenant-facing identity from setup.',
        accent: 'border-zinc-200 bg-zinc-50',
        cta: 'Open branding',
      },
      {
        title: 'Plans and Pricing',
        path: '/pharmaflow/platform',
        summary: 'Review SaaS plans, pricing, entitlements, and platform-level tenant controls.',
        accent: 'border-blue-200 bg-blue-50',
        cta: 'Open plans',
      },
      {
        title: 'Offline and Branch Control',
        path: '/pharmaflow/setup',
        summary: 'Use setup and branch context when discussing hybrid rollout and branch operations.',
        accent: 'border-stone-200 bg-stone-50',
        cta: 'Open setup',
      },
      {
        title: 'Integrations and API',
        path: '/pharmaflow/platform',
        summary: 'Use the SaaS control center to position integrations, entitlements, and platform rollout.',
        accent: 'border-cyan-200 bg-cyan-50',
        cta: 'Open integrations',
      },
      {
        title: 'Enterprise Buyer Guide',
        path: '/pharmaflow/enterprise',
        summary: 'Answer the full 43-point buyer questionnaire from one guided screen.',
        accent: 'border-indigo-200 bg-indigo-50',
        cta: 'Open guide',
      },
    ],
  },
  {
    title: 'Extra Tools and Admin',
    summary: 'Keep the small but important extras visible so the demo does not miss practical daily-use items.',
    modules: [
      {
        title: 'Print, PDF, and WhatsApp',
        path: '/pharmaflow/billing-history',
        summary: 'Open the invoice desk for receipt print, PDF download, and WhatsApp bill sharing.',
        accent: 'border-emerald-200 bg-emerald-50',
        cta: 'Open receipt tools',
      },
      {
        title: 'Audit and Bill Edits',
        path: '/pharmaflow/billing-history',
        summary: 'Show invoice-specific audit trail, user activity, and edit visibility from one place.',
        accent: 'border-indigo-200 bg-indigo-50',
        cta: 'Open audit tools',
      },
      {
        title: 'Legacy Login',
        path: '/legacy-login',
        summary: 'Jump back into the older login flow directly when the team wants the classic entry point.',
        accent: 'border-slate-200 bg-slate-100',
        cta: 'Open legacy login',
      },
      {
        title: 'White Label and Branding',
        path: '/pharmaflow/setup',
        summary: 'Edit tenant branding, tagline, support details, and deployment wording from setup.',
        accent: 'border-zinc-200 bg-zinc-50',
        cta: 'Open branding tools',
      },
      {
        title: 'Plans, Pricing, and Entitlements',
        path: '/pharmaflow/platform',
        summary: 'Manage SaaS plans, pricing, tenant entitlements, and revenue controls for the platform.',
        accent: 'border-blue-200 bg-blue-50',
        cta: 'Open SaaS tools',
      },
      {
        title: 'Buyer Demo Order',
        path: '/pharmaflow/enterprise',
        summary: 'Use the buyer guide to answer objections, follow the demo order, and cover all 43 points clearly.',
        accent: 'border-violet-200 bg-violet-50',
        cta: 'Open buyer guide',
      },
    ],
  },
];

const requirementGroups: RequirementCoverageGroup[] = [
  {
    title: 'Q1 to Q10',
    summary: 'Chain operations, stock movement, substitutions, and patient-facing workflow.',
    items: [
      {
        code: 'Q1',
        title: 'Multi-location management',
        summary: 'Store, warehouse, HO, and branch context live under the store operations workspace.',
        path: '/pharmaflow/stores',
        workspace: 'Stores',
      },
      {
        code: 'Q2',
        title: 'Expiry alerts and dump workflow',
        summary: 'Use expiry buckets from the expiry dashboard and vendor return flow from procurement.',
        path: '/pharmaflow/reports/expiry-alerts',
        workspace: 'Expiry Alerts',
      },
      {
        code: 'Q3',
        title: 'Bulk purchase import',
        summary: 'CSV purchase import lives in the procurement workspace for distributor inward posting.',
        path: '/pharmaflow/procurement',
        workspace: 'Purchases',
      },
      {
        code: 'Q4',
        title: 'Substitute management',
        summary: 'Salt-to-brand search and substitute usage are exposed through the billing counter flow.',
        path: '/pharmaflow/billing',
        workspace: 'Billing',
      },
      {
        code: 'Q5',
        title: 'H1 and narcotic tracking',
        summary: 'Controlled-drug capture and register handling live in the compliance workspace.',
        path: '/pharmaflow/compliance',
        workspace: 'Compliance',
      },
      {
        code: 'Q6',
        title: 'Batch and strip tracking',
        summary: 'Loose tablet sales and FIFO-linked selling are available from billing and inventory.',
        path: '/pharmaflow/billing',
        workspace: 'Billing',
      },
      {
        code: 'Q7',
        title: 'Credit note follow-up',
        summary: 'Returns, vendor follow-up, and credit note tracking sit inside procurement.',
        path: '/pharmaflow/procurement',
        workspace: 'Purchases',
      },
      {
        code: 'Q8',
        title: 'Prescription digitization',
        summary: 'Prescription attachment and patient-linked selling start from the billing workflow.',
        path: '/pharmaflow/billing',
        workspace: 'Billing',
      },
      {
        code: 'Q9',
        title: 'Loyalty and discounts',
        summary: 'Loyalty points and customer-level benefits are managed from the customer workspace.',
        path: '/pharmaflow/customers',
        workspace: 'Customers',
      },
      {
        code: 'Q10',
        title: 'Home delivery integration',
        summary: 'Delivery rollout and tenant-level enablement are positioned from the SaaS control center.',
        path: '/pharmaflow/platform',
        workspace: 'SaaS Admin',
      },
    ],
  },
  {
    title: 'Q11 to Q20',
    summary: 'Compliance, profitability, hybrid rollout, shortages, and inspector-ready operations.',
    items: [
      {
        code: 'Q11',
        title: 'GST and compliance reporting',
        summary: 'GSTR-1 and GSTR-3B reporting lives in the GST reports workspace.',
        path: '/pharmaflow/reports/gst',
        workspace: 'GST Reports',
      },
      {
        code: 'Q12',
        title: 'Profitability analytics',
        summary: 'Profit by manufacturer and category is available from the profit workspace.',
        path: '/pharmaflow/reports/profit',
        workspace: 'Profit',
      },
      {
        code: 'Q13',
        title: 'Credit management',
        summary: 'Credit limits, balances, and customer blocking are shown from customers.',
        path: '/pharmaflow/customers',
        workspace: 'Customers',
      },
      {
        code: 'Q14',
        title: 'Cloud vs local hybrid',
        summary: 'Tenant setup, branch context, and deployment positioning live under setup.',
        path: '/pharmaflow/setup',
        workspace: 'Setup',
      },
      {
        code: 'Q15',
        title: '24 by 7 support',
        summary: 'Use the platform and branding layer to position support ownership and tenant controls.',
        path: '/pharmaflow/platform',
        workspace: 'SaaS Admin',
      },
      {
        code: 'Q16',
        title: 'Shortage report',
        summary: 'Stock dashboard and shortage visibility are surfaced from inventory.',
        path: '/pharmaflow/inventory',
        workspace: 'Inventory',
      },
      {
        code: 'Q17',
        title: 'Schedule H, H1, and X tracking',
        summary: 'The compliance screen centralizes controlled-drug tracking and registers.',
        path: '/pharmaflow/compliance',
        workspace: 'Compliance',
      },
      {
        code: 'Q18',
        title: 'Mandatory sale registers',
        summary: 'Controlled-drug register views sit inside compliance for store staff and auditors.',
        path: '/pharmaflow/compliance',
        workspace: 'Compliance',
      },
      {
        code: 'Q19',
        title: 'Pharmacist login and audit trail',
        summary: 'Invoice and activity audit details remain easiest to inspect from bill history.',
        path: '/pharmaflow/billing-history',
        workspace: 'Bill History',
      },
      {
        code: 'Q20',
        title: 'Drug Inspector report',
        summary: 'Open the compliance workspace for inspector-focused reporting and monthly coverage.',
        path: '/pharmaflow/compliance',
        workspace: 'Compliance',
      },
    ],
  },
  {
    title: 'Q21 to Q32',
    summary: 'Patient safety, invoicing, batches, expiry blocking, and scheme handling.',
    items: [
      {
        code: 'Q21',
        title: 'Doctor prescription tracking',
        summary: 'Restricted medicine doctor details are handled through compliance and patient-linked selling.',
        path: '/pharmaflow/compliance',
        workspace: 'Compliance',
      },
      {
        code: 'Q22',
        title: 'Patient history',
        summary: 'Patient purchase and prescription history is easiest to review from customers.',
        path: '/pharmaflow/customers',
        workspace: 'Customers',
      },
      {
        code: 'Q23',
        title: 'GST compliant invoicing',
        summary: 'The billing counter and receipt workflow are the main invoicing home.',
        path: '/pharmaflow/billing',
        workspace: 'Billing',
      },
      {
        code: 'Q24',
        title: 'Mandatory sale registers again',
        summary: 'The same controlled-drug register flow stays in compliance for repeated buyer questions.',
        path: '/pharmaflow/compliance',
        workspace: 'Compliance',
      },
      {
        code: 'Q25',
        title: 'Pharmacist audit trail again',
        summary: 'Use bill history and audit coverage when the buyer repeats the audit-trail question.',
        path: '/pharmaflow/billing-history',
        workspace: 'Bill History',
      },
      {
        code: 'Q26',
        title: 'Drug Inspector reports again',
        summary: 'Inspector-ready reporting remains under compliance for repeated demos and audits.',
        path: '/pharmaflow/compliance',
        workspace: 'Compliance',
      },
      {
        code: 'Q27',
        title: 'Doctor Rx tracking again',
        summary: 'Doctor and restricted medicine capture stays in the compliance workflow.',
        path: '/pharmaflow/compliance',
        workspace: 'Compliance',
      },
      {
        code: 'Q28',
        title: 'Patient history again',
        summary: 'Customer and patient history remains directly accessible from the customer screen.',
        path: '/pharmaflow/customers',
        workspace: 'Customers',
      },
      {
        code: 'Q29',
        title: 'GST invoicing again',
        summary: 'Use the billing workspace again for invoice, print, PDF, and GST-ready totals.',
        path: '/pharmaflow/billing',
        workspace: 'Billing',
      },
      {
        code: 'Q30',
        title: 'Automatic batch tracking',
        summary: 'Inventory provides the easiest view for batch-level control and store stock visibility.',
        path: '/pharmaflow/inventory',
        workspace: 'Inventory',
      },
      {
        code: 'Q31',
        title: 'Prevent expired sale',
        summary: 'Expiry visibility and stock protection are easiest to explain from inventory.',
        path: '/pharmaflow/inventory',
        workspace: 'Inventory',
      },
      {
        code: 'Q32',
        title: 'Purchase schemes',
        summary: 'Vendor inward, scheme discussion, and procurement handling live in purchases.',
        path: '/pharmaflow/procurement',
        workspace: 'Purchases',
      },
    ],
  },
  {
    title: 'Q33 to Q43',
    summary: 'Margins, barcode, reporting, roles, audit, volume limits, and integrations.',
    items: [
      {
        code: 'Q33',
        title: 'PTR, PTS, and MRP margins',
        summary: 'Margin and profitability story is easiest to demo from the profit workspace.',
        path: '/pharmaflow/reports/profit',
        workspace: 'Profit',
      },
      {
        code: 'Q34',
        title: 'Barcode scanning',
        summary: 'Barcode-first lookup belongs in the billing workspace for quick POS use.',
        path: '/pharmaflow/billing',
        workspace: 'Billing',
      },
      {
        code: 'Q35',
        title: 'Partial strip sales',
        summary: 'Tablet and strip handling stays in the counter workflow for live selling.',
        path: '/pharmaflow/billing',
        workspace: 'Billing',
      },
      {
        code: 'Q36',
        title: 'Brand, generic, and salt search',
        summary: 'Triple search is easiest to show from the billing counter medicine search flow.',
        path: '/pharmaflow/billing',
        workspace: 'Billing',
      },
      {
        code: 'Q37',
        title: 'Daily sales, exports, and business reports',
        summary: 'Daily sales, top sellers, slow movers, expiry loss, GST, and profit analytics are handled from GST reports and profit analytics.',
        path: '/pharmaflow/reports/gst',
        workspace: 'GST Reports',
      },
      {
        code: 'Q38',
        title: 'User roles',
        summary: 'Tenant and role-oriented positioning belongs in the SaaS admin and setup layer.',
        path: '/pharmaflow/platform',
        workspace: 'SaaS Admin',
      },
      {
        code: 'Q39',
        title: 'Restrict price editing',
        summary: 'Role-driven access and controlled workflows are positioned from platform and setup.',
        path: '/pharmaflow/platform',
        workspace: 'SaaS Admin',
      },
      {
        code: 'Q40',
        title: 'Track who edited bills',
        summary: 'Invoice-level audit trail sits directly inside bill history for quick review.',
        path: '/pharmaflow/billing-history',
        workspace: 'Bill History',
      },
      {
        code: 'Q41',
        title: 'Activity audit log',
        summary: 'The easiest audit story still runs through bill history and operations review.',
        path: '/pharmaflow/billing-history',
        workspace: 'Bill History',
      },
      {
        code: 'Q42',
        title: 'Unlimited invoices and documents',
        summary: 'The billing and purchase workspaces remain the simplest place to explain unlimited operations.',
        path: '/pharmaflow/billing',
        workspace: 'Billing',
      },
      {
        code: 'Q43',
        title: 'Integrations and future APIs',
        summary: 'Platform admin is the right legacy entry point for integrations, APIs, and rollout planning.',
        path: '/pharmaflow/platform',
        workspace: 'SaaS Admin',
      },
    ],
  },
];

const LegacyFeatureHub: React.FC<LegacyFeatureHubProps> = ({
  title = 'Simple Pharmacy Launcher',
  description = 'Every major feature is available here in the same straightforward legacy style, without forcing users through the newer shell first.',
  onOpenWorkspace,
}) => {
  const branding = readBranding();
  const legacyUserRaw = localStorage.getItem('user');
  const [searchTerm, setSearchTerm] = React.useState('');
  let legacyUserName = '';
  let legacyUserRole = '';

  if (legacyUserRaw) {
    try {
      const parsedLegacyUser = JSON.parse(legacyUserRaw);
      legacyUserName = parsedLegacyUser?.employerName || parsedLegacyUser?.employerEmail || '';
      legacyUserRole = parsedLegacyUser?.role || '';
    } catch {
      legacyUserName = legacyUserRaw;
    }
  }

  const currentUser =
    localStorage.getItem('pharmaflow_full_name') ||
    localStorage.getItem('pharmaflow_username') ||
    legacyUserName;
  const currentRole = localStorage.getItem('pharmaflow_role') || legacyUserRole;
  const currentStore = localStorage.getItem('pharmaflow_store_code') || 'No store selected';
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredFeatureGroups = featureGroups
    .map((group) => ({
      ...group,
      modules: group.modules.filter((module) => {
        if (!normalizedSearch) {
          return true;
        }

        const haystack = `${module.title} ${module.summary} ${group.title}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      }),
    }))
    .filter((group) => group.modules.length > 0);

  const filteredRequirementGroups = requirementGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        const haystack =
          `${item.code} ${item.title} ${item.summary} ${item.workspace} ${group.title}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const totalQuickLaunchCards = featureGroups.reduce((sum, group) => sum + group.modules.length, 0);
  const totalRequirementItems = requirementGroups.reduce((sum, group) => sum + group.items.length, 0);
  const filteredRequirementItems = filteredRequirementGroups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className='rounded-xl bg-white p-6 shadow-md'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-slate-900'>{title}</h2>
          <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600'>{description}</p>
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          <div className='rounded-xl bg-slate-50 px-4 py-3'>
            <div className='text-xs uppercase tracking-wide text-slate-400'>Brand</div>
            <div className='mt-1 font-semibold text-slate-900'>{branding.brandName}</div>
          </div>
          <div className='rounded-xl bg-slate-50 px-4 py-3'>
            <div className='text-xs uppercase tracking-wide text-slate-400'>Store</div>
            <div className='mt-1 font-semibold text-slate-900'>{currentStore}</div>
          </div>
          <div className='rounded-xl bg-slate-50 px-4 py-3'>
            <div className='text-xs uppercase tracking-wide text-slate-400'>User</div>
            <div className='mt-1 font-semibold text-slate-900'>{currentUser || 'Not signed in'}</div>
            {currentRole ? <div className='mt-1 text-xs text-slate-500'>{currentRole}</div> : null}
          </div>
        </div>
      </div>

      <div className='mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4'>
        <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4'>
          <div className='text-xs uppercase tracking-wide text-slate-400'>Quick Launch Cards</div>
          <div className='mt-2 text-3xl font-bold text-slate-900'>{totalQuickLaunchCards}</div>
          <div className='mt-1 text-sm text-slate-500'>Every major workspace is reachable from this legacy home.</div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4'>
          <div className='text-xs uppercase tracking-wide text-slate-400'>Client Questions</div>
          <div className='mt-2 text-3xl font-bold text-slate-900'>{totalRequirementItems}</div>
          <div className='mt-1 text-sm text-slate-500'>All 43 buyer questions are listed below with their home screen.</div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4'>
          <div className='text-xs uppercase tracking-wide text-slate-400'>Simple Demo Flow</div>
          <div className='mt-2 text-lg font-semibold text-slate-900'>Billing to Stock to Compliance to Reports</div>
          <div className='mt-1 text-sm text-slate-500'>This keeps the client walkthrough clear and easy to follow.</div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4'>
          <div className='text-xs uppercase tracking-wide text-slate-400'>Find Anything Fast</div>
          <div className='mt-2 text-lg font-semibold text-slate-900'>
            {filteredRequirementItems}/{totalRequirementItems} questions shown
          </div>
          <div className='mt-1 text-sm text-slate-500'>Search by Q number, GST, barcode, loyalty, doctor, audit, plan, or delivery.</div>
        </div>
      </div>

      <div className='mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4'>
        <label htmlFor='legacy-feature-search' className='block text-sm font-semibold text-slate-900'>
          Search legacy home
        </label>
        <input
          id='legacy-feature-search'
          type='text'
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder='Search Q1, barcode, GST, loyalty, doctor, audit, plans, stores...'
          className='mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-slate-400'
        />
      </div>

      <div className='mt-6 space-y-6'>
        {filteredFeatureGroups.map((group) => (
          <section key={group.title}>
            <div className='mb-3'>
              <h3 className='text-lg font-semibold text-slate-900'>{group.title}</h3>
              <p className='text-sm text-slate-500'>{group.summary}</p>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {group.modules.map((module) => {
                const workspaceKey = resolveLegacyWorkspaceKey(module.path);
                const cardClassName = `rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${module.accent}`;
                const shouldUseInlineOpen =
                  Boolean(onOpenWorkspace) && !module.path.includes('/legacy-login');

                if (shouldUseInlineOpen) {
                  return (
                    <button
                      key={module.title}
                      type='button'
                      onClick={() => onOpenWorkspace?.(workspaceKey)}
                      className={cardClassName}
                    >
                      <div className='text-lg font-semibold text-slate-900'>{module.title}</div>
                      <p className='mt-2 text-sm leading-6 text-slate-600'>{module.summary}</p>
                      <div className='mt-4 text-sm font-medium text-slate-900'>{module.cta}</div>
                    </button>
                  );
                }

                return (
                  <Link key={module.title} to={module.path} className={cardClassName}>
                    <div className='text-lg font-semibold text-slate-900'>{module.title}</div>
                    <p className='mt-2 text-sm leading-6 text-slate-600'>{module.summary}</p>
                    <div className='mt-4 text-sm font-medium text-slate-900'>{module.cta}</div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className='mt-8 border-t border-slate-200 pt-8'>
        <div className='mb-4'>
          <h3 className='text-xl font-semibold text-slate-900'>43-Point Client Coverage</h3>
          <p className='mt-1 text-sm text-slate-500'>
            Every client question now has a clear legacy-home entry point so the team can demo from one simple screen.
          </p>
        </div>

        <div className='space-y-6'>
          {filteredRequirementGroups.map((group) => (
            <section key={group.title}>
              <div className='mb-3'>
                <h4 className='text-lg font-semibold text-slate-900'>{group.title}</h4>
                <p className='text-sm text-slate-500'>{group.summary}</p>
              </div>

              <div className='grid grid-cols-1 gap-3 xl:grid-cols-2'>
                {group.items.map((item) => {
                  const workspaceKey = resolveLegacyWorkspaceKey(item.path, item.workspace);
                  const cardClassName =
                    'rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm';

                  if (onOpenWorkspace) {
                    return (
                      <button
                        key={item.code}
                        type='button'
                        onClick={() => onOpenWorkspace?.(workspaceKey)}
                        className={cardClassName}
                      >
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                          <div className='min-w-0'>
                            <div className='flex items-center gap-2'>
                              <span className='rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white'>
                                {item.code}
                              </span>
                              <span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600'>
                                {item.workspace}
                              </span>
                            </div>
                            <div className='mt-3 text-base font-semibold text-slate-900'>{item.title}</div>
                            <p className='mt-2 text-sm leading-6 text-slate-600'>{item.summary}</p>
                          </div>

                          <div className='shrink-0 text-sm font-medium text-slate-900'>Open</div>
                        </div>
                      </button>
                    );
                  }

                  return (
                    <Link key={item.code} to={item.path} className={cardClassName}>
                      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                        <div className='min-w-0'>
                          <div className='flex items-center gap-2'>
                            <span className='rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white'>
                              {item.code}
                            </span>
                            <span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600'>
                              {item.workspace}
                            </span>
                          </div>
                          <div className='mt-3 text-base font-semibold text-slate-900'>{item.title}</div>
                          <p className='mt-2 text-sm leading-6 text-slate-600'>{item.summary}</p>
                        </div>

                        <div className='shrink-0 text-sm font-medium text-slate-900'>Open</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LegacyFeatureHub;
