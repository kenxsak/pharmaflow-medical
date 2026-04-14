import { useEffect, useState } from 'react';
import type { AuthResponse } from '../services/api';

export const PHARMAFLOW_CONTEXT_EVENT = 'pharmaflow-context-changed';
export type PharmaFlowPersona = 'saas-admin' | 'company-admin' | 'store-ops' | 'guest';

export interface PharmaFlowContextSnapshot {
  username: string;
  fullName: string;
  role: string;
  storeId: string;
  storeCode: string;
  tenantId: string;
  tenantSlug: string;
  platformOwner: boolean;
  hasToken: boolean;
}

interface StoreScopeRecord {
  storeId: string;
  tenantId?: string;
}

export const readPharmaFlowContext = (): PharmaFlowContextSnapshot => {
  if (typeof window === 'undefined') {
    return {
      username: '',
      fullName: '',
      role: '',
      storeId: '',
      storeCode: '',
      tenantId: '',
      tenantSlug: '',
      platformOwner: false,
      hasToken: false,
    };
  }

  return {
    username: localStorage.getItem('pharmaflow_username') || '',
    fullName: localStorage.getItem('pharmaflow_full_name') || '',
    role: localStorage.getItem('pharmaflow_role') || '',
    storeId: localStorage.getItem('pharmaflow_store_id') || '',
    storeCode: localStorage.getItem('pharmaflow_store_code') || '',
    tenantId: localStorage.getItem('pharmaflow_tenant_id') || '',
    tenantSlug: localStorage.getItem('pharmaflow_tenant_slug') || '',
    platformOwner: localStorage.getItem('pharmaflow_platform_owner') === 'true',
    hasToken: Boolean(localStorage.getItem('pharmaflow_token')),
  };
};

export const isPharmaFlowCompanyAdmin = (
  role: string,
  platformOwner = false
) => !platformOwner && ['SUPER_ADMIN', 'STORE_MANAGER'].includes(role);

export const isPharmaFlowStoreOperator = (role: string, platformOwner = false) =>
  !platformOwner && ['PHARMACIST', 'SALES_ASSISTANT', 'WAREHOUSE_MGR', 'DELIVERY_BOY'].includes(role);

export const getPharmaFlowPersona = (
  context: PharmaFlowContextSnapshot = readPharmaFlowContext()
): PharmaFlowPersona => {
  if (!context.hasToken) {
    return 'guest';
  }
  if (context.platformOwner) {
    return 'saas-admin';
  }
  if (isPharmaFlowCompanyAdmin(context.role, context.platformOwner)) {
    return 'company-admin';
  }
  if (isPharmaFlowStoreOperator(context.role, context.platformOwner)) {
    return 'store-ops';
  }
  return 'guest';
};

export const getPharmaFlowRoleLabel = (
  role: string,
  platformOwner = false
) => {
  if (platformOwner) {
    return 'SaaS Admin';
  }

  switch (role) {
    case 'SUPER_ADMIN':
    case 'STORE_MANAGER':
      return 'Company Admin';
    case 'PHARMACIST':
      return 'Store Operator';
    case 'SALES_ASSISTANT':
      return 'Counter Staff';
    case 'WAREHOUSE_MGR':
      return 'Warehouse Lead';
    case 'DELIVERY_BOY':
      return 'Delivery Staff';
    default:
      return role || 'Guest';
  }
};

export const getPharmaFlowHomePath = (
  context: PharmaFlowContextSnapshot = readPharmaFlowContext()
) => {
  const persona = getPharmaFlowPersona(context);

  switch (persona) {
    case 'saas-admin':
      return '/manager-dashboard/Dashboard';
    case 'company-admin':
      return '/manager-dashboard/Dashboard';
    case 'store-ops':
      return '/cashier-dashboard';
    default:
      return '/legacy-login';
  }
};

export const canAccessCompanyControls = (
  context: PharmaFlowContextSnapshot = readPharmaFlowContext()
) => {
  const persona = getPharmaFlowPersona(context);
  return persona === 'saas-admin' || persona === 'company-admin';
};

export const canAccessPlatformControls = (
  context: PharmaFlowContextSnapshot = readPharmaFlowContext()
) => getPharmaFlowPersona(context) === 'saas-admin';

export const canSwitchStores = (
  context: PharmaFlowContextSnapshot = readPharmaFlowContext()
) => {
  const persona = getPharmaFlowPersona(context);
  return persona === 'saas-admin' || persona === 'company-admin';
};

export const getVisibleStoresForContext = <T extends StoreScopeRecord>(
  stores: T[],
  context: PharmaFlowContextSnapshot = readPharmaFlowContext()
) => {
  const persona = getPharmaFlowPersona(context);

  if (persona === 'saas-admin') {
    return stores;
  }

  if (persona === 'company-admin') {
    if (!context.tenantId) {
      return [];
    }
    return stores.filter((store) => store.tenantId === context.tenantId);
  }

  if (persona === 'store-ops') {
    if (!context.storeId) {
      return [];
    }
    return stores.filter((store) => store.storeId === context.storeId);
  }

  return [];
};

export const savePharmaFlowSession = (response: AuthResponse) => {
  localStorage.setItem('pharmaflow_token', response.token);
  localStorage.setItem('pharmaflow_username', response.username);
  localStorage.setItem('pharmaflow_full_name', response.fullName);
  localStorage.setItem('pharmaflow_role', response.role);
  localStorage.setItem('pharmaflow_platform_owner', response.platformOwner ? 'true' : 'false');

  if (response.tenantId) {
    localStorage.setItem('pharmaflow_tenant_id', response.tenantId);
  } else {
    localStorage.removeItem('pharmaflow_tenant_id');
  }

  if (response.tenantSlug) {
    localStorage.setItem('pharmaflow_tenant_slug', response.tenantSlug);
  } else {
    localStorage.removeItem('pharmaflow_tenant_slug');
  }

  if (response.storeId) {
    localStorage.setItem('pharmaflow_store_id', response.storeId);
  } else {
    localStorage.removeItem('pharmaflow_store_id');
  }

  if (response.storeCode) {
    localStorage.setItem('pharmaflow_store_code', response.storeCode);
  } else {
    localStorage.removeItem('pharmaflow_store_code');
  }
};

export const clearPharmaFlowSession = () => {
  [
    'pharmaflow_token',
    'pharmaflow_username',
    'pharmaflow_full_name',
    'pharmaflow_role',
    'pharmaflow_store_id',
    'pharmaflow_store_code',
    'pharmaflow_tenant_id',
    'pharmaflow_tenant_slug',
    'pharmaflow_platform_owner',
  ].forEach((key) => localStorage.removeItem(key));
};

export const announcePharmaFlowContextChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PHARMAFLOW_CONTEXT_EVENT));
  }
};

export const usePharmaFlowContext = () => {
  const [context, setContext] = useState<PharmaFlowContextSnapshot>(() => readPharmaFlowContext());

  useEffect(() => {
    const refresh = () => setContext(readPharmaFlowContext());

    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener(PHARMAFLOW_CONTEXT_EVENT, refresh);

    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(PHARMAFLOW_CONTEXT_EVENT, refresh);
    };
  }, []);

  return context;
};
