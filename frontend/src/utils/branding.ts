import { useEffect, useState } from 'react';

export const PHARMAFLOW_BRANDING_EVENT = 'pharmaflow-branding-changed';

export interface BrandingSnapshot {
  brandName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  deploymentMode: string;
}

const DEFAULT_BRANDING: BrandingSnapshot = {
  brandName:
    process.env.REACT_APP_BRAND_NAME || process.env.REACT_APP_STORE_NAME || 'LifePill',
  tagline:
    process.env.REACT_APP_BRAND_TAGLINE ||
    'Simple pharmacy operations, billing, and compliance workspace',
  supportEmail: process.env.REACT_APP_BRAND_SUPPORT_EMAIL || 'support@lifepill.com',
  supportPhone: process.env.REACT_APP_BRAND_SUPPORT_PHONE || '+91 44 4000 9000',
  deploymentMode:
    process.env.REACT_APP_BRAND_DEPLOYMENT_MODE || 'Hybrid cloud + branch-local operations',
};

const BRANDING_STORAGE_KEYS: Record<keyof BrandingSnapshot, string> = {
  brandName: 'pharmaflow_brand_name',
  tagline: 'pharmaflow_brand_tagline',
  supportEmail: 'pharmaflow_brand_support_email',
  supportPhone: 'pharmaflow_brand_support_phone',
  deploymentMode: 'pharmaflow_brand_deployment_mode',
};

const normalizeBrandingText = (key: keyof BrandingSnapshot, value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return DEFAULT_BRANDING[key];
  }

  if (key === 'brandName' && /^pharmaflow$/i.test(trimmed)) {
    return 'LifePill';
  }

  if (key === 'supportEmail' && /^support@pharmaflow\.in$/i.test(trimmed)) {
    return 'support@lifepill.com';
  }

  return trimmed.replace(/PharmaFlow/g, 'LifePill');
};

const readValue = (key: keyof BrandingSnapshot) => {
  if (typeof window === 'undefined') {
    return DEFAULT_BRANDING[key];
  }

  const storedValue = localStorage.getItem(BRANDING_STORAGE_KEYS[key]);
  return storedValue ? normalizeBrandingText(key, storedValue) : DEFAULT_BRANDING[key];
};

export const readBranding = (): BrandingSnapshot => ({
  brandName: readValue('brandName'),
  tagline: readValue('tagline'),
  supportEmail: readValue('supportEmail'),
  supportPhone: readValue('supportPhone'),
  deploymentMode: readValue('deploymentMode'),
});

export const announceBrandingChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PHARMAFLOW_BRANDING_EVENT));
  }
};

export const saveBranding = (branding: Partial<BrandingSnapshot>) => {
  if (typeof window === 'undefined') {
    return;
  }

  (Object.keys(branding) as Array<keyof BrandingSnapshot>).forEach((key) => {
    const value = branding[key];
    if (typeof value === 'string') {
      localStorage.setItem(BRANDING_STORAGE_KEYS[key], normalizeBrandingText(key, value));
    }
  });

  announceBrandingChange();
};

export const resetBranding = () => {
  if (typeof window === 'undefined') {
    return;
  }

  Object.values(BRANDING_STORAGE_KEYS).forEach((storageKey) => localStorage.removeItem(storageKey));
  announceBrandingChange();
};

export const getBrandInitials = (brandName: string) =>
  brandName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() || '')
    .join('') || 'LP';

export const useBranding = () => {
  const [branding, setBranding] = useState<BrandingSnapshot>(() => readBranding());

  useEffect(() => {
    const refresh = () => setBranding(readBranding());

    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener(PHARMAFLOW_BRANDING_EVENT, refresh);

    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(PHARMAFLOW_BRANDING_EVENT, refresh);
    };
  }, []);

  return branding;
};
