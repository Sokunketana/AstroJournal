import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../services/api";
import {
  useUserData,
  useJournals,
  usePlanets,
} from "../../hooks/useDashboardData";
import type { Journal, Planet } from "../../types";
import SkyBackground from "../../components/SkyBackground";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import StatBadge from "../../components/StatBadge";
import {
  Star,
  Flame,
  Send,
  Trash2,
  Globe,
  X,
  Pencil,
  Check,
} from "lucide-react";
import type { DashboardPageProps } from "./DashboardPage.types";

const DashboardPage: React.FC<DashboardPageProps> = () => {
  const { logout } = useAuth();

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

  const [newEntry, setNewEntry] = useState("");
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [selectedPlanetJournals, setSelectedPlanetJournals] = useState<
    Journal[] | null
  >(null);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
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

  const mutateAll = useCallback(() => {
    mutateUser();
    mutateJournals();
    mutatePlanets();
  }, [mutateUser, mutateJournals, mutatePlanets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiFetch("/journals", {
        method: "POST",
        body: JSON.stringify({ content: newEntry }),
      });
      setNewEntry("");
      mutateAll();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      // Optimistic update: remove the journal from the local cache immediately
      mutateJournals(
        (current: Journal[]) =>
          current ? current.filter((j: Journal) => j._id !== id) : [],
        false,
      );
      setSelectedJournal(null);
      setSelectedPlanetJournals(null);

      await apiFetch(`/journals/${id}`, { method: "DELETE" });
      mutateAll();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert(String(err));
      mutateAll(); // Revert on error
    }
  };

  const handleEdit = async (id: string, content: string) => {
    if (!content.trim()) return;
    try {
      const updated = await apiFetch(`/journals/${id}`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });
      // Update the selected journal if it's the one being edited
      if (selectedJournal && selectedJournal._id === id) {
        setSelectedJournal({ ...selectedJournal, content: updated.content });
      }
      // Update planet journals if viewing planet modal
      if (selectedPlanetJournals) {
        setSelectedPlanetJournals((prev) =>
          prev
            ? prev.map((j) =>
                j._id === id ? { ...j, content: updated.content } : j,
              )
            : null,
        );
      }
      setEditingJournalId(null);
      setEditContent("");
      mutateJournals();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert(String(err));
    }
  };

  const startEditing = (journal: Journal) => {
    setEditingJournalId(journal._id);
    setEditContent(journal.content);
  };

  const cancelEditing = () => {
    setEditingJournalId(null);
    setEditContent("");
  };

  const handleJournalPositionUpdate = useCallback(
    async (id: string, pos: { x: number; y: number; z: number }) => {
      try {
        // Optimistic update: update position in local cache without revalidating
        mutateJournals(
          (current: Journal[]) =>
            current
              ? current.map((j: Journal) =>
                  j._id === id ? { ...j, position: pos } : j,
                )
              : [],
          false,
        );
        await apiFetch(`/journals/${id}/position`, {
          method: "PUT",
          body: JSON.stringify(pos),
        });
      } catch (err: unknown) {
        console.error("Failed to update journal position", err);
        mutateJournals(); // Revert on error
      }
    },
    [mutateJournals],
  );

  const handlePlanetPositionUpdate = useCallback(
    async (id: string, pos: { x: number; y: number; z: number }) => {
      try {
        // Optimistic update
        mutatePlanets(
          (current: Planet[]) =>
            current
              ? current.map((p: Planet) =>
                  p._id === id ? { ...p, position: pos } : p,
                )
              : [],
          false,
        );
        await apiFetch(`/planets/${id}/position`, {
          method: "PUT",
          body: JSON.stringify(pos),
        });
      } catch (err: unknown) {
        console.error("Failed to update planet position", err);
        mutatePlanets(); // Revert on error
      }
    },
    [mutatePlanets],
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
          <div className="flex items-center gap-4 h-[46px]">
            <h1 className="text-2xl font-black tracking-tighter text-purple-600">
              ASTROJOURNAL
            </h1>
            {userData?.role === "admin" && (
              <span className="bg-blue-500/20 text-purple-600 text-[10px] px-2 py-0.5 rounded-full border border-purple-500/30 font-bold uppercase">
                Admin
              </span>
            )}
          </div>

          {/* Main Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 max-w-xl mx-8 relative group"
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
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-6 pr-14 focus:outline-none focus:bg-white/10 focus:border-purple-500 transition-all backdrop-blur-md text-sm resize-none max-h-48 overflow-y-auto disabled:opacity-50 no-scrollbar"
              rows={1}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!newEntry.trim() || isSubmitting}
              className="absolute right-2 bottom-2 p-2 bg-purple-600 rounded-full hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>

          <div className="flex items-center gap-4 h-[46px]">
            <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
              <StatBadge icon={Globe} value={planetsData.length} colorClass="text-purple-600" />
              <StatBadge icon={Flame} value={userData?.currentStreak || 0} colorClass="text-orange-500" />
              <StatBadge icon={Star} value={userData?.totalStars || 0} colorClass="text-yellow-500" showBorder={false} />
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
            <div className="mb-6">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
                Stellar Archive
              </p>
              <h3 className="text-gray-400 text-sm font-medium">
                {new Date(selectedJournal.createdAt).toLocaleDateString(
                  undefined,
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </h3>
            </div>

            {editingJournalId === selectedJournal._id ? (
              <div className="mb-8">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-lg font-light italic focus:outline-none focus:border-purple-500 transition-colors resize-none min-h-30"
                  autoFocus
                />
              </div>
            ) : (
              <p className="text-xl text-white leading-relaxed font-light mb-8 italic">
                "{selectedJournal.content}"
              </p>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-white/5">
              <div className="flex items-center gap-2 text-yellow-500/80">
                <Star size={14} />
                <span className="text-xs font-bold uppercase">
                  Star Earned
                </span>
              </div>
              {editingJournalId === selectedJournal._id ? (
                <div className="flex items-center gap-2">
                  <Button variant="success" icon={Check} onClick={() => handleEdit(selectedJournal._id, editContent)} disabled={!editContent.trim()}>
                    Save
                  </Button>
                  <Button variant="ghost" icon={X} onClick={cancelEditing}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" icon={Pencil} onClick={() => startEditing(selectedJournal)} className="text-purple-400/50! hover:text-purple-400! hover:bg-purple-400/10!">
                    Edit
                  </Button>
                  <Button variant="danger" icon={Trash2} onClick={() => handleDelete(selectedJournal._id)}>
                    Delete Entry
                  </Button>
                </div>
              )}
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
                  <p className="text-sm text-gray-400 mb-2">
                    {new Date(journal.createdAt).toLocaleDateString(
                      undefined,
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </p>
                  {editingJournalId === journal._id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-light italic focus:outline-none focus:border-purple-500 transition-colors resize-none min-h-20"
                        autoFocus
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="success" icon={Check} onClick={() => handleEdit(journal._id, editContent)} disabled={!editContent.trim()} className="py-1.5! px-3!">
                          Save
                        </Button>
                        <Button variant="ghost" icon={X} onClick={cancelEditing} className="py-1.5! px-3!">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white font-light italic">
                      "{journal.content}"
                    </p>
                  )}
                  {editingJournalId !== journal._id && (
                    <div className="absolute top-4 right-4 flex items-center gap-1">
                      <Button variant="icon" icon={Pencil} onClick={() => startEditing(journal)} className="text-purple-400/0 group-hover:text-purple-400/50 hover:text-purple-400! hover:bg-transparent!" />
                      <Button variant="icon" icon={Trash2} onClick={() => handleDelete(journal._id)} className="text-red-400/0 group-hover:text-red-400/50 hover:text-red-400! hover:bg-transparent!" />
                    </div>
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
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default DashboardPage;
