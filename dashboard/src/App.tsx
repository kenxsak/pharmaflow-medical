import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import AddCashier from './features/cashier-management-dashboard/layouts/AddCashier';
import CashierBankDetails from './features/cashier-management-dashboard/components/add-cashier/CashierBankDetails';
import UpdateCashier from './features/cashier-management-dashboard/layouts/UpdateCashier';
import ViewCashier from './features/cashier-management-dashboard/layouts/ViewCashier';
import ViewBranchDetails from './features/branch-management-dashboard/layouts/ViewBranchDetails';
import ErrorPage from './pages/ErrorPage';
import BranchCreateCard from './features/branch-management-dashboard/components/BranchCreateCard';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path='/' element={<Login />} />
          <Route path='/dashboard' element={<ManagerDashboard />} />
          <Route path='/add-cashier' element={<AddCashier />} />
          <Route path='/cashier-bank-details' element={<CashierBankDetails />} />
          {/* <Route path='/update-cashier/:employerId' element={<UpdateCashier />} /> */}
          <Route path='/manager-dashboard/:item' element={<ManagerDashboard />} />
          <Route path='/update-cashier/:employerId' element={<UpdateCashier />} />
          <Route path='/view-cashier/:employerId' element={<ViewCashier />} />
          <Route path='/view-branch/:branchId' element={<ViewBranchDetails />} />
          <Route path='/branches/create-branch' element={<BranchCreateCard />} />
          //page for the error
          <Route path='*' element={<ErrorPage />} />
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
