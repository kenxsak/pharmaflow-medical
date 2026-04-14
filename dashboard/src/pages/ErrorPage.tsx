import React from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {};

function ErrorPage({}: Props) {
  const navigate = useNavigate();
  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100'>
      <div className='bg-white p-4 sm:p-8 shadow-md rounded-md text-center w-full sm:w-96'>
        <h1 className='text-2xl font-bold mb-4'>404 - Page Not Found</h1>
        <p className='text-gray-600 mb-6'>
          Oops! The page you're looking for does not exist.
        </p>
        <button
          className='bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded focus:outline-none focus:ring focus:ring-red-500 w-full sm:w-auto'
          onClick={(e) => {
            navigate('/');
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

export default ErrorPage;
