import React, { useState } from 'react';
import { Order } from '../interfaces/OrderDetails';
import { formatDate } from '../utils/formatDate';
import { BsBuilding, BsPerson, BsCalendar, BsCurrencyDollar, BsX, BsReceipt, BsBoxSeam } from 'react-icons/bs';

type Props = {
  order: Order;
};

function OrderCardComponent({ order }: Props) {
  const [showModal, setShowModal] = useState(false);

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  return (
    <>
      {/* Order Card */}
      <div className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden'>
        <div className='bg-gradient-to-r from-blue-500 to-blue-600 p-4'>
          <div className='flex items-center justify-between text-white'>
            <div className='flex items-center gap-2'>
              <BsReceipt className='text-xl' />
              <span className='font-semibold'>Order #{order.orderId}</span>
            </div>
            <div className='text-right'>
              <p className='text-2xl font-bold'>LKR {order.total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className='p-4 space-y-3'>
          <div className='flex items-center gap-2 text-gray-700'>
            <BsCalendar className='text-blue-600' />
            <span className='text-sm'>{formatDate(order.orderDate)}</span>
          </div>

          <div className='flex items-center gap-2 text-gray-700'>
            <BsBuilding className='text-blue-600' />
            <span className='text-sm'>Branch #{order.branchId}</span>
          </div>

          <div className='flex items-center gap-2 text-gray-700'>
            <BsPerson className='text-blue-600' />
            <span className='text-sm'>Employee #{order.employerId}</span>
          </div>

          <div className='flex items-center gap-2 text-gray-700'>
            <BsBoxSeam className='text-blue-600' />
            <span className='text-sm'>{order.groupedOrderDetails.orderCount} Items</span>
          </div>

          <button
            type='button'
            className='w-full mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors'
            onClick={toggleModal}
          >
            View Details
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'>
            {/* Modal Header */}
            <div className='bg-blue-600 text-white px-6 py-4 flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <BsReceipt className='text-2xl' />
                <div>
                  <h2 className='text-xl font-semibold'>Order Details</h2>
                  <p className='text-sm text-blue-100'>Order #{order.orderId}</p>
                </div>
              </div>
              <button
                onClick={toggleModal}
                className='p-2 hover:bg-blue-700 rounded-full transition-colors'
              >
                <BsX className='text-3xl' />
              </button>
            </div>

            {/* Modal Content */}
            <div className='p-6 overflow-y-auto flex-1'>
              {/* Order Summary */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <h3 className='text-sm font-semibold text-gray-700 mb-3'>Order Information</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Order Date:</span>
                      <span className='font-medium'>{formatDate(order.orderDate)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Branch ID:</span>
                      <span className='font-medium'>#{order.branchId}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Employee ID:</span>
                      <span className='font-medium'>#{order.employerId}</span>
                    </div>
                  </div>
                </div>

                <div className='bg-gray-50 rounded-lg p-4'>
                  <h3 className='text-sm font-semibold text-gray-700 mb-3'>Payment Summary</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Total Items:</span>
                      <span className='font-medium'>{order.groupedOrderDetails.orderCount}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Total Amount:</span>
                      <span className='font-bold text-blue-600 text-lg'>LKR {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className='mb-6'>
                <h3 className='text-lg font-semibold text-gray-800 mb-4'>Order Items</h3>
                <div className='overflow-x-auto rounded-lg border border-gray-200'>
                  <table className='w-full text-sm text-left'>
                    <thead className='text-xs uppercase bg-blue-50 text-blue-700'>
                      <tr>
                        <th scope='col' className='px-6 py-3'>Item ID</th>
                        <th scope='col' className='px-6 py-3'>Name</th>
                        <th scope='col' className='px-6 py-3'>Amount</th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {order.groupedOrderDetails.orderDetails.map((orderDetail) => (
                        <tr key={orderDetail.id.toString()} className='hover:bg-gray-50'>
                          <td className='px-6 py-4 font-medium text-gray-900'>{orderDetail.id}</td>
                          <td className='px-6 py-4 text-gray-700'>{orderDetail.name}</td>
                          <td className='px-6 py-4 font-semibold text-gray-900'>{orderDetail.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className='text-lg font-semibold text-gray-800 mb-4'>Payment Details</h3>
                {order.groupedOrderDetails.paymentDetails ? (
                  <div className='overflow-x-auto rounded-lg border border-gray-200'>
                    <table className='w-full text-sm text-left'>
                      <thead className='text-xs uppercase bg-blue-50 text-blue-700'>
                        <tr>
                          <th scope='col' className='px-6 py-3'>Payment Method</th>
                          <th scope='col' className='px-6 py-3'>Amount</th>
                          <th scope='col' className='px-6 py-3'>Date</th>
                          <th scope='col' className='px-6 py-3'>Discount</th>
                          <th scope='col' className='px-6 py-3'>Notes</th>
                        </tr>
                      </thead>
                      <tbody className='bg-white'>
                        <tr className='hover:bg-gray-50'>
                          <td className='px-6 py-4 font-medium text-gray-900'>
                            {order.groupedOrderDetails.paymentDetails.paymentMethod}
                          </td>
                          <td className='px-6 py-4 font-semibold text-gray-900'>
                            LKR {order.groupedOrderDetails.paymentDetails.paymentAmount}
                          </td>
                          <td className='px-6 py-4 text-gray-700'>
                            {order.groupedOrderDetails.paymentDetails.paymentDate.slice(0, 10)}
                          </td>
                          <td className='px-6 py-4 text-gray-700'>
                            {order.groupedOrderDetails.paymentDetails.paymentDiscount || 'N/A'}
                          </td>
                          <td className='px-6 py-4 text-gray-700'>
                            {order.groupedOrderDetails.paymentDetails.paymentNotes || 'N/A'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className='bg-gray-50 rounded-lg p-6 text-center'>
                    <p className='text-gray-500'>No payment details available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className='bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200'>
              <button
                onClick={toggleModal}
                className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OrderCardComponent;
