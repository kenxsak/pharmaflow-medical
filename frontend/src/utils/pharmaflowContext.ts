import { useEffect, useState } from 'react';

export const PHARMAFLOW_CONTEXT_EVENT = 'pharmaflow-context-changed';

export interface PharmaFlowContextSnapshot {
  username: string;
  fullName: string;
  role: string;
  storeId: string;
  storeCode: string;
  tenantId: string;
  tenantSlug: string;
  hasToken: boolean;
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
    hasToken: Boolean(localStorage.getItem('pharmaflow_token')),
  };
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
