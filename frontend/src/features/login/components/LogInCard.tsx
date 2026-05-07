import { useState } from 'react';
import { CiUser } from 'react-icons/ci';
import { RiLockPasswordLine } from 'react-icons/ri';

import { useNavigate } from 'react-router-dom';
import useSignIn from '../services/AuthService';
import { useUserContext } from '../../../context/UserContext';
import EulaComponent from './EulaComponent';
import { Loader } from 'lucide-react';
import { getPharmaFlowHomePath, readPharmaFlowContext } from '../../../utils/pharmaflowContext';
import BrandLogo from '../../../shared/brand/BrandLogo';

const LogInCard = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { setUser } = useUserContext();
  const [showEula, setShowEula] = useState(false);
  const handleShowEula = () => {
    setShowEula(!showEula);
  };

  const navigate = useNavigate();

  const { signIn, loading } = useSignIn();

  const handleSignIn = async () => {
    const user = await signIn(username, password);
    if (user) {
      setUser(user);
      const pharmaFlowHomePath = getPharmaFlowHomePath(
        readPharmaFlowContext()
      );
      navigate(
        pharmaFlowHomePath !== '/login'
          ? pharmaFlowHomePath
          : user.role === 'OWNER'
            ? '/manager-dashboard/Dashboard'
            : '/cashier-dashboard'
      );
    }
  };

  return (
    <div className='font-poppins flex min-h-[72vh] w-[min(92vw,30rem)] flex-col items-center justify-center space-y-8 rounded-2xl p-6 shadow-lg md:p-8'>
      <BrandLogo
        variant='wordmark'
        className='w-full justify-center'
        imageClassName='h-24 max-w-[320px]'
      />

      {/* title text of the page */}
      <div className='text-center'>
        <h1 className='text-2xl font-bold'>Log in to MedInOne</h1>
        <p className='text-sm text-slate-500'>One workspace for billing, stock, compliance, and delivery.</p>
      </div>

      {/* input fields for username password */}
      <div className='w-full'>
        <div className='my-4 w-full'>
          <label
            htmlFor='username'
            className='block text-gray-800 font-semibold text-sm'
          >
            Username
          </label>
          <div className='relative flex items-center'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-2'>
              <CiUser />
            </div>
            <input
              type='text'
              name='username'
              className='block w-full pl-8 rounded-md py-1.5 px-2 ring-1 focus:ring-blue'
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>
        <div className='my-4 w-full'>
          <label
            htmlFor='password'
            className='block text-gray-800 font-semibold text-sm'
          >
            Password
          </label>
          <div className='relative flex items-center'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-2'>
              <RiLockPasswordLine />
            </div>
            <input
              type='password'
              name='password'
              className='block w-full pl-8 rounded-md py-1.5 px-2 ring-1 focus:ring-blue'
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <p className='text-red cursor-pointer text-sm' onClick={handleShowEula}>
          Forgot Password?
        </p>
      </div>
      {/* Buttons */}
      <div>
        <button className='signup_button' onClick={handleSignIn}>
          {loading ? (
            <Loader className='flex justify-center items-center' />
          ) : (
            'Sign In'
          )}
        </button>
      </div>

      {/* User agreement bar */}
      <p className='text-sm pt-12 cursor-pointer' onClick={handleShowEula}>
        End User Agreement
      </p>

      {showEula && <EulaComponent OnClose={handleShowEula} />}
    </div>
  );
};

export default LogInCard;
