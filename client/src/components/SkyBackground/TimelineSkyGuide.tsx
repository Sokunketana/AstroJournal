import React, { useLayoutEffect, useMemo, useRef } from "react";
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
}

interface TimelineSkyGuideProps {
  view: TimelineViewState;
  viewRef: { current: TimelineViewState };
}

const TimelineSkyGuide: React.FC<TimelineSkyGuideProps> = ({ view, viewRef }) => {
  const guideRef = useRef<HTMLDivElement>(null);
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
    const firstWeek = Math.floor(view.weekPosition - visibleWeeks / 2) - 1;
    const lastWeek = Math.ceil(view.weekPosition + visibleWeeks / 2) + 1;
    for (let index = firstWeek; index <= lastWeek; index += 1) {
      result.push({
        key: `month-view-week-wall-${index}`,
        position: index - 0.5,
      });
    }
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

  useLayoutEffect(() => {
    let animationFrame = 0;

    const updateMarkerPositions = () => {
      const guide = guideRef.current;
      if (guide) {
        const currentView = viewRef.current;
        const currentVisibleWeeks = currentView.zoom / BASE_CAMERA_Z;
        guide
          .querySelectorAll<HTMLElement>("[data-timeline-position]")
          .forEach((marker) => {
            const position = Number(marker.dataset.timelinePosition);
            const left = 50
              + ((position - currentView.weekPosition) / currentVisibleWeeks) * 100;
            marker.style.left = `${left}%`;
            marker.style.visibility = left < -8 || left > 108 ? "hidden" : "visible";
          });
      }
      animationFrame = window.requestAnimationFrame(updateMarkerPositions);
    };

    updateMarkerPositions();
    return () => window.cancelAnimationFrame(animationFrame);
  }, [viewRef]);

  return (
    <div ref={guideRef} className="pointer-events-none fixed inset-0 z-5 overflow-hidden" aria-hidden="true">
      {markers.map((marker) => {
        return marker.label ? (
          <span
            key={marker.key}
            data-timeline-position={marker.position}
            className="absolute top-22 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35 sm:top-24 sm:text-[10px]"
          >
            {marker.label}
          </span>
        ) : (
          <span
            key={marker.key}
            data-timeline-position={marker.position}
            className="absolute top-20 bottom-24 w-[2px] bg-gradient-to-b from-transparent via-white/35 to-transparent shadow-[0_0_6px_rgba(255,255,255,0.16)]"
          />
        );
      })}

    </div>
  );
};

export default TimelineSkyGuide;
