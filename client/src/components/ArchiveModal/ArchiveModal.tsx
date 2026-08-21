import React, { useMemo, useState, useCallback } from "react";
import { Search, Star, RotateCcw, SearchX } from "lucide-react";
import Modal from "../Modal";
import { formatRelativeDate, formatShortDate } from "../../utils/dateUtils";
import { emotionColor } from "../../utils/emotion";
import type { Emotion } from "../../types";
import type { ArchiveModalProps } from "./ArchiveModal.types";

const EMOTION_FILTERS: ("all" | Emotion)[] = [
  "all",
  "happy",
  "sad",
  "angry",
  "calm",
  "neutral",
];

const toISODate = (value: string | Date): string => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  journals,
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [emotionFilter, setEmotionFilter] = useState<"all" | Emotion>("all");

  const filteredJournals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...journals]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .filter((journal) => {
        if (emotionFilter !== "all" && journal.emotion !== emotionFilter)
          return false;
        const isoDate = toISODate(journal.createdAt);
        if (dateFrom && isoDate < dateFrom) return false;
        if (dateTo && isoDate > dateTo) return false;
        if (!q) return true;
        const haystack = `${journal.content} ${formatShortDate(
          journal.createdAt,
        )}`.toLowerCase();
        return haystack.includes(q);
      });
  }, [journals, query, dateFrom, dateTo, emotionFilter]);

  const hasFilters =
    !!query.trim() || !!dateFrom || !!dateTo || emotionFilter !== "all";

  const resetFilters = useCallback(() => {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setEmotionFilter("all");
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      className="max-h-[85vh]"
    >
      <div className="mb-5 shrink-0">
        <p className="text-xs font-bold text-white uppercase tracking-widest mb-1">
          Celestial Archive
        </p>
        <h3 className="text-gray-400 text-sm font-medium">
          {filteredJournals.length}{" "}
          {filteredJournals.length === 1 ? "Entry" : "Entries"} Found
        </h3>
      </div>

      {/* Search & Filters */}
      <div className="mb-4 shrink-0 flex flex-col gap-3">
        <div className="relative">
          <Search
            size={17}
            strokeWidth={2.5}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entries by content..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all backdrop-blur-md"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-64">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="From date"
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-white/40 [color-scheme:dark]"
            />
            <span className="text-xs text-gray-500 shrink-0">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="To date"
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-white/40 [color-scheme:dark]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {EMOTION_FILTERS.map((emotion) => (
              <button
                key={emotion}
                onClick={() => setEmotionFilter(emotion)}
                className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  emotionFilter === emotion
                    ? "bg-white border-white text-black"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {emotion}
              </button>
            ))}
          </div>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors cursor-pointer ml-auto"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-3">
        {filteredJournals.length === 0 && (
          <div className="text-center py-16">
            <SearchX size={32} className="mx-auto mb-3 text-gray-600" />
            <p className="text-sm text-gray-500">
              No entries match your search.
            </p>
          </div>
        )}
        {filteredJournals.map((journal) => (
          <button
            key={journal._id}
            onClick={() => onSelect(journal)}
            className="w-full text-left bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/30 hover:bg-white/10 transition-all group cursor-pointer"
            style={{ borderLeft: `2px solid ${emotionColor(journal.emotion)}` }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-white">
                {formatRelativeDate(journal.createdAt)}
              </span>
              <span className="text-xs text-gray-500">
                {formatShortDate(journal.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-yellow-500/40 text-yellow-400 bg-yellow-500/10 shrink-0">
                <Star size={10} />
                Star
              </span>
              {journal.emotion && (
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-black/30 shrink-0"
                  style={{
                    color: emotionColor(journal.emotion),
                    borderColor: `${emotionColor(journal.emotion)}66`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: emotionColor(journal.emotion),
                    }}
                  />
                  {journal.emotion}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-300 line-clamp-2">
              {journal.content}
            </p>
          </button>
        ))}
      </div>
    </Modal>
  );
};

export default ArchiveModal;
