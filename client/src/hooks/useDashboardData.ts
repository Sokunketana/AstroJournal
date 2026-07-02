import useSWR from 'swr';
import { apiFetch } from '../services/api';

// SWR fetcher that wraps our existing apiFetch
const fetcher = (endpoint: string) => apiFetch(endpoint);

export function useUserData() {
  return useSWR('/users/me', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
}

export function useJournals() {
  return useSWR('/journals', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
}

export function usePlanets() {
  return useSWR('/planets', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
}
