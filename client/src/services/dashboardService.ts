import { apiFetch } from './api';
import { isTimelineDemoJournal } from '../utils/timelineDemo';

export const dashboardService = {
  createJournal: (content: string, position: { x: number; y: number; z: number }) =>
    apiFetch('/journals', {
      method: 'POST',
      body: JSON.stringify({ content, position }),
    }),

  deleteJournal: (id: string) =>
    apiFetch(`/journals/${id}`, {
      method: 'DELETE',
    }),

  updateJournal: (id: string, content: string) =>
    apiFetch(`/journals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),

  updateJournalPosition: (id: string, position: { x: number; y: number; z: number }) =>
    isTimelineDemoJournal(id) ? Promise.resolve({ position }) : apiFetch(`/journals/${id}/position`, {
      method: 'PUT',
      body: JSON.stringify(position),
    }),

};
