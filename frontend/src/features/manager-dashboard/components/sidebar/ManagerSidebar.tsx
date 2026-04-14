import ButtonWithIconAndTextVertical from '../../../../shared/buttons/ButtonWithIconAndTextVertical';
import { MdOutlineManageSearch } from 'react-icons/md';
import { FaRegKeyboard } from 'react-icons/fa';
import { BiBarChartAlt2 } from 'react-icons/bi';
import { RxDashboard } from 'react-icons/rx';
import { AiOutlineBranches } from 'react-icons/ai';
import { RiLogoutCircleLine } from 'react-icons/ri';
import { LuShoppingCart, LuBoxes, LuShieldCheck, LuBuilding2, LuSettings2, LuReceipt, LuUsers, LuBookOpen } from 'react-icons/lu';
import useAuthService from '../../services/AuthService';

type Props = {
  onItemClick: (itemName: string) => void;
  selectedItem: string;
};

const ManagerSidebar = ({ onItemClick, selectedItem }: Props) => {
  const { logOut, logging } = useAuthService();
  return (
    <div
      className='legacy-sidebar-scroll left-0 h-full min-h-0 w-[88px] shrink-0 overflow-y-auto overflow-x-hidden border-r border-gray-200 bg-gradient-to-b from-gray-50 to-white px-2 py-2 font-poppins shadow-sm'
      data-testid='cypress-manager-sidebar'
    >
      {/* Navigation Items */}
      <div className='flex flex-col gap-0.5'>
        <ButtonWithIconAndTextVertical
          icon={<RxDashboard size={24} />}
          text='Dashboard'
          onClick={() => onItemClick('Dashboard')}
          testid='dashboard'
          isActive={selectedItem === 'Dashboard'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuShoppingCart size={24} />}
          text='Billing'
          onClick={() => onItemClick('Billing')}
          testid='billing'
          isActive={selectedItem === 'Billing'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuReceipt size={24} />}
          text='Bills'
          onClick={() => onItemClick('Bills')}
          testid='bills'
          isActive={selectedItem === 'Bills'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuUsers size={24} />}
          text='Customers'
          onClick={() => onItemClick('Customers')}
          testid='customers'
          isActive={selectedItem === 'Customers'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuBoxes size={24} />}
          text='Inventory'
          onClick={() => onItemClick('Inventory')}
          testid='inventory'
          isActive={selectedItem === 'Inventory'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<MdOutlineManageSearch size={24} />}
          text='Purchases'
          onClick={() => onItemClick('Purchases')}
          testid='purchases'
          isActive={selectedItem === 'Purchases'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuShieldCheck size={24} />}
          text='Compliance'
          onClick={() => onItemClick('Compliance')}
          testid='compliance'
          isActive={selectedItem === 'Compliance'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<BiBarChartAlt2 size={24} />}
          text='Reports'
          onClick={() => onItemClick('Reports')}
          testid='reports'
          isActive={selectedItem.startsWith('Reports')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<AiOutlineBranches size={24} />}
          text='Stores'
          onClick={() => onItemClick('Stores')}
          testid='stores'
          isActive={selectedItem === 'Stores'}
          compact
        />
        {localStorage.getItem('pharmaflow_platform_owner') === 'true' && (
          <ButtonWithIconAndTextVertical
            icon={<LuBuilding2 size={24} />}
            text='Platform'
            onClick={() => onItemClick('Platform')}
            testid='platform'
            isActive={selectedItem === 'Platform'}
            compact
          />
        )}
        <ButtonWithIconAndTextVertical
          icon={<LuUsers size={24} />}
          text='Users'
          onClick={() => onItemClick('Users')}
          testid='users'
          isActive={selectedItem === 'Users'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuBookOpen size={24} />}
          text='Rollout'
          onClick={() => onItemClick('Enterprise')}
          testid='enterprise'
          isActive={selectedItem === 'Enterprise'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuBookOpen size={24} />}
          text='Help'
          onClick={() => onItemClick('Help')}
          testid='help'
          isActive={selectedItem === 'Help'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<FaRegKeyboard size={24} />}
          text='Cashiers'
          onClick={() => onItemClick('Cashiers')}
          testid='cashiers'
          isActive={selectedItem === 'Cashiers'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<MdOutlineManageSearch size={24} />}
          text='Items'
          onClick={() => onItemClick('Items')}
          testid='items'
          isActive={selectedItem === 'Items'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<AiOutlineBranches size={24} />}
          text='Suppliers'
          onClick={() => onItemClick('Branches')}
          testid='branches'
          isActive={selectedItem === 'Branches'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuShoppingCart size={24} />}
          text='Orders'
          onClick={() => onItemClick('Orders')}
          testid='orders'
          isActive={selectedItem === 'Orders'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<BiBarChartAlt2 size={24} />}
          text='Sales View'
          onClick={() => onItemClick('Summary')}
          testid='summary'
          isActive={selectedItem === 'Summary'}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuSettings2 size={24} />}
          text='Setup'
          onClick={() => onItemClick('Setup')}
          testid='setup'
          isActive={selectedItem === 'Setup'}
          compact
        />
      </div>
      
      {/* Logout Button - Fixed at bottom */}
      <div className='mt-2 border-t border-gray-200 pt-2'>
        <ButtonWithIconAndTextVertical
          icon={<RiLogoutCircleLine size={24} />}
          text={logging ? 'Logging...' : 'Logout'}
          onClick={logOut}
          testid='logout'
          isActive={false}
          compact
        />
      </div>
    </div>
  );
};

export default ManagerSidebar;
