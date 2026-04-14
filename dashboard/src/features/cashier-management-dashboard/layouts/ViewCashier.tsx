import { Link, useParams } from 'react-router-dom';
import useBankCRUDService from '../services/BankDetailsCRUDService';
import { useEffect, useState } from 'react';
import { CashierContext, ComponentState } from './AddCashier';
import { CashierContextType } from '../context/CashierContextType';
import { CashierDetailsType } from '../interfaces/CashierDetailsType';
import ViewCashierComponent from '../components/view-cashier/ViewCashier';

const ViewCashier = () => {
  const [currentComponent, setCurrentComponent] = useState(
    ComponentState.Details
  );

  const [cashierDetails, setCashierDetails] = useState({
    employerNicName: '',
    employerFirstName: '',
    employerLastName: '',
    employerEmail: '',
    employerPhone: '',
    employerPassword: '',
    employerConfirmPassword: '',
    profileImage: '',
    branchId: 0,
    employerNic: '',
    dateOfBirth: new Date(),
    employerAddress: '',
    pin: 0,
    role: 'CASHIER',
    employerSalary: 0,
  } as CashierDetailsType);

  const [cashierBankDetails, setCashierBankDetails] = useState({
    bankAccountNumber: 0,
    bankName: '',
    bankBranchName: '',
    employerDescription: '',
    employerBankDetailsId: 0,
    monthlyPayment: 0,
    monthlyPaymentStatus: false,
    employerId: 0,
  });

  const contextValue: CashierContextType = {
    currentComponent,
    setCurrentComponent,
    setCashierDetails,
    cashierDetails,
    cashierBankDetails,
    setCashierBankDetails,
  };

  return (
    <CashierContext.Provider value={contextValue}>
      <div className='bg-slate-300 font-poppins'>
        <ViewCashierComponent />
      </div>
    </CashierContext.Provider>
  );
};

export default ViewCashier;
