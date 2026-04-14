import { ChangeEvent, useEffect, useState } from 'react';
import { IoCloudUploadOutline } from 'react-icons/io5';
import { Link, useParams } from 'react-router-dom';
import Loader from '../../../../shared/Loader';
import useCashierCRUDService from '../../services/cashierCRUDService';

const UpdateCashierDetails = () => {
  const { employerId } = useParams();
  const [updateImage, setUpdateImage] = useState<boolean>(false);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file: File | null = e.target.files ? e.target.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfilePicture(file);
          setCashierDetails((prev: any) => ({
            ...prev,
            profileImageUrl: reader.result,
          }));
          setUpdateImage(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const goToBankDetails = (employer: any) => {
    updateCashier(employer);
  };

  const {
    fetchCashierById,
    cashierDetails,
    setCashierDetails,
    loading,
    updateCashier,
    updating,
    fetchAllBranches,
    branches,
    setProfilePicture,
    fetchImageOfEmployer,
    updateEmployerImage,
    fetchProfilePicture,
    profileImageUrl,
    updateState,
  } = useCashierCRUDService();

  useEffect(() => {
    fetchCashierById(parseInt(employerId as string));
    console.log(employerId);
    fetchAllBranches();
    fetchImageOfEmployer(parseInt(employerId as string));
  }, []);

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>
            Update Employee Profile
          </h1>
          <p className='text-gray-600'>
            Manage employee information and credentials
          </p>
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader />
          </div>
        ) : (
          <div className='bg-white rounded-2xl shadow-xl p-8'>
            {/* Profile Image Section */}
            <div className='flex flex-col items-center mb-10 pb-8 border-b border-gray-200'>
              <div className='relative mb-6'>
                {updateImage ? (
                  <img
                    src={cashierDetails.profileImageUrl}
                    alt='Preview'
                    className='w-40 h-40 rounded-full object-cover border-4 border-blue-600 shadow-lg'
                  />
                ) : fetchProfilePicture ? (
                  <div className='w-40 h-40 rounded-full flex items-center justify-center bg-gray-100'>
                    <Loader />
                  </div>
                ) : (
                  <img
                    src={
                      profileImageUrl ||
                      'https://static-00.iconduck.com/assets.00/person-icon-1901x2048-a9h70k71.png'
                    }
                    alt='Profile'
                    className='w-40 h-40 rounded-full object-cover border-4 border-blue-600 shadow-lg'
                  />
                )}
              </div>

              <label className='cursor-pointer flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg'>
                <IoCloudUploadOutline size={24} />
                <span className='font-medium'>Choose Image</span>
                <input
                  type='file'
                  className='hidden'
                  onChange={handleImageChange}
                  accept='image/*'
                />
              </label>

              <button
                type='button'
                className='mt-4 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50'
                onClick={(e) =>
                  updateEmployerImage(parseInt(employerId as string))
                }
                disabled={updateState}
              >
                {updateState ? 'Updating...' : 'Save Image'}
              </button>
            </div>

            {/* Form Fields */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {/* Personal Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200'>
                  Personal Information
                </h3>

                <div>
                  <label
                    htmlFor='nickname'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Nickname
                  </label>
                  <input
                    type='text'
                    id='nickname'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200'
                    value={cashierDetails.employerNicName}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerNicName: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor='firstName'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    First Name
                  </label>
                  <input
                    type='text'
                    id='firstName'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200'
                    value={cashierDetails.employerFirstName}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerFirstName: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor='lastName'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Last Name
                  </label>
                  <input
                    type='text'
                    id='lastName'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200'
                    value={cashierDetails.employerLastName}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerLastName: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor='nicNumber'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    NIC Number
                  </label>
                  <input
                    type='text'
                    id='nicNumber'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200'
                    value={cashierDetails.employerNic}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerNic: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor='gender'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Gender
                  </label>
                  <select
                    id='gender'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white'
                    value={cashierDetails.gender}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        gender: e.target.value,
                      })
                    }
                  >
                    <option value='MALE'>Male</option>
                    <option value='FEMALE'>Female</option>
                    <option value='OTHER'>Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor='dateOfBirth'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Date of Birth
                  </label>
                  <input
                    type='date'
                    id='dateOfBirth'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200'
                    value={cashierDetails.dateOfBirth?.slice(0, 10)}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        dateOfBirth: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200'>
                  Contact Information
                </h3>

                <div>
                  <label
                    htmlFor='email'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Email Address
                  </label>
                  <input
                    type='email'
                    id='email'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200'
                    value={cashierDetails.employerEmail}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerEmail: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor='telephone'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    id='telephone'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200'
                    value={cashierDetails.employerPhone}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerPhone: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor='addressLine'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Address
                  </label>
                  <textarea
                    id='addressLine1'
                    rows={3}
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 resize-none'
                    value={cashierDetails.employerAddress}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerAddress: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Employment Details */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200'>
                  Employment Details
                </h3>

                <div>
                  <label
                    htmlFor='branch'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Branch
                  </label>
                  <select
                    id='branch'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-white'
                    value={cashierDetails.branchId}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        branchId: parseInt(e.target.value),
                      })
                    }
                  >
                    {branches.map((branch) => (
                      <option key={branch.branchId} value={branch.branchId}>
                        {branch.branchName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor='role'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Role
                  </label>
                  <input
                    type='text'
                    id='role'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200'
                    value={cashierDetails.role}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        role: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor='baseSalary'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Base Salary (LKR)
                  </label>
                  <input
                    type='number'
                    id='baseSalary'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200'
                    value={cashierDetails.employerSalary}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerSalary: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor='password'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Password
                  </label>
                  <input
                    type='password'
                    id='password'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200'
                    value={cashierDetails.employerPassword}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerPassword: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor='pin'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    PIN Code
                  </label>
                  <input
                    type='number'
                    id='pin'
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200'
                    value={cashierDetails.pin}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        pin: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 pt-8 border-t border-gray-200'>
              {updating ? (
                <Loader />
              ) : (
                <>
                  <button
                    type='button'
                    className='w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200'
                    onClick={(e) => goToBankDetails(cashierDetails)}
                  >
                    Update Employee
                  </button>
                  <Link
                    to='/manager-dashboard/cashiers'
                    className='w-full sm:w-auto px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-center'
                  >
                    Cancel
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateCashierDetails;
