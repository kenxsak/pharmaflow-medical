import { ChangeEvent, useEffect, useState } from 'react';
import { IoCloudUploadOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { FaUser, FaIdCard, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaBriefcase, FaVenusMars, FaImage } from 'react-icons/fa';
import { ComponentState, useCashierContext } from '../../layouts/AddCashier';
import useCashierCRUDService from '../../services/cashierCRUDService';

const CashierDetails = () => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { setCurrentComponent, cashierDetails, setCashierDetails } =
    useCashierContext();

  const {
    createCashier,
    loading,
    fetchAllBranches,
    branches,
    setProfilePicture,
    profilePicture,
  } = useCashierCRUDService();

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
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const goToBankDetails = () => {
    // console.log(cashierDetails);
    createCashier(cashierDetails).then((res: any) => {
      if (res) {
        setCashierDetails({
          ...cashierDetails,
          employerId: res,
        });
      }
    });
  };

  useEffect(() => {
    fetchAllBranches();
  }, []);

  return (
    <div className='min-h-screen bg-gray-50 p-6 lg:p-8'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='bg-blue-100 p-3 rounded-lg'>
              <FaUser className='text-blue-600 text-2xl' />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>Add New Employee</h1>
              <p className='text-gray-500 text-sm'>Fill in the employee details below</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className='bg-white rounded-lg shadow-md p-8'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
            {/* Image Upload Section */}
            <div className='lg:col-span-1'>
              <label className='text-sm font-semibold text-gray-700 mb-3 block'>
                Profile Photo
              </label>
              <div className='flex flex-col items-center gap-4'>
                {profilePicture ? (
                  <img
                    src={cashierDetails.profileImageUrl}
                    alt='Preview'
                    className='w-48 h-48 rounded-lg object-cover shadow-md'
                  />
                ) : (
                  <div className='w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300'>
                    <FaUser className='text-6xl text-gray-300' />
                  </div>
                )}
                <label className='w-full cursor-pointer'>
                  <div className='bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg p-3 flex flex-col items-center gap-2 transition-colors'>
                    <IoCloudUploadOutline className='text-2xl text-blue-600' />
                    <span className='text-sm font-semibold text-blue-600'>Upload Photo</span>
                  </div>
                  <input
                    type='file'
                    className='hidden'
                    onChange={handleImageChange}
                    accept='image/*'
                  />
                </label>
              </div>
            </div>

            {/* Form Fields - 3 Columns */}
            <div className='lg:col-span-3'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {/* Nickname */}
                <div>
                  <label htmlFor='nickname' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaUser className='text-blue-600' />
                    Nickname
                  </label>
                  <input
                    type='text'
                    id='nickname'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
                    value={cashierDetails.employerNicName}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerNicName: e.target.value,
                      })
                    }
                  />
                </div>

                {/* First Name */}
                <div>
                  <label htmlFor='firstName' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaUser className='text-blue-600' />
                    First Name
                  </label>
                  <input
                    type='text'
                    id='firstName'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
                    value={cashierDetails.employerFirstName}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerFirstName: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor='lastName' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaUser className='text-blue-600' />
                    Last Name
                  </label>
                  <input
                    type='text'
                    id='lastName'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
                    value={cashierDetails.employerLastName}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerLastName: e.target.value,
                      })
                    }
                  />
                </div>

                {/* NIC Number */}
                <div>
                  <label htmlFor='nicNumber' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaIdCard className='text-blue-600' />
                    NIC Number
                  </label>
                  <input
                    type='text'
                    id='nicNumber'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
                    value={cashierDetails.employerNic}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerNic: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor='telephone' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaPhone className='text-blue-600' />
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    id='telephone'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
                    value={cashierDetails.employerPhone}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerPhone: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor='email' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaEnvelope className='text-blue-600' />
                    Email
                  </label>
                  <input
                    type='email'
                    id='email'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
                    value={cashierDetails.employerEmail}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerEmail: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Branch */}
                <div>
                  <label htmlFor='branch' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaBriefcase className='text-blue-600' />
                    Branch
                  </label>
                  <select
                    id='branch'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
                    value={cashierDetails.branchId}
                    onChange={(e) =>
                      setCashierDetails({ ...cashierDetails, branchId: e.target.value })
                    }
                  >
                    <option value=''>Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branchId} value={branch.branchId}>{branch.branchName}</option>
                    ))}
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor='gender' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaVenusMars className='text-blue-600' />
                    Gender
                  </label>
                  <select
                    id='gender'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
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

                {/* Date of Birth */}
                <div>
                  <label htmlFor='dateOfBirth' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaCalendarAlt className='text-blue-600' />
                    Date of Birth
                  </label>
                  <input
                    type='date'
                    id='dateOfBirth'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
                    value={cashierDetails.dateOfBirth.toISOString().split('T')[0]}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        dateOfBirth: new Date(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Address - Full Width */}
                <div className='md:col-span-3'>
                  <label htmlFor='addressLine' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaMapMarkerAlt className='text-blue-600' />
                    Address
                  </label>
                  <input
                    type='text'
                    id='addressLine1'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
                    value={cashierDetails.employerAddress}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerAddress: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Role */}
                <div>
                  <label htmlFor='role' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaBriefcase className='text-blue-600' />
                    Role
                  </label>
                  <input
                    type='text'
                    id='role'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800 bg-gray-50'
                    value={cashierDetails.role}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        role: e.target.value,
                      })
                    }
                    readOnly
                  />
                </div>

                {/* Salary */}
                <div>
                  <label htmlFor='baseSalary' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaDollarSign className='text-blue-600' />
                    Base Salary (LKR)
                  </label>
                  <input
                    type='number'
                    id='baseSalary'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
                    value={cashierDetails.employerSalary}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerSalary: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                {/* PIN */}
                <div>
                  <label htmlFor='pin' className='text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2'>
                    <FaIdCard className='text-blue-600' />
                    PIN
                  </label>
                  <input
                    type='number'
                    id='pin'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
                    value={cashierDetails.pin}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        pin: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Password - Full Width */}
                <div className='md:col-span-3'>
                  <label htmlFor='password' className='text-sm font-semibold text-gray-700 mb-2 block'>
                    Password
                  </label>
                  <input
                    type='password'
                    id='password'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800'
                    value={cashierDetails.employerPassword}
                    onChange={(e) =>
                      setCashierDetails({
                        ...cashierDetails,
                        employerPassword: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200'>
            <Link to='/manager-dashboard/cashiers'>
              <button
                type='button'
                className='px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-300 transition-all duration-200'
              >
                Cancel
              </button>
            </Link>
            <button
              type='button'
              className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              onClick={goToBankDetails}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CashierDetails;
