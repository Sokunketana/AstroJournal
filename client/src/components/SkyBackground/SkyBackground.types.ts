import type { Journal } from "../../types";

export interface SkyTooltipData {
  title: string;
  subtitle: string;
  color: string;
  x: number;
  y: number;
}

export interface RocketLaunchData {
  id: number;
  start: { x: number; y: number };
  targetScreen: { x: number; y: number };
  target: { x: number; y: number; z: number };
  confirmed: boolean;
  journalId?: string;
}

export interface JournalStarProps {
  position: [number, number, number];
  journal: Journal;
  onClick: (journal: Journal) => void;
  onDragEnd: (id: string, pos: { x: number; y: number; z: number }) => void;
  onHover: (tooltip: SkyTooltipData | null) => void;
  paused?: boolean;
}

export interface SkyBackgroundProps {
  totalStars: number;
  launch: RocketLaunchData | null;
  looseJournals: Journal[];
  onStarClick: (journal: Journal) => void;
  onJournalPositionUpdate: (
    id: string,
    pos: { x: number; y: number; z: number },
  ) => void;
  focusCurrentSignal?: number;
  paused?: boolean;
}
