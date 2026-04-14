import { toast } from 'react-toastify';
import { useUserContext } from '../context/UserContext';
import useAxiosInstance from '../features/login/services/useAxiosInstance';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  announcePharmaFlowContextChange,
  clearPharmaFlowSession,
} from '../utils/pharmaflowContext';
import { shouldCallLegacyLogout } from '../utils/legacySession';

const useAuthenticationService = () => {
  const { user, setUser, setCookie } = useUserContext();
  const navigate = useNavigate();
  const [log, setLog] = useState<boolean>();
  const http = useAxiosInstance();

  const logInUsingPin = async (pin: string) => {
    try {
      setLog(true);
      const res = await http.post('/session/authenticate/cached', {
        username: user?.employerEmail,
        pin: parseInt(pin),
      });

      const { authenticationResponse, employerDetails } = res.data || {};

      if (authenticationResponse?.access_token && employerDetails) {
        const { access_token, refresh_token } = authenticationResponse;

        // Set the token in context (will save to localStorage)
        setCookie(access_token);

        // Store refresh token
        if (refresh_token) {
          localStorage.setItem('refreshToken', refresh_token);
        }

        // Update user data in context
        setUser(employerDetails);

        toast.success(authenticationResponse.message || 'Successfully authenticated');
        navigate('/cashier-dashboard');
      } else {
        toast.error('Authentication failed');
      }
    } catch (error: any) {
      console.error('Cached authentication error:', error);
      toast.error(error?.response?.data?.message || 'Authentication failed');
    } finally {
      setLog(false);
    }
  };

  const [logging, setLogging] = useState<boolean>();

  const logOut = async () => {
    // Prompt for confirmation before logging out
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (!confirmed) return; // If user cancels logout, do nothing

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
      toast.success('Successfully logged out');
      setUser(null);
      setCookie(null);
      navigate('/legacy-login');
      setLogging(false);
    }
  };

  return {
    logInUsingPin,
    log,
    logOut,
    logging,
  };
};

export default useAuthenticationService;
