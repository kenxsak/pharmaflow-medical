import ButtonWithIconAndTextVertical from '../../../../shared/buttons/ButtonWithIconAndTextVertical';
import { MdOutlineManageSearch } from 'react-icons/md';
import { FaRegKeyboard } from 'react-icons/fa';
import { BiBarChartAlt2 } from 'react-icons/bi';
import { RxDashboard } from 'react-icons/rx';
import { AiOutlineBranches } from 'react-icons/ai';
import { RiLogoutCircleLine } from 'react-icons/ri';
import { LuShoppingCart, LuBoxes, LuShieldCheck, LuBuilding2, LuSettings2, LuReceipt, LuUsers, LuBookOpen } from 'react-icons/lu';
import useAuthService from '../../services/AuthService';
import { useUserContext } from '../../../../context/UserContext';
import { normalizeManagerWorkspaceKey } from '../../../../utils/legacySession';

type Props = {
  onItemClick: (itemName: string) => void;
  selectedItem: string;
};

const ManagerSidebar = ({ onItemClick, selectedItem }: Props) => {
  const { logOut, logging } = useAuthService();
  const { user } = useUserContext();
  const resolveItemKey = (itemName: string) =>
    normalizeManagerWorkspaceKey(itemName, user);

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
          onClick={() => onItemClick(resolveItemKey('Dashboard'))}
          testid='dashboard'
          isActive={selectedItem === resolveItemKey('Dashboard')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuShoppingCart size={24} />}
          text='Billing'
          onClick={() => onItemClick(resolveItemKey('Billing'))}
          testid='billing'
          isActive={selectedItem === resolveItemKey('Billing')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuReceipt size={24} />}
          text='Bills'
          onClick={() => onItemClick(resolveItemKey('Bills'))}
          testid='bills'
          isActive={selectedItem === resolveItemKey('Bills')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuUsers size={24} />}
          text='Customers'
          onClick={() => onItemClick(resolveItemKey('Customers'))}
          testid='customers'
          isActive={selectedItem === resolveItemKey('Customers')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuBoxes size={24} />}
          text='Inventory'
          onClick={() => onItemClick(resolveItemKey('Inventory'))}
          testid='inventory'
          isActive={selectedItem === resolveItemKey('Inventory')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<MdOutlineManageSearch size={24} />}
          text='Purchases'
          onClick={() => onItemClick(resolveItemKey('Purchases'))}
          testid='purchases'
          isActive={selectedItem === resolveItemKey('Purchases')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuShieldCheck size={24} />}
          text='Compliance'
          onClick={() => onItemClick(resolveItemKey('Compliance'))}
          testid='compliance'
          isActive={selectedItem === resolveItemKey('Compliance')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<BiBarChartAlt2 size={24} />}
          text='Reports'
          onClick={() => onItemClick(resolveItemKey('Reports'))}
          testid='reports'
          isActive={resolveItemKey(selectedItem).startsWith('Reports')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<AiOutlineBranches size={24} />}
          text='Stores'
          onClick={() => onItemClick(resolveItemKey('Stores'))}
          testid='stores'
          isActive={selectedItem === resolveItemKey('Stores')}
          compact
        />
        {localStorage.getItem('pharmaflow_platform_owner') === 'true' && (
          <ButtonWithIconAndTextVertical
            icon={<LuBuilding2 size={24} />}
            text='Platform'
            onClick={() => onItemClick(resolveItemKey('Platform'))}
            testid='platform'
            isActive={selectedItem === resolveItemKey('Platform')}
            compact
          />
        )}
        <ButtonWithIconAndTextVertical
          icon={<LuUsers size={24} />}
          text='Users'
          onClick={() => onItemClick(resolveItemKey('Users'))}
          testid='users'
          isActive={selectedItem === resolveItemKey('Users')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuBookOpen size={24} />}
          text='Rollout'
          onClick={() => onItemClick(resolveItemKey('Enterprise'))}
          testid='enterprise'
          isActive={selectedItem === resolveItemKey('Enterprise')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuBookOpen size={24} />}
          text='Help'
          onClick={() => onItemClick(resolveItemKey('Help'))}
          testid='help'
          isActive={selectedItem === resolveItemKey('Help')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<FaRegKeyboard size={24} />}
          text='Cashiers'
          onClick={() => onItemClick(resolveItemKey('Cashiers'))}
          testid='cashiers'
          isActive={selectedItem === resolveItemKey('Cashiers')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<MdOutlineManageSearch size={24} />}
          text='Items'
          onClick={() => onItemClick(resolveItemKey('Items'))}
          testid='items'
          isActive={selectedItem === resolveItemKey('Items')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<AiOutlineBranches size={24} />}
          text='Suppliers'
          onClick={() => onItemClick(resolveItemKey('Branches'))}
          testid='branches'
          isActive={selectedItem === resolveItemKey('Branches')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuShoppingCart size={24} />}
          text='Orders'
          onClick={() => onItemClick(resolveItemKey('Orders'))}
          testid='orders'
          isActive={selectedItem === resolveItemKey('Orders')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<BiBarChartAlt2 size={24} />}
          text='Sales View'
          onClick={() => onItemClick(resolveItemKey('Summary'))}
          testid='summary'
          isActive={selectedItem === resolveItemKey('Summary')}
          compact
        />
        <ButtonWithIconAndTextVertical
          icon={<LuSettings2 size={24} />}
          text='Setup'
          onClick={() => onItemClick(resolveItemKey('Setup'))}
          testid='setup'
          isActive={selectedItem === resolveItemKey('Setup')}
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
