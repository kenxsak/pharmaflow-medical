import React, { useEffect, useState } from 'react';
import useOrderManagementService from '../services/OrderManagementServices';
import OrderCardComponent from '../components/OrderCardComponent';
import { Order } from '../interfaces/OrderDetails';
import { getToday } from '../../../utils/getToday';
import { BiLoader } from 'react-icons/bi';
import { BsCalendar, BsReceipt, BsCurrencyDollar, BsBoxSeam } from 'react-icons/bs';

type Props = {};

function OrderManagementWindow({}: Props) {
  const {
    loading,
    orderData,
    fetchOrderData,
    filteredOrderData,
    setFilteredOrderData,
    fetchAllBranches,
    branches,
  } = useOrderManagementService();

  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState(getToday());
  const [selectedBranch, setSelectedBranch] = useState('All');

  useEffect(() => {
    fetchOrderData();
  }, []);

  const filterOrdersByDateRange = (order: Order) => {
    const orderDate = new Date(order.orderDate).getTime();
    const startDateTime = new Date(startDate).getTime();
    const endDateTime = new Date(endDate).getTime();

    const withinDateRange =
      orderDate >= startDateTime && orderDate <= endDateTime;

    return withinDateRange;
  };

  useEffect(() => {
    const filtered = orderData?.filter(filterOrdersByDateRange);
    setFilteredOrderData(filtered);
  }, [startDate, endDate]);

  const handleClearFilters = () => {
    setStartDate('2023-01-01');
    setEndDate(getToday());
  };

  // Calculate summary statistics
  const totalOrders = filteredOrderData?.length || 0;
  const totalRevenue = filteredOrderData?.reduce((sum, order) => sum + order.total, 0) || 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItems = filteredOrderData?.reduce((sum, order) => sum + order.groupedOrderDetails.orderCount, 0) || 0;

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-800'>Order Management</h1>
          <p className='text-gray-600'>Track and manage all orders</p>
        </div>

        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
          <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Orders</p>
                <p className='text-3xl font-bold text-gray-800 mt-2'>{totalOrders}</p>
              </div>
              <div className='p-3 bg-blue-100 rounded-full'>
                <BsReceipt className='text-2xl text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Revenue</p>
                <p className='text-3xl font-bold text-gray-800 mt-2'>LKR {totalRevenue.toFixed(2)}</p>
              </div>
              <div className='p-3 bg-green-100 rounded-full'>
                <BsCurrencyDollar className='text-2xl text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Avg Order Value</p>
                <p className='text-3xl font-bold text-gray-800 mt-2'>LKR {averageOrderValue.toFixed(2)}</p>
              </div>
              <div className='p-3 bg-purple-100 rounded-full'>
                <BsCurrencyDollar className='text-2xl text-purple-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Items</p>
                <p className='text-3xl font-bold text-gray-800 mt-2'>{totalItems}</p>
              </div>
              <div className='p-3 bg-orange-100 rounded-full'>
                <BsBoxSeam className='text-2xl text-orange-600' />
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
                onChange={(e) => setStartDate(e.target.value)}
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
                onChange={(e) => setEndDate(e.target.value)}
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

        {/* Orders Grid */}
        {loading ? (
          <div className='flex justify-center py-12'>
            <BiLoader className='animate-spin text-4xl text-blue-600' />
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredOrderData?.map((order) => (
              <OrderCardComponent key={order.orderId} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderManagementWindow;
