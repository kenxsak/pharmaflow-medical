import React from 'react';
import { Link } from 'react-router-dom';
import LegacyFeatureHub from '../../shared/legacy/LegacyFeatureHub';
import { readBranding } from '../../utils/branding';
import { getPharmaFlowRoleLabel, usePharmaFlowContext } from '../../utils/pharmaflowContext';

const PharmaFlowLegacyHome: React.FC = () => {
  const branding = readBranding();
  const context = usePharmaFlowContext();

  return (
    <div className='min-h-screen bg-slate-100 px-4 py-6 md:px-8'>
      <div className='mx-auto flex max-w-7xl flex-col gap-6'>
        <div className='rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white shadow-lg'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div>
              <p className='text-sm uppercase tracking-[0.25em] text-slate-300'>Simple Mode</p>
              <h1 className='mt-2 text-3xl font-bold'>{branding.brandName} Pharmacy Home</h1>
              <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-200'>
                This is the easy launcher for daily pharmacy work. Billing, stock, purchases,
                compliance, reports, stores, and SaaS admin are all available here without the
                busier workspace flow.
              </p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Link
                to='/pharmaflow/billing'
                className='rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm'
              >
                Open Billing
              </Link>
              <Link
                to='/pharmaflow/setup'
                className='rounded-xl border border-slate-400 px-4 py-3 text-sm font-semibold text-white'
              >
                Access Portal
              </Link>
              <Link
                to='/pharmaflow/help'
                className='rounded-xl border border-slate-400 px-4 py-3 text-sm font-semibold text-white'
              >
                Help
              </Link>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
          <div className='rounded-2xl bg-white p-5 shadow-sm'>
            <div className='text-xs uppercase tracking-wide text-slate-400'>Current User</div>
            <div className='mt-2 text-lg font-semibold text-slate-900'>
              {context.fullName || context.username || 'Legacy operator'}
            </div>
            <div className='mt-1 text-sm text-slate-500'>
              {getPharmaFlowRoleLabel(context.role, context.platformOwner) || 'Legacy session'}
            </div>
          </div>

          <div className='rounded-2xl bg-white p-5 shadow-sm'>
            <div className='text-xs uppercase tracking-wide text-slate-400'>Active Store</div>
            <div className='mt-2 text-lg font-semibold text-slate-900'>
              {context.storeCode || localStorage.getItem('pharmaflow_store_code') || 'Select branch in Setup'}
            </div>
            <div className='mt-1 text-sm text-slate-500'>Use this as the starting point for daily work and rollout walkthroughs.</div>
          </div>

          <div className='rounded-2xl bg-white p-5 shadow-sm'>
            <div className='text-xs uppercase tracking-wide text-slate-400'>Tenant</div>
            <div className='mt-2 text-lg font-semibold text-slate-900'>
              {context.tenantSlug || localStorage.getItem('pharmaflow_tenant_slug') || 'No tenant selected'}
            </div>
            <div className='mt-1 text-sm text-slate-500'>
              Branding, plans, and chain setup still remain available when you need them.
            </div>
          </div>
        </div>

        <LegacyFeatureHub
          title='Legacy-style feature launcher'
          description='One-click access to billing, customers, inventory, purchases, compliance, GST, profit, stores, enterprise guide, SaaS control, and setup.'
        />
      </div>
    </div>
  );
};

export default PharmaFlowLegacyHome;
