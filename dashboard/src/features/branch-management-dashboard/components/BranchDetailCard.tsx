import { useState } from 'react';
import { Branch } from '../interfaces/Branch';
import useBranchManagementService from '../services/BranchManagementService';
import { FaStore, FaTimes, FaMapMarkerAlt, FaPhone, FaEnvelope, FaFax } from 'react-icons/fa';

type Props = {
  branch: Branch;
  closeTab: () => void;
};

function BranchDetailCard({ branch, closeTab }: Props) {
  const [formData, setFormData] = useState(branch);

  const { updateBranch, updating } = useBranchManagementService();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateBranch(branch.branchId, formData);
  };

  return (
    <div className='fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm z-50 p-4'>
      <div className='bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-lg sticky top-0 z-10'>
          <div className='flex items-center justify-between text-white'>
            <div className='flex items-center gap-3'>
              <div className='bg-white text-blue-600 p-3 rounded-lg'>
                <FaStore className='text-xl' />
              </div>
              <h2 className='text-xl font-bold'>Branch Details</h2>
            </div>
            <button
              onClick={closeTab}
              className='hover:bg-white/20 p-2 rounded-lg transition-all duration-200'
            >
              <FaTimes className='text-xl' />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-5'>
          {/* Branch Name */}
          <div>
            <label htmlFor='branchName' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
              <FaStore className='text-blue-600' />
              Branch Name
            </label>
            <input
              type='text'
              id='branchName'
              name='branchName'
              value={formData.branchName}
              onChange={handleChange}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800'
              required
            />
          </div>

          {/* Two Column Layout */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            {/* Branch Address */}
            <div>
              <label htmlFor='branchAddress' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                <FaMapMarkerAlt className='text-blue-600' />
                Address
              </label>
              <input
                type='text'
                id='branchAddress'
                name='branchAddress'
                value={formData.branchAddress}
                onChange={handleChange}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800'
                required
              />
            </div>

            {/* Branch Contact */}
            <div>
              <label htmlFor='branchContact' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                <FaPhone className='text-blue-600' />
                Contact
              </label>
              <input
                type='text'
                id='branchContact'
                name='branchContact'
                value={formData.branchContact}
                onChange={handleChange}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800'
                required
              />
            </div>

            {/* Branch Email */}
            <div>
              <label htmlFor='branchEmail' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                <FaEnvelope className='text-blue-600' />
                Email
              </label>
              <input
                type='email'
                id='branchEmail'
                name='branchEmail'
                value={formData.branchEmail}
                onChange={handleChange}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800'
                required
              />
            </div>

            {/* Branch Fax */}
            <div>
              <label htmlFor='branchFax' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                <FaFax className='text-blue-600' />
                Fax
              </label>
              <input
                type='text'
                id='branchFax'
                name='branchFax'
                value={formData.branchFax}
                onChange={handleChange}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800'
                required
              />
            </div>
          </div>

          {/* Branch Description */}
          <div>
            <label htmlFor='branchDescription' className='text-sm font-semibold text-gray-700 mb-2 block'>
              Description
            </label>
            <input
              id='branchDescription'
              name='branchDescription'
              value={formData.branchDescription}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800'
              onChange={handleChange}
            />
          </div>

          {/* Branch Image */}
          <div>
            <label htmlFor='branchImage' className='text-sm font-semibold text-gray-700 mb-2 block'>
              Branch Image URL
            </label>
            <input
              type='text'
              id='branchImage'
              name='branchImage'
              value={formData.branchImage || ''}
              onChange={handleChange}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800'
            />
          </div>

          {/* Branch Status */}
          <div>
            <label htmlFor='branchStatus' className='text-sm font-semibold text-gray-700 mb-2 block'>
              Status
            </label>
            <select
              id='branchStatus'
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800'
              value={formData.branchStatus ? 'Active' : 'Inactive'}
              required
              onChange={
                (e) =>
                  setFormData((prevState) => ({
                    ...prevState,
                    branchStatus: e.target.value === 'Active',
                  }))
              }
            >
              <option value='Active'>Active</option>
              <option value='Inactive'>Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center justify-end gap-3 pt-6 border-t border-gray-200'>
            <button
              type='button'
              onClick={closeTab}
              className='px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-300 transition-all duration-200'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg'
              onClick={() => updateBranch(branch.branchId, formData)}
            >
              {updating ? 'Updating...' : 'Update Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BranchDetailCard;
