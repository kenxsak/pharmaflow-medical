import { useState } from 'react';
import { useUserContext } from '../../../context/UserContext';
import { IEmployeeInterface } from '../../../interfaces/IEmployeeInterface';
import { AuthAPI } from '../../../services/api';
import { saveBranding } from '../../../utils/branding';
import {
  announcePharmaFlowContextChange,
  savePharmaFlowSession,
} from '../../../utils/pharmaflowContext';
import {
  inferTenantSlugForLegacyLogin,
  mapPharmaFlowAuthToLegacyEmployee,
} from '../utils/mapPharmaFlowAuthToLegacyEmployee';

const useSignIn = () => {
  const [loading, setLoading] = useState(false);
  const { setCookie, setUser } = useUserContext();

  const signIn = async (
    username: string,
    password: string
  ): Promise<IEmployeeInterface | null> => {
    setLoading(true);
    try {
      const tenantSlug = inferTenantSlugForLegacyLogin(username);
      const response = await AuthAPI.login(
        username.trim(),
        password.trim(),
        tenantSlug
      );
      const employee = mapPharmaFlowAuthToLegacyEmployee(response);

      savePharmaFlowSession(response);
      saveBranding({
        brandName: response.brandName || 'PharmaFlow',
        tagline:
          response.brandTagline ||
          'Retail pharmacy operations, billing, and compliance workspace',
        supportEmail: response.supportEmail || 'support@pharmaflow.in',
        supportPhone: response.supportPhone || '+91 44 4000 9000',
        deploymentMode:
          response.deploymentMode || 'Hybrid cloud + branch-local operations',
      });

      localStorage.removeItem('refreshToken');
      announcePharmaFlowContextChange();

      if (response.token) {
        setUser(employee);
        setCookie(response.token);

        return employee;
      }
    } catch (error) {
      console.log(error);
      alert(
        'Unable to sign in. Please check the username, password, and tenant setup.'
      );
    } finally {
      setLoading(false);
    }

    return null;
  };

  return { signIn, loading };
};

export default useSignIn;
