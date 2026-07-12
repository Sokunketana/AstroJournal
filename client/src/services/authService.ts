import { apiFetch } from './api';

interface AuthPayload {
  username: string;
  password: string;
  role?: string;
}

export const authService = {
  login: (payload: AuthPayload) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  register: (payload: AuthPayload) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
