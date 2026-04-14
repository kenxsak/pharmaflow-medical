import { useNavigate, useParams } from 'react-router-dom';
import useBranchManagementService from '../services/BranchManagementService';
import { useEffect, useState } from 'react';
import OrdersChart from '../components/OrdersChart';
import SalesChart from '../components/SalesChart';
import { getToday } from '../../../utils/getToday';
import { generateMonthlySalesSummary } from '../utils/monthlySalesSummary';
import BranchDetailCard from '../components/BranchDetailCard';
import EmployerTable from '../components/EmployerTable';
import ItemsTable from '../components/ItemsTable';
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaFax,
  FaUser,
  FaCalendarAlt,
} from 'react-icons/fa';
import { CashierDetailsType } from '../../cashier-management-dashboard/interfaces/CashierDetailsType';
import BranchManagerCard from '../components/BranchManagerCard';
import ImageUpdateComponent from '../components/ImageUpdateComponent';
import ChangeBranchManager from '../components/ChangeBranchManager';

type Props = {};

function ViewBranchDetails({}: Props) {
  const { branchId } = useParams();
  const {
    fetchBranchById,
    getSalesSummary,
    salesSummary,
    fetchEmployersByBranchId,
    branchEmployers,
    branch,
    fetchItemsByBranchId,
    items,
    fetchBranchMangerById,
    branchManager,
    fetchBranchImage,
    branchImage,
    branchManagerFetching,
  } = useBranchManagementService();

  useEffect(() => {
    if (branchId) {
      fetchBranchById(branchId);
      getSalesSummary(branchId);
      fetchEmployersByBranchId(branchId);
      fetchItemsByBranchId(branchId);
      fetchBranchMangerById(branchId);
      fetchBranchImage(parseInt(branchId));
    }
  }, []);

  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState(getToday());
  const [filterByMonth, setFilterByMonth] = useState(false);
  const [filterByYear, setFilterByYear] = useState('');
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [showBranchDetails, setShowBranchDetails] = useState(false);
  const [showBranchManger, setShowBranchManager] = useState(false);
  const [showImageUpdateToggle, setShowImageUpdateToggle] = useState(false);
  const [showChangeManager, setShowChangeManager] = useState(false);

  const handleStartDateChange = (e: any) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: any) => {
    setEndDate(e.target.value);
  };

  const handleYearChange = (e: any) => {
    setFilterByYear(e.target.value);
  };

  const handleClearFilters = () => {
    setStartDate('2023-01-01');
    setEndDate(getToday());
    setFilterByMonth(false);
    setFilterByYear('');
  };

  const filteredSalesData = salesSummary.filter((data) => {
    const dataYear = new Date(data.date).getFullYear().toString();
    const withinDateRange = data.date >= startDate && data.date <= endDate;
    const matchesYear = filterByYear ? dataYear === filterByYear : true;

    return withinDateRange && matchesYear;
  });

  useEffect(() => {
    const totalOrders = filteredSalesData.reduce(
      (acc, curr) => acc + curr.orderCount,
      0
    );
    const totalSales = filteredSalesData.reduce(
      (acc, curr) => acc + curr.totalSales,
      0
    );

    setTotalOrders(totalOrders);
    setTotalSales(totalSales);
  }, [salesSummary, startDate, endDate, filterByYear, filterByMonth]);

  const handleToggleClick = () => {
    setShowBranchDetails(!showBranchDetails);
  };

  const handleImageToggleClick = () => {
    setShowImageUpdateToggle(!showImageUpdateToggle);
  };

  const handleBranchManagerClick = () => {
    setShowBranchManager(!showBranchManger);
  };

  const handleChangeBranchManager = () => {
    setShowChangeManager(!showChangeManager);
  };

  const navigate = useNavigate();

  useEffect(() => {
    if (branchId) {
      fetchBranchById(branchId);
    }
  }, [showBranchDetails]);

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Branch Header Card */}
        <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          {/* Header with Gradient */}
          <div className='bg-gradient-to-r from-blue-600 to-blue-700 p-6'>
            <div className='flex flex-col md:flex-row items-center gap-6'>
              {branch && (
                <img
                  src={
                    branch.branchImage ||
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdhUtDLZiByDiz05R15jG3TLrCIS2MiCZnTQ&s'
                  }
                  alt='Branch'
                  className='w-32 h-32 rounded-lg object-cover border-4 border-white shadow-lg'
                />
              )}
              <div className='text-white text-center md:text-left flex-1'>
                <h1 className='text-2xl font-bold mb-2'>{branch.branchName}</h1>
                <p className='text-blue-100 text-sm'>{branch.branchDescription}</p>
              </div>
            </div>
          </div>

          {/* Branch Info Grid */}
          <div className='p-6 bg-gray-50'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              <div className='flex items-center gap-3 bg-white p-4 rounded-lg'>
                <FaMapMarkerAlt className='text-blue-600 text-xl' />
                <div>
                  <p className='text-xs text-gray-500 font-medium'>Address</p>
                  <p className='text-sm text-gray-900 font-semibold'>{branch.branchAddress}</p>
                </div>
              </div>
              <div className='flex items-center gap-3 bg-white p-4 rounded-lg'>
                <FaPhone className='text-blue-600 text-xl' />
                <div>
                  <p className='text-xs text-gray-500 font-medium'>Contact</p>
                  <p className='text-sm text-gray-900 font-semibold'>{branch.branchContact}</p>
                </div>
              </div>
              <div className='flex items-center gap-3 bg-white p-4 rounded-lg'>
                <FaEnvelope className='text-blue-600 text-xl' />
                <div>
                  <p className='text-xs text-gray-500 font-medium'>Email</p>
                  <p className='text-sm text-gray-900 font-semibold'>{branch.branchEmail}</p>
                </div>
              </div>
              <div className='flex items-center gap-3 bg-white p-4 rounded-lg'>
                <FaFax className='text-blue-600 text-xl' />
                <div>
                  <p className='text-xs text-gray-500 font-medium'>Fax</p>
                  <p className='text-sm text-gray-900 font-semibold'>{branch.branchFax}</p>
                </div>
              </div>
              <div className='flex items-center gap-3 bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors' onClick={handleBranchManagerClick}>
                <FaUser className='text-blue-600 text-xl' />
                <div>
                  <p className='text-xs text-gray-500 font-medium'>Manager</p>
                  <p className='text-sm text-gray-900 font-semibold hover:text-blue-600'>
                    {!branchManagerFetching &&
                      branchManager?.employerFirstName +
                        ' ' +
                        branchManager?.employerLastName}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-3 bg-white p-4 rounded-lg'>
                <FaCalendarAlt className='text-blue-600 text-xl' />
                <div>
                  <p className='text-xs text-gray-500 font-medium'>Created On</p>
                  <p className='text-sm text-gray-900 font-semibold'>
                    {branch.branchCreatedOn?.slice(0, 10)}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-white p-4 rounded-lg border-l-4 border-green-500'>
                <p className='text-sm text-gray-600 font-medium'>Total Sales</p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>LKR {totalSales.toLocaleString()}</p>
              </div>
              <div className='bg-white p-4 rounded-lg border-l-4 border-blue-500'>
                <p className='text-sm text-gray-600 font-medium'>Total Orders</p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>{totalOrders.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='p-6 bg-white border-t border-gray-200'>
            <div className='flex flex-wrap gap-3'>
              <button
                className='bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg'
                onClick={handleToggleClick}
              >
                Branch Details
              </button>
              <button
                className='bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg'
                onClick={handleImageToggleClick}
              >
                Edit Image
              </button>
              <button
                className='bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg'
                onClick={handleChangeBranchManager}
              >
                Change Manager
              </button>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className='bg-white rounded-lg shadow-md p-6'>
          <h3 className='text-lg font-bold text-gray-900 mb-4'>Sales & Orders Filters</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div>
              <label htmlFor='startDate' className='text-sm font-semibold text-gray-700 mb-2 block'>
                Start Date
              </label>
              <input
                type='date'
                id='startDate'
                value={startDate}
                onChange={handleStartDateChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
              />
            </div>
            <div>
              <label htmlFor='endDate' className='text-sm font-semibold text-gray-700 mb-2 block'>
                End Date
              </label>
              <input
                type='date'
                id='endDate'
                value={endDate}
                onChange={handleEndDateChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
              />
            </div>
            <div>
              <label htmlFor='filterByYear' className='text-sm font-semibold text-gray-700 mb-2 block'>
                Filter By Year
              </label>
              <input
                type='text'
                id='filterByYear'
                value={filterByYear}
                onChange={handleYearChange}
                placeholder='YYYY'
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
              />
            </div>
            <div>
              <label className='text-sm font-semibold text-gray-700 mb-2 block'>
                Filter By Month
              </label>
              <label className='flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors'>
                <input
                  type='checkbox'
                  id='filterByMonth'
                  checked={filterByMonth}
                  onChange={() => setFilterByMonth(!filterByMonth)}
                  className='w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
                />
                <span className='text-sm text-gray-700'>Monthly View</span>
              </label>
            </div>
          </div>
          <div className='mt-4'>
            <button
              className='bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 font-semibold rounded-lg transition-all duration-200'
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Modals */}
        <div>
          {showBranchManger && (
            <BranchManagerCard
              onClose={handleBranchManagerClick}
              branchManager={branchManager}
            />
          )}
        </div>

        {showBranchDetails && (
          <BranchDetailCard branch={branch} closeTab={handleToggleClick} />
        )}

        {showImageUpdateToggle && (
          <ImageUpdateComponent
            onClose={handleImageToggleClick}
            branchId={branchId ? branchId : ''}
          />
        )}

        {showChangeManager && (
          <ChangeBranchManager
            onClose={handleChangeBranchManager}
            branchEmployers={branchEmployers}
          />
        )}

        {/* Charts */}
        <div className='space-y-6'>
          {filterByMonth ? (
            <>
              <div className='bg-white rounded-lg shadow-md p-6'>
                <h3 className='text-lg font-bold text-gray-900 mb-4'>Monthly Sales</h3>
                <SalesChart
                  salesData={generateMonthlySalesSummary(filteredSalesData)}
                />
              </div>
              <div className='bg-white rounded-lg shadow-md p-6'>
                <h3 className='text-lg font-bold text-gray-900 mb-4'>Monthly Orders</h3>
                <OrdersChart
                  salesData={generateMonthlySalesSummary(filteredSalesData)}
                />
              </div>
            </>
          ) : (
            <>
              <div className='bg-white rounded-lg shadow-md p-6'>
                <h3 className='text-lg font-bold text-gray-900 mb-4'>Sales Overview</h3>
                <SalesChart salesData={filteredSalesData} />
              </div>
              <div className='bg-white rounded-lg shadow-md p-6'>
                <h3 className='text-lg font-bold text-gray-900 mb-4'>Orders Overview</h3>
                <OrdersChart salesData={filteredSalesData} />
              </div>
            </>
          )}
        </div>

        {/* Tables */}
        <div className='bg-white rounded-lg shadow-md p-6'>
          <h3 className='text-lg font-bold text-gray-900 mb-4'>Branch Employees</h3>
          <EmployerTable branchEmployers={branchEmployers} />
        </div>

        <div className='bg-white rounded-lg shadow-md p-6'>
          <h3 className='text-lg font-bold text-gray-900 mb-4'>Branch Inventory</h3>
          <ItemsTable items={items} />
        </div>

        {/* Back Button */}
        <div className='flex justify-start'>
          <button
            type='button'
            onClick={() => navigate('/manager-dashboard/branches')}
            className='bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 font-semibold rounded-lg transition-all duration-200'
          >
            ← Back to Branches
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewBranchDetails;
