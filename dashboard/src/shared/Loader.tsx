import Lottie from 'lottie-react';
import loading from '../assets/lottie/loading.json';

function Loader() {
  return (
    <div className='flex justify-center items-center h-screen fixed top-0 left-0 right-0 bottom-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm z-50 animate-fade-in'>
      <div className='bg-white p-8 rounded-2xl shadow-2xl animate-slide-up'>
        <Lottie animationData={loading} style={{ width: 150, height: 150 }} />
        <p className='text-center mt-4 text-gray-600 font-medium'>Loading...</p>
      </div>
    </div>
  );
}

export default Loader;
