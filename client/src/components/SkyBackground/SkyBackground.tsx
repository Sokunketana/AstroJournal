import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Sparkles, MeshDistortMaterial } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { formatShortDate } from "../../utils/dateUtils";
import { flowVelocity, noise3D } from "./flowField";
import InstancedJournalStars from "./InstancedJournalStars";
import BackgroundStars from "./BackgroundStars";
import QualityProbe from "./QualityProbe";
import type {
  PlanetProps,
  SkyBackgroundProps,
  SkyTooltipData,
} from "./SkyBackground.types";

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

// Adaptive quality: drop to a lighter sky when the renderer can't keep up
// Same flow-field physics as the journal stars: curl-noise drift,
// pull-home anchoring, damping, and drag throw momentum
const Planet: React.FC<PlanetProps> = ({ id, position, color, size, journals, onClick, onDragEnd, onHover, paused }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const { camera } = useThree();

  const seed = useMemo(
    () =>
      id
        .split("")
        .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0),
    [id],
  );

  const initial = useMemo(() => new THREE.Vector3(...position), [position]);
  const home = useRef(initial.clone());
  const pos = useRef(initial.clone());
  const vel = useRef(new THREE.Vector3());
  const lastPointer = useRef({ x: 0, y: 0, z: 0, t: 0 });

  useEffect(() => {
    home.current.set(position[0], position[1], position[2]);
  }, [position]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const s = seed * 0.01;

    if (!paused && !isDragging) {
      // Planets are heavy: ride the flow slower than stars, then settle home
      const speed = 0.5 * (0.4 + 0.4 * noise3D(s, 1, 0));
      const [fx, fy, fz] = flowVelocity(
        pos.current.x,
        pos.current.y,
        pos.current.z,
        t,
      );

      vel.current.x += fx * speed * dt;
      vel.current.y += fy * speed * dt;
      vel.current.z += fz * speed * dt * 0.4;

      pos.current.x += vel.current.x * dt;
      pos.current.y += vel.current.y * dt;
      pos.current.z += vel.current.z * dt;

      // Gentle pull home so planets keep their spot in the sky
      const pull = 0.15 * dt;
      pos.current.x += (home.current.x - pos.current.x) * pull;
      pos.current.y += (home.current.y - pos.current.y) * pull;
      pos.current.z += (home.current.z - pos.current.z) * pull * 0.5;

      vel.current.multiplyScalar(Math.exp(-dt * 0.5));
    }

    meshRef.current.position.copy(pos.current);
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        if (e.delta <= 5) {
          e.stopPropagation();
          onClick(journals);
        }
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        hasDragged.current = false;
        lastPointer.current = {
          x: pos.current.x,
          y: pos.current.y,
          z: pos.current.z,
          t: performance.now(),
        };
        vel.current.set(0, 0, 0);
        setIsDragging(true);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        setIsDragging(false);
        if (hasDragged.current) {
          // Throw: hand the drag velocity back to the planet for momentum
          vel.current.clampLength(0, 4);
          onDragEnd(id, {
            x: pos.current.x,
            y: pos.current.y,
            z: pos.current.z,
          });
        }
        hasDragged.current = false;
      }}
      onPointerMove={(e) => {
        if (isDragging && meshRef.current) {
          hasDragged.current = true;
          const vector = new THREE.Vector3(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1,
            0.5,
          );
          vector.unproject(camera);
          const dir = vector.sub(camera.position).normalize();
          const distance =
            (meshRef.current.position.z - camera.position.z) / dir.z;
          const target = camera.position
            .clone()
            .add(dir.multiplyScalar(distance));
          const now = performance.now();
          const dt = Math.max((now - lastPointer.current.t) / 1000, 0.001);
          vel.current
            .set(
              target.x - lastPointer.current.x,
              target.y - lastPointer.current.y,
              target.z - lastPointer.current.z,
            )
            .divideScalar(dt)
            .clampLength(0, 4);
          lastPointer.current = {
            x: target.x,
            y: target.y,
            z: target.z,
            t: now,
          };
          pos.current.copy(target);
          meshRef.current.position.copy(target);
        }
      }}
      onPointerOver={(e) => {
        document.body.style.cursor = "grab";
        onHover({
          title: "Planet",
          subtitle: `${journals.length} journal${journals.length === 1 ? "" : "s"}${journals.length ? ` · ${formatShortDate(journals[0].createdAt)}` : ""
            }`,
          color,
          x: e.clientX,
          y: e.clientY,
        });
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
        onHover(null);
      }}
    >
      <sphereGeometry args={[size, 32, 32]} />
      <MeshDistortMaterial color={color} speed={2} distort={0.3} radius={1} />
    </mesh>
  );
};

const SkyBackground: React.FC<SkyBackgroundProps> = ({
  totalStars,
  planetsData,
  looseJournals,
  onStarClick,
  onPlanetClick,
  onJournalPositionUpdate,
  onPlanetPositionUpdate,
  paused,
}) => {
  const [tooltip, setTooltip] = useState<SkyTooltipData | null>(null);
  const [quality, setQuality] = useState<"high" | "low">("high");

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

  const planets = useMemo(() => {
    return planetsData.map((planet) => {
      // Use saved position if available
      if (planet.position) {
        return {
          id: planet._id,
          journals: planet.journals,
          position: [
            planet.position.x,
            planet.position.y,
            planet.position.z,
          ] as [number, number, number],
          color: planet.color || "#4a90e2",
          size: 0.6 + planet.journals.length * 0.05,
        };
      }

      // Deterministic position based on planet ID
      const seed = planet._id
        .split("")
        .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const x = ((seed * 7.5) % 20) - 10;
      const y = ((seed * 11.5) % 12) - 6;
      const z = ((seed * 13.5) % 4) - 2;

      return {
        id: planet._id,
        journals: planet.journals,
        position: [x, y, z] as [number, number, number],
        color: planet.color || "#4a90e2",
        size: 0.6 + planet.journals.length * 0.05,
      };
    });
  }, [planetsData]);

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

        <QualityProbe onResult={handleQualityResult} />

        <InstancedJournalStars
          stars={journalStars}
          onClick={onStarClick}
          onDragEnd={onJournalPositionUpdate}
          onHover={setTooltip}
          paused={paused}
        />

        {planets.map((planet) => (
          <Planet
            key={planet.id}
            id={planet.id}
            position={planet.position}
            color={planet.color}
            size={planet.size}
            journals={planet.journals}
            onClick={onPlanetClick}
            onDragEnd={onPlanetPositionUpdate}
            onHover={setTooltip}
            paused={paused}
          />
        ))}

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
