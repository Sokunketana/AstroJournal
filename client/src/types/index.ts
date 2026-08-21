export type Emotion = 'happy' | 'sad' | 'angry' | 'calm' | 'neutral';

export interface Journal {
  _id: string;
  userId: string;
  content: string;
  emotion?: Emotion;
  starsEarned: number;
  streakBeforeEntry: number;
  position?: { x: number; y: number; z: number };
  createdAt: string;
}

export interface User {
  _id: string;
  username: string;
  role: 'user';
  currentStreak: number;
  totalStars: number;
  lastEntryDate: string | null;
}

export interface Constellation {
  _id: string;
  userId: string;
  title: string;
  color: string;
  journalIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConstellationInput {
  title: string;
  color: string;
  journalIds: string[];
}

