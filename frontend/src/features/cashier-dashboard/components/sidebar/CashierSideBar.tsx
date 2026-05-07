import React, { Dispatch } from 'react';
import { AiFillHome } from 'react-icons/ai';
import { BiBarChartAlt2, BiTimeFive } from 'react-icons/bi';
import { PiPillLight } from 'react-icons/pi';
import ButtonWithIconAndTextVertical from '../../../../shared/buttons/ButtonWithIconAndTextVertical';
import { RiLogoutCircleLine } from 'react-icons/ri';
import useAuthService from '../../services/AuthService';
import { LuBoxes, LuUsers, LuShieldCheck, LuReceipt, LuClipboardList, LuTruck } from 'react-icons/lu';

type Props = {
  //pass setactivetable
  setActiveTable: Dispatch<string>;
  activeTable: string;
};

const CashierSideBar = (props: Props) => {
  const { logOutCashier, logging, temporaryLogOutCashier, temporayLogout } =
    useAuthService();
  return (
    <div className='legacy-sidebar-scroll left-0 h-auto min-h-0 w-full shrink-0 overflow-x-auto overflow-y-hidden border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-2 py-2 font-poppins shadow-sm md:h-full md:w-[88px] md:overflow-x-hidden md:overflow-y-auto md:border-b-0 md:border-r md:bg-gradient-to-b'>
      <div className='flex min-w-max flex-row gap-0.5 md:min-w-0 md:flex-col'>
      <ButtonWithIconAndTextVertical
        icon={<AiFillHome size={25} />}
        text='Home'
        onClick={() => props.setActiveTable('home')}
        testid='pharmacy-hub'
        isActive={props.activeTable === 'home'}
        compact
      />
      <ButtonWithIconAndTextVertical
        icon={<PiPillLight size={25} />}
        text='Billing'
        onClick={() => props.setActiveTable('billing')}
        testid='billing'
        isActive={props.activeTable === 'billing'}
        compact
      />
      <ButtonWithIconAndTextVertical
        icon={<LuReceipt size={25} />}
        text='Bills'
        onClick={() => props.setActiveTable('bills')}
        testid='bills'
        isActive={props.activeTable === 'bills'}
        compact
      />
      <ButtonWithIconAndTextVertical
        icon={<LuUsers size={25} />}
        text='Customers'
        onClick={() => props.setActiveTable('customers')}
        testid='customers'
        isActive={props.activeTable === 'customers'}
        compact
      />
      <ButtonWithIconAndTextVertical
        icon={<LuBoxes size={25} />}
        text='Stock'
        onClick={() => props.setActiveTable('inventory')}
        testid='inventory'
        isActive={props.activeTable === 'inventory'}
        compact
      />
      <ButtonWithIconAndTextVertical
        icon={<LuClipboardList size={25} />}
        text='Purchases'
        onClick={() => props.setActiveTable('purchases')}
        testid='purchases'
        isActive={props.activeTable === 'purchases'}
        compact
      />
      <ButtonWithIconAndTextVertical
        icon={<LuShieldCheck size={25} />}
        text='Compliance'
        onClick={() => props.setActiveTable('compliance')}
        testid='compliance'
        isActive={props.activeTable === 'compliance'}
        compact
      />
      <ButtonWithIconAndTextVertical
        icon={<BiBarChartAlt2 size={25} />}
        text='Reports'
        onClick={() => props.setActiveTable('reports')}
        testid='reports'
        isActive={props.activeTable.startsWith('reports')}
        compact
      />
      <ButtonWithIconAndTextVertical
        icon={<LuTruck size={25} />}
        text='Delivery'
        onClick={() => props.setActiveTable('delivery')}
        testid='delivery'
        isActive={props.activeTable === 'delivery'}
        compact
      />
      </div>

      <div className='mt-0 flex min-w-max flex-row gap-0.5 border-l border-gray-200 pl-2 md:mt-2 md:min-w-0 md:flex-col md:border-l-0 md:border-t md:pl-0 md:pt-2'>
        <ButtonWithIconAndTextVertical
          icon={<BiTimeFive size={25} />}
          text={temporayLogout ? 'Wait ...' : 'Temporary Logout'}
          onClick={temporaryLogOutCashier}
          testid='test'
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<RiLogoutCircleLine size={25} />}
          text={logging ? 'Wait ...' : 'Logout'}
          onClick={logOutCashier}
          testid='testtemporary'
          compact
        />
      </div>
    </div>
  );
};

export default CashierSideBar;
