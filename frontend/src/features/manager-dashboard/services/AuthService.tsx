import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContext';
import useAxiosInstance from '../../login/services/useAxiosInstance';
import { toast } from 'react-toastify';
import { useState } from 'react';
import {
  announcePharmaFlowContextChange,
  clearPharmaFlowSession,
} from '../../../utils/pharmaflowContext';

const useAuthService = () => {
  const http = useAxiosInstance();
  const { user, setUser, setCookie } = useUserContext();
  const navigate = useNavigate();
  const [logging, setLogging] = useState<boolean>();

  const logOut = async () => {
    const confirm = window.confirm('Are you sure log out ?');

    if (confirm) {
      try {
        setLogging(true);
        await http.post('/session/logout/permanent', {
          username: user?.employerEmail,
        });
      } catch (error) {
        console.log(error);
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

  return { logOut, logging };
};

export default useAuthService;
