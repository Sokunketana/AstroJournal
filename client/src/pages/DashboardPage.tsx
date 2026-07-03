import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { useUserData, useJournals, usePlanets } from '../hooks/useDashboardData';
import type { Journal, Planet } from '../types';
import SkyBackground from '../components/SkyBackground';
import { Star, Flame, Send, Trash2, Globe, X, Pencil, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';

const DashboardPage: React.FC = () => {
  const { logout } = useAuth();
  const { data: userData, isLoading: userLoading, mutate: mutateUser } = useUserData();
  const { data: journals = [], isLoading: journalsLoading, mutate: mutateJournals } = useJournals();
  const { data: planets = [], isLoading: planetsLoading, mutate: mutatePlanets } = usePlanets();

  const [newEntry, setNewEntry] = useState('');
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [selectedPlanetJournals, setSelectedPlanetJournals] = useState<Journal[] | null>(null);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loading = userLoading || journalsLoading || planetsLoading;

  // Memoize derived data so SkyBackground only re-renders when journals/planets actually change
  const looseJournals = useMemo(() => journals.filter((j: Journal) => !j.planetId), [journals]);
  const planetsData = useMemo(() => planets.map((planet: Planet) => ({
    ...planet,
    journals: journals.filter((j: Journal) => j.planetId === planet._id)
  })), [planets, journals]);

  const mutateAll = useCallback(() => {
    mutateUser();
    mutateJournals();
    mutatePlanets();
  }, [mutateUser, mutateJournals, mutatePlanets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim()) return;
    try {
      await apiFetch('/journals', {
        method: 'POST',
        body: JSON.stringify({ content: newEntry }),
      });
      setNewEntry('');
      mutateAll();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert(String(err));
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
        (current: Journal[]) => current ? current.filter((j: Journal) => j._id !== id) : [],
        false
      );
      setSelectedJournal(null);
      setSelectedPlanetJournals(null);

      await apiFetch(`/journals/${id}`, { method: 'DELETE' });
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
        method: 'PUT',
        body: JSON.stringify({ content }),
      });
      // Update the selected journal if it's the one being edited
      if (selectedJournal && selectedJournal._id === id) {
        setSelectedJournal({ ...selectedJournal, content: updated.content });
      }
      // Update planet journals if viewing planet modal
      if (selectedPlanetJournals) {
        setSelectedPlanetJournals(prev =>
          prev ? prev.map(j => j._id === id ? { ...j, content: updated.content } : j) : null
        );
      }
      setEditingJournalId(null);
      setEditContent('');
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
    setEditContent('');
  };

  const handleJournalPositionUpdate = useCallback(async (id: string, pos: { x: number, y: number, z: number }) => {
    try {
      // Optimistic update: update position in local cache without revalidating
      mutateJournals(
        (current: Journal[]) => current ? current.map((j: Journal) => j._id === id ? { ...j, position: pos } : j) : [],
        false
      );
      await apiFetch(`/journals/${id}/position`, {
        method: 'PUT',
        body: JSON.stringify(pos),
      });
    } catch (err: unknown) {
      console.error('Failed to update journal position', err);
      mutateJournals(); // Revert on error
    }
  }, [mutateJournals]);

  const handlePlanetPositionUpdate = useCallback(async (id: string, pos: { x: number, y: number, z: number }) => {
    try {
      // Optimistic update
      mutatePlanets(
        (current: Planet[]) => current ? current.map((p: Planet) => p._id === id ? { ...p, position: pos } : p) : [],
        false
      );
      await apiFetch(`/planets/${id}/position`, {
        method: 'PUT',
        body: JSON.stringify(pos),
      });
    } catch (err: unknown) {
      console.error('Failed to update planet position', err);
      mutatePlanets(); // Revert on error
    }
  }, [mutatePlanets]);

  const handleStarClick = useCallback((journal: Journal) => {
    setSelectedJournal(journal);
  }, []);

  const handlePlanetClick = useCallback((pJournals: Journal[]) => {
    setSelectedPlanetJournals(pJournals);
  }, []);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

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
        <header className="flex justify-between items-center p-6 from-black/80 to-transparent pointer-events-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tighter text-purple-600">ASTROJOURNAL</h1>
            {userData?.role === 'admin' && (
              <span className="bg-blue-500/20 text-purple-600 text-[10px] px-2 py-0.5 rounded-full border border-purple-500/30 font-bold uppercase">
                Admin
              </span>
            )}
          </div>
          
          {/* Main Input Bar */}
          <form onSubmit={handleSubmit} className="flex-1 max-w-xl mx-8 relative group">
            <input
              type="text"
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder="Reflect on your day across the universe..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-6 pr-14 focus:outline-none focus:bg-white/10 focus:border-purple-500 transition-all backdrop-blur-md text-sm"
            />
            <button
              type="submit"
              disabled={!newEntry.trim()}
              className="absolute right-2 top-1.5 p-2 bg-purple-600 rounded-full hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
                <Globe size={16} className="text-purple-600" />
                <span className="text-sm font-bold">{planetsData.length}</span>
              </div>
              <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
                <Flame size={16} className="text-orange-500" />
                <span className="text-sm font-bold">{userData?.currentStreak || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star size={16} className="text-yellow-500" />
                <span className="text-sm font-bold">{userData?.totalStars || 0}</span>
              </div>
            </div>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-white transition-colors">Logout</button>
          </div>
        </header>
      </div>

      {/* Journal Entry Viewer (Modal) */}
      <AnimatePresence>
        {selectedJournal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#111] border border-white/10 p-8 rounded-3xl max-w-lg w-full relative shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              
              <button
                onClick={() => setSelectedJournal(null)}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Stellar Archive</p>
                <h3 className="text-gray-400 text-sm font-medium">
                  {new Date(selectedJournal.createdAt).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
              </div>

              {editingJournalId === selectedJournal._id ? (
                <div className="mb-8">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-lg font-light italic focus:outline-none focus:border-purple-500 transition-colors resize-none min-h-[120px]"
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
                  <span className="text-xs font-bold uppercase">Star Earned</span>
                </div>
                {editingJournalId === selectedJournal._id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(selectedJournal._id, editContent)}
                      disabled={!editContent.trim()}
                      className="flex items-center gap-2 px-4 py-2 text-green-400/80 hover:text-green-400 hover:bg-green-400/10 rounded-xl transition-all text-xs font-bold uppercase disabled:opacity-30"
                    >
                      <Check size={14} />
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="flex items-center gap-2 px-4 py-2 text-gray-400/50 hover:text-gray-400 hover:bg-white/5 rounded-xl transition-all text-xs font-bold uppercase"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditing(selectedJournal)}
                      className="flex items-center gap-2 px-4 py-2 text-purple-400/50 hover:text-purple-400 hover:bg-purple-400/10 rounded-xl transition-all text-xs font-bold uppercase"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedJournal._id)}
                      className="flex items-center gap-2 px-4 py-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all text-xs font-bold uppercase"
                    >
                      <Trash2 size={14} />
                      Delete Entry
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Planet Journals Viewer (Modal) */}
      <AnimatePresence>
        {selectedPlanetJournals && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#111] border border-white/10 p-6 rounded-3xl max-w-2xl w-full relative shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              
              <button
                onClick={() => setSelectedPlanetJournals(null)}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              <div className="mb-4 flex-shrink-0">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Planet Archive</p>
                <h3 className="text-gray-400 text-sm font-medium">
                  {selectedPlanetJournals.length} Journals Contained
                </h3>
              </div>

              <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-4">
                {selectedPlanetJournals.map((journal: Journal) => (
                  <div key={journal._id} className="bg-white/5 p-4 rounded-xl border border-white/5 relative group">
                    <p className="text-sm text-gray-400 mb-2">
                      {new Date(journal.createdAt).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                    {editingJournalId === journal._id ? (
                      <div>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-light italic focus:outline-none focus:border-purple-500 transition-colors resize-none min-h-[80px]"
                          autoFocus
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleEdit(journal._id, editContent)}
                            disabled={!editContent.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-green-400/80 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-all text-xs font-bold uppercase disabled:opacity-30"
                          >
                            <Check size={12} />
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400/50 hover:text-gray-400 hover:bg-white/5 rounded-lg transition-all text-xs font-bold uppercase"
                          >
                            <X size={12} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white font-light italic">"{journal.content}"</p>
                    )}
                    {editingJournalId !== journal._id && (
                      <div className="absolute top-4 right-4 flex items-center gap-1">
                        <button
                          onClick={() => startEditing(journal)}
                          className="text-purple-400/0 group-hover:text-purple-400/50 hover:!text-purple-400 transition-all"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(journal._id)}
                          className="text-red-400/0 group-hover:text-red-400/50 hover:!text-red-400 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

    </div>
  );
};

export default DashboardPage;
