import { useState } from 'react';
import type { KeyedMutator } from 'swr';
import { dashboardService } from '../../services/dashboardService';
import type { Journal } from '../../types';

export const useUpdateJournal = (
  mutateJournals: KeyedMutator<Journal[]>,
  selectedJournal: Journal | null,
  setSelectedJournal: React.Dispatch<React.SetStateAction<Journal | null>>,
) => {
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleEdit = async (id: string, content: string) => {
    if (!content.trim()) return;
    try {
      const updated = await dashboardService.updateJournal(id, content);
      // Update the selected journal if it's the one being edited
      if (selectedJournal && selectedJournal._id === id) {
        setSelectedJournal({ ...selectedJournal, content: updated.content });
      }
      setEditingJournalId(null);
      setEditContent("");
      mutateJournals();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert(String(err));
    }
  };

  const startEditing = (journal: Journal) => {
    setEditingJournalId(journal._id);
    setEditContent(journal.content);
  };

  const cancelEditing = () => {
    setEditingJournalId(null);
    setEditContent("");
  };

  return { editingJournalId, editContent, setEditContent, handleEdit, startEditing, cancelEditing };
};
