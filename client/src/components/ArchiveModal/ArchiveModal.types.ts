import type { Journal } from "../../types";

export interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  journals: Journal[];
  onSelect: (journal: Journal) => void;
  onLocate: (journal: Journal) => void;
}
