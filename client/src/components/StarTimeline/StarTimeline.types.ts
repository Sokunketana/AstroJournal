import type { Journal } from "../../types";

export type TimelineScale = "week" | "month";

export interface StarTimelineProps {
  journals: Journal[];
  onSelect: (journal: Journal) => void;
}
