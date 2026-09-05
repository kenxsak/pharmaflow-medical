const stripTrailingSlash = (value: string) =>
  value.endsWith('/') ? value.slice(0, -1) : value;

const DEFAULT_HOSTED_BACKEND_URL =
  process.env.REACT_APP_DEFAULT_HOSTED_BACKEND_URL ||
  'https://pharmaflow-backend.onrender.com';

const getHostedFallbackBaseUrl = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_HOSTED_BACKEND_URL;
  }

  const hostname = window.location.hostname;
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0'
  ) {
    return null;
  }

  return DEFAULT_HOSTED_BACKEND_URL;
};

const normalizeBackendUrl = (url?: string | null): string | null => {
  if (!url) return null;
  let cleaned = url.trim();
  if (!cleaned) return null;

  // If Render passed a short service name without a domain (e.g. pharmaflow-backend-lui4)
  if (
    !cleaned.includes('.') &&
    !cleaned.includes('localhost') &&
    !cleaned.includes('127.0.0.1')
  ) {
    cleaned = `${cleaned}.onrender.com`;
  }

  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }

  return stripTrailingSlash(cleaned);
};

export const getBackendBaseUrl = () => {
  const customOverride = typeof window !== 'undefined'
    ? localStorage.getItem('pharmaflow_backend_url')
    : null;
  const normalizedOverride = normalizeBackendUrl(customOverride);
  if (normalizedOverride) {
    return normalizedOverride;
  }

  const configuredBaseUrl = process.env.REACT_APP_BACKEND_URL;
  const normalizedConfigured = normalizeBackendUrl(configuredBaseUrl);
  if (normalizedConfigured) {
    return normalizedConfigured;
  }

  const hostedFallbackBaseUrl = getHostedFallbackBaseUrl();
  if (hostedFallbackBaseUrl) {
    return hostedFallbackBaseUrl;
  }

  return 'http://localhost:8080';
};

export const getPharmaFlowApiBaseUrl = () =>
  stripTrailingSlash(process.env.REACT_APP_API_URL || `${getBackendBaseUrl()}/api/v1`);

export const getLegacyApiBaseUrl = () =>
  stripTrailingSlash(
    process.env.REACT_APP_LEGACY_API_URL || `${getBackendBaseUrl()}/lifepill/v1`
  );

export const getWebSocketUrl = () =>
  stripTrailingSlash(process.env.REACT_APP_WS_URL || `${getBackendBaseUrl()}/ws`);

export const toLegacyApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getLegacyApiBaseUrl()}${normalizedPath}`;
};
