import { useState } from 'react';
import { HiChartBar, HiChartPie } from 'react-icons/hi';
import OrderBarChart from '../components/order-bar-chart/OrderBarChart';
import OrderPieChart from '../components/order-pie-chart/OrderPieChart';
import SalesBarChart from '../components/sales-bar-chart/SalesBarChart';
import SalesPieChart from '../components/sales-pie-chart/SalesPieChart';
import SummaryCards from '../components/summary-detail-cards/SummaryCards';

function MainDashboard() {
  const [showPieChart, setShowPieChart] = useState<boolean>(false);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 lg:p-8'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Dashboard Overview</h1>
            <p className='text-gray-600 mt-1'>Welcome back! Here's what's happening today.</p>
          </div>
          <div className='text-sm text-gray-500'>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards />

        {/* Charts Section */}
        <div className='bg-white rounded-xl shadow-card p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-bold text-gray-900'>Analytics</h2>
            
            {/* Chart Type Toggle */}
            <div className='inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1'>
              <button
                onClick={() => setShowPieChart(false)}
                className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  !showPieChart
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <HiChartBar className='text-lg' />
                <span>Bar Chart</span>
              </button>
              <button
                onClick={() => setShowPieChart(true)}
                className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  showPieChart
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <HiChartPie className='text-lg' />
                <span>Pie Chart</span>
              </button>
            </div>
          </div>

          {/* Charts Container */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {showPieChart ? (
              <>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <SalesPieChart />
                </div>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <OrderPieChart />
                </div>
              </>
            ) : (
              <>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <SalesBarChart />
                </div>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <OrderBarChart />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainDashboard;
