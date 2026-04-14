import React, { useEffect, useState } from 'react';
import SalesChart from '../components/SalesChart';
import OrdersChart from '../components/OrdersChart';
import { getToday } from '../../../utils/getToday';
import { BranchSalesData } from '../interfaces/BranchSales';
import useSummaryService from '../services/SummaryService';
import { BiLoader } from 'react-icons/bi';
import { BsCalendar, BsGraphUp, BsReceipt, BsCurrencyDollar, BsBuilding } from 'react-icons/bs';

const SummaryPage: React.FC = () => {
  const { getAllBranchesSales, branchSalesOrders, filterBranchSalesData, loading } =
    useSummaryService();
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState(getToday());

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  useEffect(() => {
    getAllBranchesSales();
  }, []);

  const handleClearFilters = () => {
    setStartDate('2023-01-01');
    setEndDate(getToday());
  };

  // Filtering logic based on date range - if no dailySales, include the branch anyway
  const filteredSalesData = branchSalesOrders.filter(
    (data: BranchSalesData) => {
      // If there are no daily sales, include the branch
      if (data.dailySales.length === 0) {
        return true;
      }
      // Otherwise filter by date range
      return data.dailySales.some((summary) => {
        const dataDate = new Date(summary.date);
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        return dataDate >= startDateObj && dataDate <= endDateObj;
      });
    }
  );

  // Calculate summary statistics
  const totalBranches = branchSalesOrders.length;
  const totalSales = filteredSalesData.reduce(
    (sum, branch) => sum + branch.dailySales.reduce((s, day) => s + day.totalSales, 0),
    0
  );
  const totalOrders = filteredSalesData.reduce(
    (sum, branch) => sum + branch.dailySales.reduce((s, day) => s + day.orderCount, 0),
    0
  );
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const hasData = branchSalesOrders.length > 0;

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-800'>Sales & Orders Summary</h1>
          <p className='text-gray-600'>Overview of branch performance and analytics</p>
        </div>

        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
          <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Branches</p>
                <p className='text-3xl font-bold text-gray-800 mt-2'>{totalBranches}</p>
              </div>
              <div className='p-3 bg-blue-100 rounded-full'>
                <BsBuilding className='text-2xl text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Sales</p>
                <p className='text-3xl font-bold text-gray-800 mt-2'>LKR {totalSales.toFixed(2)}</p>
              </div>
              <div className='p-3 bg-green-100 rounded-full'>
                <BsCurrencyDollar className='text-2xl text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Orders</p>
                <p className='text-3xl font-bold text-gray-800 mt-2'>{totalOrders}</p>
              </div>
              <div className='p-3 bg-purple-100 rounded-full'>
                <BsReceipt className='text-2xl text-purple-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Avg Order Value</p>
                <p className='text-3xl font-bold text-gray-800 mt-2'>LKR {averageOrderValue.toFixed(2)}</p>
              </div>
              <div className='p-3 bg-orange-100 rounded-full'>
                <BsGraphUp className='text-2xl text-orange-600' />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex-1 min-w-[200px]'>
              <label htmlFor='startDate' className='block text-sm font-semibold text-gray-700 mb-2'>
                <BsCalendar className='inline mr-2' />
                Start Date
              </label>
              <input
                type='date'
                id='startDate'
                value={startDate}
                onChange={handleStartDateChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
            
            <div className='flex-1 min-w-[200px]'>
              <label htmlFor='endDate' className='block text-sm font-semibold text-gray-700 mb-2'>
                <BsCalendar className='inline mr-2' />
                End Date
              </label>
              <input
                type='date'
                id='endDate'
                value={endDate}
                onChange={handleEndDateChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>

            <div className='flex items-end'>
              <button
                className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors'
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Charts */}
        {loading ? (
          <div className='flex justify-center py-12'>
            <BiLoader className='animate-spin text-4xl text-blue-600' />
          </div>
        ) : hasData ? (
          filteredSalesData.length > 0 ? (
            <div className='space-y-6'>
              <SalesChart branchSalesOrders={filteredSalesData} />
              <OrdersChart branchSalesOrders={filteredSalesData} />
            </div>
          ) : (
            <div className='bg-white rounded-lg shadow-md p-12 text-center'>
              <div className='flex flex-col items-center gap-4'>
                <BsGraphUp className='text-6xl text-gray-300' />
                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-2'>No Data Available</h3>
                  <p className='text-gray-600'>No sales data found for the selected date range. Try adjusting your filters.</p>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className='bg-white rounded-lg shadow-md p-12 text-center'>
            <div className='flex flex-col items-center gap-4'>
              <BsGraphUp className='text-6xl text-gray-300' />
              <div>
                <h3 className='text-lg font-semibold text-gray-800 mb-2'>No Data Available</h3>
                <p className='text-gray-600'>There is no sales data available at the moment.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPage;
