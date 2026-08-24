import React, { useState, useCallback, useRef, useEffect } from "react";
import { UserButton } from '@clerk/react';
import { clerkAppearance, clerkUserProfileAppearance } from '../../config/clerkAppearance';
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
import JournalDataSettings from "../../components/JournalDataSettings";
import LoadingScreen from "../../components/LoadingScreen";
import { formatLongDate } from "../../utils/dateUtils";
import { emotionColor } from "../../utils/emotion";
import type { DashboardPageProps } from "./DashboardPage.types";
import type {
  ConstellationFocusRequest,
  RocketLaunchData,
  StarFocusRequest,
} from "../../components/SkyBackground/SkyBackground.types";
import {
  Star,
  Flame,
  Rocket,
  Search,
  Crosshair,
  X,
  Share2,
  Database,
} from "lucide-react";

interface DeleteAllJournalsResult {
  deletedCount: number;
  user: Pick<User, 'currentStreak' | 'totalStars' | 'lastEntryDate'>;
}

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

interface SkySelectionDraft {
  journalIds: string[];
  color: string;
  editingId?: string;
  onComplete: (journalIds: string[]) => void;
  onSave: (journalIds: string[]) => Promise<boolean>;
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
  const [showConstellations, setShowConstellations] = useState(false);
  const [skySelection, setSkySelection] = useState<SkySelectionDraft | null>(null);
  const [isSavingSkySelection, setIsSavingSkySelection] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launch, setLaunch] = useState<RocketLaunchData | null>(null);
  const [aimPreview, setAimPreview] = useState<AimPreview | null>(null);
  const [focusCurrentSignal, setFocusCurrentSignal] = useState(0);
  const [focusStarRequest, setFocusStarRequest] = useState<StarFocusRequest | null>(null);
  const [focusConstellationRequest, setFocusConstellationRequest] = useState<ConstellationFocusRequest | null>(null);

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

  const deleteAllJournals = useCallback(async () => {
    const result = await dashboardService.deleteAllJournals() as DeleteAllJournalsResult;

    setSelectedJournal(null);
    setSkySelection(null);
    await Promise.all([
      mutateJournals([], { revalidate: false }),
      mutateConstellations([], { revalidate: false }),
      mutateUser(
        (current: User | undefined) => current ? { ...current, ...result.user } : current,
        { revalidate: false },
      ),
    ]);

    return result.deletedCount;
  }, [mutateConstellations, mutateJournals, mutateUser]);

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
    if (!skySelection) {
      setSelectedJournal(journal);
      return;
    }

    setSkySelection((current) => {
      if (!current) return current;
      const selected = current.journalIds.includes(journal._id);
      if (!selected && current.journalIds.length >= 30) return current;
      return {
        ...current,
        journalIds: selected
          ? current.journalIds.filter((id) => id !== journal._id)
          : [...current.journalIds, journal._id],
      };
    });
  }, [skySelection]);

  const beginSkySelection = useCallback((
    draft: Omit<SkySelectionDraft, 'onComplete' | 'onSave'>,
    onComplete: (journalIds: string[]) => void,
    onSave: (journalIds: string[]) => Promise<boolean>,
  ) => {
    setSkySelection({ ...draft, onComplete, onSave });
    setShowConstellations(false);
  }, []);

  const finishSkySelection = useCallback(() => {
    if (!skySelection) return;
    skySelection.onComplete(skySelection.journalIds);
    setSkySelection(null);
    setShowConstellations(true);
  }, [skySelection]);

  const cancelSkySelection = useCallback(() => {
    setSkySelection(null);
    setShowConstellations(true);
  }, []);

  const saveSkySelection = useCallback(async () => {
    if (!skySelection || isSavingSkySelection) return;
    setIsSavingSkySelection(true);
    const saved = await skySelection.onSave(skySelection.journalIds);
    setIsSavingSkySelection(false);
    setSkySelection(null);
    if (!saved) setShowConstellations(true);
  }, [isSavingSkySelection, skySelection]);

  useEffect(() => {
    if (!skySelection) return;
    const handleSelectionKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat) return;
      event.preventDefault();
      void saveSkySelection();
    };
    window.addEventListener('keydown', handleSelectionKeyDown);
    return () => window.removeEventListener('keydown', handleSelectionKeyDown);
  }, [saveSkySelection, skySelection]);

  const handleArchiveSelect = useCallback(
    (journal: Journal) => {
      setSelectedJournal(journal);
      setShowArchive(false);
    },
    [],
  );

  const handleArchiveLocate = useCallback((journal: Journal) => {
    setSelectedJournal(null);
    setShowArchive(false);
    setFocusConstellationRequest(null);
    setFocusStarRequest((current) => ({
      journalId: journal._id,
      signal: (current?.signal ?? 0) + 1,
    }));
  }, []);

  const handleConstellationLocate = useCallback((constellation: Constellation) => {
    setSelectedJournal(null);
    setShowConstellations(false);
    setFocusStarRequest(null);
    setFocusConstellationRequest((current) => ({
      constellationId: constellation._id,
      title: constellation.title,
      color: constellation.color,
      journalIds: [...constellation.journalIds],
      signal: (current?.signal ?? 0) + 1,
    }));
  }, []);

  const exitStarLocate = useCallback(() => {
    setFocusStarRequest(null);
    setFocusConstellationRequest(null);
  }, []);

  useEffect(() => {
    if (
      (!focusStarRequest && !focusConstellationRequest)
      || selectedJournal
      || showArchive
      || showConstellations
    ) return;

    const handleLocateKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      exitStarLocate();
    };

    window.addEventListener("keydown", handleLocateKeyDown);
    return () => window.removeEventListener("keydown", handleLocateKeyDown);
  }, [exitStarLocate, focusConstellationRequest, focusStarRequest, selectedJournal, showArchive, showConstellations]);

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

  if (loading) return <LoadingScreen />;

  return (
    <div className="relative min-h-screen text-white overflow-hidden font-sans">
      <SkyBackground
        totalStars={userData?.totalStars || 0}
        launch={launch}
        looseJournals={journals}
        constellations={constellations}
        selectionDraft={skySelection}
        onStarClick={handleStarClick}
        onJournalPositionUpdate={handleJournalPositionUpdate}
        focusCurrentSignal={focusCurrentSignal}
        focusStarRequest={focusStarRequest}
        focusConstellationRequest={focusConstellationRequest}
        paused={!!selectedJournal || showArchive || showConstellations}
      />
      <LottieRocketOverlay launch={launch} />
      {aimPreview && <LaunchAimPreview {...aimPreview} />}

      {(focusStarRequest || focusConstellationRequest) && !selectedJournal && !showArchive && !showConstellations && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-60 flex justify-center px-4">
          <div
            data-star-bounce
            className="pointer-events-auto flex items-center gap-3 rounded-full border border-sky-200/25 bg-black/75 py-2 pl-3.5 pr-2 text-xs shadow-[0_0_24px_rgba(125,211,252,0.15)] backdrop-blur-xl"
            role="status"
          >
            <span className="flex items-center gap-2 font-semibold text-sky-100">
              <Crosshair size={14} aria-hidden="true" />
              {focusConstellationRequest
                ? `${focusConstellationRequest.title} located`
                : 'Star located'}
            </span>
            <button
              type="button"
              onClick={exitStarLocate}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 font-bold uppercase tracking-wider text-gray-300 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-200/50"
              aria-label="Exit locate mode"
              title="Exit locate mode (Escape)"
            >
              <X size={12} aria-hidden="true" />
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Persistent top navigation */}
      <div className="fixed top-0 inset-x-0 z-50 pointer-events-none">
        <header className="flex justify-between items-start p-6 from-black/80 to-transparent pointer-events-auto">
          <div className="flex items-center gap-4 h-11.5" data-star-bounce>
            <Logo className="text-2xl" />

          </div>

          <div className="flex items-center gap-4 h-11.5" data-star-bounce>
            <button
              onClick={() => setShowConstellations(true)}
              disabled={!!skySelection}
              className={`p-2.5 rounded-full bg-black/40 border border-white/5 backdrop-blur-sm transition-all ${
                skySelection
                  ? 'cursor-not-allowed text-gray-700 opacity-45'
                  : 'cursor-pointer text-gray-400 hover:bg-white/10 hover:text-violet-200'
              }`}
              aria-label={skySelection ? 'Constellations unavailable while selecting stars' : 'Manage constellations'}
              title={skySelection ? 'Finish or cancel star selection first' : 'Constellations'}
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
            <UserButton
              appearance={clerkAppearance}
              userProfileProps={{ appearance: clerkUserProfileAppearance }}
            >
              <UserButton.UserProfilePage
                label="Journal data"
                url="journal-data"
                labelIcon={<Database size={16} />}
              >
                <JournalDataSettings
                  journalCount={journals.length}
                  onDeleteAll={deleteAllJournals}
                />
              </UserButton.UserProfilePage>
            </UserButton>
          </div>
        </header>
      </div>

      {/* Bottom composer: entries launch upward into the sky. */}
      {!skySelection && <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none px-4 pb-6 sm:px-6">
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
      </div>}

      {skySelection && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-60 px-4 pb-6 sm:px-6">
          <div
            data-star-bounce
            className="pointer-events-auto mx-auto flex w-full max-w-xl items-center gap-3 rounded-2xl border border-white/15 bg-black/80 p-3 shadow-2xl backdrop-blur-xl"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/60 font-bold"
              style={{ color: skySelection.color, boxShadow: `0 0 18px ${skySelection.color}88` }}
            >
              {skySelection.journalIds.length}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Select stars in connection order</p>
              <p className="text-xs text-gray-400">Hover to read. Click to select. Press Enter to save.</p>
            </div>
            <button onClick={cancelSkySelection} disabled={isSavingSkySelection} className="rounded-xl px-3 py-2 text-xs font-bold uppercase text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40">
              Cancel
            </button>
            <button onClick={finishSkySelection} disabled={isSavingSkySelection} className="rounded-xl bg-white px-4 py-2 text-xs font-bold uppercase text-black transition hover:bg-gray-200 disabled:opacity-40">
              Done
            </button>
          </div>
        </div>
      )}

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
        onLocate={handleArchiveLocate}
      />

      <ConstellationModal
        isOpen={showConstellations}
        onClose={() => setShowConstellations(false)}
        constellations={constellations}
        journals={journals}
        onCreate={createConstellation}
        onUpdate={updateConstellation}
        onDelete={deleteConstellation}
        onLocate={handleConstellationLocate}
        onSelectInSky={beginSkySelection}
      />

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
