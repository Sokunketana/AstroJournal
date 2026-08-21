import React, { useState } from 'react';
import { ArrowLeft, Link2, MousePointer2, Pencil, Plus, Save, Star, Trash2 } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import { formatShortDate } from '../../utils/dateUtils';
import type { Constellation, ConstellationInput } from '../../types';
import type { ConstellationModalProps } from './ConstellationModal.types';

const DEFAULT_COLOR = '#a78bfa';

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
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const beginEdit = (constellation: Constellation | 'new') => {
    setEditing(constellation);
    setTitle(constellation === 'new' ? '' : constellation.title);
    setColor(constellation === 'new' ? DEFAULT_COLOR : constellation.color);
    setSelectedIds(constellation === 'new' ? [] : constellation.journalIds);
    setError('');
  };

  const leaveEditor = () => {
    setEditing(null);
    setError('');
  };

  const save = async () => {
    if (!title.trim()) return setError('Give this constellation a name.');
    if (selectedIds.length < 2) return setError('Choose at least two journal stars.');

    const input: ConstellationInput = { title: title.trim(), color, journalIds: selectedIds };
    setBusy(true);
    setError('');
    try {
      if (editing === 'new') await onCreate(input);
      else if (editing) await onUpdate(editing._id, input);
      leaveEditor();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the constellation.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (constellation: Constellation) => {
    if (!window.confirm(`Delete “${constellation.title}”? Your journal entries will remain.`)) return;
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
    onClose();
  };

  return (
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
            <div className="flex items-center gap-3" aria-label="Constellation color">
              <label
                className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full p-1 transition hover:scale-105"
                style={{
                  background: 'conic-gradient(#ef4444, #facc15, #22c55e, #22d3ee, #3b82f6, #a855f7, #ef4444)',
                  boxShadow: `0 0 20px ${color}66`,
                }}
                title="Choose any constellation color"
              >
                <span className="h-full w-full rounded-full border-2 border-black/70" style={{ backgroundColor: color }} />
                <input
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="absolute -inset-3 h-20 w-20 cursor-pointer opacity-0"
                  aria-label="Choose any constellation color"
                />
              </label>
              <div>
                <p className="text-xs font-semibold text-gray-300">Constellation color</p>
                <p className="font-mono text-xs uppercase text-gray-500">{color}</p>
              </div>
              <span className="ml-auto text-xs text-gray-500">{selectedIds.length}/30 stars</span>
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
            )}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-violet-300/40 bg-violet-400/8 px-4 py-5 text-sm font-semibold text-violet-100 transition hover:border-violet-200/70 hover:bg-violet-400/15"
          >
            <MousePointer2 size={18} />
            {selectedIds.length ? 'Continue selecting stars in the sky' : 'Select stars in the sky'}
          </button>

          <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
            {selectedIds.length === 0 ? (
              <div className="py-8 text-center">
                <Star size={26} className="mx-auto mb-2 text-gray-700" />
                <p className="text-sm text-gray-500">No stars selected yet.</p>
              </div>
            ) : selectedIds.map((journalId, index) => {
              const journal = journals.find((item) => item._id === journalId);
              if (!journal) return null;
              return (
                <div key={journalId} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/60 text-xs font-bold"
                    style={{ color, boxShadow: `0 0 14px ${color}88` }}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-gray-300">{formatShortDate(journal.createdAt)}</span>
                    <span className="block truncate text-sm text-gray-500">{journal.content}</span>
                  </span>
                </div>
              );
            })}
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-2 border-t border-white/5 pt-4">
            <Button variant="ghost" onClick={leaveEditor} disabled={busy}>Cancel</Button>
            <Button icon={Save} onClick={() => void save()} disabled={busy || selectedIds.length < 2 || !title.trim()}>
              {busy ? 'Saving…' : 'Save constellation'}
            </Button>
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
                <button onClick={() => beginEdit(constellation)} className="rounded-full p-2 text-gray-500 transition hover:bg-white/10 hover:text-white" aria-label={`Edit ${constellation.title}`}>
                  <Pencil size={16} />
                </button>
                <button onClick={() => void remove(constellation)} disabled={busy} className="rounded-full p-2 text-gray-500 transition hover:bg-red-400/10 hover:text-red-400" aria-label={`Delete ${constellation.title}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
};

export default ConstellationModal;
