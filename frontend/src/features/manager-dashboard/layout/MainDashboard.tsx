import { useEffect, useState } from 'react';
import ManagerNavbar from '../components/navbar/ManagerNavbar';
import ManagerSidebar from '../components/sidebar/ManagerSidebar';
import Dashboard from '../components/main/Dashboard';
import CashierManagementWindow from '../components/cashiers/CashierManagementWindow';
import SalesManagementWindow from '../components/sales/SalesManagementWindow';
import ItemsManagementWindow from '../components/items/ItemsManagementWindow';
import { useParams } from 'react-router-dom';
import SellerManagementWindow from '../components/seller/SellerManagementWindow';
import OrderManagementWindow from '../../order-management/layouts/OrderManagementWindow';
import POSBilling from '../../../pages/billing/POSBilling';
import BillingAuditDashboard from '../../../pages/billing/BillingAuditDashboard';
import CustomersDashboard from '../../../pages/customers/CustomersDashboard';
import InventoryDashboard from '../../../pages/inventory/InventoryDashboard';
import ProcurementDashboard from '../../../pages/procurement/ProcurementDashboard';
import ComplianceDashboard from '../../../pages/compliance/ComplianceDashboard';
import StoreOperationsDashboard from '../../../pages/stores/StoreOperationsDashboard';
import PharmaFlowCommandCenter from '../../../pages/pharmaflow/PharmaFlowCommandCenter';
import PharmaFlowHelpCenter from '../../../pages/pharmaflow/PharmaFlowHelpCenter';
import SaaSControlCenter from '../../../pages/pharmaflow/SaaSControlCenter';
import UsersAccessDashboard from '../../../pages/pharmaflow/UsersAccessDashboard';
import EnterpriseReadinessDashboard from '../../../pages/pharmaflow/EnterpriseReadinessDashboard';
import LegacyReportsWorkspace, {
  LegacyReportsTab,
} from '../../../shared/legacy/LegacyReportsWorkspace';

const MainDashboard = () => {
  const { item } = useParams();
  const [selectedItem, setSelectedItem] = useState<String>(item || 'Dashboard');

  useEffect(() => {
    setSelectedItem(item || 'Dashboard');
  }, [item]);

  const handleItemClick = (itemName: String) => {
    setSelectedItem(itemName);
  };

  const renderSelectedItem = () => {
    if (selectedItem.toString().startsWith('Reports')) {
      const reportTab: LegacyReportsTab =
        selectedItem === 'Reports:Profit'
          ? 'profit'
          : selectedItem === 'Reports:Expiry'
          ? 'expiry'
          : 'gst';

      return <LegacyReportsWorkspace initialTab={reportTab} />;
    }

    switch (selectedItem) {
      case 'Dashboard':
        return (
          <Dashboard
            onNavigateToOrders={() => setSelectedItem('Orders')}
            onOpenWorkspace={(workspaceKey) => setSelectedItem(workspaceKey)}
          />
        );
      case 'Billing':
        return <POSBilling embedded />;
      case 'Bills':
        return <BillingAuditDashboard embedded />;
      case 'Customers':
        return <CustomersDashboard embedded />;
      case 'Inventory':
        return <InventoryDashboard embedded />;
      case 'Purchases':
        return <ProcurementDashboard embedded />;
      case 'Compliance':
        return <ComplianceDashboard embedded />;
      case 'Stores':
        return <StoreOperationsDashboard embedded />;
      case 'Platform':
        return <SaaSControlCenter embedded />;
      case 'Users':
        return <UsersAccessDashboard embedded />;
      case 'Help':
        return <PharmaFlowHelpCenter embedded />;
      case 'Enterprise':
        return <EnterpriseReadinessDashboard embedded />;
      case 'Setup':
        return <PharmaFlowCommandCenter embedded />;
      case 'Cashiers':
        return <CashierManagementWindow />;
      case 'Branches':
        return <SellerManagementWindow />;
      case 'Summary':
        return <SalesManagementWindow />;
      case 'Items':
        return <ItemsManagementWindow />;
      case 'Legacy Sales':
        return <SalesManagementWindow />;
      case 'Orders':
        return <OrderManagementWindow />;
      default:
        return (
          <Dashboard
            onNavigateToOrders={() => setSelectedItem('Orders')}
            onOpenWorkspace={(workspaceKey) => setSelectedItem(workspaceKey)}
          />
        );
    }
  };

  return (
    <div className='flex h-screen w-full flex-col overflow-hidden'>
      <ManagerNavbar title={selectedItem as string} />
      <div className='flex min-h-0 flex-1 flex-row'>
        <ManagerSidebar onItemClick={handleItemClick} selectedItem={selectedItem as string} />
        <div className='min-h-0 min-w-0 flex-1 overflow-y-auto p-4 font-poppins'>
          {renderSelectedItem()}
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
