import { useState } from 'react';
import { useUserContext } from '../../../context/UserContext';
import useAxiosInstance from '../../../services/useAxiosInstance';
import { mapEmployeeReponseToIEmployee } from '../utils/mapEmployeeResponseToIEmployee';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'js-cookie';
import { IEmployeeInterface } from '../../../interfaces/IEmployeeInterface';

const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const { setCookie, setUser, user, setRefreshToken } = useUserContext();
  const http = useAxiosInstance();
  const navigate = useNavigate();

  const login = async (username: string, password: string) => {
    setLoading(true);

    try {
      const res = await http.post('/auth/authenticate', {
        employerEmail: username,
        employerPassword: password,
      });
      console.log(res);

      if (res.data.data?.authenticationResponse && res.data.data?.employerDetails) {
        const employee = mapEmployeeReponseToIEmployee(
          res.data.data.employerDetails
        );
        // console.log(employee);
        setUser(employee);
        if (employee.role.toLocaleLowerCase() === 'owner') {
          toast.success('Logged in as owner');
          navigate('/dashboard');
          //store cookie and user in local storage
          localStorage.setItem('user', JSON.stringify(employee));
          const accessToken = res.data.data.authenticationResponse.accessToken;
          const refreshToken = res.data.data.authenticationResponse.refreshToken;
          
          setCookie(accessToken);
          setRefreshToken(refreshToken);
          
          Cookies.set('Auth', accessToken, { expires: 7 });
          Cookies.set('RefreshToken', refreshToken, { expires: 30 });
          
          localStorage.setItem('refreshToken', JSON.stringify(refreshToken));
        } else {
          toast.error('Authentication failed: Incorrect username or password');
        }
        return employee;
      }
    } catch (error) {
      console.log(error);
      toast.error('error');
    } finally {
      setLoading(false);
    }
  };

  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  const logout = async () => {
    try {
      setLoggingOut(true);
      
      // Call backend logout endpoint
      await http.post('/auth/logout');
      
      // Clear all tokens and user data
      Cookies.remove('Auth');
      Cookies.remove('RefreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('cookie');
      localStorage.removeItem('refreshToken');
      
      setUser({} as IEmployeeInterface);
      setCookie('');
      setRefreshToken('');
      
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.log('Logout error:', error);
      // Even if backend call fails, clear local tokens
      Cookies.remove('Auth');
      Cookies.remove('RefreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('cookie');
      localStorage.removeItem('refreshToken');
      
      setUser({} as IEmployeeInterface);
      setCookie('');
      setRefreshToken('');
      
      navigate('/');
      toast.info('Logged out locally');
    } finally {
      setLoggingOut(false);
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const refreshToken = Cookies.get('RefreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const res = await http.post('/auth/refresh-token', {
        refreshToken: refreshToken,
      });

      if (res.data.data?.accessToken) {
        const newAccessToken = res.data.data.accessToken;
        
        setCookie(newAccessToken);
        Cookies.set('Auth', newAccessToken, { expires: 7 });
        
        return newAccessToken;
      }
      
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await logout();
      return null;
    }
  };

  return {
    login,
    loading,
    logout,
    loggingOut,
    refreshAccessToken,
  };
};

export default useAuth;
