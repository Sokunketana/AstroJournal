import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import Button from '../Button';
import type { JournalDataSettingsProps } from './JournalDataSettings.types';

const CONFIRMATION_PHRASE = 'DELETE ALL';

const JournalDataSettings: React.FC<JournalDataSettingsProps> = ({
  journalCount,
  onDeleteAll,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletedCount, setDeletedCount] = useState<number | null>(null);

  const cancelConfirmation = () => {
    if (isDeleting) return;
    setIsConfirming(false);
    setConfirmation('');
    setError(null);
  };

  const handleDeleteAll = async () => {
    if (confirmation !== CONFIRMATION_PHRASE || isDeleting) return;

    setIsDeleting(true);
    setError(null);
    try {
      const count = await onDeleteAll();
      setDeletedCount(count);
      setIsConfirming(false);
      setConfirmation('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-[#f8f5ed]">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Journal data</h2>
        <p className="mt-1 text-sm leading-relaxed text-[#969bad]">
          Manage the journal entries stored in your AstroJournal account.
        </p>
      </div>

      {deletedCount !== null && (
        <div
          className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/8 p-4 text-sm text-emerald-100"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={18} />
          <p>
            {deletedCount === 1
              ? '1 journal entry was deleted.'
              : `${deletedCount} journal entries were deleted.`}
          </p>
        </div>
      )}

      <section className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-red-400/10 p-2 text-red-300">
            <Trash2 size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white">Delete all journals</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#aeb3c2]">
              Permanently delete all {journalCount} journal {journalCount === 1 ? 'entry' : 'entries'},
              reset your stars and streak, and remove all constellations. This cannot be undone.
            </p>
          </div>
        </div>

        {!isConfirming ? (
          <Button
            variant="danger"
            className="mt-5 border border-red-400/20"
            disabled={journalCount === 0}
            onClick={() => {
              setDeletedCount(null);
              setIsConfirming(true);
            }}
          >
            Delete all journals
          </Button>
        ) : (
          <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="flex gap-2 text-sm text-red-100">
              <AlertTriangle className="mt-0.5 shrink-0 text-red-400" size={17} />
              <p>
                Type <strong className="font-semibold text-white">{CONFIRMATION_PHRASE}</strong> to confirm.
              </p>
            </div>
            <label htmlFor="delete-all-confirmation" className="sr-only">
              Type {CONFIRMATION_PHRASE} to confirm
            </label>
            <input
              id="delete-all-confirmation"
              autoFocus
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleDeleteAll();
              }}
              disabled={isDeleting}
              placeholder={CONFIRMATION_PHRASE}
              autoComplete="off"
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#111521] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-red-400/60 focus:ring-2 focus:ring-red-400/10 disabled:opacity-50"
            />
            {error && (
              <p className="mt-2 text-sm text-red-300" role="alert">{error}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" disabled={isDeleting} onClick={cancelConfirmation}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="border border-red-400/25 bg-red-400/10"
                disabled={confirmation !== CONFIRMATION_PHRASE || isDeleting}
                onClick={() => void handleDeleteAll()}
              >
                {isDeleting ? 'Deleting…' : 'Delete everything'}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default JournalDataSettings;
