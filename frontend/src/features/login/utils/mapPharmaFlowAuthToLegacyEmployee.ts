import type { AuthResponse } from '../../../services/api';
import type { IEmployeeInterface } from '../../../interfaces/IEmployeeInterface';

const hashUsernameToNumber = (username: string) =>
  Array.from(username).reduce((accumulator, character) => {
    return (accumulator * 31 + character.charCodeAt(0)) % 100000;
  }, 7000);

const splitFullName = (fullName: string) => {
  const normalized = fullName.trim();
  if (!normalized) {
    return {
      firstName: 'Legacy',
      lastName: 'User',
    };
  }

  const [firstName, ...rest] = normalized.split(/\s+/);
  return {
    firstName,
    lastName: rest.join(' ') || 'User',
  };
};

const deriveLegacyBranchId = (response: AuthResponse) => {
  const digits = response.storeCode?.match(/\d+/g)?.join('') || '';
  if (digits) {
    return Number(digits.slice(-4));
  }

  return response.platformOwner ? 999 : 1;
};

export const inferTenantSlugForLegacyLogin = (username: string) => {
  const normalized = username.trim().toLowerCase();

  if (!normalized || normalized === 'admin') {
    return undefined;
  }

  if (normalized.endsWith('@pharmaflow.in')) {
    return 'pharmaflow';
  }

  const cachedTenantSlug = localStorage.getItem('pharmaflow_tenant_slug')?.trim();
  return cachedTenantSlug || undefined;
};

export const mapPharmaFlowRoleToLegacyRole = (response: AuthResponse) => {
  if (response.platformOwner || ['SUPER_ADMIN', 'STORE_MANAGER'].includes(response.role)) {
    return 'OWNER';
  }

  return 'CASHIER';
};

export const mapPharmaFlowAuthToLegacyEmployee = (
  response: AuthResponse
): IEmployeeInterface => {
  const { firstName, lastName } = splitFullName(response.fullName);
  const legacyRole = mapPharmaFlowRoleToLegacyRole(response);
  const employerId = hashUsernameToNumber(response.username);

  return {
    employerId,
    branchId: deriveLegacyBranchId(response),
    employerNicName: response.storeCode || response.username,
    employerFirstName: firstName,
    employerLastName: lastName,
    employerEmail: response.username,
    employerPhone: response.supportPhone || '',
    employerAddress: response.brandTagline || response.storeCode || response.tenantSlug || '',
    employerSalary: 0,
    employerNic: response.tenantSlug || response.storeCode || response.username,
    isActiveStatus: true,
    gender: '',
    dateOfBirth: new Date('1990-01-01'),
    role: legacyRole,
    pin: legacyRole === 'CASHIER' ? 4321 : 0,
    profileImageUrl: null,
    authSource: 'pharmaflow-bridge',
  };
};

export const resolveLegacyLoginDestination = (response: AuthResponse) =>
  mapPharmaFlowRoleToLegacyRole(response) === 'OWNER'
    ? '/manager-dashboard/Dashboard'
    : '/cashier-dashboard';
