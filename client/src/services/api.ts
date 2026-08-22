const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type AuthTokenGetter = () => Promise<string | null>;

let getAuthToken: AuthTokenGetter | undefined;

export const setAuthTokenGetter = (getter: AuthTokenGetter) => {
  getAuthToken = getter;
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken?.();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};
