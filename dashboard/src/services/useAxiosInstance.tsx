import axios from 'axios';
import { useEffect, useRef } from 'react';
import { useUserContext } from '../context/UserContext';
import { getCookie } from '../utils/getCookie';
import Cookies from 'js-cookie';

function useAxiosInstance() {
  const { cookie } = useUserContext();
  const isRefreshing = useRef(false);
  const failedQueue = useRef<any[]>([]);

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.current.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    failedQueue.current = [];
  };

  const instance = axios.create({
    baseURL: 'https://api.lifepill.devnerd.online/lifepill/v1',
    // baseURL: 'http://35.208.197.159:9191/lifepill/v1',
    // baseURL: '/lifepill/v1',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getCookie('Auth')}`,
    },
  });

  console.log(getCookie('Auth'));

  useEffect(() => {
    // Update instance headers when cookie changes
    instance.defaults.headers.common['Authorization'] = `Bearer ${getCookie(
      'Auth'
    )}`;
    console.log(`Bearer ${getCookie('Auth')}`);
  }, [cookie, instance]);

  useEffect(() => {
    // console.log(cookie);
    instance.interceptors.response.use(
      (response) => {
        // Handle successful responses
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing.current) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              failedQueue.current.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers['Authorization'] = 'Bearer ' + token;
                return instance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing.current = true;

          try {
            const refreshToken = Cookies.get('RefreshToken');

            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Call refresh token endpoint
            const res = await axios.post(
              'https://api.lifepill.devnerd.online/lifepill/v1/auth/refresh-token',
              { refreshToken }
            );

            if (res.data.data?.accessToken) {
              const newAccessToken = res.data.data.accessToken;
              Cookies.set('Auth', newAccessToken, { expires: 7 });

              // Update axios instance header
              instance.defaults.headers.common['Authorization'] =
                `Bearer ${newAccessToken}`;
              originalRequest.headers['Authorization'] =
                `Bearer ${newAccessToken}`;

              processQueue(null, newAccessToken);
              isRefreshing.current = false;

              return instance(originalRequest);
            }
          } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing.current = false;

            // Clear tokens and redirect to login
            Cookies.remove('Auth');
            Cookies.remove('RefreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('cookie');
            localStorage.removeItem('refreshToken');

            window.location.href = '/';
            return Promise.reject(refreshError);
          }
        }

        // Handle other error responses
        if (error.response) {
          console.log('Response error status:', error.response.status);
          console.log('Response error data:', error.response.data);
        } else if (error.request) {
          console.log('Request error:', error.request);
        } else {
          console.log('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }, [instance]);

  return instance;
}

export default useAxiosInstance;
