import {
  Activity,
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  Coins,
  Home,
  HeartPulse,
  FileClock,
  LayoutDashboard,
  LineChart,
  Receipt,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PharmaFlowNavStatus = 'Live' | 'Partial';

export interface PharmaFlowNavItem {
  title: string;
  path: string;
  summary: string;
  shortSummary: string;
  status: PharmaFlowNavStatus;
  icon: LucideIcon;
  group: 'Workspace' | 'Operations' | 'Controls';
}

export const pharmaFlowNavItems: PharmaFlowNavItem[] = [
  {
    title: 'Home',
    path: '/pharmaflow/legacy-home',
    summary: 'Simple legacy-style home with all 43 client questions and every major module in one place.',
    shortSummary: 'Legacy feature home',
    status: 'Live',
    icon: Home,
    group: 'Workspace',
  },
  {
    title: 'Setup',
    path: '/pharmaflow/setup',
    summary: 'Sign in, switch the active branch, and review the pilot-store demo checklist.',
    shortSummary: 'Login and branch setup',
    status: 'Live',
    icon: LayoutDashboard,
    group: 'Workspace',
  },
  {
    title: 'Enterprise',
    path: '/pharmaflow/enterprise',
    summary: 'White-label profile, deployment model, buyer-question coverage, and the recommended multi-store demo path.',
    shortSummary: 'White label and buyer Q&A',
    status: 'Live',
    icon: FileText,
    group: 'Workspace',
  },
  {
    title: 'SaaS Admin',
    path: '/pharmaflow/platform',
    summary: 'Tenant roster, plans, pricing, and 43-point feature entitlements for super-admin control.',
    shortSummary: 'Tenants and pricing',
    status: 'Live',
    icon: Coins,
    group: 'Workspace',
  },
  {
    title: 'Counter',
    path: '/pharmaflow/billing',
    summary: 'Counter billing with barcode-ready medicine search, GST, substitutes, and compliance capture.',
    shortSummary: 'Billing and barcode scan',
    status: 'Live',
    icon: ScanLine,
    group: 'Operations',
  },
  {
    title: 'Stock',
    path: '/pharmaflow/inventory',
    summary: 'Batch stock visibility, medicine lookup, shortage detection, and FIFO-oriented stock inspection.',
    shortSummary: 'Inventory and batches',
    status: 'Live',
    icon: Boxes,
    group: 'Operations',
  },
  {
    title: 'Purchases',
    path: '/pharmaflow/procurement',
    summary: 'Supplier setup, manual inward entry, and CSV purchase invoice import for the active store.',
    shortSummary: 'Inward and purchase import',
    status: 'Live',
    icon: ClipboardList,
    group: 'Operations',
  },
  {
    title: 'Bills',
    path: '/pharmaflow/billing-history',
    summary: 'Invoice search, detailed bill review, and audit trail visibility for changes and events.',
    shortSummary: 'History and edits',
    status: 'Live',
    icon: Receipt,
    group: 'Controls',
  },
  {
    title: 'Compliance',
    path: '/pharmaflow/compliance',
    summary: 'Schedule H, H1, X, and narcotic reporting with Drug Inspector-ready register views.',
    shortSummary: 'Controlled drugs',
    status: 'Live',
    icon: ShieldCheck,
    group: 'Controls',
  },
  {
    title: 'Customers',
    path: '/pharmaflow/customers',
    summary: 'Customer search, credit visibility, loyalty actions, and patient history in one branch-friendly workspace.',
    shortSummary: 'Credit and history',
    status: 'Live',
    icon: HeartPulse,
    group: 'Operations',
  },
  {
    title: 'GST Reports',
    path: '/pharmaflow/reports/gst',
    summary: 'GSTR-1, GSTR-3B, shortage, expiry loss, and monthly operational reporting from store invoices.',
    shortSummary: 'GST, shortage, expiry loss',
    status: 'Live',
    icon: Activity,
    group: 'Controls',
  },
  {
    title: 'Profit',
    path: '/pharmaflow/reports/profit',
    summary: 'Daily sales, top sellers, slow movers, and estimated profit by manufacturer and category for the active store.',
    shortSummary: 'Sales, movement, margin',
    status: 'Live',
    icon: LineChart,
    group: 'Controls',
  },
  {
    title: 'Expiry',
    path: '/pharmaflow/reports/expiry-alerts',
    summary: '30, 60, and 90-day expiry buckets, at-risk stock value, and exportable alerts.',
    shortSummary: 'Expiry and shortage',
    status: 'Live',
    icon: FileClock,
    group: 'Controls',
  },
  {
    title: 'Stores',
    path: '/pharmaflow/stores',
    summary: 'Store directory, branch selection, and current multi-store readiness across HO and warehouse.',
    shortSummary: 'Store switching',
    status: 'Partial',
    icon: Building2,
    group: 'Workspace',
  },
];

export const pharmaFlowNavGroups: Array<PharmaFlowNavItem['group']> = [
  'Workspace',
  'Operations',
  'Controls',
];
