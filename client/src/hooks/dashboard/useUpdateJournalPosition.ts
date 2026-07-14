import { useCallback } from 'react';
import type { KeyedMutator } from 'swr';
import { dashboardService } from '../../services/dashboardService';
import type { Journal } from '../../types';

export const useUpdateJournalPosition = (mutateJournals: KeyedMutator<Journal[]>) => {
  const handleJournalPositionUpdate = useCallback(
    async (id: string, pos: { x: number; y: number; z: number }) => {
      try {
        // Optimistic update: update position in local cache without revalidating
        mutateJournals(
          (current?: Journal[]) =>
            current
              ? current.map((j: Journal) =>
                j._id === id ? { ...j, position: pos } : j,
              )
              : [],
          false,
        );
        await dashboardService.updateJournalPosition(id, pos);
      } catch (err: unknown) {
        console.error("Failed to update journal position", err);
        mutateJournals(); // Revert on error
      }
    },
    [mutateJournals],
  );

  return { handleJournalPositionUpdate };
};
