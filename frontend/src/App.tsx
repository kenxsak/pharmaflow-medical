import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LogInPage from './pages/login-page';
import LogInCashierPasswordPage from './pages/cashier-password-page';
import CashierTemporaryLogOutPage from './pages/temporary-logout-page';
import CashierDashBoardPage from './pages/cashier-dashboard';
import BillingAuditDashboard from './pages/billing/BillingAuditDashboard';
import POSBilling from './pages/billing/POSBilling';
import ComplianceDashboard from './pages/compliance/ComplianceDashboard';
import CustomersDashboard from './pages/customers/CustomersDashboard';
import InventoryDashboard from './pages/inventory/InventoryDashboard';
import PharmaFlowCommandCenter from './pages/pharmaflow/PharmaFlowCommandCenter';
import PharmaFlowEntry from './pages/pharmaflow/PharmaFlowEntry';
import PharmaFlowLegacyHome from './pages/pharmaflow/PharmaFlowLegacyHome';
import EnterpriseReadinessDashboard from './pages/pharmaflow/EnterpriseReadinessDashboard';
import SaaSControlCenter from './pages/pharmaflow/SaaSControlCenter';
import ProcurementDashboard from './pages/procurement/ProcurementDashboard';
import ExpiryAlertsDashboard from './pages/reports/ExpiryAlertsDashboard';
import GSTReportsDashboard from './pages/reports/GSTReportsDashboard';
import ProfitAnalyticsDashboard from './pages/reports/ProfitAnalyticsDashboard';
import StoreOperationsDashboard from './pages/stores/StoreOperationsDashboard';
import {
  AddCashier,
  CashierBankDetails,
  UpdateCashier,
  ViewCashier,
} from './features/cashier-management';
import ErrorRoutePage from './pages/error-route-page';
import { AddItems, UpdateItems } from './features/items-management';
import MainDashboard from './features/manager-dashboard';
import { useUserContext } from './context/UserContext';
import ViewItem from './features/items-management/layout/ViewItem';
import AddCompany from './features/seller-management/layouts/AddCompany';
import UpdateCompany from './features/seller-management/layouts/UpdateCompany';

function App() {
  const { user } = useUserContext();
  const isAdmin = user?.role === 'OWNER'; // Assuming 'OWNER' is the role for admin/owner

  return (
    <Router>
      <Routes>
        <Route path='/' element={<Navigate to='/pharmaflow' replace />} />
        <Route path='/pharmaflow' element={<PharmaFlowEntry />} />
        <Route path='/pharmaflow/legacy-home' element={<PharmaFlowLegacyHome />} />
        <Route path='/pharmaflow/setup' element={<PharmaFlowCommandCenter />} />
        <Route path='/pharmaflow/enterprise' element={<EnterpriseReadinessDashboard />} />
        <Route path='/pharmaflow/platform' element={<SaaSControlCenter />} />
        <Route path='/pharmaflow/dashboard' element={<Navigate to='/pharmaflow' replace />} />
        <Route path='/pharmaflow/home' element={<Navigate to='/pharmaflow/legacy-home' replace />} />
        <Route path='/pharmaflow/launchpad' element={<Navigate to='/pharmaflow/setup' replace />} />
        <Route path='/pharmaflow/operations' element={<Navigate to='/pharmaflow/billing' replace />} />
        <Route path='/pharmaflow/stock' element={<Navigate to='/pharmaflow/inventory' replace />} />
        <Route path='/pharmaflow/reports' element={<Navigate to='/pharmaflow/reports/gst' replace />} />
        <Route path='/pharmaflow/expiry' element={<Navigate to='/pharmaflow/reports/expiry-alerts' replace />} />
        <Route path='/pharmaflow/procurement' element={<ProcurementDashboard />} />
        <Route path='/pharmaflow/billing-history' element={<BillingAuditDashboard />} />
        <Route path='/pharmaflow/inventory' element={<InventoryDashboard />} />
        <Route path='/pharmaflow/stores' element={<StoreOperationsDashboard />} />
        <Route path='/pharmaflow/customers' element={<CustomersDashboard />} />
        <Route path='/legacy-login' element={<LogInPage />} />
        <Route
          path='/login-cashier-password'
          element={<LogInCashierPasswordPage />}
        />
        <Route
          path='/temporary-logout'
          element={<CashierTemporaryLogOutPage />}
        />
        <Route path='/pharmaflow/billing' element={<POSBilling />} />
        <Route path='/pharmaflow/compliance' element={<ComplianceDashboard />} />
        <Route path='/pharmaflow/reports/gst' element={<GSTReportsDashboard />} />
        <Route path='/pharmaflow/reports/profit' element={<ProfitAnalyticsDashboard />} />
        <Route
          path='/pharmaflow/reports/expiry-alerts'
          element={<ExpiryAlertsDashboard />}
        />

        {isAdmin ? (
          <>
            {/* Routes for OWNER */}
            <Route path='/manager-dashboard' element={<Navigate to='/manager-dashboard/Dashboard' replace />} />
            <Route path='/add-cashier' element={<AddCashier />} />
            <Route
              path='/cashier-bank-details'
              element={<CashierBankDetails />}
            />
            <Route
              path='/update-cashier/:employerId'
              element={<UpdateCashier />}
            />
            <Route
              path='/manager-dashboard/:item'
              element={<MainDashboard />}
            />
            <Route path='/view-cashier/:employerId' element={<ViewCashier />} />
            <Route path='/add-items' element={<AddItems />} />
            <Route path='/update-items/:itemId' element={<UpdateItems />} />
            <Route path='/view-item/:itemId' element={<ViewItem />} />
            <Route path='/manager-dashboard/add-company' element={<AddCompany />} />
            <Route path='/manager-dashboard/update-company/:id' element={<UpdateCompany />} />
          </>
        ) : (
          <>
            {/* Routes for CASHIER */}
            <Route
              path='/cashier-dashboard'
              element={<CashierDashBoardPage />}
            />
            {/* Add more routes specific to CASHIER if needed */}
          </>
        )}

        {/* Error route */}
        <Route path='/*' element={<ErrorRoutePage />} />
      </Routes>
    </Router>
  );
}

export default App;
