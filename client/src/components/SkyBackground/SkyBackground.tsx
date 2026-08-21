import React, { useCallback, useEffect, useMemo, useState, memo } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraShake, Stars, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import InstancedJournalStars from "./InstancedJournalStars";
import BackgroundStars from "./BackgroundStars";
import QualityProbe from "./QualityProbe";
import RocketLaunch from "./RocketLaunch";
import type { SkyBackgroundProps, SkyTooltipData } from "./SkyBackground.types";

const SkyTooltip: React.FC<{ tooltip: SkyTooltipData | null }> = ({ tooltip }) => {
  if (!tooltip) return null;
  return (
    <div
      className="fixed z-10 pointer-events-none bg-black/80 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-xl max-w-xs"
      style={{
        left: Math.min(tooltip.x, window.innerWidth - 300),
        top: Math.min(tooltip.y + 16, window.innerHeight - 90),
      }}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: tooltip.color }}
        />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: tooltip.color }}>
          {tooltip.title}
        </p>
      </div>
      <p className="text-sm text-gray-300 font-medium truncate">{tooltip.subtitle}</p>
    </div>
  );
};

const SkyBackground: React.FC<SkyBackgroundProps> = ({
  totalStars,
  launch,
  looseJournals,
  onStarClick,
  onJournalPositionUpdate,
  paused,
}) => {
  const [tooltip, setTooltip] = useState<SkyTooltipData | null>(null);
  const [quality, setQuality] = useState<"high" | "low">("high");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  const handleQualityResult = useCallback((avgFrameMs: number, renderer: string) => {
    const softwareRenderer = /WebKit WebGL|SwiftShader|llvmpipe|Software/i.test(
      renderer,
    );
    if (softwareRenderer || avgFrameMs > 24) {
      console.info(
        `[Sky] adapting to low quality (renderer: ${renderer}, ${avgFrameMs.toFixed(1)}ms/frame)`,
      );
      setQuality("low");
    }
  }, []);

  const journalStars = useMemo(() => {
    return looseJournals.map((journal) => {
      // Use saved position if available
      if (journal.position) {
        return {
          id: journal._id,
          position: [
            journal.position.x,
            journal.position.y,
            journal.position.z,
          ] as [number, number, number],
          journal,
        };
      }

      // Deterministic position based on journal ID
      const seed = journal._id
        .split("")
        .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const x = ((seed * 1.5) % 12) - 6;
      const y = ((seed * 2.5) % 8) - 4;
      const z = ((seed * 3.5) % 4) - 2;
      return {
        id: journal._id,
        position: [x, y, z] as [number, number, number],
        journal,
      };
    });
  }, [looseJournals]);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        frameloop={paused ? "demand" : "always"}
        dpr={quality === "high" ? 1 : 0.75}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#020205"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />

        <Stars
          radius={100}
          depth={50}
          count={quality === "high" ? 1500 : 600}
          factor={2.5}
          saturation={0}
          fade
          speed={0.4}
        />
        <BackgroundStars
          count={totalStars * (quality === "high" ? 5 : 2)}
        />
        <Sparkles
          count={quality === "high" ? 120 : 40}
          scale={[24, 14, 6]}
          size={2}
          speed={0.35}
          opacity={0.45}
          color="#9db4ff"
        />

        {launch && <RocketLaunch key={launch.id} launch={launch} />}
        {launch?.confirmed && !prefersReducedMotion && (
          <CameraShake
            key={`impact-shake-${launch.id}`}
            intensity={1}
            decay
            decayRate={0.4}
            maxYaw={0.018}
            maxPitch={0.015}
            maxRoll={0.012}
            yawFrequency={18}
            pitchFrequency={22}
            rollFrequency={16}
          />
        )}

        <QualityProbe onResult={handleQualityResult} />

        <InstancedJournalStars
          stars={journalStars}
          onClick={onStarClick}
          onDragEnd={onJournalPositionUpdate}
          onHover={setTooltip}
          impact={launch}
          paused={paused}
        />

        {quality === "high" && (
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={0.6}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.3}
              radius={0.45}
            />
          </EffectComposer>
        )}
      </Canvas>
      <SkyTooltip tooltip={tooltip} />
    </div>
  );
};

export default memo(SkyBackground);
