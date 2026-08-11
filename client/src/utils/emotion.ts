import type { Emotion } from '../types';

export const EMOTION_COLORS: Record<Emotion, string> = {
  happy: '#22c55e',
  sad: '#9ca3af',
  angry: '#ef4444',
  calm: '#3b82f6',
  neutral: '#ffffff',
};

export const emotionColor = (emotion?: Emotion): string =>
  EMOTION_COLORS[emotion ?? 'neutral'];
