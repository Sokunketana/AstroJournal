import React, { useMemo } from "react";
import type { TimelineViewState } from "./TimelineCameraController";
import {
  BASE_CAMERA_Z,
  dateToWeekPosition,
  formatWeekRange,
  weekPositionToDate,
} from "./timelineLayout";

interface Marker {
  key: string;
  position: number;
  label?: string;
  strong?: boolean;
}

const TimelineSkyGuide: React.FC<{ view: TimelineViewState }> = ({ view }) => {
  const visibleWeeks = view.zoom / BASE_CAMERA_Z;
  const monthly = view.zoom >= 26;
  const markers = useMemo<Marker[]>(() => {
    if (!monthly) {
      const first = Math.floor(view.weekPosition - visibleWeeks / 2) - 1;
      const last = Math.ceil(view.weekPosition + visibleWeeks / 2) + 1;
      const result: Marker[] = [];
      for (let index = first; index <= last; index += 1) {
        result.push({
          key: `wall-${index}`,
          position: index - 0.5,
        });
        result.push({
          key: `week-${index}`,
          position: index,
          label: formatWeekRange(weekPositionToDate(index)),
        });
      }
      return result;
    }

    const centerDate = weekPositionToDate(view.weekPosition);
    const result: Marker[] = [];
    for (let offset = -3; offset <= 3; offset += 1) {
      const monthStart = new Date(
        centerDate.getFullYear(),
        centerDate.getMonth() + offset,
        1,
      );
      const nextMonth = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() + 1,
        1,
      );
      const startPosition = dateToWeekPosition(monthStart);
      const endPosition = dateToWeekPosition(nextMonth);
      result.push({
        key: `month-wall-${monthStart.toISOString()}`,
        position: startPosition,
        strong: true,
      });
      result.push({
        key: `month-${monthStart.toISOString()}`,
        position: (startPosition + endPosition) / 2,
        label: monthStart.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        }),
      });
    }
    return result;
  }, [monthly, view.weekPosition, visibleWeeks]);

  const centerDate = weekPositionToDate(view.weekPosition);
  const centerLabel = monthly
    ? centerDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : formatWeekRange(weekPositionToDate(Math.round(view.weekPosition)));

  return (
    <div className="pointer-events-none fixed inset-0 z-5 overflow-hidden" aria-hidden="true">
      {markers.map((marker) => {
        const left = 50 + ((marker.position - view.weekPosition) / visibleWeeks) * 100;
        if (left < -8 || left > 108) return null;
        return marker.label ? (
          <span
            key={marker.key}
            className="absolute top-22 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35 sm:top-24 sm:text-[10px]"
            style={{ left: `${left}%` }}
          >
            {marker.label}
          </span>
        ) : (
          <span
            key={marker.key}
            className={`absolute top-20 bottom-24 w-px bg-gradient-to-b from-transparent via-white/12 to-transparent ${marker.strong ? "via-white/20" : ""}`}
            style={{ left: `${left}%` }}
          />
        );
      })}

      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center text-[9px] uppercase tracking-[0.18em] text-white/35 sm:bottom-25">
        <p>{centerLabel}</p>
        <p className="mt-1 text-white/20">
          Scroll or swipe to travel · Pinch, Ctrl/⌘ + wheel, or +/− to zoom · {monthly ? "Months" : "Weeks"}
        </p>
      </div>
    </div>
  );
};

export default TimelineSkyGuide;
