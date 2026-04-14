import React from 'react';
import useSellerCompanyService from '../services/SellerComapanyService';
import LoadingSpinner from '../../../shared/loader/LoadingSpinner';
import { IoCloseOutline } from 'react-icons/io5';

interface AddCompanyModalProps {
  onClose: () => void;
}

const AddCompanyModal: React.FC<AddCompanyModalProps> = ({ onClose }) => {
  const { setFormData, addCompany, formData, adding } =
    useSellerCompanyService();
    
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addCompany();
  };

  return (
    <div className='fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 backdrop-blur-sm p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 rounded-t-xl flex justify-between items-center'>
          <div>
            <h2 className='text-2xl font-bold'>Add Supplier Company</h2>
            <p className='text-blue-100 text-sm mt-1'>Create a new supplier company</p>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-white/20 rounded-lg transition-colors'
            aria-label='Close'
          >
            <IoCloseOutline size={28} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6'>
          <div className='space-y-6'>
            {/* Company Information Section */}
            <div>
              <h3 className='text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200'>
                Company Information
              </h3>
              
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Company Name */}
                <div className='md:col-span-2'>
                  <label htmlFor='companyName' className='block text-sm font-medium text-gray-700 mb-2'>
                    Company Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    id='companyName'
                    name='companyName'
                    value={formData.companyName}
                    onChange={handleChange}
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                    placeholder='Enter company name'
                    required
                  />
                </div>

                {/* Company Address */}
                <div className='md:col-span-2'>
                  <label htmlFor='companyAddress' className='block text-sm font-medium text-gray-700 mb-2'>
                    Company Address <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    id='companyAddress'
                    name='companyAddress'
                    value={formData.companyAddress}
                    onChange={handleChange}
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                    placeholder='Enter company address'
                    required
                  />
                </div>

                {/* Company Contact */}
                <div>
                  <label htmlFor='companyContact' className='block text-sm font-medium text-gray-700 mb-2'>
                    Contact Number <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    id='companyContact'
                    name='companyContact'
                    value={formData.companyContact}
                    onChange={handleChange}
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                    placeholder='0771234567'
                    required
                  />
                </div>

                {/* Company Email */}
                <div>
                  <label htmlFor='companyEmail' className='block text-sm font-medium text-gray-700 mb-2'>
                    Email Address <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='email'
                    id='companyEmail'
                    name='companyEmail'
                    value={formData.companyEmail}
                    onChange={handleChange}
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                    placeholder='company@example.com'
                    required
                  />
                </div>

                {/* Company Description */}
                <div className='md:col-span-2'>
                  <label htmlFor='companyDescription' className='block text-sm font-medium text-gray-700 mb-2'>
                    Description
                  </label>
                  <textarea
                    id='companyDescription'
                    name='companyDescription'
                    value={formData.companyDescription}
                    onChange={handleChange}
                    rows={3}
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none'
                    placeholder='Enter company description'
                  />
                </div>

                {/* Company Image URL */}
                <div className='md:col-span-2'>
                  <label htmlFor='companyImage' className='block text-sm font-medium text-gray-700 mb-2'>
                    Company Logo URL <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    id='companyImage'
                    name='companyImage'
                    value={formData.companyImage}
                    onChange={handleChange}
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                    placeholder='https://example.com/logo.png'
                    required
                  />
                </div>
              </div>
            </div>

            {/* Banking Information Section */}
            <div>
              <h3 className='text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200'>
                Banking Information
              </h3>
              
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Company Bank */}
                <div>
                  <label htmlFor='companyBank' className='block text-sm font-medium text-gray-700 mb-2'>
                    Bank Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    id='companyBank'
                    name='companyBank'
                    value={formData.companyBank}
                    onChange={handleChange}
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                    placeholder='Bank of Ceylon'
                    required
                  />
                </div>

                {/* Company Account Number */}
                <div>
                  <label htmlFor='companyAccountNumber' className='block text-sm font-medium text-gray-700 mb-2'>
                    Account Number <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    id='companyAccountNumber'
                    name='companyAccountNumber'
                    value={formData.companyAccountNumber}
                    onChange={handleChange}
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                    placeholder='1234567890'
                    required
                  />
                </div>
              </div>
            </div>

            {/* Status and Rating Section */}
            <div>
              <h3 className='text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200'>
                Additional Details
              </h3>
              
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Company Status */}
                <div>
                  <label htmlFor='companyStatus' className='block text-sm font-medium text-gray-700 mb-2'>
                    Status <span className='text-red-500'>*</span>
                  </label>
                  <select
                    id='companyStatus'
                    name='companyStatus'
                    value={formData.companyStatus}
                    onChange={handleChange as any}
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                    required
                  >
                    <option value=''>Select status</option>
                    <option value='Active'>Active</option>
                    <option value='Inactive'>Inactive</option>
                    <option value='Pending'>Pending</option>
                  </select>
                </div>

                {/* Company Rating */}
                <div>
                  <label htmlFor='companyRating' className='block text-sm font-medium text-gray-700 mb-2'>
                    Rating (1-5) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='number'
                    id='companyRating'
                    name='companyRating'
                    value={formData.companyRating}
                    onChange={handleChange}
                    min='1'
                    max='5'
                    step='0.1'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                    placeholder='4.5'
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              className='px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors'
              disabled={adding}
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={adding}
              className={`px-8 py-2.5 rounded-lg font-medium transition-all shadow-md ${
                adding
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
              }`}
            >
              {adding ? (
                <span className='flex items-center gap-2'>
                  <LoadingSpinner size='sm' />
                  Adding...
                </span>
              ) : (
                'Add Company'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCompanyModal;
