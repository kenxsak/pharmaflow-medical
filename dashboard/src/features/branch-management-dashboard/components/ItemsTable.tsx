import React, { useState } from 'react';
import { Item } from '../../item-management-window/interfaces/Item';

type Props = {
  items: Item[];
};

function ItemsTable({ items }: Props) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredItems = items.filter((item) =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    const dateA = new Date(a.expireDate).getTime();
    const dateB = new Date(b.expireDate).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <>
      <div className='flex justify-between items-center mb-4'>
        <p className='text-lg font-semibold text-gray-800'>
          Inventory Items
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
              Medicine ID
            </th>
            <th scope='col' className='px-6 py-3'>
              Description
            </th>
            <th scope='col' className='px-6 py-3'>
              Name
            </th>
            <th scope='col' className='px-6 py-3'>
              Price (LKR) per Unit
            </th>
            <th scope='col' className='px-6 py-3'>
              Status
            </th>
            <th scope='col' className='px-6 py-3'>
              Quantity
            </th>
            <th
              scope='col'
              className='px-6 py-3 cursor-pointer'
              onClick={toggleSortOrder}
            >
              Expire On
              {sortOrder === 'asc' ? '↑' : '↓'}
            </th>
          </tr>
        </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {sortedItems.map((medicine) => (
              <tr key={medicine.itemId} className='hover:bg-gray-50 transition-colors'>
                <td className='px-6 py-4 font-medium text-gray-900'>{medicine.itemId}</td>
                <td className='px-6 py-4 text-gray-700'>{medicine.itemDescription}</td>
                <td className='px-6 py-4 font-medium text-gray-900'>{medicine.itemName}</td>
                <td className='px-6 py-4 text-gray-700'>
                  <span className='font-semibold'>LKR {medicine.sellingPrice}</span> per {medicine.measuringUnitType}
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
                  {medicine.expireDate.split('T')[0]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ItemsTable;
