import React, { useState } from 'react';
import {
  FaHome,
  FaUserFriends,
  FaBuilding,
  FaChartBar,
  FaBox,
  FaClipboardList,
  FaSignOutAlt,
  FaUser,
} from 'react-icons/fa';
import { IoNotifications } from 'react-icons/io5';
import Logo from '../../../../assets/logo.png';
import useAuth from '../../../authentication/services/AuthService';
import Loader from '../../../../shared/Loader';
import { useUserContext } from '../../../../context/UserContext';

type SideBarProps = {
  setActiveComponent: React.Dispatch<React.SetStateAction<string>>;
};

const SideBar: React.FC<SideBarProps> = ({ setActiveComponent }) => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const { user } = useUserContext();

  const handleItemClick = (item: string) => {
    setActiveItem(item);
    setActiveComponent(item);
  };

  const { logout, loggingOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', icon: FaHome, label: 'Dashboard' },
    { id: 'branches', icon: FaBuilding, label: 'Branches' },
    { id: 'cashiers', icon: FaUserFriends, label: 'Employees' },
    { id: 'summary', icon: FaChartBar, label: 'Reports' },
    { id: 'orders', icon: FaBox, label: 'Orders' },
    { id: 'items', icon: FaClipboardList, label: 'Inventory' },
  ];

  return (
    <nav className='bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm'>
      <div className='px-6 py-3'>
        <div className='flex items-center justify-between'>
          {/* Logo & Brand */}
          <div className='flex items-center space-x-3'>
            <img src={Logo} alt='LifePill Logo' className='h-12 w-12' />
            <div>
              <h1 className='text-xl font-bold text-gray-900'>LifePill</h1>
              <p className='text-xs text-gray-500'>Management Portal</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className='flex items-center space-x-1'>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className='text-lg' />
                  <span className='whitespace-nowrap'>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Section - User & Actions */}
          <div className='flex items-center space-x-4'>
            {/* Notifications */}
            <button className='relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200'>
              <IoNotifications className='text-xl' />
              <span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full'></span>
            </button>

            {/* User Profile */}
            <div className='flex items-center space-x-3 pl-4 border-l border-gray-200'>
              <div className='text-right'>
                <p className='text-sm font-semibold text-gray-900'>
                  {user?.employerFirstName} {user?.employerLastName}
                </p>
                <p className='text-xs text-gray-500 capitalize'>{user?.role}</p>
              </div>
              <div className='w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold shadow-md'>
                {user?.employerFirstName?.charAt(0)}
                {user?.employerLastName?.charAt(0)}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              disabled={loggingOut}
              className='flex items-center space-x-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loggingOut ? (
                <div className='w-5 h-5'>
                  <svg
                    className='animate-spin h-5 w-5'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                </div>
              ) : (
                <FaSignOutAlt />
              )}
              <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SideBar;
