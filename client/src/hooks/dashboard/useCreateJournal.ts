import { useState } from 'react';
import { dashboardService } from '../../services/dashboardService';

export const useCreateJournal = (mutateAll: () => void) => {
  const [newEntry, setNewEntry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await dashboardService.createJournal(newEntry);
      setNewEntry("");
      mutateAll();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return { newEntry, setNewEntry, isSubmitting, handleSubmit };
};
