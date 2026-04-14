import { useEffect } from 'react';
import {
  HiTrendingUp,
  HiShoppingCart,
  HiUsers,
  HiOfficeBuilding,
} from 'react-icons/hi';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import useBranchService from '../../services/BranchService';

function SummaryCards() {
  const { allBranchData, fetchAllBranchDataSummary } = useBranchService();

  useEffect(() => {
    fetchAllBranchDataSummary();
  }, []);

  const cards = [
    {
      title: 'Total Revenue',
      value: allBranchData
        ? `LKR ${allBranchData.totalSalesAllBranches.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : '...',
      icon: HiTrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      change: '+12.5%',
      trend: 'up',
    },
    {
      title: 'Total Orders',
      value: allBranchData
        ? allBranchData.totalOrdersAllBranches.toLocaleString()
        : '...',
      icon: HiShoppingCart,
      gradient: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      change: '+8.2%',
      trend: 'up',
    },
    {
      title: 'Total Employees',
      value: allBranchData
        ? allBranchData.totalEmployeesAllBranches.toLocaleString()
        : '...',
      icon: HiUsers,
      gradient: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      change: '+3.1%',
      trend: 'up',
    },
    {
      title: 'Active Branches',
      value: allBranchData ? allBranchData.totalBranches.toLocaleString() : '...',
      icon: HiOfficeBuilding,
      gradient: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      change: '0%',
      trend: 'neutral',
    },
  ];

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className='bg-white rounded-xl shadow-card hover:shadow-soft transition-all duration-300 overflow-hidden group animate-fade-in'
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Colored Top Border */}
            <div className={`h-1 bg-gradient-to-r ${card.gradient}`}></div>
            
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div
                  className={`${card.bgColor} p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`text-2xl ${card.iconColor}`} />
                </div>
                <div
                  className={`flex items-center space-x-1 text-xs font-semibold ${
                    card.trend === 'up'
                      ? 'text-green-600'
                      : card.trend === 'down'
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  {card.trend === 'up' && <FaArrowUp />}
                  {card.trend === 'down' && <FaArrowDown />}
                  <span>{card.change}</span>
                </div>
              </div>

              <div>
                <p className='text-sm font-medium text-gray-600 mb-1'>
                  {card.title}
                </p>
                {allBranchData ? (
                  <p className='text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-300'>
                    {card.value}
                  </p>
                ) : (
                  <div className='flex items-center space-x-2'>
                    <div className='w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin'></div>
                    <span className='text-sm text-gray-500'>Loading...</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className='mt-4 pt-4 border-t border-gray-100'>
                <div className='h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                  <div
                    className={`h-full bg-gradient-to-r ${card.gradient} rounded-full transition-all duration-1000 ease-out`}
                    style={{
                      width: allBranchData ? '100%' : '0%',
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SummaryCards;
