import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Journal } from "../../types";
import { emotionColor } from "../../utils/emotion";
import { formatShortDate } from "../../utils/dateUtils";
import { flowVelocity, noise3D } from "./flowField";
import { getStarGeometry } from "./starGeometry";
import type { SkyTooltipData } from "./SkyBackground.types";

export interface InstancedJournalStarsProps {
  stars: { id: string; position: [number, number, number]; journal: Journal }[];
  onClick: (journal: Journal) => void;
  onDragEnd: (id: string, pos: { x: number; y: number; z: number }) => void;
  onHover: (tooltip: SkyTooltipData | null) => void;
  paused?: boolean;
}

interface StarEntry {
  id: string;
  journal: Journal;
  home: THREE.Vector3;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  phase: number;
  speedFactor: number;
  birth: number;
  hover: number;
}

const MAX_STARS = 2048;
const SPAWN_DURATION = 1.2;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const _matrix = new THREE.Matrix4();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();

const InstancedJournalStars: React.FC<InstancedJournalStarsProps> = ({
  stars,
  onClick,
  onDragEnd,
  onHover,
  paused,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const entriesRef = useRef<StarEntry[]>([]);
  const clockRef = useRef<THREE.Clock | null>(null);
  const hoverIndexRef = useRef(-1);
  const dragRef = useRef<{
    index: number;
    last: THREE.Vector3;
    time: number;
    vel: THREE.Vector3;
  } | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    const now = clockRef.current ? clockRef.current.elapsedTime : 0;
    const existing = new Map(entriesRef.current.map((e) => [e.id, e]));
    entriesRef.current = stars.map((star) => {
      const old = existing.get(star.id);
      if (old) {
        old.journal = star.journal;
        return old;
      }
      return {
        id: star.id,
        journal: star.journal,
        home: new THREE.Vector3(...star.position),
        pos: new THREE.Vector3(...star.position),
        vel: new THREE.Vector3(),
        phase: Math.random() * 1000,
        speedFactor: 0.6 + 0.8 * noise3D(Math.random() * 1000, 1, 0),
        birth: now,
        hover: 0,
      };
    });
    hoverIndexRef.current = -1;
  }, [stars]);

  // Window-level drag: pointer capture on the object is unreliable across
  // browsers/touch, so movement and release are tracked globally instead
  useEffect(() => {
    const onWindowMove = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const entry = entriesRef.current[drag.index];
      if (!entry) return;
      const vector = new THREE.Vector3(
        (ev.clientX / window.innerWidth) * 2 - 1,
        -(ev.clientY / window.innerHeight) * 2 + 1,
        0.5,
      );
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = (entry.pos.z - camera.position.z) / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));
      const now = performance.now();
      const dt = Math.max((now - drag.time) / 1000, 0.001);
      drag.vel
        .set(pos.x - drag.last.x, pos.y - drag.last.y, pos.z - drag.last.z)
        .divideScalar(dt);
      drag.last.copy(pos);
      drag.time = now;
      entry.pos.copy(pos);
    };

    const onWindowUp = () => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      const entry = entriesRef.current[drag.index];
      if (!entry) return;
      // Throw: hand the drag velocity back to the star for momentum
      entry.vel.copy(drag.vel).clampLength(0, 8);
      onDragEnd(entry.id, { x: entry.pos.x, y: entry.pos.y, z: entry.pos.z });
    };

    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowUp);
    return () => {
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
    };
  }, [camera, onDragEnd]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    clockRef.current = state.clock;
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const entries = entriesRef.current;
    const dragging = dragRef.current;
    mesh.count = Math.min(entries.length, MAX_STARS);

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (!paused && dragging?.index !== i) {
        // Parallax: stars closer to the camera ride the flow faster
        const depth = THREE.MathUtils.clamp(
          (camera.position.z - e.pos.z) / 10,
          0.6,
          1.4,
        );
        const [fx, fy, fz] = flowVelocity(e.pos.x, e.pos.y, e.pos.z, t);
        const speed = 1.6 * depth * e.speedFactor;

        e.vel.x += fx * speed * dt;
        e.vel.y += fy * speed * dt;
        e.vel.z += fz * speed * dt * 0.4;

        e.pos.x += e.vel.x * dt;
        e.pos.y += e.vel.y * dt;
        e.pos.z += e.vel.z * dt;

        // Gentle pull home so stars keep their spot in the sky
        const pull = 0.15 * dt;
        e.pos.x += (e.home.x - e.pos.x) * pull;
        e.pos.y += (e.home.y - e.pos.y) * pull;
        e.pos.z += (e.home.z - e.pos.z) * pull * 0.5;

        e.vel.multiplyScalar(Math.exp(-dt * 0.5));
      }

      const spawn = easeOutCubic(
        THREE.MathUtils.clamp((t - e.birth) / SPAWN_DURATION, 0, 1),
      );
      const scale = Math.max(spawn * (1 + 0.3 * e.hover), 0.001);

      _quaternion.setFromAxisAngle(
        THREE.Object3D.DEFAULT_UP,
        t * 0.3 + e.phase * 0.1,
      );
      _scale.set(scale, scale, scale);
      _matrix.compose(e.pos, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);

      _color.set(emotionColor(e.journal.emotion)).multiplyScalar(1.5);
      mesh.setColorAt(i, _color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const index = e.instanceId ?? -1;
    if (index < 0 || !entriesRef.current[index]) return;
    dragRef.current = {
      index,
      last: entriesRef.current[index].pos.clone(),
      time: performance.now(),
      vel: new THREE.Vector3(),
    };
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (dragRef.current) return; // movement handled by window listener
    const index = e.instanceId ?? -1;

    if (index !== hoverIndexRef.current) {
      if (
        hoverIndexRef.current >= 0 &&
        entriesRef.current[hoverIndexRef.current]
      ) {
        entriesRef.current[hoverIndexRef.current].hover = 0;
      }
      hoverIndexRef.current = index;
      const entry = entriesRef.current[index];
      if (entry) {
        entry.hover = 1;
        document.body.style.cursor = "grab";
        onHover({
          title: formatShortDate(entry.journal.createdAt),
          subtitle: entry.journal.content,
          color: emotionColor(entry.journal.emotion),
          x: e.clientX,
          y: e.clientY,
        });
      } else {
        document.body.style.cursor = "auto";
        onHover(null);
      }
    }
  };

  const handlePointerOut = () => {
    if (!dragRef.current) {
      hoverIndexRef.current = -1;
      document.body.style.cursor = "auto";
      onHover(null);
    }
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[getStarGeometry(), undefined, MAX_STARS]}
      onClick={(e) => {
        if (e.delta <= 5) {
          e.stopPropagation();
          const entry = entriesRef.current[e.instanceId ?? -1];
          if (entry) onClick(entry.journal);
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

export default InstancedJournalStars;
