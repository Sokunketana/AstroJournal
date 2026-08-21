import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, Star } from "lucide-react";
import type { Journal } from "../../types";
import { emotionColor } from "../../utils/emotion";
import type { StarTimelineProps, TimelineScale } from "./StarTimeline.types";

const startOfDay = (value: string | Date) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const startOfWeek = (value: Date) => {
  const date = startOfDay(value);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return date;
};

const addDays = (value: Date, days: number) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const dateKey = (value: string | Date) => {
  const date = startOfDay(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const monthKey = (value: string | Date) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const fullDayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  year: "numeric",
});

const fullMonthFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

interface WeekGroup {
  key: string;
  start: Date;
  days: Date[];
  journals: Journal[];
}

interface MonthGroup {
  key: string;
  start: Date;
  journals: Journal[];
  activeDays: number;
}

const buildWeeks = (journals: Journal[]): WeekGroup[] => {
  const today = startOfDay(new Date());
  const firstEntry = journals.reduce<Date | null>((earliest, journal) => {
    const createdAt = startOfDay(journal.createdAt);
    return !earliest || createdAt < earliest ? createdAt : earliest;
  }, null);
  const lastEntry = journals.reduce<Date>((latest, journal) => {
    const createdAt = startOfDay(journal.createdAt);
    return createdAt > latest ? createdAt : latest;
  }, today);
  const firstWeek = startOfWeek(firstEntry ?? today);
  const lastWeek = startOfWeek(lastEntry);
  const entriesByDay = new Map<string, Journal[]>();

  journals.forEach((journal) => {
    const key = dateKey(journal.createdAt);
    entriesByDay.set(key, [...(entriesByDay.get(key) ?? []), journal]);
  });

  const weeks: WeekGroup[] = [];
  for (let cursor = firstWeek; cursor <= lastWeek; cursor = addDays(cursor, 7)) {
    const days = Array.from({ length: 7 }, (_, index) => addDays(cursor, index));
    weeks.push({
      key: dateKey(cursor),
      start: cursor,
      days,
      journals: days.flatMap((day) => entriesByDay.get(dateKey(day)) ?? []),
    });
  }
  return weeks;
};

const buildMonths = (journals: Journal[]): MonthGroup[] => {
  const today = startOfDay(new Date());
  const dates = journals.map((journal) => startOfDay(journal.createdAt));
  const first = dates.length
    ? new Date(Math.min(...dates.map((date) => date.getTime())))
    : today;
  const last = dates.length
    ? new Date(Math.max(today.getTime(), ...dates.map((date) => date.getTime())))
    : today;
  const entriesByMonth = new Map<string, Journal[]>();

  journals.forEach((journal) => {
    const key = monthKey(journal.createdAt);
    entriesByMonth.set(key, [...(entriesByMonth.get(key) ?? []), journal]);
  });

  const months: MonthGroup[] = [];
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const lastMonth = new Date(last.getFullYear(), last.getMonth(), 1);
  while (cursor <= lastMonth) {
    const start = new Date(cursor);
    const monthJournals = entriesByMonth.get(monthKey(start)) ?? [];
    months.push({
      key: monthKey(start),
      start,
      journals: monthJournals,
      activeDays: new Set(monthJournals.map((journal) => dateKey(journal.createdAt))).size,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
};

const StarTimeline: React.FC<StarTimelineProps> = ({ journals, onSelect }) => {
  const [scale, setScale] = useState<TimelineScale>("week");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const weeks = useMemo(() => buildWeeks(journals), [journals]);
  const months = useMemo(() => buildMonths(journals), [journals]);
  const journalsByDay = useMemo(() => {
    const map = new Map<string, Journal>();
    journals.forEach((journal) => map.set(dateKey(journal.createdAt), journal));
    return map;
  }, [journals]);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "smooth") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ left: scroller.scrollWidth, behavior });
  }, []);

  useEffect(() => {
    scrollToLatest("instant");
  }, [journals.length, scale, scrollToLatest]);

  const setZoom = useCallback((nextScale: TimelineScale) => {
    setScale(nextScale);
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      setZoom(event.deltaY > 0 ? "month" : "week");
      return;
    }

    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      event.currentTarget.scrollLeft += event.deltaY;
    }
  }, [setZoom]);

  const scrollByPage = useCallback((direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({
      left: direction * Math.max(260, scroller.clientWidth * 0.75),
      behavior: "smooth",
    });
  }, []);

  return (
    <section
      data-star-bounce
      aria-label="Your star history"
      className="pointer-events-auto mx-auto w-full max-w-5xl rounded-2xl border border-white/10 bg-black/45 p-2.5 shadow-[0_12px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Star size={13} className="shrink-0 text-yellow-300" fill="currentColor" />
            <h2 className="truncate text-[11px] font-bold uppercase tracking-[0.2em] text-white">
              Your constellation
            </h2>
            <span className="text-[10px] text-gray-500">
              {journals.length} {journals.length === 1 ? "star" : "stars"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
            aria-label="See earlier history"
            title="Earlier"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setZoom("month")}
              disabled={scale === "month"}
              className="rounded-full p-1.5 text-gray-400 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:bg-white/10 disabled:text-white"
              aria-label="Zoom out to months"
              title="Zoom out to months"
            >
              <Minus size={12} />
            </button>
            <span className="w-12 text-center text-[9px] font-bold uppercase tracking-widest text-gray-300">
              {scale === "week" ? "Weeks" : "Months"}
            </span>
            <button
              type="button"
              onClick={() => setZoom("week")}
              disabled={scale === "week"}
              className="rounded-full p-1.5 text-gray-400 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:bg-white/10 disabled:text-white"
              aria-label="Zoom in to weeks"
              title="Zoom in to weeks"
            >
              <Plus size={12} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
            aria-label="See later history"
            title="Later"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onWheel={handleWheel}
        className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth"
      >
        {scale === "week"
          ? weeks.map((week) => {
              const end = addDays(week.start, 6);
              const label = week.start.getMonth() === end.getMonth()
                ? `${week.start.toLocaleDateString(undefined, { month: "short" })} ${week.start.getDate()}–${end.getDate()}`
                : `${week.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}–${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

              return (
                <article
                  key={week.key}
                  className="w-64 shrink-0 snap-end rounded-xl border border-white/7 bg-white/[0.035] px-3 py-2"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-300">{label}</span>
                    <span className="text-[9px] uppercase tracking-wider text-gray-500">
                      {week.journals.length}/7 days
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {week.days.map((day) => {
                      const journal = journalsByDay.get(dateKey(day));
                      const isToday = dateKey(day) === dateKey(new Date());
                      return (
                        <div key={dateKey(day)} className="text-center">
                          <span className="block text-[8px] tabular-nums text-gray-600">
                            {day.getDate()}
                          </span>
                          {journal ? (
                            <button
                              type="button"
                              onClick={() => onSelect(journal)}
                              className="group mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:scale-110 hover:border-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-200"
                              aria-label={`Open journal from ${fullDayFormatter.format(day)}`}
                              title={fullDayFormatter.format(day)}
                            >
                              <Star
                                size={13}
                                fill="currentColor"
                                className="drop-shadow-[0_0_5px_currentColor]"
                                style={{ color: emotionColor(journal.emotion) }}
                              />
                            </button>
                          ) : (
                            <span
                              className={`mx-auto mt-1 block h-6 w-6 rounded-full border ${isToday ? "border-white/30 bg-white/8" : "border-white/5 bg-white/[0.02]"}`}
                              title={fullDayFormatter.format(day)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })
          : months.map((month) => {
              const daysInMonth = new Date(
                month.start.getFullYear(),
                month.start.getMonth() + 1,
                0,
              ).getDate();
              const fill = Math.round((month.activeDays / daysInMonth) * 100);
              return (
                <article
                  key={month.key}
                  className="w-48 shrink-0 snap-end rounded-xl border border-white/7 bg-white/[0.035] px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[11px] font-semibold text-gray-200">
                        {monthFormatter.format(month.start)}
                      </h3>
                      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-gray-500">
                        {month.activeDays} active {month.activeDays === 1 ? "day" : "days"}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-yellow-200/80">
                      {month.journals.length} ★
                    </span>
                  </div>
                  <div
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"
                    role="progressbar"
                    aria-label={`${fullMonthFormatter.format(month.start)} activity`}
                    aria-valuemin={0}
                    aria-valuemax={daysInMonth}
                    aria-valuenow={month.activeDays}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-300 to-yellow-200 shadow-[0_0_8px_rgba(196,181,253,0.65)]"
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                  <div className="mt-2 flex h-4 items-center gap-0.5 overflow-hidden" aria-hidden="true">
                    {month.journals.slice(0, 20).map((journal) => (
                      <Star
                        key={journal._id}
                        size={9}
                        fill="currentColor"
                        className="shrink-0"
                        style={{ color: emotionColor(journal.emotion) }}
                      />
                    ))}
                  </div>
                </article>
              );
            })}
      </div>
      <p className="mt-1.5 px-1 text-[9px] text-gray-600">
        Scroll to travel through time · Ctrl/⌘ + wheel to zoom
      </p>
    </section>
  );
};

export default StarTimeline;
