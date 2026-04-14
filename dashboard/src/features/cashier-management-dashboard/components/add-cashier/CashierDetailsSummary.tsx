import React from 'react';
import { Link } from 'react-router-dom';
import { ComponentState, useCashierContext } from '../../layouts/AddCashier';
import TableRow from '../../../../shared/TableRow';

function CashierDetailsSummary() {
  const { cashierDetails, setCurrentComponent, cashierBankDetails } =
    useCashierContext();

  const goToBankDetails = () => {
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
              <img
                src={cashierDetails.profileImageUrl}
                alt='Profile'
                className='w-48 h-48 rounded-full object-cover border-4 border-blue-100 shadow-md'
              />
              <h3 className='text-xl font-semibold text-gray-800'>
                {cashierDetails.employerFirstName} {cashierDetails.employerLastName}
              </h3>
            </div>

            {/* Employment Information */}
            <div className='bg-gray-50 rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-4'>Employment Information</h3>
              <table className='min-w-full'>
                <tbody className='divide-y divide-gray-200'>
                  <TableRow label='Employee ID' value={cashierDetails.employerId} />
                  <TableRow
                    label='First Name'
                    value={cashierDetails.employerFirstName}
                  />
                  <TableRow
                    label='Last Name'
                    value={cashierDetails.employerLastName}
                  />
                  <TableRow label='Nickname' value={cashierDetails.employerNicName} />
                  <TableRow label='NIC Number' value={cashierDetails.employerNic} />
                  <TableRow label='Email' value={cashierDetails.employerEmail} />
                  <TableRow
                    label='Phone'
                    value={cashierDetails.employerPhone}
                  />
                  <TableRow label='Address' value={cashierDetails.employerAddress} />
                  <TableRow
                    label='Date of Birth'
                    value={cashierDetails.dateOfBirth.toString().slice(0, 10)}
                  />
                  <TableRow
                    label='Gender'
                    value={cashierDetails.gender.toUpperCase()}
                  />
                  <TableRow label='Role' value={cashierDetails.role.toUpperCase()} />
                </tbody>
              </table>
            </div>

            {/* Bank Details */}
            <div className='bg-gray-50 rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-4'>Bank Details</h3>
              <table className='min-w-full'>
                <tbody className='divide-y divide-gray-200'>
                  <TableRow
                    label='Account Number'
                    value={cashierBankDetails.bankAccountNumber}
                  />
                  <TableRow label='Bank Name' value={cashierBankDetails.bankName} />
                  <TableRow
                    label='Branch Name'
                    value={cashierBankDetails.bankBranchName}
                  />
                  <TableRow
                    label='Base Salary (LKR)'
                    value={cashierBankDetails.monthlyPayment}
                  />
                  <TableRow
                    label='Notes'
                    value={cashierBankDetails.employerDescription}
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200'>
            <button
              type='button'
              className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors'
              onClick={goToBankDetails}
            >
              Back
            </button>
            <button
              type='button'
              className='px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors'
            >
              <Link to='/manager-dashboard/cashiers'>Complete</Link>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CashierDetailsSummary;
