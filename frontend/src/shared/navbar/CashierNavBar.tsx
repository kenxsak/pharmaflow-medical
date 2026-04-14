import DateAndTimeNavBar from '../clock/DateAndTimeNavBar';
import { PiDeviceMobileSpeakerThin } from 'react-icons/pi';
import ProfileNameCard from '../cashier_profile/ProfileNameCard';
import Divider from '../divider/Divider';
import { useState } from 'react';
import OrderCardComponent from '../../features/cashier-dashboard/components/order-card/OrderCardComponent';
import { useWebSocket } from '../../features/cashier-dashboard/context/WebSocketContext';
import { useUserContext } from '../../context/UserContext';
import { supportsLegacyRealtime } from '../../utils/legacySession';
const Logo = require('../../assets/logo/logo.png');

interface CashierNavBarProps {
  title?: string;
}

const CashierNavBar = ({ title = 'Easy Pharmacy Home' }: CashierNavBarProps) => {
  const [showOnlineOrders, setShowOnlineOrders] = useState(false);
  const { prescriptions } = useWebSocket();
  const { user } = useUserContext();
  const realtimeEnabled = supportsLegacyRealtime(user);

  const handleShowOnlineOrders = () => {
    setShowOnlineOrders(!showOnlineOrders);
  };
  return (
    <div className='flex items-center justify-between w-full p-2 font-poppins shadow-md'>
      {/* Logo */}
      <div className='flex items-center gap-3'>
        <img src={Logo} alt='Logo' width={60} height={60} className='ml-4' />
        <div>
          <h2 className='text-lg font-semibold text-slate-900'>{title}</h2>
          <p className='text-xs text-slate-500'>Simple legacy workspace</p>
        </div>
      </div>

      {/* Date and time */}
      <DateAndTimeNavBar />

      {realtimeEnabled ? (
      <div className='relative'>
        <button
          type='button'
          className='bg-blue-600 text-white hover:bg-blue-700 
          focus:outline-none rounded-lg px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-400 
          transition duration-300 shadow-md hover:shadow-lg transform hover:scale-105'
          onClick={handleShowOnlineOrders}
        >
          <div className='flex items-center justify-center gap-2'>
            <PiDeviceMobileSpeakerThin size={22} />
            <span>Online Orders</span>
          </div>
        </button>
        {prescriptions.length > 0 && (
          <span className='absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center'>
            {prescriptions.length > 99 ? '99+' : prescriptions.length}
          </span>
        )}
      </div>
      ) : (
      <div className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500'>
        Online prescriptions available on branch legacy accounts
      </div>
      )}

      <Divider />

      {/* Cashier name,number and profile picture */}
      <ProfileNameCard />

      {showOnlineOrders && (
        <OrderCardComponent onClose={handleShowOnlineOrders} />
      )}
    </div>
  );
};

export default CashierNavBar;
