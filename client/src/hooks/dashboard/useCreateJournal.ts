import { useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import type { Journal, User } from '../../types';

export interface JournalCreationResult {
  journal: Journal;
  user: Pick<User, 'currentStreak' | 'totalStars'>;
  planetCreated: boolean;
}

export const useCreateJournal = () => {
  const [newEntry, setNewEntry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    position: { x: number; y: number; z: number },
  ): Promise<JournalCreationResult | null> => {
    if (!newEntry.trim() || isSubmitting) return null;
    setIsSubmitting(true);
    try {
      const result = await dashboardService.createJournal(newEntry, position) as JournalCreationResult;
      setNewEntry("");
      return {
        ...result,
        journal: { ...result.journal, position },
      };
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
