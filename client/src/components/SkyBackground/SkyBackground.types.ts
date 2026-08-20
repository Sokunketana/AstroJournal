import type { Journal, PlanetData } from "../../types";

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
}

export interface PlanetProps {
  id: string;
  position: [number, number, number];
  color: string;
  size: number;
  journals: Journal[];
  onClick: (journals: Journal[]) => void;
  onDragEnd: (id: string, pos: { x: number; y: number; z: number }) => void;
  onHover: (tooltip: SkyTooltipData | null) => void;
  paused?: boolean;
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
