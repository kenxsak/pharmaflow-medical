import React, { useEffect, useState } from 'react';
import ExpiryAlertsDashboard from '../../pages/reports/ExpiryAlertsDashboard';
import GSTReportsDashboard from '../../pages/reports/GSTReportsDashboard';
import ProfitAnalyticsDashboard from '../../pages/reports/ProfitAnalyticsDashboard';

export type LegacyReportsTab = 'gst' | 'profit' | 'expiry';

interface LegacyReportsWorkspaceProps {
  initialTab?: LegacyReportsTab;
}

const tabs: Array<{
  key: LegacyReportsTab;
  label: string;
  summary: string;
}> = [
  {
    key: 'gst',
    label: 'GST Reports',
    summary: 'GSTR-1, GSTR-3B, shortage export, and monthly compliance reporting.',
  },
  {
    key: 'profit',
    label: 'Profit Analytics',
    summary: 'Daily sales, top sellers, slow movers, and profit by manufacturer or category.',
  },
  {
    key: 'expiry',
    label: 'Expiry Alerts',
    summary: '30, 60, and 90 day risk buckets with expiry-loss and shortage follow-up.',
  },
];

const LegacyReportsWorkspace: React.FC<LegacyReportsWorkspaceProps> = ({
  initialTab = 'gst',
}) => {
  const [activeTab, setActiveTab] = useState<LegacyReportsTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const activeMeta = tabs.find((tab) => tab.key === activeTab) || tabs[0];

  return (
    <div className='legacy-module-ui space-y-4'>
      <section className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <div className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-500'>
              Legacy reports console
            </div>
            <h2 className='mt-2 text-xl font-semibold text-slate-950'>
              Simple reporting flow for store teams and owners
            </h2>
            <p className='mt-1 max-w-3xl text-sm leading-6 text-slate-500'>
              Keep tax, profitability, and expiry work under one easy legacy tab instead of
              making the team jump across different screens.
            </p>
          </div>

          <div className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600'>
            {activeMeta.summary}
          </div>
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type='button'
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'gst' && <GSTReportsDashboard embedded />}
      {activeTab === 'profit' && <ProfitAnalyticsDashboard embedded />}
      {activeTab === 'expiry' && <ExpiryAlertsDashboard embedded />}
    </div>
  );
};

export default LegacyReportsWorkspace;
