const stripTrailingSlash = (value: string) =>
  value.endsWith('/') ? value.slice(0, -1) : value;

export const getBackendBaseUrl = () =>
  stripTrailingSlash(process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080');

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
