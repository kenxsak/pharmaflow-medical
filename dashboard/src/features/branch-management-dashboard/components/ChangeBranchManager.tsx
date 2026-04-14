import React, { useState } from 'react';
import { CashierDetailsType } from '../../cashier-management-dashboard/interfaces/CashierDetailsType';
import { ChangeBranchManagerDTO } from '../interfaces/ChangeBranchManagerDTO';
import useBranchManagementService from '../services/BranchManagementService';

type Props = {
  onClose: () => void;
  branchEmployers: CashierDetailsType[];
};

function ChangeBranchManager({ onClose, branchEmployers }: Props) {
  const [changeBranchManagerDTO, setChangeBranchManagerDTO] =
    useState<ChangeBranchManagerDTO>();

  const { changeBranchManagerMethod, updatingManager } =
    useBranchManagementService();

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col'>
        {/* Header */}
        <div className='bg-blue-600 text-white px-6 py-4 rounded-t-lg'>
          <h2 className='text-xl font-semibold'>Change Branch Manager</h2>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto flex-1'>
          <div className='space-y-3'>
            {branchEmployers.map((employer) => (
              <div key={employer.employerId}>
                {(employer.role === 'CASHIER' || employer.role === 'OTHER') && (
                  <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                        <span className='text-blue-600 font-semibold'>
                          {employer.employerFirstName.charAt(0)}{employer.employerLastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className='font-semibold text-gray-800'>
                          {employer.employerFirstName} {employer.employerLastName}
                        </p>
                        <p className='text-sm text-gray-500'>{employer.role}</p>
                      </div>
                    </div>
                    <button
                      type='button'
                      className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors'
                      onClick={() => {
                        setChangeBranchManagerDTO({
                          formerManagerId: employer.employerId,
                          branchId: employer.branchId,
                          newManagerId: employer.employerId,
                          currentManagerNewRole: 'OTHER',
                          newManagerRole: 'MANAGER',
                        });

                        changeBranchManagerDTO &&
                          changeBranchManagerMethod(changeBranchManagerDTO);
                      }}
                    >
                      {updatingManager &&
                      employer.employerId === changeBranchManagerDTO?.newManagerId
                        ? 'Updating...'
                        : 'Assign as Manager'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg'>
          <button
            type='button'
            onClick={onClose}
            className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangeBranchManager;
