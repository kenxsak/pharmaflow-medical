const stripTrailingSlash = (value: string) =>
  value.endsWith('/') ? value.slice(0, -1) : value;

const getHostedFallbackBaseUrl = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname;
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0'
  ) {
    return null;
  }

  return stripTrailingSlash(window.location.origin);
};

export const getBackendBaseUrl = () => {
  const configuredBaseUrl = process.env.REACT_APP_BACKEND_URL?.trim();
  if (configuredBaseUrl) {
    return stripTrailingSlash(configuredBaseUrl);
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
