import React, { useCallback, useEffect, useRef, useState } from "react";
import { DotLottieReact, type DotLottie } from "@lottiefiles/dotlottie-react";
import { motion } from "framer-motion";
import { Rocket } from "lucide-react";
import type { RocketLaunchData } from "../SkyBackground/SkyBackground.types";

interface LottieRocketOverlayProps {
  launch: RocketLaunchData | null;
}

export const ROCKET_FLIGHT_DURATION_MS = 1100;
export const ROCKET_FLIGHT_DURATION_SECONDS = ROCKET_FLIGHT_DURATION_MS / 1000;

const LottieRocketOverlay: React.FC<LottieRocketOverlayProps> = ({ launch }) => {
  const launchId = launch?.id;
  const renderedLaunchIdRef = useRef<number | null>(null);
  const playerCleanupRef = useRef<(() => void) | null>(null);
  const [fallbackLaunchId, setFallbackLaunchId] = useState<number | null>(null);

  const handlePlayerRef = useCallback((player: DotLottie | null) => {
    playerCleanupRef.current?.();
    playerCleanupRef.current = null;
    if (!player || !launch) return;

    const currentLaunchId = launch.id;
    renderedLaunchIdRef.current = null;
    const markRendered = () => {
      renderedLaunchIdRef.current = currentLaunchId;
      setFallbackLaunchId((visibleLaunchId) =>
        visibleLaunchId === currentLaunchId ? null : visibleLaunchId);
    };
    const showFallback = () => setFallbackLaunchId(currentLaunchId);

    player.addEventListener("render", markRendered);
    player.addEventListener("loadError", showFallback);
    playerCleanupRef.current = () => {
      player.removeEventListener("render", markRendered);
      player.removeEventListener("loadError", showFallback);
    };

    player.stop();
    player.setFrame(0);
    player.play();
  }, [launch]);

  useEffect(() => {
    if (launchId == null) return;

    const fallbackTimer = window.setTimeout(() => {
      if (renderedLaunchIdRef.current !== launchId) {
        setFallbackLaunchId(launchId);
      }
    }, 120);

    return () => window.clearTimeout(fallbackTimer);
  }, [launchId]);

  useEffect(() => () => playerCleanupRef.current?.(), []);

  const start = launch?.start ?? { x: -80, y: -80 };
  const end = launch?.targetScreen ?? start;
  const distanceX = end.x - start.x;
  const distanceY = end.y - start.y;
  // The supplied animation has a built-in 29° right tilt. Cancel that tilt,
  // then orient the rocket along the straight button-to-star vector.
  const directionAngle = Math.atan2(distanceX, -distanceY) * (180 / Math.PI) - 29;

  return (
    <motion.span
      key={launchId ?? "idle"}
      aria-hidden="true"
      className="pointer-events-none fixed z-40 block h-16 w-16"
      style={{ left: start.x - 32, top: start.y - 32 }}
      initial={launch
        ? { x: 0, y: 0, rotate: directionAngle, opacity: 0, scale: 0.7 }
        : false}
      animate={launch
          ? {
            x: [0, distanceX * 0.08, distanceX * 0.84, distanceX],
            y: [0, distanceY * 0.08, distanceY * 0.84, distanceY],
            rotate: directionAngle,
            opacity: [0, 1, 1, 0],
            scale: [0.7, 1, 0.82, 0.42],
          }
        : { x: 0, y: 0, rotate: 0, opacity: 0, scale: 0.7 }}
      transition={launch
        ? {
          duration: ROCKET_FLIGHT_DURATION_SECONDS,
          times: [0, 0.08, 0.84, 1],
          ease: "easeIn",
        }
        : { duration: 0 }}
    >
      {launch && fallbackLaunchId === launchId && (
        <Rocket
          className="absolute inset-2 h-12 w-12 text-orange-100 drop-shadow-[0_0_8px_rgba(251,146,60,0.9)]"
          strokeWidth={1.8}
          style={{ transform: "rotate(-16deg)" }}
        />
      )}
      <DotLottieReact
        key={launchId ?? "idle"}
        src={launchId
          ? `/animations/rocket-flight.lottie?launch=${launchId}`
          : "/animations/rocket-flight.lottie"}
        autoplay={Boolean(launch)}
        loop={false}
        speed={1.1}
        className="h-16 w-16"
        renderConfig={{ autoResize: true, devicePixelRatio: 1 }}
        dotLottieRefCallback={handlePlayerRef}
      />
    </motion.span>
  );
};

export default LottieRocketOverlay;
