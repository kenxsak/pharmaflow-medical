import { useEffect } from 'react';
import { FaPlus, FaUsers, FaUserCheck, FaMale, FaFemale } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { BsPencilSquare, BsEye } from 'react-icons/bs';
import useCashierService from '../services/CashierService';
import {
  calculateActiveWorkers,
  calculateMaleFemaleWorkers,
} from '../utils/cashierManagementUtils';
import { CashierDetailsType } from '../interfaces/CashierDetailsType';
import Loader from '../../../shared/Loader';

const CashierManagementDashboard = () => {
  const navigate = useNavigate();

  const {
    fetchEmployeeData,
    workers,
    setFilteredCashiers,
    filteredCashiers,
    loading,
  } = useCashierService();

  const handleSearch = (searchPhoneNumber: string) => {
    const filtered = workers.filter((cashier) =>
      cashier.employerPhone?.includes(searchPhoneNumber)
    );
    setFilteredCashiers(filtered);
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const onUpdateClick = (employer: CashierDetailsType) => {
    console.log(employer.employerId);
    navigate(`/update-cashier/${employer.employerId}`);
  };

  const onViewClick = (employer: CashierDetailsType) => {
    console.log(employer.employerId);
    navigate(`/view-cashier/${employer.employerId}`);
  };

  const onDeleteClick = (employer: CashierDetailsType) => {
    console.log(employer.employerId);
    // navigate('/view-cashier');
  };

  const { maleCount, femaleCount } = calculateMaleFemaleWorkers(workers);

  return (
    <div className='min-h-screen bg-gray-50 p-6 lg:p-8' data-testid='cashier-management-window'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
              <FaUsers className='text-blue-600' />
              Employee Management
            </h1>
            <p className='text-gray-500 mt-2'>Manage all employees and staff members</p>
          </div>
          <Link
            to='/add-cashier'
            className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2'
          >
            <FaPlus className='text-lg' />
            <span>Add Employee</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 font-medium'>Total Employees</p>
                <p className='text-3xl font-bold text-gray-900 mt-2'>{workers.length}</p>
              </div>
              <div className='bg-blue-100 p-3 rounded-lg'>
                <FaUsers className='text-blue-600 text-2xl' />
              </div>
            </div>
          </div>
          <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 font-medium'>Active Employees</p>
                <p className='text-3xl font-bold text-gray-900 mt-2'>{calculateActiveWorkers(workers)}</p>
              </div>
              <div className='bg-green-100 p-3 rounded-lg'>
                <FaUserCheck className='text-green-600 text-2xl' />
              </div>
            </div>
          </div>
          <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 font-medium'>Male Employees</p>
                <p className='text-3xl font-bold text-gray-900 mt-2'>{maleCount}</p>
              </div>
              <div className='bg-indigo-100 p-3 rounded-lg'>
                <FaMale className='text-indigo-600 text-2xl' />
              </div>
            </div>
          </div>
          <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-pink-500'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 font-medium'>Female Employees</p>
                <p className='text-3xl font-bold text-gray-900 mt-2'>{femaleCount}</p>
              </div>
              <div className='bg-pink-100 p-3 rounded-lg'>
                <FaFemale className='text-pink-600 text-2xl' />
              </div>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-bold text-gray-900'>Employee Details</h2>
              <input
                type='text'
                placeholder='Search by phone number'
                className='px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800 w-64'
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          <div className='overflow-x-auto'>
            {loading ? (
              <div className='p-8'>
                <Loader />
              </div>
            ) : (
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th scope='col' className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    ID
                  </th>
                  <th scope='col' className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Name
                  </th>
                  <th scope='col' className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Branch
                  </th>
                  <th scope='col' className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Phone
                  </th>
                  <th scope='col' className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Status
                  </th>
                  <th scope='col' className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Payment
                  </th>
                  <th scope='col' className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Salary
                  </th>
                  <th scope='col' className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {filteredCashiers.map((worker) => (
                    <tr
                      key={worker.employerId}
                      className='hover:bg-gray-50 transition-colors'
                    >
                      <td className='px-6 py-4 text-sm text-gray-900'>{worker.employerId}</td>
                      <td className='px-6 py-4 text-sm font-medium text-gray-900'>{worker.employerFirstName}</td>
                      <td className='px-6 py-4 text-sm text-gray-600'>{worker.branchId}</td>
                      <td className='px-6 py-4 text-sm text-gray-600'>{worker.employerPhone}</td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            worker.activeStatus
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {worker.activeStatus ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            worker.activeStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {worker.activeStatus ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                        LKR {worker.employerSalary?.toLocaleString()}
                      </td>
                      <td className='px-6 py-4 text-sm font-medium'>
                        <div className='flex items-center gap-2'>
                          <button
                            className='text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg'
                            onClick={() => onUpdateClick(worker)}
                            title='Edit Employee'
                          >
                            <BsPencilSquare className='text-lg' />
                          </button>
                          <button
                            className='text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg'
                            onClick={() => onViewClick(worker)}
                            title='View Employee'
                          >
                            <BsEye className='text-lg' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierManagementDashboard;
