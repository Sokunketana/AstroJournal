import type { Constellation, ConstellationInput, Journal } from '../../types';

export interface ConstellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  constellations: Constellation[];
  journals: Journal[];
  onCreate: (input: ConstellationInput) => Promise<void>;
  onUpdate: (id: string, input: ConstellationInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelectInSky: (draft: {
    journalIds: string[];
    color: string;
    editingId?: string;
  }, onComplete: (journalIds: string[]) => void, onSave: (journalIds: string[]) => Promise<boolean>) => void;
}
