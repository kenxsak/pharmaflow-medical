import axios from 'axios';
import { useEffect, useMemo } from 'react';
import { useUserContext } from '../../../context/UserContext';
import { getLegacyApiBaseUrl } from '../../../utils/apiBaseUrls';

const useAxiosInstance = () => {
  const { cookie } = useUserContext();

  // Create axios instance once using useMemo
  const instance = useMemo(() => {
    return axios.create({
      baseURL: getLegacyApiBaseUrl(),
      headers: {
        'Content-type': 'application/json',
      },
    });
  }, []);

  useEffect(() => {
    // Request interceptor to dynamically add token to each request
    const requestInterceptor = instance.interceptors.request.use(
      (config) => {
        // Get the latest token from localStorage to ensure we have the most recent one
        const storedCookie = localStorage.getItem('cookie');
        const token = storedCookie ? JSON.parse(storedCookie) : null;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Don't override Content-Type for FormData - let browser set it with boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-type'];
          delete config.headers['Content-Type'];
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    const responseInterceptor = instance.interceptors.response.use(
      (response) => {
        // Handle successful responses
        return response;
      },
      (error) => {
        // Handle error responses
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      instance.interceptors.request.eject(requestInterceptor);
      instance.interceptors.response.eject(responseInterceptor);
    };
  }, [instance, cookie]);

  return instance;
};

export default useAxiosInstance;
