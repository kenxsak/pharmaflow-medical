import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import LatestTransactionDetails from '../components/LatestTransactionDetails';
import SummaryCard from '../components/SummaryCard';
import BranchDetailsCard from '../components/BranchDetailsCard';
import UseBranchService from '../../manager-dashboard/services/BranchService';
import LegacyFeatureHub from '../../../shared/legacy/LegacyFeatureHub';
import { readBranding } from '../../../utils/branding';

interface MainManagerDashboardProps {
  onNavigateToOrders?: () => void;
  onOpenWorkspace?: (workspaceKey: string) => void;
}

function MainManagerDashboard({
  onNavigateToOrders,
  onOpenWorkspace,
}: MainManagerDashboardProps) {
  const { fetchBranchData, branchData } = UseBranchService();
  const branding = readBranding();
  const displayBranchData = branchData || {
    branchId: 0,
    branchName: localStorage.getItem('pharmaflow_store_code') || 'LifePill Main Branch',
    branchAddress:
      localStorage.getItem('pharmaflow_brand_tagline') ||
      'Use this simple legacy workspace to open the full PharmaFlow suite.',
    branchContact: localStorage.getItem('pharmaflow_brand_support_phone') || '-',
    branchEmail: localStorage.getItem('pharmaflow_brand_support_email') || '-',
    branchLocation: 'Tamil Nadu branch workspace',
    branchStatus: true,
    branchImageUrl: null,
    totalSales: 0,
    orderCount: 0,
    employeeCount: 1,
    itemCount: 0,
    lowStockItemCount: 0,
  };

  useEffect(() => {
    fetchBranchData();
  }, []);

  return (
    <div
      className='flex flex-col gap-6 h-full overflow-y-auto'
      data-testid='dashboard'
    >
      <>
        {/* Header Section */}
        <div className='bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 shadow-lg flex-shrink-0'>
          <h1 className='text-2xl font-bold text-white mb-2'>Manager Dashboard</h1>
          <p className='text-blue-100 text-sm'>
            Legacy-first branch control with quick access to billing, inventory, compliance, reports, and SaaS controls.
          </p>
        </div>

        <div className='bg-white rounded-xl p-6 shadow-md flex-shrink-0'>
          <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
            <div>
              <h2 className='text-xl font-semibold text-slate-900'>{branding.brandName} Legacy Workspace</h2>
              <p className='mt-1 text-sm text-slate-500'>
                Every important pharmacy feature now lives behind the same simpler legacy-style launcher.
                Use this as the primary working home if the newer shell feels too busy.
              </p>
            </div>
            {onOpenWorkspace ? (
              <button
                type='button'
                onClick={() => onOpenWorkspace('Billing')}
                className='inline-flex items-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white'
              >
                Open Billing Counter
              </button>
            ) : (
              <Link
                to='/pharmaflow/billing'
                className='inline-flex items-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white'
              >
                Open Billing Counter
              </Link>
            )}
          </div>

          <div className='mt-5'>
            <LegacyFeatureHub
              title='Legacy-style feature launcher'
              description='Counter, inventory, purchases, compliance, reports, stores, SaaS admin, and buyer guide are all available here with one-click access.'
              onOpenWorkspace={onOpenWorkspace}
            />
          </div>
        </div>

        {/* Summary Cards Section */}
        <div className='flex-shrink-0'>
          <SummaryCard branchData={displayBranchData} />
        </div>

        {/* Branch Details and Transactions Section */}
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 flex-shrink-0 pb-6'>
          <div className='bg-white rounded-xl shadow-md p-6 max-h-[600px] overflow-y-auto'>
            <BranchDetailsCard branchData={displayBranchData} />
          </div>
          <div className='bg-white rounded-xl shadow-md p-6 max-h-[600px] overflow-y-auto'>
            <LatestTransactionDetails onNavigateToOrders={onNavigateToOrders} />
          </div>
        </div>
      </>
    </div>
  );
}

export default MainManagerDashboard;
