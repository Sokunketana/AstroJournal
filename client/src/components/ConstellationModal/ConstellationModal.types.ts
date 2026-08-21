import type { Constellation, ConstellationInput, Journal } from '../../types';

export interface ConstellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  constellations: Constellation[];
  journals: Journal[];
  onCreate: (input: ConstellationInput) => Promise<void>;
  onUpdate: (id: string, input: ConstellationInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
