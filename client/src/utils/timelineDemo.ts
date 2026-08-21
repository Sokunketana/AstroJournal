import type { Emotion, Journal, User } from "../types";

export const TIMELINE_DEMO_PARAM = "timelineDemo";
export const TIMELINE_DEMO_PREFIX = "timeline-demo-";

export const isTimelineDemo = (): boolean =>
  import.meta.env.DEV
  && new URLSearchParams(window.location.search).get(TIMELINE_DEMO_PARAM) === "1";

const emotions: Emotion[] = ["happy", "calm", "neutral", "sad", "happy"];

export const createTimelineDemoJournals = (): Journal[] => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return Array.from({ length: 112 }, (_, index) => {
    const createdAt = new Date(today);
    createdAt.setDate(createdAt.getDate() - index * 3);
    const phase = index * 1.73;

    return {
      _id: `${TIMELINE_DEMO_PREFIX}${index}`,
      userId: "timeline-demo-user",
      content: `Demo reflection from ${createdAt.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}.`,
      emotion: emotions[index % emotions.length],
      starsEarned: 1,
      streakBeforeEntry: index % 12,
      position: {
        x: Math.sin(phase) * 4.8,
        y: Math.cos(phase * 0.7) * 3.4,
        z: -1.8 + (index % 8) * 0.42,
      },
      createdAt: createdAt.toISOString(),
    };
  });
};

export const timelineDemoUser: User = {
  _id: "timeline-demo-user",
  username: "Timeline Explorer",
  role: "user",
  currentStreak: 8,
  totalStars: 112,
  lastEntryDate: new Date().toISOString(),
};

export const isTimelineDemoJournal = (id: string): boolean =>
  import.meta.env.DEV && id.startsWith(TIMELINE_DEMO_PREFIX);
