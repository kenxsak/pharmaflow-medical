import { useEffect, useState } from 'react';
import useItemService from '../services/ItemManagementServices';
import { BsBoxSeam, BsBoxes, BsExclamationTriangle } from 'react-icons/bs';
import { TbCirclePlus } from 'react-icons/tb';
import useOrderManagementService from '../../order-management-window/services/OrderManagementServices';
import { BiLoader } from 'react-icons/bi';
type Props = {};

function ItemManagementWindow({}: Props) {
  const { fetchAllItems, items, filteredItems, setFilteredItems, loading } =
    useItemService();
  const { fetchAllBranches, branches } = useOrderManagementService();

  const [selectedBranch, setSelectedBranch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSearch = (searchName: string) => {
    const filtered = items.filter((medicine) =>
      medicine.itemName.toLowerCase().includes(searchName.toLowerCase())
    );
    setFilteredItems(filtered);
  };
  useEffect(() => {
    fetchAllItems();
    fetchAllBranches();
  }, []);

  // Calculate summary information
  const totalItems = items.length;
  const inStockItems = items.reduce(
    (acc, item) => acc + (item.itemQuantity > 0 ? 1 : 0),
    0
  );
  const outOfStockItems = items.reduce(
    (acc, item) => acc + (item.itemQuantity === 0 ? 1 : 0),
    0
  );
  const averagePrice = (
    items.reduce((acc, item) => acc + item.sellingPrice, 0) / totalItems
  ).toFixed(2);

  useEffect(() => {
    const filter = filteredItems?.filter((item) => {
      if (selectedBranch === '' || selectedBranch === undefined) return true;
      return item.branchId?.toString() === selectedBranch;
    });

    const sortedItems = [...filter].sort((a, b) => {
      const dateA = new Date(a.expireDate).getTime();
      const dateB = new Date(b.expireDate).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredItems(sortedItems);
  }, [selectedBranch, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-800'>Inventory Management</h1>
          <p className='text-gray-600'>Manage and monitor your medicine inventory</p>
        </div>

        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
          {loading ? (
            <div className='col-span-4 flex justify-center py-8'>
              <BiLoader className='animate-spin text-4xl text-blue-600' />
            </div>
          ) : (
            <>
              <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>Total Items</p>
                    <p className='text-3xl font-bold text-gray-800 mt-2'>{totalItems}</p>
                  </div>
                  <div className='p-3 bg-blue-100 rounded-full'>
                    <BsBoxSeam className='text-2xl text-blue-600' />
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>In Stock</p>
                    <p className='text-3xl font-bold text-gray-800 mt-2'>{inStockItems}</p>
                  </div>
                  <div className='p-3 bg-green-100 rounded-full'>
                    <BsBoxes className='text-2xl text-green-600' />
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>Out of Stock</p>
                    <p className='text-3xl font-bold text-gray-800 mt-2'>{outOfStockItems}</p>
                  </div>
                  <div className='p-3 bg-red-100 rounded-full'>
                    <BsExclamationTriangle className='text-2xl text-red-600' />
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>Average Price</p>
                    <p className='text-3xl font-bold text-gray-800 mt-2'>LKR {averagePrice}</p>
                  </div>
                  <div className='p-3 bg-purple-100 rounded-full'>
                    <TbCirclePlus className='text-2xl text-purple-600' />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Table Section */}
        <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          {/* Table Header */}
          <div className='bg-blue-600 px-6 py-4 flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-white'>Medicine Inventory</h2>
            <input
              type='text'
              placeholder='Search by name...'
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64'
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Table Content */}
          <div className='overflow-x-auto'>
            {loading ? (
              <div className='flex justify-center py-12'>
                <BiLoader className='animate-spin text-4xl text-blue-600' />
              </div>
            ) : (
              <table className='w-full text-sm text-left'>
                <thead className='text-xs uppercase bg-blue-50 text-blue-700 sticky top-0'>
                  <tr>
                    <th scope='col' className='px-6 py-4'>
                      Medicine ID
                    </th>
                    <th scope='col' className='px-6 py-4'>
                      Name
                    </th>
                    <th scope='col' className='px-6 py-4'>
                      Description
                    </th>
                    <th scope='col' className='px-6 py-4'>
                      Price (LKR)
                    </th>
                    <th scope='col' className='px-6 py-4'>
                      Status
                    </th>
                    <th scope='col' className='px-6 py-4'>
                      Quantity
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-4 cursor-pointer hover:bg-blue-100 transition-colors'
                      onClick={toggleSortOrder}
                    >
                      <div className='flex items-center gap-1'>
                        Expire On
                        <span className='text-sm'>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {filteredItems.map((medicine) => (
                    <tr key={medicine.itemId} className='hover:bg-gray-50 transition-colors'>
                      <td className='px-6 py-4 font-medium text-gray-900'>{medicine.itemId}</td>
                      <td className='px-6 py-4 font-medium text-gray-900'>{medicine.itemName}</td>
                      <td className='px-6 py-4 text-gray-700'>{medicine.itemDescription}</td>
                      <td className='px-6 py-4 font-semibold text-gray-900'>
                        LKR {medicine.sellingPrice.toFixed(2)}
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            medicine.itemQuantity > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {medicine.itemQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            medicine.itemQuantity > 0
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {medicine.itemQuantity}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 font-medium ${
                          new Date(medicine.expireDate) < new Date()
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {medicine.expireDate?.split('T')[0]}
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
}

export default ItemManagementWindow;
