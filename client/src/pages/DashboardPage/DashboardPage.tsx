import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from '@tanstack/react-router';
import { useAuth } from "../../context/AuthContext";
import {
  useCreateJournal,
  type JournalCreationResult,
} from "../../hooks/dashboard/useCreateJournal";
import { useDeleteJournal } from "../../hooks/dashboard/useDeleteJournal";
import { useUpdateJournal } from "../../hooks/dashboard/useUpdateJournal";
import { useUpdateJournalPosition } from "../../hooks/dashboard/useUpdateJournalPosition";
import { useUserData, useJournals, useConstellations } from "../../hooks/useDashboardData";
import type { Constellation, ConstellationInput, Journal, User } from "../../types";
import { dashboardService } from "../../services/dashboardService";
import SkyBackground from "../../components/SkyBackground";
import LottieRocketOverlay, {
  ROCKET_FLIGHT_DURATION_MS,
} from "../../components/LottieRocketOverlay/LottieRocketOverlay";
import ConfirmDialog from "../../components/ConfirmDialog";
import Modal from "../../components/Modal";
import ArchiveModal from "../../components/ArchiveModal";
import StatBadge from "../../components/StatBadge";
import EditableContent from "../../components/EditableContent";
import EditableActions from "../../components/EditableActions";
import Logo from "../../components/Logo";
import ConstellationModal from "../../components/ConstellationModal";
import { formatLongDate } from "../../utils/dateUtils";
import { emotionColor } from "../../utils/emotion";
import type { DashboardPageProps } from "./DashboardPage.types";
import type { RocketLaunchData } from "../../components/SkyBackground/SkyBackground.types";
import {
  Star,
  Flame,
  Rocket,
  Search,
  X,
  Share2,
} from "lucide-react";

interface AimPoint {
  x: number;
  y: number;
}

interface AimPreview {
  start: AimPoint;
  target: AimPoint;
  canceling: boolean;
}

interface AimDragState extends AimPreview {
  pointerId: number;
  pointerStart: AimPoint;
  moved: boolean;
}

const AIM_DRAG_THRESHOLD = 8;
const AIM_CANCEL_MARGIN = 8;

const projectTargetToScreen = (target: { x: number; y: number; z: number }) => {
  const distance = 10 - target.z;
  const halfHeight = Math.tan(Math.PI / 6) * distance;
  const halfWidth = halfHeight * (window.innerWidth / window.innerHeight);
  return {
    x: window.innerWidth * (0.5 + target.x / (halfWidth * 2)),
    y: window.innerHeight * (0.5 - target.y / (halfHeight * 2)),
  };
};

const projectScreenToTarget = (screen: AimPoint, z: number) => {
  const distance = 10 - z;
  const halfHeight = Math.tan(Math.PI / 6) * distance;
  const halfWidth = halfHeight * (window.innerWidth / window.innerHeight);
  return {
    x: ((screen.x / window.innerWidth) * 2 - 1) * halfWidth,
    y: (1 - (screen.y / window.innerHeight) * 2) * halfHeight,
    z,
  };
};

const clampAimToSky = (x: number, y: number): AimPoint => {
  const composer = document.querySelector("[data-launch-composer]")?.getBoundingClientRect();
  const horizontalMargin = Math.min(48, window.innerWidth * 0.08);
  const minY = Math.min(96, window.innerHeight * 0.18);
  const maxY = Math.max(minY + 40, (composer?.top ?? window.innerHeight - 96) - 36);

  return {
    x: Math.min(Math.max(x, horizontalMargin), window.innerWidth - horizontalMargin),
    y: Math.min(Math.max(y, minY), maxY),
  };
};

const isPointOverButton = (point: AimPoint, rect: DOMRect) => (
  point.x >= rect.left - AIM_CANCEL_MARGIN
  && point.x <= rect.right + AIM_CANCEL_MARGIN
  && point.y >= rect.top - AIM_CANCEL_MARGIN
  && point.y <= rect.bottom + AIM_CANCEL_MARGIN
);

const LaunchAimPreview: React.FC<AimPreview> = ({ start, target, canceling }) => {
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-hidden="true">
      {canceling ? (
        <span
          className="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border border-red-300/30 bg-black/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-red-100 backdrop-blur-sm"
          style={{ left: start.x, top: start.y - 26 }}
        >
          Release to cancel
        </span>
      ) : (
        <>
      <div
        className="absolute h-px origin-left bg-gradient-to-r from-orange-300/20 via-yellow-200/80 to-white shadow-[0_0_8px_rgba(253,224,71,0.8)]"
        style={{
          left: start.x,
          top: start.y,
          width: length,
          transform: `rotate(${angle}deg)`,
        }}
      />
      <div
        className="absolute"
        style={{ left: target.x, top: target.y }}
      >
        <span className="absolute block h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-yellow-200/80 shadow-[0_0_18px_rgba(253,224,71,0.65)]">
          <span className="absolute inset-2 rounded-full border border-white/70" />
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_white]" />
        </span>
        <span className="absolute left-0 top-7 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-yellow-100 backdrop-blur-sm">
          Release to launch
        </span>
      </div>
        </>
      )}
    </div>
  );
};

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

  const {
    data: constellations = [],
    mutate: mutateConstellations,
  } = useConstellations();

  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showConstellations, setShowConstellations] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launch, setLaunch] = useState<RocketLaunchData | null>(null);
  const [aimPreview, setAimPreview] = useState<AimPreview | null>(null);
  const [focusCurrentSignal, setFocusCurrentSignal] = useState(0);

  const mutateAll = useCallback(() => {
    mutateUser();
    mutateJournals();
    mutateConstellations();
  }, [mutateUser, mutateJournals, mutateConstellations]);

  const createConstellation = useCallback(async (input: ConstellationInput) => {
    const created = await dashboardService.createConstellation(input) as Constellation;
    await mutateConstellations(
      (current: Constellation[] | undefined = []) => [created, ...current],
      { revalidate: false },
    );
  }, [mutateConstellations]);

  const updateConstellation = useCallback(async (id: string, input: ConstellationInput) => {
    const updated = await dashboardService.updateConstellation(id, input) as Constellation;
    await mutateConstellations(
      (current: Constellation[] | undefined = []) => current.map((item) => item._id === id ? updated : item),
      { revalidate: false },
    );
  }, [mutateConstellations]);

  const deleteConstellation = useCallback(async (id: string) => {
    await dashboardService.deleteConstellation(id);
    await mutateConstellations(
      (current: Constellation[] | undefined = []) => current.filter((item) => item._id !== id),
      { revalidate: false },
    );
  }, [mutateConstellations]);

  const applyJournalCreation = useCallback((result: JournalCreationResult) => {
    void mutateJournals(
      (current: Journal[] | undefined = []) => [
        result.journal,
        ...current.filter((journal) => journal._id !== result.journal._id),
      ],
      { revalidate: false },
    );
    void mutateUser(
      (current: User | undefined) => current ? { ...current, ...result.user } : current,
      { revalidate: false },
    );

    // Emotion detection finishes in the background on the server. Refresh only
    // journals later so its final color arrives without blocking star creation.
    window.setTimeout(() => void mutateJournals(), 1800);
  }, [mutateJournals, mutateUser]);

  const { newEntry, setNewEntry, isSubmitting, handleSubmit } = useCreateJournal();
  const { deleteTargetId, setDeleteTargetId, handleDelete, confirmDelete } = useDeleteJournal(mutateJournals, mutateAll, setSelectedJournal);
  const { editingJournalId, editContent, setEditContent, handleEdit, startEditing, cancelEditing } = useUpdateJournal(mutateJournals, selectedJournal, setSelectedJournal);
  const { handleJournalPositionUpdate } = useUpdateJournalPosition(mutateJournals);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const launchButtonRef = useRef<HTMLButtonElement>(null);
  const aimDragRef = useRef<AimDragState | null>(null);
  const suppressLaunchClickRef = useRef(false);

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

  const loading = userLoading || journalsLoading;

  const handleStarClick = useCallback((journal: Journal) => {
    setSelectedJournal(journal);
  }, []);

  const handleArchiveSelect = useCallback(
    (journal: Journal) => {
      setSelectedJournal(journal);
      setShowArchive(false);
    },
    [],
  );

  const launchToTarget = useCallback(
    async (
      target: { x: number; y: number; z: number },
      targetScreen: AimPoint,
    ) => {
      if (!newEntry.trim() || isSubmitting || isLaunching) return;

      const buttonRect = launchButtonRef.current?.getBoundingClientRect();
      const launchId = Date.now();
      setLaunch({
        id: launchId,
        start: {
          x: buttonRect ? buttonRect.left + buttonRect.width / 2 : window.innerWidth / 2,
          y: buttonRect ? buttonRect.top + buttonRect.height / 2 : window.innerHeight - 48,
        },
        targetScreen,
        target,
        confirmed: false,
      });
      setIsLaunching(true);
      let settledCreation: JournalCreationResult | null | undefined;
      const creationRequest = handleSubmit(target).then((result) => {
        settledCreation = result;
        return result;
      });

      await new Promise<void>((resolve) =>
        window.setTimeout(resolve, ROCKET_FLIGHT_DURATION_MS));

      // Impact timing belongs to the animation, not the network. If the request
      // is still running when the rocket arrives, play the explosion now and
      // attach the persisted journal as soon as the response follows.
      if (settledCreation !== null) {
        setLaunch((current) => current?.id === launchId
          ? { ...current, confirmed: true }
          : current);
      }
      setIsLaunching(false);

      const creationResult = settledCreation ?? await creationRequest;
      if (creationResult) {
        applyJournalCreation(creationResult);
        setLaunch((current) => current?.id === launchId
          ? { ...current, confirmed: true, journalId: creationResult.journal._id }
          : current);
      } else {
        setLaunch(null);
        textareaRef.current?.focus();
      }
    },
    [applyJournalCreation, handleSubmit, isLaunching, isSubmitting, newEntry],
  );

  const handleLaunchSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const target = {
        x: -5.6 + Math.random() * 11.2,
        y: 0.5 + Math.random() * 3.8,
        z: -1.5 + Math.random() * 2.5,
      };
      void launchToTarget(target, projectTargetToScreen(target));
    },
    [launchToTarget],
  );

  const handleAimPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || !newEntry.trim() || isSubmitting || isLaunching) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const start = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      aimDragRef.current = {
        pointerId: event.pointerId,
        pointerStart: { x: event.clientX, y: event.clientY },
        start,
        target: start,
        moved: false,
        canceling: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [isLaunching, isSubmitting, newEntry],
  );

  const handleAimPointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = aimDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const movement = Math.hypot(
        event.clientX - drag.pointerStart.x,
        event.clientY - drag.pointerStart.y,
      );
      if (!drag.moved && movement < AIM_DRAG_THRESHOLD) return;

      event.preventDefault();
      drag.moved = true;
      const point = { x: event.clientX, y: event.clientY };
      drag.canceling = isPointOverButton(
        point,
        event.currentTarget.getBoundingClientRect(),
      );
      if (!drag.canceling) drag.target = clampAimToSky(point.x, point.y);
      setAimPreview({
        start: drag.start,
        target: drag.target,
        canceling: drag.canceling,
      });
    },
    [],
  );

  const handleAimPointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = aimDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      aimDragRef.current = null;
      setAimPreview(null);
      if (!drag.moved) return;

      event.preventDefault();
      suppressLaunchClickRef.current = true;
      window.setTimeout(() => {
        suppressLaunchClickRef.current = false;
      }, 0);

      const releasePoint = { x: event.clientX, y: event.clientY };
      if (isPointOverButton(releasePoint, event.currentTarget.getBoundingClientRect())) {
        textareaRef.current?.focus();
        return;
      }

      drag.target = clampAimToSky(releasePoint.x, releasePoint.y);
      const z = -1.5 + Math.random() * 2.5;
      void launchToTarget(projectScreenToTarget(drag.target, z), drag.target);
    },
    [launchToTarget],
  );

  const handleAimPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (aimDragRef.current?.pointerId !== event.pointerId) return;
      aimDragRef.current = null;
      setAimPreview(null);
    },
    [],
  );

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
        launch={launch}
        looseJournals={journals}
        constellations={constellations}
        onStarClick={handleStarClick}
        onJournalPositionUpdate={handleJournalPositionUpdate}
        focusCurrentSignal={focusCurrentSignal}
        paused={!!selectedJournal || showArchive || showConstellations}
      />
      <LottieRocketOverlay launch={launch} />
      {aimPreview && <LaunchAimPreview {...aimPreview} />}

      {/* Persistent top navigation */}
      <div className="fixed top-0 inset-x-0 z-50 pointer-events-none">
        <header className="flex justify-between items-start p-6 from-black/80 to-transparent pointer-events-auto">
          <div className="flex items-center gap-4 h-11.5" data-star-bounce>
            <Logo className="text-2xl" />

          </div>

          <div className="flex items-center gap-4 h-11.5" data-star-bounce>
            <button
              onClick={() => setShowConstellations(true)}
              className="p-2.5 rounded-full bg-black/40 border border-white/5 backdrop-blur-sm text-gray-400 hover:text-violet-200 hover:bg-white/10 transition-all cursor-pointer"
              aria-label="Manage constellations"
              title="Constellations"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={() => setShowArchive(true)}
              className="p-2.5 rounded-full bg-black/40 border border-white/5 backdrop-blur-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              aria-label="Search entries"
              title="Search Entries"
            >
              <Search size={18} />
            </button>
            <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
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

      {/* Bottom composer: entries launch upward into the sky. */}
      <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none px-4 pb-6 sm:px-6">
        <form
          onSubmit={handleLaunchSubmit}
          data-star-bounce
          data-launch-composer
          className="pointer-events-auto relative group mx-auto w-full max-w-xl transition-all duration-300 ease-in-out"
        >
            <textarea
              ref={textareaRef}
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              onFocus={() => setFocusCurrentSignal((signal) => signal + 1)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleLaunchSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder="Reflect on your day across the universe..."
              className="w-full block bg-white/5 border border-white/10 rounded-2xl py-3 px-6 pr-14 focus:outline-none focus:bg-white/10 focus:border-white/40 transition-all duration-300 ease-in-out backdrop-blur-md text-sm resize-none max-h-64 overflow-y-auto disabled:opacity-50 no-scrollbar"
              rows={1}
              disabled={isSubmitting}
            />
            <button
              ref={launchButtonRef}
              type="submit"
              onClick={(e) => {
                if (suppressLaunchClickRef.current) {
                  suppressLaunchClickRef.current = false;
                  e.preventDefault();
                  return;
                }
                if (!newEntry.trim() || isSubmitting || isLaunching) e.preventDefault();
              }}
              onPointerDown={handleAimPointerDown}
              onPointerMove={handleAimPointerMove}
              onPointerUp={handleAimPointerUp}
              onPointerCancel={handleAimPointerCancel}
              aria-label={aimPreview?.canceling
                ? "Release to cancel the aimed launch"
                : aimPreview
                  ? "Release to launch at the selected location"
                : isLaunching
                  ? "Launching entry"
                  : "Launch entry into the sky; drag to aim"}
              title={aimPreview?.canceling
                ? "Release to cancel"
                : aimPreview
                  ? "Release to launch"
                : isLaunching
                  ? "Launching..."
                  : "Click to launch randomly, or drag to aim"}
              className={`absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 touch-none rounded-full p-0 transition-all flex items-center justify-center cursor-pointer overflow-visible ${
                aimPreview?.canceling
                  ? "bg-red-200 ring-2 ring-red-100/80 shadow-[0_0_18px_rgba(248,113,113,0.75)]"
                  : aimPreview
                  ? "bg-yellow-200 ring-2 ring-yellow-100/70 shadow-[0_0_18px_rgba(253,224,71,0.7)]"
                  : isLaunching
                  ? "bg-orange-200"
                  : !newEntry.trim() || isSubmitting
                    ? "bg-white opacity-30 hover:opacity-100 group-focus-within:opacity-100"
                    : "bg-white hover:bg-gray-200 group-focus-within:bg-gray-200"
              }`}
            >
              {aimPreview?.canceling ? (
                <X size={19} strokeWidth={2.5} className="text-black" aria-hidden="true" />
              ) : (
                <Rocket
                  size={18}
                  strokeWidth={2.2}
                  className="-rotate-45 text-black"
                  aria-hidden="true"
                />
              )}
            </button>
        </form>
      </div>

      {/* Journal Entry Viewer (Modal) */}
      <Modal isOpen={!!selectedJournal} onClose={() => setSelectedJournal(null)} maxWidth="lg">
        {selectedJournal && (
          <>
            <div className="mb-6 flex items-start justify-between gap-4 pr-12">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-widest mb-1">
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

            <div
              className="mb-8 rounded-xl border border-white/10 bg-white/5 p-5"
              style={{ borderLeft: `2px solid ${emotionColor(selectedJournal.emotion)}` }}
            >
              <EditableContent
                isEditing={editingJournalId === selectedJournal._id}
                value={editContent}
                onValueChange={setEditContent}
                displayContent={selectedJournal.content}
                containerClassName=""
                textareaClassName="rounded-lg p-3 min-h-30"
                displayClassName="text-xl leading-relaxed"
              />
            </div>

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
                editButtonClassName="text-gray-400/50! hover:text-white! hover:bg-white/10!"
              />
            </div>
          </>
        )}
      </Modal>

      {/* Search / Archive Modal */}
      <ArchiveModal
        isOpen={showArchive}
        onClose={() => setShowArchive(false)}
        journals={journals}
        onSelect={handleArchiveSelect}
      />

      <ConstellationModal
        isOpen={showConstellations}
        onClose={() => setShowConstellations(false)}
        constellations={constellations}
        journals={journals}
        onCreate={createConstellation}
        onUpdate={updateConstellation}
        onDelete={deleteConstellation}
      />

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
