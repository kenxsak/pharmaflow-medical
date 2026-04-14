import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import PharmaFlowHelpCenter from './pages/pharmaflow/PharmaFlowHelpCenter';
import PharmaFlowLegacyHome from './pages/pharmaflow/PharmaFlowLegacyHome';
import EnterpriseReadinessDashboard from './pages/pharmaflow/EnterpriseReadinessDashboard';
import SaaSControlCenter from './pages/pharmaflow/SaaSControlCenter';
import UsersAccessDashboard from './pages/pharmaflow/UsersAccessDashboard';
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
import {
  canAccessCompanyControls,
  canAccessPlatformControls,
  getPharmaFlowHomePath,
  getPharmaFlowPersona,
  usePharmaFlowContext,
} from './utils/pharmaflowContext';

function RedirectLegacyPharmaFlowRoute() {
  const location = useLocation();
  const nextPath =
    location.pathname === '/pharmaflow'
      ? '/lifepill'
      : location.pathname.replace(/^\/pharmaflow/, '/lifepill');

  return <Navigate to={`${nextPath}${location.search}`} replace />;
}

function App() {
  const { user } = useUserContext();
  const pharmaFlowContext = usePharmaFlowContext();
  const pharmaFlowPersona = getPharmaFlowPersona(pharmaFlowContext);
  const pharmaFlowHomePath = getPharmaFlowHomePath(pharmaFlowContext);
  const isAdmin =
    user?.role === 'OWNER' ||
    pharmaFlowPersona === 'saas-admin' ||
    pharmaFlowPersona === 'company-admin';
  const canOpenCompanyControls = user?.role === 'OWNER' || canAccessCompanyControls(pharmaFlowContext);
  const canOpenPlatformControls = canAccessPlatformControls(pharmaFlowContext);
  const companyControlsFallback =
    pharmaFlowPersona === 'store-ops' ? '/lifepill/help' : '/legacy-login';
  const platformControlsFallback =
    pharmaFlowPersona === 'company-admin'
      ? '/lifepill/users'
      : pharmaFlowPersona === 'store-ops'
        ? '/lifepill/help'
        : '/legacy-login';

  return (
    <Router>
      <Routes>
        <Route path='/' element={<Navigate to='/legacy-login' replace />} />
        <Route path='/lifepill' element={<PharmaFlowEntry />} />
        <Route path='/lifepill/legacy-home' element={<PharmaFlowLegacyHome />} />
        <Route
          path='/lifepill/setup'
          element={
            canOpenCompanyControls ? (
              <PharmaFlowCommandCenter />
            ) : (
              <Navigate to={companyControlsFallback} replace />
            )
          }
        />
        <Route path='/lifepill/help' element={<PharmaFlowHelpCenter />} />
        <Route
          path='/lifepill/enterprise'
          element={
            canOpenCompanyControls ? (
              <EnterpriseReadinessDashboard />
            ) : (
              <Navigate to={companyControlsFallback} replace />
            )
          }
        />
        <Route
          path='/lifepill/platform'
          element={
            canOpenPlatformControls ? (
              <SaaSControlCenter />
            ) : (
              <Navigate to={platformControlsFallback} replace />
            )
          }
        />
        <Route
          path='/lifepill/users'
          element={
            canOpenCompanyControls ? (
              <UsersAccessDashboard />
            ) : (
              <Navigate to={companyControlsFallback} replace />
            )
          }
        />
        <Route path='/lifepill/dashboard' element={<Navigate to='/lifepill' replace />} />
        <Route path='/lifepill/home' element={<Navigate to='/lifepill/legacy-home' replace />} />
        <Route path='/lifepill/launchpad' element={<Navigate to='/legacy-login' replace />} />
        <Route path='/lifepill/operations' element={<Navigate to='/lifepill/billing' replace />} />
        <Route path='/lifepill/stock' element={<Navigate to='/lifepill/inventory' replace />} />
        <Route path='/lifepill/reports' element={<Navigate to='/lifepill/reports/gst' replace />} />
        <Route path='/lifepill/expiry' element={<Navigate to='/lifepill/reports/expiry-alerts' replace />} />
        <Route path='/lifepill/procurement' element={<ProcurementDashboard />} />
        <Route path='/lifepill/billing-history' element={<BillingAuditDashboard />} />
        <Route path='/lifepill/inventory' element={<InventoryDashboard />} />
        <Route
          path='/lifepill/stores'
          element={
            canOpenCompanyControls ? (
              <StoreOperationsDashboard />
            ) : (
              <Navigate to={companyControlsFallback} replace />
            )
          }
        />
        <Route path='/lifepill/customers' element={<CustomersDashboard />} />
        <Route path='/legacy-login' element={<LogInPage />} />
        <Route
          path='/login-cashier-password'
          element={<LogInCashierPasswordPage />}
        />
        <Route
          path='/temporary-logout'
          element={<CashierTemporaryLogOutPage />}
        />
        <Route path='/lifepill/billing' element={<POSBilling />} />
        <Route path='/lifepill/compliance' element={<ComplianceDashboard />} />
        <Route path='/lifepill/reports/gst' element={<GSTReportsDashboard />} />
        <Route path='/lifepill/reports/profit' element={<ProfitAnalyticsDashboard />} />
        <Route
          path='/lifepill/reports/expiry-alerts'
          element={<ExpiryAlertsDashboard />}
        />
        <Route path='/pharmaflow/*' element={<RedirectLegacyPharmaFlowRoute />} />

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
        <Route
          path='/*'
          element={pharmaFlowPersona !== 'guest' ? <Navigate to={pharmaFlowHomePath} replace /> : <ErrorRoutePage />}
        />
      </Routes>
    </Router>
  );
}

export default App;
