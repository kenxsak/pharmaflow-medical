import React, { ChangeEvent } from 'react';
import useBranchManagementService from '../services/BranchManagementService';
import { useNavigate } from 'react-router-dom';
import { IoCloudUploadOutline } from 'react-icons/io5';
import { FaStore, FaTimes, FaMapMarkerAlt, FaPhone, FaEnvelope, FaImage, FaSave } from 'react-icons/fa';
import { HiLocationMarker, HiSparkles } from 'react-icons/hi';

type Props = {};

const BranchCreateCard: React.FC<Props> = () => {
  const {
    setCreateBranchDTO,
    createBranch,
    creating,
    setBranchImageDTO,
    branchImageDTO,
    createBranchDTO,
  } = useBranchManagementService();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setCreateBranchDTO((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file: File | null = e.target.files ? e.target.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setBranchImageDTO(file);
          setCreateBranchDTO((prev: any) => ({
            ...prev,
            branchProfileImageUrl: reader.result,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const navigate = useNavigate();

  return (
    <div className='fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm z-50 p-4 overflow-y-auto'>
      <div className='bg-white rounded-lg shadow-2xl w-full max-w-5xl my-8'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-lg'>
          <div className='flex items-center justify-between text-white'>
            <div className='flex items-center gap-3'>
              <div className='bg-white text-blue-600 p-3 rounded-lg'>
                <FaStore className='text-2xl' />
              </div>
              <div>
                <h2 className='text-2xl font-bold'>Create New Branch</h2>
                <p className='text-blue-100 text-sm mt-1'>Add a new pharmacy branch to your network</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/manager-dashboard/branches')}
              className='hover:bg-white/20 p-2 rounded-lg transition-all duration-200'
            >
              <FaTimes className='text-xl' />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className='p-8 bg-gray-50'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Left Column - Image Upload */}
            <div className='lg:col-span-1'>
              <div className='sticky top-8'>
                <label className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3'>
                  <FaImage className='text-blue-600' />
                  Branch Image
                </label>
                <div className='relative group'>
                  {branchImageDTO ? (
                    <img
                      src={createBranchDTO.branchProfileImageUrl}
                      alt='Branch Preview'
                      className='w-full aspect-square object-cover rounded-lg shadow-md'
                    />
                  ) : (
                    <div className='w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300'>
                      <div className='text-center'>
                        <FaStore className='text-5xl text-gray-300 mx-auto mb-3' />
                        <p className='text-gray-500 text-sm'>No image selected</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Overlay */}
                  <label className='absolute inset-0 flex items-center justify-center bg-blue-600/90 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer'>
                    <div className='text-center text-white'>
                      <IoCloudUploadOutline className='text-5xl mx-auto mb-2' />
                      <span className='text-base font-semibold'>Click to Upload</span>
                    </div>
                    <input
                      type='file'
                      className='hidden'
                      onChange={handleImageChange}
                      accept='image/*'
                    />
                  </label>
                </div>
                <div className='mt-3 bg-blue-50 p-2 rounded-lg border border-blue-200'>
                  <p className='text-xs text-blue-700 text-center'>
                    Recommended: Square image, min 400x400px
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className='lg:col-span-2 space-y-5'>
              {/* Branch Name */}
              <div>
                <label htmlFor='branchName' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                  <FaStore className='text-blue-600' />
                  Branch Name *
                </label>
                <input
                  type='text'
                  id='branchName'
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800'
                  placeholder='e.g., LifePill Main Branch'
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Two Column Layout */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                {/* Branch Address */}
                <div>
                  <label htmlFor='branchAddress' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <HiLocationMarker className='text-blue-600' />
                    Address *
                  </label>
                  <input
                    type='text'
                    id='branchAddress'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800'
                    placeholder='Street address'
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Branch Location */}
                <div>
                  <label htmlFor='branchLocation' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaMapMarkerAlt className='text-blue-600' />
                    Location/City *
                  </label>
                  <input
                    type='text'
                    id='branchLocation'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800'
                    placeholder='e.g., Colombo, Sri Lanka'
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label htmlFor='branchContact' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaPhone className='text-blue-600' />
                    Contact Number *
                  </label>
                  <input
                    type='tel'
                    id='branchContact'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800'
                    placeholder='+94 XX XXX XXXX'
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor='branchEmail' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaEnvelope className='text-blue-600' />
                    Email Address *
                  </label>
                  <input
                    type='email'
                    id='branchEmail'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800'
                    placeholder='branch@lifepill.com'
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor='branchDescription' className='text-sm font-semibold text-gray-700 mb-2 block'>
                  Branch Description
                </label>
                <textarea
                  id='branchDescription'
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-gray-800 h-24 resize-none'
                  placeholder='Brief description about this branch...'
                  onChange={handleInputChange}
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className='flex items-center justify-end gap-3 pt-6 border-t border-gray-200'>
                <button
                  type='button'
                  onClick={() => navigate('/manager-dashboard/branches')}
                  className='px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-300 transition-all duration-200'
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={createBranch}
                  disabled={creating}
                  className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg'
                >
                  {creating ? (
                    <>
                      <svg
                        className='animate-spin h-5 w-5'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <FaSave />
                      <span>Create Branch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchCreateCard;

