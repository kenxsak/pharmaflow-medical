import Logo from '../../../assets/logo.png';
import {
  FaUserTie,
  FaUserFriends,
  FaCheckCircle,
  FaPlus,
  FaMapMarkerAlt,
  FaChartLine,
  FaShoppingBag,
  FaStore,
  FaArrowRight,
  FaStar,
} from 'react-icons/fa';
import { HiCurrencyDollar, HiTrendingUp, HiSparkles } from 'react-icons/hi';
import { useEffect } from 'react';
import useBranchManagementService from '../services/BranchManagementService';
import Lottie from 'lottie-react';
import loading from '../../../assets/lottie/loading.json';
import { useNavigate } from 'react-router-dom';
import { IBranchAndSales } from '../interfaces/IBranchAndSales';

function BranchManagement() {
  const { allBranchSales, loadingAllBranchSales, fetchAllBranchSales } =
    useBranchManagementService();

  useEffect(() => {
    fetchAllBranchSales();
  }, []);

  const navigate = useNavigate();

  const viewMoreClick = (worker: IBranchAndSales) => {
    navigate(`/view-branch/${worker.branchId}`);
  };

  const createBranch = () => {
    navigate('/branches/create-branch');
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBg = (status: boolean) => {
    return status ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  return (
    <div className='min-h-screen bg-gray-50 p-6 lg:p-8'>
      {loadingAllBranchSales ? (
        <div className='flex flex-col justify-center items-center h-screen'>
          <Lottie animationData={loading} style={{ width: 200, height: 200 }} />
          <p className='mt-4 text-gray-600 font-medium'>Loading branches...</p>
        </div>
      ) : (
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='flex items-center justify-between mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
                <FaStore className='text-blue-600' />
                Branch Management
              </h1>
              <p className='text-gray-500 mt-2'>Manage and monitor all pharmacy branches</p>
            </div>
            <button
              onClick={createBranch}
              className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2'
            >
              <FaPlus className='text-lg' />
              <span>Add Branch</span>
            </button>
          </div>

          {/* Branch Cards Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
            {allBranchSales?.map((pharmacy, index) => (
              <div
                key={pharmacy.branchId}
                className='bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300'
              >
                {/* Card Header */}
                <div className='bg-gradient-to-r from-blue-600 to-blue-700 p-6 relative'>
                  {/* Status Badge */}
                  <div className='absolute top-4 right-4'>
                    <div className={`${getStatusBg(pharmacy.branchStatus)} border px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold`}>
                      <FaCheckCircle className={getStatusColor(pharmacy.branchStatus)} />
                      <span className={getStatusColor(pharmacy.branchStatus)}>
                        {pharmacy.branchStatus ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Branch Logo */}
                  <div className='flex justify-center'>
                    <div className='bg-white p-2 rounded-lg shadow-lg'>
                      <img
                        src={Logo}
                        alt='Branch Logo'
                        className='w-16 h-16 rounded-md'
                      />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className='p-6'>
                  {/* Branch Name */}
                  <h3 className='text-xl font-bold text-gray-900 mb-2 text-center'>
                    {pharmacy.branchName}
                  </h3>

                  {/* Location */}
                  <div className='flex items-start justify-center gap-2 text-gray-600 mb-6 pb-6 border-b border-gray-200'>
                    <FaMapMarkerAlt className='text-blue-600 mt-1 flex-shrink-0' />
                    <p className='text-sm text-center'>{pharmacy.branchLocation}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className='space-y-3 mb-6'>
                    {/* Revenue */}
                    <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                      <div className='flex items-center gap-3'>
                        <div className='bg-green-100 p-2 rounded-lg'>
                          <HiCurrencyDollar className='text-green-600 text-xl' />
                        </div>
                        <span className='text-sm font-medium text-gray-600'>Revenue</span>
                      </div>
                      <p className='text-sm font-bold text-gray-900'>
                        LKR {pharmacy.totalSales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    {/* Orders */}
                    <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                      <div className='flex items-center gap-3'>
                        <div className='bg-blue-100 p-2 rounded-lg'>
                          <FaShoppingBag className='text-blue-600 text-xl' />
                        </div>
                        <span className='text-sm font-medium text-gray-600'>Orders</span>
                      </div>
                      <p className='text-sm font-bold text-gray-900'>
                        {pharmacy.orderCount.toLocaleString()}
                      </p>
                    </div>

                    {/* Employees */}
                    <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                      <div className='flex items-center gap-3'>
                        <div className='bg-indigo-100 p-2 rounded-lg'>
                          <FaUserFriends className='text-indigo-600 text-xl' />
                        </div>
                        <span className='text-sm font-medium text-gray-600'>Employees</span>
                      </div>
                      <p className='text-sm font-bold text-gray-900'>
                        {pharmacy.employeeCount}
                      </p>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => viewMoreClick(pharmacy)}
                    className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2'
                  >
                    <span>View Details</span>
                    <FaArrowRight className='text-sm' />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {allBranchSales?.length === 0 && (
            <div className='bg-white rounded-lg shadow-md p-12 text-center border border-gray-200'>
              <FaStore className='text-6xl text-gray-300 mx-auto mb-4' />
              <h3 className='text-2xl font-bold text-gray-900 mb-2'>No Branches Yet</h3>
              <p className='text-gray-500 mb-6'>Get started by creating your first branch</p>
              <button
                onClick={createBranch}
                className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200'
              >
                <FaPlus />
                <span>Create First Branch</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BranchManagement;
