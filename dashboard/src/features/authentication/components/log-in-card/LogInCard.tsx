import { CiUser } from 'react-icons/ci';
import { RiLockPasswordLine } from 'react-icons/ri';
import { BiHide, BiShow } from 'react-icons/bi';
import { FiMail } from 'react-icons/fi';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import Logo from '../../../../assets/logo.png';
import useAuth from '../../services/AuthService';
import { useState } from 'react';

type Props = {};

function LogInCard({}: Props) {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      login(username, password);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className='flex flex-col lg:flex-row items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50'>
      {/* Left Side - Branding */}
      <div className='hidden lg:flex lg:w-1/2 h-screen items-center justify-center p-12 bg-gradient-to-br from-primary-600 to-primary-800'>
        <div className='text-center animate-fade-in'>
          <div className='mb-8 flex justify-center'>
            <div className='bg-white p-6 rounded-full shadow-2xl'>
              <img src={Logo} alt='LifePill Logo' className='w-32 h-32' />
            </div>
          </div>
          <h1 className='text-5xl font-bold text-white mb-4 tracking-tight'>
            LifePill Manager
          </h1>
          <p className='text-xl text-primary-100 mb-8 max-w-md mx-auto'>
            Your Complete Pharmacy Management Solution
          </p>
          <div className='flex items-center justify-center space-x-6 text-primary-100'>
            <div className='text-center'>
              <HiOutlineShieldCheck className='text-4xl mx-auto mb-2' />
              <p className='text-sm'>Secure</p>
            </div>
            <div className='text-center'>
              <svg className='w-10 h-10 mx-auto mb-2' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z' />
              </svg>
              <p className='text-sm'>Analytics</p>
            </div>
            <div className='text-center'>
              <svg className='w-10 h-10 mx-auto mb-2' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' />
              </svg>
              <p className='text-sm'>Multi-User</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12'>
        <div className='w-full max-w-md animate-slide-up'>
          {/* Mobile Logo */}
          <div className='lg:hidden flex justify-center mb-8'>
            <img src={Logo} alt='LifePill Logo' className='w-20 h-20' />
          </div>

          {/* Login Card */}
          <div className='bg-white p-8 lg:p-10 rounded-2xl shadow-soft border border-gray-100'>
            <div className='mb-8'>
              <h2 className='text-3xl font-bold text-gray-900 mb-2'>
                Welcome Back
              </h2>
              <p className='text-gray-600'>
                Please enter your credentials to continue
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email Input */}
              <div className='mb-5'>
                <label className='label-text' htmlFor='email'>
                  Email Address
                </label>
                <div
                  className={`relative flex items-center transition-all duration-200 ${
                    focusedInput === 'email'
                      ? 'transform scale-[1.01]'
                      : ''
                  }`}
                >
                  <FiMail
                    className={`absolute left-3 text-xl transition-colors duration-200 ${
                      focusedInput === 'email'
                        ? 'text-primary-600'
                        : 'text-gray-400'
                    }`}
                  />
                  <input
                    id='email'
                    type='email'
                    placeholder='manager@lifepill.com'
                    className='w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className='mb-6'>
                <label className='label-text' htmlFor='password'>
                  Password
                </label>
                <div
                  className={`relative flex items-center transition-all duration-200 ${
                    focusedInput === 'password'
                      ? 'transform scale-[1.01]'
                      : ''
                  }`}
                >
                  <RiLockPasswordLine
                    className={`absolute left-3 text-xl transition-colors duration-200 ${
                      focusedInput === 'password'
                        ? 'text-primary-600'
                        : 'text-gray-400'
                    }`}
                  />
                  <input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Enter your password'
                    className='w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 text-gray-400 hover:text-primary-600 transition-colors duration-200 focus:outline-none'
                    disabled={loading}
                  >
                    {showPassword ? (
                      <BiHide className='text-xl' />
                    ) : (
                      <BiShow className='text-xl' />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className='flex items-center justify-between mb-6'>
                <label className='flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    className='w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer'
                  />
                  <span className='ml-2 text-sm text-gray-600'>
                    Remember me
                  </span>
                </label>
                <a
                  href='#'
                  className='text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200'
                >
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type='submit'
                disabled={loading || !username || !password}
                className={
                  loading || !username || !password
                    ? 'w-full py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-semibold'
                    : 'w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
                }
              >
                {loading ? (
                  <div className='flex items-center justify-center'>
                    <svg
                      className='animate-spin h-5 w-5 mr-3 text-white'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className='mt-6 pt-6 border-t border-gray-200 text-center'>
              <p className='text-sm text-gray-600'>
                Need help?{' '}
                <a
                  href='#'
                  className='text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200'
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>

          {/* Version Info */}
          <div className='mt-6 text-center text-sm text-gray-500'>
            <p>© 2024 LifePill. All rights reserved.</p>
            <p className='mt-1'>Version 2.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogInCard;
