import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from '@tanstack/react-router';
import { useAuth } from "../../context/AuthContext";
import { useCreateJournal } from "../../hooks/dashboard/useCreateJournal";
import { useDeleteJournal } from "../../hooks/dashboard/useDeleteJournal";
import { useUpdateJournal } from "../../hooks/dashboard/useUpdateJournal";
import { useUpdateJournalPosition } from "../../hooks/dashboard/useUpdateJournalPosition";
import { useUpdatePlanetPosition } from "../../hooks/dashboard/useUpdatePlanetPosition";
import { useUserData, useJournals, usePlanets } from "../../hooks/useDashboardData";
import type { Journal, Planet } from "../../types";
import SkyBackground from "../../components/SkyBackground";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import StatBadge from "../../components/StatBadge";
import EditableContent from "../../components/EditableContent";
import EditableActions from "../../components/EditableActions";
import Logo from "../../components/Logo";
import { formatLongDate, formatShortDate } from "../../utils/dateUtils";
import { emotionColor } from "../../utils/emotion";
import type { DashboardPageProps } from "./DashboardPage.types";
import {
  Star,
  Flame,
  Globe,
} from "lucide-react";


const DashboardPage: React.FC<DashboardPageProps> = () => {
  const { logout } = useAuth();
  const router = useRouter();

  // fetch user data
  const {
    data: userData,
    isLoading: userLoading,
    mutate: mutateUser,
  } = useUserData();

  // fetch journals data
  const {
    data: journals = [],
    isLoading: journalsLoading,
    mutate: mutateJournals,
  } = useJournals();

  // fetch planets data
  const {
    data: planets = [],
    isLoading: planetsLoading,
    mutate: mutatePlanets,
  } = usePlanets();

  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [selectedPlanetJournals, setSelectedPlanetJournals] = useState<
    Journal[] | null
  >(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const mutateAll = useCallback(() => {
    mutateUser();
    mutateJournals();
    mutatePlanets();
  }, [mutateUser, mutateJournals, mutatePlanets]);

  const { newEntry, setNewEntry, isSubmitting, handleSubmit } = useCreateJournal(mutateAll);
  const { deleteTargetId, setDeleteTargetId, handleDelete, confirmDelete } = useDeleteJournal(mutateJournals, mutateAll, setSelectedJournal, setSelectedPlanetJournals);
  const { editingJournalId, editContent, setEditContent, handleEdit, startEditing, cancelEditing } = useUpdateJournal(mutateJournals, selectedJournal, setSelectedJournal, selectedPlanetJournals, setSelectedPlanetJournals);
  const { handleJournalPositionUpdate } = useUpdateJournalPosition(mutateJournals);
  const { handlePlanetPositionUpdate } = useUpdatePlanetPosition(mutatePlanets);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      const prevTransition = el.style.transition;
      el.style.transition = 'none';

      el.style.minHeight = '0px';
      el.style.height = "auto";
      
      void el.offsetHeight; 
      
      const trueHeight = el.scrollHeight;
      
      el.style.minHeight = '';
      el.style.height = `${trueHeight}px`;
      
      void el.offsetHeight; 
      
      el.style.transition = prevTransition;
    }
  }, [newEntry]);

  const loading = userLoading || journalsLoading || planetsLoading;

  // Memoize derived data so SkyBackground only re-renders when journals/planets actually change
  const looseJournals = useMemo(
    () => journals.filter((j: Journal) => !j.planetId),
    [journals],
  );

  const planetsData = useMemo(
    () =>
      planets.map((planet: Planet) => ({
        ...planet,
        journals: journals.filter((j: Journal) => j.planetId === planet._id),
      })),
    [planets, journals],
  );

  const handleStarClick = useCallback((journal: Journal) => {
    setSelectedJournal(journal);
  }, []);

  const handlePlanetClick = useCallback((pJournals: Journal[]) => {
    setSelectedPlanetJournals(pJournals);
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );

  return (
    <div className="relative min-h-screen text-white overflow-hidden font-sans">
      <SkyBackground
        totalStars={userData?.totalStars || 0}
        planetsData={planetsData}
        looseJournals={looseJournals}
        onStarClick={handleStarClick}
        onPlanetClick={handlePlanetClick}
        onJournalPositionUpdate={handleJournalPositionUpdate}
        onPlanetPositionUpdate={handlePlanetPositionUpdate}
        paused={!!selectedJournal || !!selectedPlanetJournals}
      />

      {/* Persistent Top Navigation & Input Bar */}
      <div className="fixed top-0 inset-x-0 z-50 pointer-events-none">
        <header className="flex justify-between items-start p-6 from-black/80 to-transparent pointer-events-auto">
          <div className="flex items-center gap-4 h-11.5">
            <Logo className="text-2xl" />

          </div>

          {/* Main Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 max-w-xl mx-8 relative group transition-all duration-300 ease-in-out"
          >
            <textarea
              ref={textareaRef}
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder="Reflect on your day across the universe..."
              className="w-full block bg-white/5 border border-white/10 rounded-2xl py-3 px-6 pr-14 focus:outline-none focus:bg-white/10 focus:border-purple-500 focus:min-h-[96px] transition-all duration-300 ease-in-out backdrop-blur-md text-sm resize-none max-h-96 overflow-y-auto disabled:opacity-50 no-scrollbar"
              rows={1}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              onClick={(e) => {
                if (!newEntry.trim() || isSubmitting) e.preventDefault();
              }}
              className={`absolute right-2 top-[7px] p-2 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                !newEntry.trim() || isSubmitting
                  ? "bg-purple-600 opacity-30 hover:opacity-100 group-focus-within:opacity-100"
                  : "bg-purple-600 hover:bg-purple-500 group-focus-within:bg-purple-500"
              }`}
            >
              <img src="/Send Button.svg" alt="Send" className="w-4 h-4 object-contain translate-x-0.5 pointer-events-none" />
            </button>
          </form>

          <div className="flex items-center gap-4 h-11.5">
            <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
              <StatBadge icon={Globe} value={planetsData.length} colorClass="text-purple-600" tooltip="Total Planets Created" />
              <StatBadge icon={Flame} value={userData?.currentStreak || 0} colorClass="text-orange-500" tooltip="Current Daily Journal Streak" />
              <StatBadge icon={Star} value={userData?.totalStars || 0} colorClass="text-yellow-500" showBorder={false} tooltip="Total Stars Earned" />
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </header>
      </div>

      {/* Journal Entry Viewer (Modal) */}
      <Modal isOpen={!!selectedJournal} onClose={() => setSelectedJournal(null)} maxWidth="lg">
        {selectedJournal && (
          <>
            <div className="mb-6 flex items-start justify-between gap-4 pr-12">
              <div>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
                  Stellar Archive
                </p>
                <h3 className="text-gray-400 text-sm font-medium">
                  {formatLongDate(selectedJournal.createdAt)}
                </h3>
              </div>
              {selectedJournal.emotion && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border bg-black/30"
                  style={{
                    color: emotionColor(selectedJournal.emotion),
                    borderColor: `${emotionColor(selectedJournal.emotion)}66`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: emotionColor(selectedJournal.emotion) }}
                  />
                  {selectedJournal.emotion}
                </span>
              )}
            </div>

            <EditableContent
              isEditing={editingJournalId === selectedJournal._id}
              value={editContent}
              onValueChange={setEditContent}
              displayContent={selectedJournal.content}
              containerClassName="mb-8"
              textareaClassName="rounded-xl p-4 text-lg min-h-30"
              displayClassName="text-xl leading-relaxed mb-8"
            />

            <div className="flex justify-between items-center pt-6 border-t border-white/5">
              <div className="flex items-center gap-2 text-yellow-500/80">
                <Star size={14} />
                <span className="text-xs font-bold uppercase">
                  Star Earned
                </span>
              </div>
              <EditableActions
                isEditing={editingJournalId === selectedJournal._id}
                onSave={() => handleEdit(selectedJournal._id, editContent)}
                onCancel={cancelEditing}
                onEdit={() => startEditing(selectedJournal)}
                onDelete={() => handleDelete(selectedJournal._id)}
                isSaveDisabled={!editContent.trim()}
                editButtonClassName="text-purple-400/50! hover:text-purple-400! hover:bg-purple-400/10!"
              />
            </div>
          </>
        )}
      </Modal>

      {/* Planet Journals Viewer (Modal) */}
      <Modal isOpen={!!selectedPlanetJournals} onClose={() => setSelectedPlanetJournals(null)} maxWidth="2xl" className="max-h-[80vh]">
        {selectedPlanetJournals && (
          <>
            <div className="mb-4 shrink-0">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
                Planet Archive
              </p>
              <h3 className="text-gray-400 text-sm font-medium">
                {selectedPlanetJournals.length} Journals Contained
              </h3>
            </div>

            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-4">
              {selectedPlanetJournals.map((journal: Journal) => (
                <div
                  key={journal._id}
                  className="bg-white/5 p-4 rounded-xl border border-white/5 relative group"
                >
                  <div className="flex items-center gap-2 mb-2 pr-14">
                    <p className="text-sm text-gray-400 shrink-0">
                      {formatShortDate(journal.createdAt)}
                    </p>
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
                          style={{ backgroundColor: emotionColor(journal.emotion) }}
                        />
                        {journal.emotion}
                      </span>
                    )}
                  </div>
                  <EditableContent
                    isEditing={editingJournalId === journal._id}
                    value={editContent}
                    onValueChange={setEditContent}
                    displayContent={journal.content}
                    textareaClassName="rounded-lg p-3 min-h-20"
                  >
                    <EditableActions
                      isEditing={true}
                      onSave={() => handleEdit(journal._id, editContent)}
                      onCancel={cancelEditing}
                      isSaveDisabled={!editContent.trim()}
                      editContainerClassName="flex items-center gap-2 mt-2"
                      saveButtonClassName="py-1.5! px-3!"
                      cancelButtonClassName="py-1.5! px-3!"
                    />
                  </EditableContent>
                  {editingJournalId !== journal._id && (
                    <EditableActions
                      isEditing={false}
                      onEdit={() => startEditing(journal)}
                      onDelete={() => handleDelete(journal._id)}
                      viewVariant="icon"
                      viewContainerClassName="absolute top-4 right-4 flex items-center gap-1"
                      editButtonClassName="text-purple-400/0 group-hover:text-purple-400/50 hover:text-purple-400! hover:bg-transparent!"
                      deleteButtonClassName="text-red-400/0 group-hover:text-red-400/50 hover:text-red-400! hover:bg-transparent!"
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          logout();
          await router.navigate({ to: '/login' });
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default DashboardPage;
