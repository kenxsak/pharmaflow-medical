import React, { useState } from 'react';
import { CashierDetailsType } from '../../cashier-management-dashboard/interfaces/CashierDetailsType';

type Props = {
  branchManager: CashierDetailsType;
  onClose: () => void;
};

function BranchManagerCard({ branchManager, onClose }: Props) {
  const [formData, setFormData] = useState(branchManager);
  const [editable, setEditable] = useState(false);

  const handleSubmit = () => {};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const toggleEditable = () => {
    setEditable((prevEditable) => !prevEditable);
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4'>
        {/* Header */}
        <div className='bg-blue-600 text-white px-6 py-4 rounded-t-lg'>
          <h2 className='text-xl font-semibold'>Branch Manager Information</h2>
        </div>

        {/* Content */}
        <div className='p-6'>
          <div className='flex justify-center mb-6'>
            <img
              src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNXQN49BC5ALTU_rWah1zC5WQaPqyd81wmxA&s'
              alt='Branch Manager'
              className='w-32 h-32 rounded-full border-4 border-blue-100 shadow-md object-cover'
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label htmlFor='employerFirstName' className='block text-sm font-semibold text-gray-700 mb-2'>
                  First Name
                </label>
                <input
                  type='text'
                  id='employerFirstName'
                  name='employerFirstName'
                  value={formData.employerFirstName}
                  onChange={handleChange}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50'
                  readOnly={!editable}
                  required
                />
              </div>
              
              <div>
                <label htmlFor='employerLastName' className='block text-sm font-semibold text-gray-700 mb-2'>
                  Last Name
                </label>
                <input
                  type='text'
                  id='employerLastName'
                  name='employerLastName'
                  value={formData.employerLastName}
                  onChange={handleChange}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50'
                  readOnly={!editable}
                  required
                />
              </div>
              
              <div>
                <label htmlFor='employerPhone' className='block text-sm font-semibold text-gray-700 mb-2'>
                  Contact Number
                </label>
                <input
                  type='text'
                  id='employerPhone'
                  name='employerPhone'
                  value={formData.employerPhone}
                  onChange={handleChange}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50'
                  readOnly={!editable}
                  required
                />
              </div>
              
              <div>
                <label htmlFor='employerEmail' className='block text-sm font-semibold text-gray-700 mb-2'>
                  Email Address
                </label>
                <input
                  type='email'
                  id='employerEmail'
                  name='employerEmail'
                  value={formData.employerEmail}
                  onChange={handleChange}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50'
                  readOnly={!editable}
                  required
                />
              </div>
              
              <div>
                <label htmlFor='employerAddress' className='block text-sm font-semibold text-gray-700 mb-2'>
                  Address
                </label>
                <input
                  type='text'
                  id='employerAddress'
                  name='employerAddress'
                  value={formData.employerAddress}
                  onChange={handleChange}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50'
                  readOnly={!editable}
                  required
                />
              </div>

              <div>
                <label htmlFor='employerSalary' className='block text-sm font-semibold text-gray-700 mb-2'>
                  Salary
                </label>
                <input
                  id='employerSalary'
                  name='employerSalary'
                  value={formData.employerSalary}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50'
                  readOnly={!editable}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200'>
              <button
                type='button'
                onClick={onClose}
                className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors'
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BranchManagerCard;
