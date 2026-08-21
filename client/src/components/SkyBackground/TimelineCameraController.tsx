import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BASE_CAMERA_Z, MAX_CAMERA_Z } from "./timelineLayout";

export interface TimelineViewState {
  weekPosition: number;
  zoom: number;
}

interface TimelineCameraControllerProps {
  earliestWeek: number;
  weekWidth: number;
  focusCurrentSignal: number;
  viewRef: { current: TimelineViewState };
  paused?: boolean;
  onViewChange: (view: TimelineViewState) => void;
}

const TimelineCameraController: React.FC<TimelineCameraControllerProps> = ({
  earliestWeek,
  weekWidth,
  focusCurrentSignal,
  viewRef,
  paused,
  onViewChange,
}) => {
  const { camera, gl, scene } = useThree();
  const targetWeekRef = useRef(0);
  const targetZoomRef = useRef(BASE_CAMERA_Z);
  const lastReportRef = useRef(0);
  const lastViewRef = useRef<TimelineViewState>({
    weekPosition: Number.NaN,
    zoom: Number.NaN,
  });
  const panRef = useRef<{ pointerId: number; x: number } | null>(null);
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleWheel = (event: WheelEvent) => {
      if (paused) return;
      event.preventDefault();

      if (event.ctrlKey || event.metaKey) {
        targetZoomRef.current = THREE.MathUtils.clamp(
          targetZoomRef.current + event.deltaY * 0.08,
          BASE_CAMERA_Z,
          MAX_CAMERA_Z,
        );
        return;
      }

      const movement = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
      const zoomScale = targetZoomRef.current / BASE_CAMERA_Z;
      targetWeekRef.current = THREE.MathUtils.clamp(
        targetWeekRef.current - movement * 0.0025 * zoomScale,
        earliestWeek,
        0,
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, [contenteditable='true']")) return;
      if (event.key !== "-" && event.key !== "+" && event.key !== "=") return;
      event.preventDefault();
      const direction = event.key === "-" ? 1 : -1;
      targetZoomRef.current = THREE.MathUtils.clamp(
        targetZoomRef.current + direction * 8,
        BASE_CAMERA_Z,
        MAX_CAMERA_Z,
      );
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [earliestWeek, gl, paused]);

  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const activePointers = activePointersRef.current;

    const handlePointerDown = (event: PointerEvent) => {
      if (paused || (event.button !== 0 && event.pointerType !== "touch")) return;
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const journalMesh = scene.getObjectByName("journal-stars");
      if (journalMesh && raycaster.intersectObject(journalMesh).length > 0) return;
      activePointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      if (activePointers.size === 2) {
        const [first, second] = [...activePointers.values()];
        pinchRef.current = {
          distance: Math.hypot(second.x - first.x, second.y - first.y),
          zoom: targetZoomRef.current,
        };
        panRef.current = null;
        return;
      }
      panRef.current = { pointerId: event.pointerId, x: event.clientX };
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (activePointers.has(event.pointerId)) {
        activePointers.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
      }
      if (pinchRef.current && activePointers.size >= 2) {
        event.preventDefault();
        const [first, second] = [...activePointers.values()];
        const distance = Math.max(
          Math.hypot(second.x - first.x, second.y - first.y),
          1,
        );
        targetZoomRef.current = THREE.MathUtils.clamp(
          pinchRef.current.zoom * (pinchRef.current.distance / distance),
          BASE_CAMERA_Z,
          MAX_CAMERA_Z,
        );
        return;
      }
      const pan = panRef.current;
      if (!pan || pan.pointerId !== event.pointerId) return;
      event.preventDefault();
      const deltaX = event.clientX - pan.x;
      pan.x = event.clientX;
      const visibleWeeks = targetZoomRef.current / BASE_CAMERA_Z;
      targetWeekRef.current = THREE.MathUtils.clamp(
        targetWeekRef.current - (deltaX / Math.max(canvas.clientWidth, 1)) * visibleWeeks,
        earliestWeek,
        0,
      );
    };

    const finishPan = (event: PointerEvent) => {
      activePointers.delete(event.pointerId);
      pinchRef.current = null;
      const remaining = [...activePointers.entries()][0];
      panRef.current = remaining
        ? { pointerId: remaining[0], x: remaining[1].x }
        : null;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", finishPan);
    window.addEventListener("pointercancel", finishPan);
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishPan);
      window.removeEventListener("pointercancel", finishPan);
      activePointers.clear();
      pinchRef.current = null;
      panRef.current = null;
    };
  }, [camera, earliestWeek, gl, paused, scene]);

  useEffect(() => {
    targetWeekRef.current = THREE.MathUtils.clamp(
      targetWeekRef.current,
      earliestWeek,
      0,
    );
  }, [earliestWeek]);

  useEffect(() => {
    if (focusCurrentSignal === 0) return;
    targetWeekRef.current = 0;
    targetZoomRef.current = BASE_CAMERA_Z;
  }, [focusCurrentSignal]);

  useFrame((state, delta) => {
    const camera = state.camera;
    const dt = Math.min(delta, 0.05);
    const targetX = targetWeekRef.current * weekWidth;
    const positionAlpha = 1 - Math.exp(-dt * 9);
    const zoomAlpha = 1 - Math.exp(-dt * 7);
    const nextX = THREE.MathUtils.lerp(camera.position.x, targetX, positionAlpha);
    const nextZoom = THREE.MathUtils.lerp(
      camera.position.z,
      targetZoomRef.current,
      zoomAlpha,
    );
    camera.position.x = Math.abs(nextX - targetX) < weekWidth * 0.0001
      ? targetX
      : nextX;
    camera.position.z = Math.abs(nextZoom - targetZoomRef.current) < 0.005
      ? targetZoomRef.current
      : nextZoom;
    camera.lookAt(camera.position.x, 0, 0);
    camera.updateProjectionMatrix();

    const now = performance.now();
    const nextView = {
      weekPosition: camera.position.x / weekWidth,
      zoom: camera.position.z,
    };
    viewRef.current = nextView;
    const viewChanged =
      !Number.isFinite(lastViewRef.current.weekPosition)
      || Math.abs(nextView.weekPosition - lastViewRef.current.weekPosition) > 0.002
      || Math.abs(nextView.zoom - lastViewRef.current.zoom) > 0.02;
    if (viewChanged && now - lastReportRef.current >= 50) {
      lastReportRef.current = now;
      lastViewRef.current = nextView;
      onViewChange(nextView);
    }
  });

  return null;
};

export default TimelineCameraController;
