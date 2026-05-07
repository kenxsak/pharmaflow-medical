import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LogInPage from './pages/login-page';
import LogInCashierPasswordPage from './pages/cashier-password-page';
import CashierTemporaryLogOutPage from './pages/temporary-logout-page';
import CashierDashBoardPage from './pages/cashier-dashboard';
import BillingAuditDashboard from './pages/billing/BillingAuditDashboard';
import POSBilling from './pages/billing/POSBilling';
import ComplianceDashboard from './pages/compliance/ComplianceDashboard';
import CustomersDashboard from './pages/customers/CustomersDashboard';
import DeliveryTrackingDashboard from './pages/delivery/DeliveryTrackingDashboard';
import InventoryDashboard from './pages/inventory/InventoryDashboard';
import PharmaFlowCommandCenter from './pages/pharmaflow/PharmaFlowCommandCenter';
import PharmaFlowEntry from './pages/pharmaflow/PharmaFlowEntry';
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
  const legacyPrefix = location.pathname.startsWith('/lifepill') ? /^\/lifepill/ : /^\/pharmaflow/;
  const nextPath =
    location.pathname === '/pharmaflow' || location.pathname === '/lifepill'
      ? '/medinone'
      : location.pathname.replace(legacyPrefix, '/medinone');

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
    pharmaFlowPersona === 'store-ops' || pharmaFlowPersona === 'delivery-staff'
      ? pharmaFlowHomePath
      : '/login';
  const platformControlsFallback =
    pharmaFlowPersona === 'company-admin'
      ? '/medinone/users'
      : pharmaFlowPersona === 'store-ops' || pharmaFlowPersona === 'delivery-staff'
        ? pharmaFlowHomePath
        : '/login';

  return (
    <Router>
      <Routes>
        <Route path='/' element={<Navigate to={pharmaFlowHomePath} replace />} />
        <Route path='/login' element={<LogInPage />} />
        <Route path='/legacy-login' element={<Navigate to='/login' replace />} />
        <Route path='/medinone' element={<PharmaFlowEntry />} />
        <Route path='/medinone/home' element={<PharmaFlowLegacyHome />} />
        <Route path='/medinone/legacy-home' element={<Navigate to='/medinone/home' replace />} />
        <Route path='/dashboard' element={<Navigate to={pharmaFlowHomePath} replace />} />
        <Route path='/home' element={<Navigate to={pharmaFlowHomePath} replace />} />
        <Route
          path='/medinone/setup'
          element={
            canOpenCompanyControls ? (
              <PharmaFlowCommandCenter />
            ) : (
              <Navigate to={companyControlsFallback} replace />
            )
          }
        />
        <Route path='/medinone/help' element={<Navigate to={pharmaFlowHomePath} replace />} />
        <Route
          path='/medinone/enterprise'
          element={
            canOpenCompanyControls ? (
              <EnterpriseReadinessDashboard />
            ) : (
              <Navigate to={companyControlsFallback} replace />
            )
          }
        />
        <Route
          path='/medinone/platform'
          element={
            canOpenPlatformControls ? (
              <SaaSControlCenter />
            ) : (
              <Navigate to={platformControlsFallback} replace />
            )
          }
        />
        <Route
          path='/medinone/users'
          element={
            canOpenCompanyControls ? (
              <UsersAccessDashboard />
            ) : (
              <Navigate to={companyControlsFallback} replace />
            )
          }
        />
        <Route path='/medinone/dashboard' element={<Navigate to='/medinone' replace />} />
        <Route path='/medinone/launchpad' element={<Navigate to={pharmaFlowHomePath} replace />} />
        <Route path='/medinone/operations' element={<Navigate to='/medinone/billing' replace />} />
        <Route path='/medinone/stock' element={<Navigate to='/medinone/inventory' replace />} />
        <Route path='/medinone/reports' element={<Navigate to='/medinone/reports/gst' replace />} />
        <Route path='/medinone/expiry' element={<Navigate to='/medinone/reports/expiry-alerts' replace />} />
        <Route path='/medinone/procurement' element={<ProcurementDashboard />} />
        <Route path='/medinone/billing-history' element={<BillingAuditDashboard />} />
        <Route path='/medinone/inventory' element={<InventoryDashboard />} />
        <Route
          path='/medinone/stores'
          element={
            canOpenCompanyControls ? (
              <StoreOperationsDashboard />
            ) : (
              <Navigate to={companyControlsFallback} replace />
            )
          }
        />
        <Route path='/medinone/customers' element={<CustomersDashboard />} />
        <Route path='/medinone/delivery' element={<DeliveryTrackingDashboard />} />
        <Route
          path='/login-cashier-password'
          element={<LogInCashierPasswordPage />}
        />
        <Route
          path='/temporary-logout'
          element={<CashierTemporaryLogOutPage />}
        />
        <Route path='/medinone/billing' element={<POSBilling />} />
        <Route path='/medinone/compliance' element={<ComplianceDashboard />} />
        <Route path='/medinone/reports/gst' element={<GSTReportsDashboard />} />
        <Route path='/medinone/reports/profit' element={<ProfitAnalyticsDashboard />} />
        <Route
          path='/medinone/reports/expiry-alerts'
          element={<ExpiryAlertsDashboard />}
        />
        <Route path='/lifepill/*' element={<RedirectLegacyPharmaFlowRoute />} />
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
              path='/cashier-dashboard/*'
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
