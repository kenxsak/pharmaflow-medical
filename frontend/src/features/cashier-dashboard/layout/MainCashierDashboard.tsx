import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Divider from '../../../shared/divider/Divider';
import CashierNavBar from '../../../shared/navbar/CashierNavBar';
import OrderDetailsSideBar from '../components/cashier_dashboard_order_details_sidebar/OrderDetailsSideBar';
import PaymentDrawer from '../components/cashier_dashboard_payement_sidebar/PaymentDrawer';
import ConfirmPaymentPopUp from '../components/cashier_dashboard_payment_confirm_popup/ConfirmPaymentPopUp';
import CashierSideBar from '../components/sidebar/CashierSideBar';
import { OrderedMedicine } from '../interfaces/OrderMedicine';
import { PaymentContextType } from '../interfaces/PaymentContextType';
import { PaymentDetails } from '../interfaces/PaymentDetails';
import { IMedicine } from '../../../interfaces/IMedicine';
import LegacyFeatureHub from '../../../shared/legacy/LegacyFeatureHub';
import POSBilling from '../../../pages/billing/POSBilling';
import BillingAuditDashboard from '../../../pages/billing/BillingAuditDashboard';
import CustomersDashboard from '../../../pages/customers/CustomersDashboard';
import InventoryDashboard from '../../../pages/inventory/InventoryDashboard';
import DeliveryTrackingDashboard from '../../../pages/delivery/DeliveryTrackingDashboard';
import ComplianceDashboard from '../../../pages/compliance/ComplianceDashboard';
import ProcurementDashboard from '../../../pages/procurement/ProcurementDashboard';
import LegacyReportsWorkspace, {
  LegacyReportsTab,
} from '../../../shared/legacy/LegacyReportsWorkspace';
import { WebSocketProvider } from '../context/WebSocketContext';

export enum ComponentState {
  OrderDetails,
  ConfirmPayment,
  PopupPayment,
}

const PaymentContext = React.createContext<PaymentContextType | undefined>(
  undefined
);

const cashierWorkspacePath: Record<string, string> = {
  home: '/cashier-dashboard',
  billing: '/cashier-dashboard/billing',
  bills: '/cashier-dashboard/bills',
  customers: '/cashier-dashboard/customers',
  inventory: '/cashier-dashboard/inventory',
  purchases: '/cashier-dashboard/purchases',
  compliance: '/cashier-dashboard/compliance',
  delivery: '/cashier-dashboard/delivery',
  reports: '/cashier-dashboard/reports',
  'reports:profit': '/cashier-dashboard/reports/profit',
  'reports:expiry': '/cashier-dashboard/reports/expiry',
};

const resolveCashierWorkspaceFromPath = (pathname: string) => {
  const nestedPath = pathname.replace(/^\/cashier-dashboard\/?/, '').replace(/^\/+|\/+$/g, '');

  switch (nestedPath) {
    case '':
      return 'home';
    case 'billing':
      return 'billing';
    case 'bills':
      return 'bills';
    case 'customers':
      return 'customers';
    case 'inventory':
      return 'inventory';
    case 'purchases':
      return 'purchases';
    case 'compliance':
      return 'compliance';
    case 'delivery':
      return 'delivery';
    case 'reports':
      return 'reports';
    case 'reports/profit':
      return 'reports:profit';
    case 'reports/expiry':
      return 'reports:expiry';
    default:
      return 'home';
  }
};

export const usePaymentContext = () => {
  const context = React.useContext(PaymentContext);
  if (!context) {
    throw new Error('usePaymentContext must be used within a PaymentProvider');
  }
  return context;
};

const MainCashierDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentComponent, setCurrentComponent] = useState(
    ComponentState.OrderDetails
  );

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    paymentMethod: '',
    paymentAmount: 0,
    paymentDate: new Date(),
    paymentNotes: '',
    paymentDiscount: 0,
    paidAmount: 0,
    customerEmail: '',
    customerName: '',
  });

  const [orderedMedicine, setOrderedMedicine] = useState<OrderedMedicine[]>([]);

  const [medicine, setMedicine] = useState<IMedicine[]>([]);

  const [filteredMedicine, setFilteredMedicine] = useState<IMedicine[]>([]);

  const contextValue: PaymentContextType = {
    currentComponent,
    setCurrentComponent,
    paymentDetails,
    setPaymentDetails,
    orderedMedicine,
    setOrderedMedicine,
    medicine,
    setMedicine,
    filteredMedicine,
    setFilteredMedicine,
  };

  const renderComponent = () => {
    switch (currentComponent) {
      case ComponentState.OrderDetails:
        return <OrderDetailsSideBar />;
      case ComponentState.ConfirmPayment:
        return <PaymentDrawer />;
      case ComponentState.PopupPayment:
        return <ConfirmPaymentPopUp />;
      default:
        return <OrderDetailsSideBar />;
    }
  };

  const [activeTable, setActiveTable] = useState(() =>
    resolveCashierWorkspaceFromPath(location.pathname)
  );

  React.useEffect(() => {
    setActiveTable(resolveCashierWorkspaceFromPath(location.pathname));
  }, [location.pathname]);

  const setActiveWorkspace = (workspace: string) => {
    setActiveTable(workspace);
    navigate(cashierWorkspacePath[workspace] || cashierWorkspacePath.home);
  };

  const openCashierWorkspace = (workspaceKey: string) => {
    switch (workspaceKey) {
      case 'Billing':
        setActiveWorkspace('billing');
        break;
      case 'Bills':
        setActiveWorkspace('bills');
        break;
      case 'Customers':
        setActiveWorkspace('customers');
        break;
      case 'Inventory':
        setActiveWorkspace('inventory');
        break;
      case 'Purchases':
        setActiveWorkspace('purchases');
        break;
      case 'Compliance':
        setActiveWorkspace('compliance');
        break;
      case 'Delivery':
        setActiveWorkspace('delivery');
        break;
      case 'Reports':
        setActiveWorkspace('reports');
        break;
      case 'Reports:Profit':
        setActiveWorkspace('reports:profit');
        break;
      case 'Reports:Expiry':
        setActiveWorkspace('reports:expiry');
        break;
      case 'Help':
        setActiveWorkspace('help');
        break;
      default:
        setActiveWorkspace('home');
        break;
    }
  };

  const activeTitle =
    activeTable === 'home'
      ? 'MedInOne Dashboard'
      : activeTable === 'billing'
      ? 'Billing Counter'
      : activeTable === 'bills'
      ? 'Bill History'
      : activeTable === 'customers'
      ? 'Customers'
      : activeTable === 'inventory'
      ? 'Stock Control'
      : activeTable === 'purchases'
      ? 'Purchases'
      : activeTable === 'compliance'
      ? 'Compliance'
      : activeTable === 'delivery'
      ? 'Online & Delivery'
      : activeTable === 'reports:profit'
      ? 'Profit Reports'
      : activeTable === 'reports:expiry'
      ? 'Expiry Reports'
      : activeTable === 'reports'
      ? 'Reports'
      : activeTable.charAt(0).toUpperCase() + activeTable.slice(1);

  return (
    <WebSocketProvider>
      <div className='flex h-screen min-h-0 flex-col overflow-hidden'>
        <div>
          <CashierNavBar title={activeTitle} />
        </div>

        <div className='flex min-h-0 flex-1 flex-col md:flex-row'>
          <CashierSideBar setActiveTable={setActiveWorkspace} activeTable={activeTable} />
          <div className='hidden md:block'>
            <Divider />
          </div>
          <PaymentContext.Provider value={contextValue}>
            {activeTable === 'home' && (
              <div className='min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100 p-3 md:p-6'>
                <LegacyFeatureHub
                  title='MedInOne Dashboard'
                  description='A focused branch command center for billing, stock, customers, purchases, compliance, delivery, and reporting.'
                  onOpenWorkspace={openCashierWorkspace}
                />
              </div>
            )}
            {activeTable === 'billing' && (
              <div className='min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100 p-6'>
                <POSBilling embedded />
              </div>
            )}
            {activeTable === 'bills' && (
              <div className='min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100 p-6'>
                <BillingAuditDashboard embedded />
              </div>
            )}
            {activeTable === 'customers' && (
              <div className='min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100 p-6'>
                <CustomersDashboard embedded />
              </div>
            )}
            {activeTable === 'inventory' && (
              <div className='min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100 p-6'>
                <InventoryDashboard embedded />
              </div>
            )}
            {activeTable === 'purchases' && (
              <div className='min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100 p-6'>
                <ProcurementDashboard embedded />
              </div>
            )}
            {activeTable === 'compliance' && (
              <div className='min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100 p-6'>
                <ComplianceDashboard embedded />
              </div>
            )}
            {activeTable === 'delivery' && (
              <div className='min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100 p-6'>
                <DeliveryTrackingDashboard embedded />
              </div>
            )}
            {(activeTable === 'reports' ||
              activeTable === 'reports:profit' ||
              activeTable === 'reports:expiry') && (
              <div className='min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100 p-6'>
                <LegacyReportsWorkspace
                  initialTab={
                    activeTable === 'reports:profit'
                      ? ('profit' as LegacyReportsTab)
                      : activeTable === 'reports:expiry'
                      ? ('expiry' as LegacyReportsTab)
                      : ('gst' as LegacyReportsTab)
                  }
                />
              </div>
            )}
            {![
              'home',
              'billing',
              'bills',
              'customers',
              'inventory',
              'purchases',
              'compliance',
              'delivery',
              'reports',
              'reports:profit',
              'reports:expiry',
            ].includes(activeTable) &&
              renderComponent()}
          </PaymentContext.Provider>
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default MainCashierDashboard;
// /
