import type { Journal, PlanetData } from "../../types";

export interface StarFieldProps {
  count: number;
}

export interface PlanetProps {
  id: string;
  position: [number, number, number];
  color: string;
  size: number;
  journals: Journal[];
  onClick: (journals: Journal[]) => void;
  onDragEnd: (id: string, pos: { x: number; y: number; z: number }) => void;
}

export interface JournalStarProps {
  position: [number, number, number];
  journal: Journal;
  onClick: (journal: Journal) => void;
  onDragEnd: (id: string, pos: { x: number; y: number; z: number }) => void;
  paused?: boolean;
}

export interface SkyBackgroundProps {
  totalStars: number;
  planetsData: PlanetData[];
  looseJournals: Journal[];
  onStarClick: (journal: Journal) => void;
  onPlanetClick: (journals: Journal[]) => void;
  onJournalPositionUpdate: (
    id: string,
    pos: { x: number; y: number; z: number },
  ) => void;
  onPlanetPositionUpdate: (
    id: string,
    pos: { x: number; y: number; z: number },
  ) => void;
  paused?: boolean;
}
