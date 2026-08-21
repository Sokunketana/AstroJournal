import { useState } from 'react';
import type { KeyedMutator } from 'swr';
import { dashboardService } from '../../services/dashboardService';
import type { Journal } from '../../types';

export const useDeleteJournal = (
  mutateJournals: KeyedMutator<Journal[]>,
  mutateAll: () => void,
  setSelectedJournal: (journal: Journal | null) => void,
) => {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      // Optimistic update: remove the journal from the local cache immediately
      mutateJournals(
        (current?: Journal[]) =>
          current ? current.filter((j: Journal) => j._id !== id) : [],
        false,
      );
      setSelectedJournal(null);

      await dashboardService.deleteJournal(id);
      mutateAll();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert(String(err));
      mutateAll(); // Revert on error
    }
  };

  return { deleteTargetId, setDeleteTargetId, handleDelete, confirmDelete };
};
