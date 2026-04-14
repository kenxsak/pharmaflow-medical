import { CashierDetailsType } from '../../cashier-management-dashboard/interfaces/CashierDetailsType';
import { useNavigate } from 'react-router-dom';
import { BsPencilSquare, BsEye } from 'react-icons/bs';
import { useState } from 'react';

type Props = {
  branchEmployers: CashierDetailsType[];
};

function EmployerTable({ branchEmployers }: Props) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const onUpdateClick = (employer: CashierDetailsType) => {
    console.log(employer.employerId);
    navigate(`/update-cashier/${employer.employerId}`);
  };

  const onViewClick = (employer: CashierDetailsType) => {
    console.log(employer.employerId);
    navigate(`/view-cashier/${employer.employerId}`);
  };

  const filteredEmployers = branchEmployers.filter((employer) =>
    employer.employerFirstName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className='flex justify-between items-center mb-4'>
        <p className='text-lg font-semibold text-gray-800'>
          Employees in Branch
        </p>

        <div>
          <input
            type='text'
            placeholder='Search by name...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
        </div>
      </div>

      <div className='overflow-x-auto rounded-lg border border-gray-200'>
        <table className='w-full text-sm text-left'>
          <thead className='text-xs uppercase bg-blue-50 text-blue-700'>
          <tr>
            <th scope='col' className='px-6 py-3'>
              Cashier ID
            </th>
            <th scope='col' className='px-6 py-3'>
              Name
            </th>
            <th scope='col' className='px-6 py-3'>
              Gender
            </th>
            <th scope='col' className='px-6 py-3'>
              Phone Number
            </th>
            <th scope='col' className='px-6 py-3'>
              Active Status
            </th>
            <th scope='col' className='px-6 py-3'>
              Monthly Payment Status
            </th>
            <th scope='col' className='px-6 py-3'>
              Salary
            </th>
            <th scope='col' className='px-6 py-3'></th>
          </tr>
        </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {filteredEmployers.map((worker) => (
              <tr
                key={worker.employerId}
                className='hover:bg-gray-50 transition-colors'
              >
                <td className='px-6 py-4 font-medium text-gray-900'>{worker.employerId}</td>
                <td className='px-6 py-4 text-gray-700'>{worker.employerFirstName}</td>
                <td className='px-6 py-4 text-gray-700 capitalize'>{worker.gender.toLowerCase()}</td>
                <td className='px-6 py-4 text-gray-700'>{worker.employerPhone}</td>
                <td className='px-6 py-4'>
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      worker.activeStatus
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {worker.activeStatus ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td className='px-6 py-4'>
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      worker.activeStatus
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {worker.activeStatus ? 'Paid' : 'Not Paid'}
                  </span>
                </td>
                <td className='px-6 py-4 font-medium text-gray-900'>LKR {worker.employerSalary}</td>
                <td className='px-6 py-4'>
                  <div className='flex gap-2'>
                    <button
                      className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                      onClick={() => onUpdateClick(worker)}
                      title='Edit'
                    >
                      <BsPencilSquare className='text-lg' />
                    </button>
                    <button
                      className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                      onClick={() => onViewClick(worker)}
                      title='View'
                    >
                      <BsEye className='text-lg' />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default EmployerTable;
