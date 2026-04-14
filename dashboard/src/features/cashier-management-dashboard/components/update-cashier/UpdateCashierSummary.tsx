import { Link, useParams } from 'react-router-dom';
import { useCashierContext, ComponentState } from '../../layouts/AddCashier';
import { useEffect } from 'react';
import useCashierCRUDService from '../../services/cashierCRUDService';
import useBankCRUDService from '../../services/BankDetailsCRUDService';
import Loader from '../../../../shared/Loader';

const UpdateCashierSummary = () => {
  const { employerId } = useParams();

  const {
    cashierDetails,
    fetchCashierById,
    fetchImageOfEmployer,
    fetchProfilePicture,
    profileImageUrl,
  } = useCashierCRUDService();
  const { cashierBankDetails, fetchBankDetailsById } = useBankCRUDService();
  const { setCurrentComponent } = useCashierContext();

  useEffect(() => {
    if (employerId) {
      fetchCashierById(parseInt(employerId as string));
      fetchBankDetailsById(parseInt(employerId as string));
      fetchImageOfEmployer(parseInt(employerId as string));
    }
  }, []);

  const goToBack = () => {
    setCurrentComponent(ComponentState.BankDetails);
  };

  return (
    <div className='w-full max-w-7xl mx-auto p-6'>
      <div className='bg-white rounded-lg shadow-md overflow-hidden'>
        {/* Header */}
        <div className='bg-blue-600 text-white px-6 py-4'>
          <h2 className='text-xl font-semibold'>Employee Details Summary</h2>
        </div>

        {/* Content */}
        <div className='p-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Profile Image Section */}
            <div className='flex flex-col items-center gap-4'>
              {fetchProfilePicture ? (
                <Loader />
              ) : (
                <img
                  src={
                    profileImageUrl ||
                    'https://static-00.iconduck.com/assets.00/person-icon-1901x2048-a9h70k71.png'
                  }
                  alt='Profile'
                  className='w-48 h-48 rounded-full object-cover border-4 border-blue-100 shadow-md'
                />
              )}
              <h3 className='text-xl font-semibold text-gray-800'>
                {cashierDetails.employerFirstName} {cashierDetails.employerLastName}
              </h3>
            </div>

            {/* Personal Information */}
            <div className='bg-gray-50 rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-4'>Personal Information</h3>
              <div className='space-y-3 text-sm'>
                <div>
                  <span className='font-semibold text-gray-700'>Name:</span>
                  <p className='text-gray-600'>
                    {cashierDetails.employerFirstName} {cashierDetails.employerLastName}
                  </p>
                </div>
                <div>
                  <span className='font-semibold text-gray-700'>Nickname:</span>
                  <p className='text-gray-600'>{cashierDetails.employerNicName}</p>
                </div>
                <div>
                  <span className='font-semibold text-gray-700'>Email:</span>
                  <p className='text-gray-600'>{cashierDetails.employerEmail}</p>
                </div>
                <div>
                  <span className='font-semibold text-gray-700'>Phone:</span>
                  <p className='text-gray-600'>{cashierDetails.employerPhone}</p>
                </div>
                <div>
                  <span className='font-semibold text-gray-700'>Address:</span>
                  <p className='text-gray-600'>{cashierDetails.employerAddress}</p>
                </div>
                <div>
                  <span className='font-semibold text-gray-700'>Date of Birth:</span>
                  <p className='text-gray-600'>{cashierDetails.dateOfBirth.split('T')[0]}</p>
                </div>
              </div>
            </div>

            {/* Employment & Bank Details */}
            <div className='bg-gray-50 rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-4'>Employment & Bank Details</h3>
              <div className='space-y-3 text-sm'>
                <div>
                  <span className='font-semibold text-gray-700'>Role:</span>
                  <p className='text-gray-600'>{cashierDetails.role}</p>
                </div>
                <div>
                  <span className='font-semibold text-gray-700'>Branch:</span>
                  <p className='text-gray-600'>{cashierDetails.branchId}</p>
                </div>
                <div>
                  <span className='font-semibold text-gray-700'>Salary:</span>
                  <p className='text-gray-600'>LKR {cashierDetails.employerSalary}</p>
                </div>
                <div>
                  <span className='font-semibold text-gray-700'>Bank Account:</span>
                  <p className='text-gray-600'>{cashierBankDetails.bankAccountNumber}</p>
                </div>
                <div>
                  <span className='font-semibold text-gray-700'>Bank Name:</span>
                  <p className='text-gray-600'>{cashierBankDetails.bankName}</p>
                </div>
                <div>
                  <span className='font-semibold text-gray-700'>Branch Name:</span>
                  <p className='text-gray-600'>{cashierBankDetails.bankBranchName}</p>
                </div>
                <div>
                  <span className='font-semibold text-gray-700'>Notes:</span>
                  <p className='text-gray-600'>{cashierBankDetails.employerDescription}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200'>
            <button
              type='button'
              className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors'
              onClick={goToBack}
            >
              Back
            </button>
            <Link
              to='/manager-dashboard/cashiers'
              className='px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-block'
            >
              Confirm & Update
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateCashierSummary;
