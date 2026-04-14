import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useCashierContext } from '../../layouts/AddCashier';
import useBankCRUDService from '../../services/BankDetailsCRUDService';
import { Link } from 'react-router-dom';

const CashierBankDetails = () => {
  const { cashierDetails, cashierBankDetails, setCashierBankDetails } =
    useCashierContext();
  const { updateBankDetails, loading } = useBankCRUDService();

  useEffect(() => {
    setCashierBankDetails({
      ...cashierBankDetails,
      employerId: cashierDetails.employerId,
      monthlyPayment: cashierDetails.employerSalary,
    });
  }, []);

  const goToSummary = () => {
    console.log('Summary', cashierDetails);
    if (cashierDetails && cashierDetails.employerId) {
      updateBankDetails(cashierBankDetails, cashierDetails.employerId);
    } else {
      toast.error('No cashier created yet.');
    }
  };

  return (
    <div className='w-full max-w-4xl mx-auto'>
      <div className='bg-white rounded-lg shadow-md overflow-hidden'>
        {/* Header */}
        <div className='bg-blue-600 text-white px-6 py-4'>
          <h2 className='text-xl font-semibold'>Employee Bank Details</h2>
        </div>

        {/* Content */}
        <div className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label
                htmlFor='bankName'
                className='block text-sm font-semibold text-gray-700 mb-2'
              >
                Bank Name
              </label>
              <input
                type='text'
                id='bankName'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            value={cashierBankDetails.bankName}
            onChange={(e) =>
              setCashierBankDetails({
                ...cashierBankDetails,
                bankName: e.target.value,
              })
            }
              />
            </div>

            <div>
              <label
                htmlFor='branchName'
                className='block text-sm font-semibold text-gray-700 mb-2'
              >
                Branch Name
              </label>
              <input
                type='text'
                id='branchName'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            value={cashierBankDetails.bankBranchName}
            onChange={(e) =>
              setCashierBankDetails({
                ...cashierBankDetails,
                bankBranchName: e.target.value,
              })
            }
              />
            </div>

            <div>
              <label
                htmlFor='accountNumber'
                className='block text-sm font-semibold text-gray-700 mb-2'
              >
                Account Number
              </label>
              <input
                type='number'
                id='accountNumber'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            value={cashierBankDetails.bankAccountNumber}
            onChange={(e) =>
              setCashierBankDetails({
                ...cashierBankDetails,
                bankAccountNumber: parseInt(e.target.value),
              })
            }
              />
            </div>

            <div>
              <label
                htmlFor='baseSalary'
                className='block text-sm font-semibold text-gray-700 mb-2'
              >
                Base Salary (LKR)
              </label>
              <input
                type='text'
                id='baseSalary'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50'
                value={cashierDetails.employerSalary}
                readOnly
              />
            </div>

            <div className='md:col-span-2'>
              <label
                htmlFor='additionalNotes'
                className='block text-sm font-semibold text-gray-700 mb-2'
              >
                Additional Notes
              </label>
              <textarea
                id='additionalNotes'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            value={cashierBankDetails.employerDescription}
            onChange={(e) =>
              setCashierBankDetails({
                ...cashierBankDetails,
                employerDescription: e.target.value,
              })
            }
              ></textarea>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200'>
            <button
              type='button'
              className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors'
            >
              <Link to='/manager-dashboard/cashiers'>Cancel</Link>
            </button>
            <button
              type='button'
              className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              onClick={goToSummary}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierBankDetails;
