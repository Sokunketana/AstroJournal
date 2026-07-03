export interface Journal {
  _id: string;
  userId: string;
  planetId?: string | null;
  content: string;
  starsEarned: number;
  streakBeforeEntry: number;
  position?: { x: number; y: number; z: number };
  createdAt: string;
}

export interface Planet {
  _id: string;
  userId: string;
  color: string;
  position?: { x: number; y: number; z: number };
  createdAt: string;
}

export interface PlanetData extends Planet {
  journals: Journal[];
}

export interface CelestialItem {
  type: string;
  count: number;
}

export interface User {
  _id: string;
  username: string;
  role: 'user' | 'admin';
  currentStreak: number;
  totalStars: number;
  celestialInventory: CelestialItem[];
  lastEntryDate: string | null;
}

