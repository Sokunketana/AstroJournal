import useSWR from 'swr';
import { apiFetch } from '../services/api';
import {
  createTimelineDemoJournals,
  isTimelineDemo,
  timelineDemoUser,
} from '../utils/timelineDemo';

// SWR fetcher that wraps our existing apiFetch
const demoJournals = createTimelineDemoJournals();
const fetcher = (endpoint: string) => {
  if (isTimelineDemo()) {
    return Promise.resolve(endpoint === '/users/me' ? timelineDemoUser : demoJournals);
  }
  return apiFetch(endpoint);
};

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
