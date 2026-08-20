import { useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import type { Journal } from '../../types';

export const useCreateJournal = (mutateAll: () => void) => {
  const [newEntry, setNewEntry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent,
    position: { x: number; y: number; z: number },
  ): Promise<Journal | null> => {
    e.preventDefault();
    if (!newEntry.trim() || isSubmitting) return null;
    setIsSubmitting(true);
    try {
      const result = await dashboardService.createJournal(newEntry) as { journal: Journal };
      await dashboardService.updateJournalPosition(result.journal._id, position);
      setNewEntry("");
      mutateAll();
      return { ...result.journal, position };
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert(String(err));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { newEntry, setNewEntry, isSubmitting, handleSubmit };
};
