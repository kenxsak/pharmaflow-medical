import { useState } from 'react';
import { useUserContext } from '../../../context/UserContext';
import useAxiosInstance from '../../login/services/useAxiosInstance';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  announcePharmaFlowContextChange,
  clearPharmaFlowSession,
} from '../../../utils/pharmaflowContext';
import { shouldCallLegacyLogout } from '../../../utils/legacySession';

const useAuthService = () => {
  const { user, setUser, setCookie } = useUserContext();
  const http = useAxiosInstance();
  const [logging, setLogging] = useState<boolean>();
  const navigate = useNavigate();

  const logOutCashier = async () => {
    const confirm = window.confirm('Are you sure log out ?');

    if (confirm) {
      try {
        setLogging(true);
        if (shouldCallLegacyLogout(user)) {
          await http.post('/session/logout/permanent', {
            username: user?.employerEmail,
          });
        }
      } catch (error) {
      } finally {
        clearPharmaFlowSession();
        announcePharmaFlowContextChange();
        toast.success('Logged out successfully');
        setUser(null);
        setCookie(null);
        navigate('/legacy-login');
        setLogging(false);
      }
    }
  };

  const [temporayLogout, setTemporaryLogout] = useState<boolean>();
  const temporaryLogOutCashier = async () => {
    const confirm = window.confirm('Are you sure log out ?');

    if (confirm) {
      try {
        setTemporaryLogout(true);
        const res = await http.post('/session/logout/temporary', {
          username: user?.employerEmail,
        });

        if (res.data.code === 200) {
          toast.success(res.data.message || 'Logged out successfully');
          navigate('/temporary-logout');
        } else {
          toast.error(res.data.message || 'Logout failed');
        }
      } catch (error: any) {
        console.error('Temporary logout error:', error);
        toast.error(error?.response?.data?.message || 'Failed to logout');
      } finally {
        setTemporaryLogout(false);
      }
    }
  };

  return {
    logOutCashier,
    logging,
    temporaryLogOutCashier,
    temporayLogout,
  };
};

export default useAuthService;
