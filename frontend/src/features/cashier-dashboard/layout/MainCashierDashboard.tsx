import React, { useState } from 'react';
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
import PharmaFlowHelpCenter from '../../../pages/pharmaflow/PharmaFlowHelpCenter';
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

export const usePaymentContext = () => {
  const context = React.useContext(PaymentContext);
  if (!context) {
    throw new Error('usePaymentContext must be used within a PaymentProvider');
  }
  return context;
};

const MainCashierDashboard = () => {
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

  const [activeTable, setActiveTable] = useState('home');

  const openCashierWorkspace = (workspaceKey: string) => {
    switch (workspaceKey) {
      case 'Billing':
        setActiveTable('billing');
        break;
      case 'Bills':
        setActiveTable('bills');
        break;
      case 'Customers':
        setActiveTable('customers');
        break;
      case 'Inventory':
        setActiveTable('inventory');
        break;
      case 'Purchases':
        setActiveTable('purchases');
        break;
      case 'Compliance':
        setActiveTable('compliance');
        break;
      case 'Reports':
        setActiveTable('reports');
        break;
      case 'Reports:Profit':
        setActiveTable('reports:profit');
        break;
      case 'Reports:Expiry':
        setActiveTable('reports:expiry');
        break;
      case 'Help':
        setActiveTable('help');
        break;
      default:
        setActiveTable('home');
        break;
    }
  };

  const activeTitle =
    activeTable === 'home'
      ? 'Easy Pharmacy Home'
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
      : activeTable === 'reports:profit'
      ? 'Profit Reports'
      : activeTable === 'reports:expiry'
      ? 'Expiry Reports'
      : activeTable === 'reports'
      ? 'Reports'
      : activeTable === 'help'
      ? 'Help and FAQ'
      : activeTable.charAt(0).toUpperCase() + activeTable.slice(1);

  return (
    <WebSocketProvider>
      <div className='flex h-screen min-h-0 flex-col overflow-hidden'>
        <div>
          <CashierNavBar title={activeTitle} />
        </div>

        <div className='flex min-h-0 flex-1 flex-row'>
          <CashierSideBar setActiveTable={setActiveTable} activeTable={activeTable} />
          <Divider />
          <PaymentContext.Provider value={contextValue}>
            {activeTable === 'home' && (
              <div className='min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100 p-6'>
                <LegacyFeatureHub
                  title='Easy Pharmacy Home'
                  description='Use this simple home screen to open billing, stock, compliance, customers, reports, and branch controls without learning the newer workspace.'
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
            {activeTable === 'help' && (
              <div className='min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100 p-6'>
                <PharmaFlowHelpCenter embedded />
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
              'reports',
              'reports:profit',
              'reports:expiry',
              'help',
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
