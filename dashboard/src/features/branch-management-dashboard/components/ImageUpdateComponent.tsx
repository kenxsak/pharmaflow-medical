import React, { ChangeEvent, useEffect, useState } from 'react';
import useBranchManagementService from '../services/BranchManagementService';
import { IoCloudUploadOutline } from 'react-icons/io5';
import Loader from '../../../shared/Loader';

type Props = {
  onClose: () => void;
  branchId: string;
};

function ImageUpdateComponent({ onClose, branchId }: Props) {
  const {
    fetchBranchById,
    branchImage,
    setBranchImageUpdate,
    branchImageUpdate,
    setBranch,
    branch,
    updateBranchImage,
    updatingImage,
    branchImageFetch,
  } = useBranchManagementService();

  const [updateImage, setUpdateImage] = useState(false);

  useEffect(() => {
    fetchBranchById(branchId);
  }, []);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file: File | null = e.target.files ? e.target.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setBranchImageUpdate(file);
          setUpdateImage(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-lg mx-4'>
        {/* Header */}
        <div className='bg-blue-600 text-white px-6 py-4 rounded-t-lg'>
          <h2 className='text-xl font-semibold'>Update Branch Image</h2>
        </div>

        {/* Content */}
        <div className='p-6'>
          <div className='flex flex-col items-center gap-6'>
            <div className='relative'>
              {updateImage ? (
                <img
                  src={
                    branchImageUpdate
                      ? URL.createObjectURL(branchImageUpdate)
                      : ''
                  }
                  alt='Preview'
                  className='w-64 h-64 rounded-lg object-cover border-4 border-blue-100 shadow-md'
                />
              ) : (
                <img
                  src={
                    branch.branchImage ||
                    'https://static-00.iconduck.com/assets.00/person-icon-1901x2048-a9h70k71.png'
                  }
                  alt='Branch'
                  className='w-64 h-64 rounded-lg object-cover border-4 border-gray-200 shadow-md'
                />
              )}
            </div>

            <label className='w-full cursor-pointer'>
              <div className='flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-lg border-2 border-blue-200 transition-colors'>
                <IoCloudUploadOutline size={24} />
                <span>Select New Image</span>
              </div>
              <input
                type='file'
                className='hidden'
                onChange={handleImageChange}
                accept='image/*'
              />
            </label>
          </div>

          <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors'
            >
              Cancel
            </button>
            <button
              type='button'
              className='px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2'
              onClick={() => updateBranchImage(parseInt(branchId))}
            >
              {updatingImage ? <Loader /> : 'Update Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageUpdateComponent;
