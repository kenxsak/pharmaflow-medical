import React, { Dispatch } from 'react';
import { AiFillHome } from 'react-icons/ai';
import { BiBarChartAlt2, BiTimeFive } from 'react-icons/bi';
import { PiPillLight } from 'react-icons/pi';
import ButtonWithIconAndTextVertical from '../../../../shared/buttons/ButtonWithIconAndTextVertical';
import { RiLogoutCircleLine } from 'react-icons/ri';
import useAuthService from '../../services/AuthService';
import { LuBoxes, LuUsers, LuShieldCheck, LuReceipt, LuClipboardList, LuBookOpen } from 'react-icons/lu';

type Props = {
  //pass setactivetable
  setActiveTable: Dispatch<string>;
  activeTable: string;
};

const CashierSideBar = (props: Props) => {
  const { logOutCashier, logging, temporaryLogOutCashier, temporayLogout } =
    useAuthService();
  return (
    <div className='legacy-sidebar-scroll left-0 h-full min-h-0 w-[88px] shrink-0 overflow-y-auto overflow-x-hidden border-r border-gray-200 bg-gradient-to-b from-gray-50 to-white px-2 py-2 font-poppins shadow-sm'>
      <div className='flex flex-col gap-0.5'>
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
        icon={<LuBookOpen size={25} />}
        text='Help'
        onClick={() => props.setActiveTable('help')}
        testid='help'
        isActive={props.activeTable === 'help'}
        compact
      />
      </div>

      <div className='mt-2 border-t border-gray-200 pt-2'>
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
