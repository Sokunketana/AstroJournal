import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Check, Link2, MousePointer2, Palette, Pencil, Plus, Save, Star, Trash2 } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import ConfirmDialog from '../ConfirmDialog';
import { formatShortDate } from '../../utils/dateUtils';
import type { Constellation, ConstellationInput } from '../../types';
import type { ConstellationModalProps } from './ConstellationModal.types';

const DEFAULT_COLOR = "#787878";

interface HslColor {
  h: number;
  s: number;
  l: number;
}

const hexToHsl = (hex: string): HslColor => {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16) / 255;
  const green = Number.parseInt(value.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) return { h: 0, s: 0, l: lightness * 100 };

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = max === red
    ? ((green - blue) / delta) % 6
    : max === green
      ? (blue - red) / delta + 2
      : (red - green) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  return { h: hue, s: saturation * 100, l: lightness * 100 };
};

const hslToHex = ({ h, s, l }: HslColor): string => {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = h / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const [red, green, blue] = segment < 1 ? [chroma, secondary, 0]
    : segment < 2 ? [secondary, chroma, 0]
      : segment < 3 ? [0, chroma, secondary]
        : segment < 4 ? [0, secondary, chroma]
          : segment < 5 ? [secondary, 0, chroma]
            : [chroma, 0, secondary];
  const offset = lightness - chroma / 2;
  return `#${[red, green, blue]
    .map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, '0'))
    .join('')}`;
};

const ConstellationModal: React.FC<ConstellationModalProps> = ({
  isOpen,
  onClose,
  constellations,
  journals,
  onCreate,
  onUpdate,
  onDelete,
  onSelectInSky,
}) => {
  const [editing, setEditing] = useState<Constellation | 'new' | null>(null);
  const [viewing, setViewing] = useState<Constellation | null>(null);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Constellation | null>(null);

  const hslColor = useMemo(() => hexToHsl(color), [color]);

  const sortedJournals = useMemo(
    () => [...journals].sort(
      (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    ),
    [journals],
  );

  const beginEdit = (constellation: Constellation | 'new') => {
    setViewing(null);
    setColorPickerOpen(false);
    setEditing(constellation);
    setTitle(constellation === 'new' ? '' : constellation.title);
    setColor(constellation === 'new' ? DEFAULT_COLOR : constellation.color);
    setSelectedIds(constellation === 'new' ? [] : constellation.journalIds);
    setError('');
  };

  const leaveEditor = () => {
    setEditing(null);
    setColorPickerOpen(false);
    setError('');
  };

  const toggleJournal = (journalId: string) => {
    if (selectedIds.includes(journalId)) {
      setSelectedIds((current) => current.filter((id) => id !== journalId));
      setError('');
      return;
    }
    if (selectedIds.length >= 30) {
      setError('A constellation can contain at most 30 stars.');
      return;
    }
    setSelectedIds((current) => [...current, journalId]);
    setError('');
  };

  const chooseWheelColor = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.type === 'pointermove' && event.buttons !== 1) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const radius = bounds.width / 2;
    const x = event.clientX - bounds.left - radius;
    const y = event.clientY - bounds.top - radius;
    const hue = (Math.atan2(y, x) * 180 / Math.PI + 450) % 360;
    const saturation = Math.min(Math.hypot(x, y) / radius, 1) * 100;
    setColor(hslToHex({ h: hue, s: saturation, l: hslColor.l }));
  };

  const saveSelection = async (journalIds: string[]): Promise<boolean> => {
    setSelectedIds(journalIds);
    if (!title.trim()) {
      setError('Give this constellation a name.');
      return false;
    }
    if (journalIds.length < 2) {
      setError('Choose at least two journal stars.');
      return false;
    }

    const input: ConstellationInput = { title: title.trim(), color, journalIds };
    setBusy(true);
    setError('');
    try {
      if (editing === 'new') await onCreate(input);
      else if (editing) await onUpdate(editing._id, input);
      leaveEditor();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the constellation.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const confirmRemove = async () => {
    if (!deleteTarget) return;
    const constellation = deleteTarget;
    setDeleteTarget(null);
    setBusy(true);
    setError('');
    try {
      await onDelete(constellation._id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete the constellation.');
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    leaveEditor();
    setViewing(null);
    setDeleteTarget(null);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={close} maxWidth="2xl" className="max-h-[85vh]">
      {editing ? (
        <>
          <div className="mb-5 flex items-center gap-3 pr-10">
            <button onClick={leaveEditor} className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white" aria-label="Back">
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white">
                {editing === 'new' ? 'Create constellation' : 'Edit constellation'}
              </p>
              <p className="mt-1 text-xs text-gray-500">Stars connect in the order you select them.</p>
            </div>
          </div>

          <div className="mb-4 space-y-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={60}
              placeholder="e.g. A new beginning"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-white/40"
            />
            <div className="relative flex items-center gap-3" aria-label="Constellation color">
              <button
                type="button"
                onClick={() => setColorPickerOpen((open) => !open)}
                className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 p-1.5 transition hover:border-white/45 hover:bg-white/10"
                style={{ boxShadow: `0 0 18px ${color}55` }}
                aria-label="Open constellation color picker"
                aria-expanded={colorPickerOpen}
              >
                <span className="h-full w-full rounded-full border border-white/30" style={{ backgroundColor: color }} />
                <Palette size={13} className="absolute text-white drop-shadow-[0_1px_2px_black]" />
              </button>
              <div>
                <p className="text-xs font-semibold text-gray-300">Constellation color</p>
                <p className="font-mono text-xs uppercase text-gray-500">{color}</p>
              </div>
              <span className="ml-auto text-xs text-gray-500">{selectedIds.length}/30 stars</span>

              {colorPickerOpen && (
                <div className="absolute left-0 top-14 z-30 w-60 rounded-2xl border border-white/15 bg-[#15151a]/98 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-300">Choose color</p>
                    <span className="h-5 w-5 rounded-full border border-white/30" style={{ backgroundColor: color }} />
                  </div>
                  <div
                    role="slider"
                    tabIndex={0}
                    aria-label="Hue and saturation"
                    className="relative mx-auto mb-4 aspect-square w-40 touch-none rounded-full border border-white/20 shadow-inner cursor-crosshair"
                    style={{
                      background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0) 72%), conic-gradient(from 0deg, #ef4444, #facc15, #22c55e, #22d3ee, #3b82f6, #a855f7, #ef4444)',
                    }}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      chooseWheelColor(event);
                    }}
                    onPointerMove={chooseWheelColor}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                        event.preventDefault();
                        const direction = event.key === 'ArrowRight' ? 1 : -1;
                        setColor(hslToHex({ ...hslColor, h: (hslColor.h + direction * 3 + 360) % 360 }));
                      }
                      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                        event.preventDefault();
                        const direction = event.key === 'ArrowUp' ? 1 : -1;
                        setColor(hslToHex({ ...hslColor, s: Math.min(100, Math.max(0, hslColor.s + direction * 3)) }));
                      }
                    }}
                  >
                    <span
                      className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_4px_black]"
                      style={{
                        left: `${50 + Math.cos((hslColor.h - 90) * Math.PI / 180) * hslColor.s / 2}%`,
                        top: `${50 + Math.sin((hslColor.h - 90) * Math.PI / 180) * hslColor.s / 2}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <label className="mb-3 block">
                    <span className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Brightness <span>{Math.round(hslColor.l)}%</span>
                    </span>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={hslColor.l}
                      onChange={(event) => setColor(hslToHex({ ...hslColor, l: Number(event.target.value) }))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
                      style={{ background: `linear-gradient(to right, #050505, hsl(${hslColor.h} ${hslColor.s}% 50%), #ffffff)` }}
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      value={color.toUpperCase()}
                      readOnly
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/35 px-3 py-2 font-mono text-xs uppercase text-gray-300 outline-none focus:border-white/35"
                      aria-label="Selected hex color"
                    />
                    <button
                      type="button"
                      onClick={() => setColorPickerOpen(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black transition hover:bg-gray-200"
                      aria-label="Confirm color"
                    >
                      <Check size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectInSky(
              {
                journalIds: selectedIds,
                color,
                editingId: editing === 'new' ? undefined : editing._id,
              },
              setSelectedIds,
              saveSelection,
            )}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-violet-300/40 bg-violet-400/8 px-4 py-5 text-sm font-semibold text-violet-100 transition hover:border-violet-200/70 hover:bg-violet-400/15"
          >
            <MousePointer2 size={18} />
            {selectedIds.length ? 'Continue selecting stars in the sky' : 'Select stars in the sky'}
          </button>

          <div className="mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Or select from your journal list</p>
          </div>
          <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
            {sortedJournals.length === 0 ? (
              <div className="py-8 text-center">
                <Star size={26} className="mx-auto mb-2 text-gray-700" />
                <p className="text-sm text-gray-500">No journal stars available yet.</p>
              </div>
            ) : sortedJournals.map((journal) => {
              const selectionIndex = selectedIds.indexOf(journal._id);
              const selected = selectionIndex >= 0;
              return (
                <button
                  key={journal._id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleJournal(journal._id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                    selected
                      ? 'border-white/30 bg-white/12'
                      : 'border-white/5 bg-white/5 hover:border-white/15 hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      selected ? 'border-white/60' : 'border-white/15 text-gray-600'
                    }`}
                    style={selected ? { color, boxShadow: `0 0 14px ${color}88` } : undefined}
                  >
                    {selected ? selectionIndex + 1 : <Star size={13} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-gray-300">{formatShortDate(journal.createdAt)}</span>
                    <span className="block truncate text-sm text-gray-500">{journal.content}</span>
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${selected ? 'text-white' : 'text-gray-600'}`}>
                    {selected ? 'Selected' : 'Select'}
                  </span>
                </button>
              );
            })}
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-2 border-t border-white/5 pt-4">
            <Button variant="ghost" onClick={leaveEditor} disabled={busy}>Cancel</Button>
            <Button icon={Save} onClick={() => void saveSelection(selectedIds)} disabled={busy || selectedIds.length < 2 || !title.trim()}>
              {busy ? 'Saving…' : 'Save constellation'}
            </Button>
          </div>
        </>
      ) : viewing ? (
        <>
          <div className="mb-5 flex items-center gap-3 pr-10">
            <button
              onClick={() => setViewing(null)}
              className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Back to constellations"
            >
              <ArrowLeft size={18} />
            </button>
            <span
              className="h-9 w-9 shrink-0 rounded-full"
              style={{ backgroundColor: viewing.color, boxShadow: `0 0 18px ${viewing.color}88` }}
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">{viewing.title}</p>
              <p className="text-xs text-gray-500">{viewing.journalIds.length} grouped journals · constellation order</p>
            </div>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
            {viewing.journalIds.map((journalId, index) => {
              const journal = journals.find((item) => item._id === journalId);
              if (!journal) return null;
              return (
                <article
                  key={journalId}
                  className="rounded-2xl border border-white/8 bg-white/5 p-4"
                  style={{ borderLeft: `2px solid ${viewing.color}` }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                      style={{ color: viewing.color, borderColor: `${viewing.color}99` }}
                    >
                      {index + 1}
                    </span>
                    <time className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {formatShortDate(journal.createdAt)}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-200">
                    {journal.content}
                  </p>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="mb-5 flex items-start justify-between gap-4 pr-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white">Your constellations</p>
              <p className="mt-1 text-sm text-gray-500">Connect journal stars into chapters of your life.</p>
            </div>
            <Button icon={Plus} onClick={() => beginEdit('new')} disabled={journals.length < 2}>New</Button>
          </div>

          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
            {constellations.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <Link2 size={30} className="mb-3 text-violet-300" />
                <p className="text-sm font-semibold text-white">No constellations yet</p>
                <p className="mt-1 max-w-xs text-sm text-gray-500">
                  {journals.length < 2 ? 'Write at least two journal entries to connect your first story.' : 'Choose a few entries that belong to the same story.'}
                </p>
              </div>
            ) : constellations.map((constellation) => (
              <div key={constellation._id} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/5 p-4">
                <span className="h-10 w-10 shrink-0 rounded-full" style={{ backgroundColor: constellation.color, boxShadow: `0 0 22px ${constellation.color}88` }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{constellation.title}</p>
                  <p className="text-xs text-gray-500">{constellation.journalIds.length} connected stars</p>
                </div>
                <button
                  onClick={() => setViewing(constellation)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
                  aria-label={`View journals in ${constellation.title}`}
                >
                  <BookOpen size={14} />
                  <span className="hidden sm:inline">View journals</span>
                </button>
                <button onClick={() => beginEdit(constellation)} className="rounded-full p-2 text-gray-500 transition hover:bg-white/10 hover:text-white" aria-label={`Edit ${constellation.title}`}>
                  <Pencil size={16} />
                </button>
                <button onClick={() => setDeleteTarget(constellation)} disabled={busy} className="rounded-full p-2 text-gray-500 transition hover:bg-red-400/10 hover:text-red-400" aria-label={`Delete ${constellation.title}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      </Modal>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete constellation?"
        message={deleteTarget
          ? `Delete “${deleteTarget.title}”? Its connecting lines will disappear, but all grouped journal entries will remain.`
          : ''}
        confirmLabel="Delete"
        onConfirm={() => void confirmRemove()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default ConstellationModal;
