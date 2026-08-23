import { apiFetch } from './api';
import type { ConstellationInput } from '../types';

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

  deleteAllJournals: () =>
    apiFetch('/journals', {
      method: 'DELETE',
    }),

  updateJournal: (id: string, content: string) =>
    apiFetch(`/journals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),

  updateJournalPosition: (id: string, position: { x: number; y: number; z: number }) =>
    apiFetch(`/journals/${id}/position`, {
      method: 'PUT',
      body: JSON.stringify(position),
    }),

  createConstellation: (input: ConstellationInput) =>
    apiFetch('/constellations', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateConstellation: (id: string, input: ConstellationInput) =>
    apiFetch(`/constellations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  deleteConstellation: (id: string) =>
    apiFetch(`/constellations/${id}`, {
      method: 'DELETE',
    }),

};
