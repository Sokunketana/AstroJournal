import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Journal } from "../../types";
import { emotionColor } from "../../utils/emotion";
import { formatShortDate } from "../../utils/dateUtils";
import { flowVelocity, noise3D } from "./flowField";
import { getStarGeometry } from "./starGeometry";
import type { RocketLaunchData, SkyTooltipData } from "./SkyBackground.types";

export interface InstancedJournalStarsProps {
  stars: { id: string; position: [number, number, number]; journal: Journal }[];
  onClick: (journal: Journal) => void;
  onDragEnd: (id: string, pos: { x: number; y: number; z: number }) => void;
  onHover: (tooltip: SkyTooltipData | null) => void;
  impact?: RocketLaunchData | null;
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

// Screen rect of a UI element (nav bar, entry bar, buttons...), in NDC.
// Scaled to camera space at each star's depth so it acts as a bounce box.
interface UiRect {
  l: number;
  r: number;
  b: number;
  t: number;
}

const MAX_STARS = 2048;
const SPAWN_DURATION = 1.2;
const UI_SCAN_MS = 250;
const UI_MARGIN_PX = 12;
// Screen-edge margins in NDC: consistent at every depth, and always outside
// the UI rects (which are clamped to these same lines) so the two bounce
// systems can never disagree
const SCREEN_MARGIN_X = 0.03;
const SCREEN_MARGIN_BOTTOM = 0.03;
const SCREEN_MARGIN_TOP = 0.03;
// Reflect off UI elements when the star arrives with real momentum (total
// speed above this threshold); slower drifts get absorbed so the star rests
// against the edge instead of fizzling on it
const UI_BOUNCE_SPEED = 1.0;
// UI bounces are bouncier than the screen edges (0.8) so throws keep their
// energy when deflecting off the nav elements
const UI_RESTITUTION = 0.9;
const IMPACT_RADIUS = 4.5;
const IMPACT_STRENGTH = 7;
// Z bounce bounds: stars stay between a near plane (before the projection
// blows up and they fly off-screen) and a far plane (before they shrink away)
const NEAR_DEPTH = 1.5;
const FAR_DEPTH = 30;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const _matrix = new THREE.Matrix4();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();
const _cameraSpace = new THREE.Vector3();

const InstancedJournalStars: React.FC<InstancedJournalStarsProps> = ({
  stars,
  onClick,
  onDragEnd,
  onHover,
  impact,
  paused,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const entriesRef = useRef<StarEntry[]>([]);
  const hoverIndexRef = useRef(-1);
  const dragRef = useRef<{
    index: number;
    last: THREE.Vector3;
    time: number;
    vel: THREE.Vector3;
  } | null>(null);
  const { camera, gl } = useThree();
  const cameraRef = useRef(camera);
  const raycasterRef = useRef(new THREE.Raycaster());
  const ndcRef = useRef(new THREE.Vector2());
  const uiRectsRef = useRef<UiRect[]>([]);
  const lastImpactIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!impact?.confirmed || lastImpactIdRef.current === impact.id) return;
    lastImpactIdRef.current = impact.id;

    const origin = new THREE.Vector3(
      impact.target.x,
      impact.target.y,
      impact.target.z,
    );

    entriesRef.current.forEach((entry) => {
      if (entry.id === impact.journalId) return;
      const direction = entry.pos.clone().sub(origin);
      const distance = direction.length();
      if (distance >= IMPACT_RADIUS) return;

      if (distance < 0.001) {
        const seed = entry.id
          .split("")
          .reduce((total, character) => total + character.charCodeAt(0), impact.id);
        const angle = (seed % 360) * (Math.PI / 180);
        const depth = ((seed * 17) % 100) / 100 - 0.5;
        direction.set(Math.cos(angle), Math.sin(angle), depth * 0.7).normalize();
      } else {
        direction.divideScalar(distance);
      }

      const falloff = 1 - distance / IMPACT_RADIUS;
      const impulse = IMPACT_STRENGTH * falloff * falloff;
      entry.vel.add(direction.multiplyScalar(impulse)).clampLength(0, 8);
    });
  }, [impact]);

  // Cache the bounce zones (nav bar, entry bar, buttons...) as NDC rects.
  // Elements opt in with data-star-bounce; rescan on resize and periodically
  // so layout/visibility changes (e.g. the entry bar growing while typing)
  // stay in sync without querying the DOM on every frame
  useEffect(() => {
    const scan = () => {
      const canvas = gl.domElement;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      const rects: UiRect[] = [];
      document.querySelectorAll("[data-star-bounce]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return; // hidden or empty
        const mx = (UI_MARGIN_PX / w) * 2;
        const my = (UI_MARGIN_PX / h) * 2;
        rects.push({
          l: Math.max((r.left / w) * 2 - 1 - mx, -(1 - SCREEN_MARGIN_X)),
          r: Math.min((r.right / w) * 2 - 1 + mx, 1 - SCREEN_MARGIN_X),
          b: Math.max(1 - (r.bottom / h) * 2 - my, -(1 - SCREEN_MARGIN_BOTTOM)),
          t: Math.min(1 - (r.top / h) * 2 + my, 1 - SCREEN_MARGIN_TOP),
        });
      });
      uiRectsRef.current = rects;
    };
    scan();
    window.addEventListener("resize", scan);
    const interval = window.setInterval(scan, UI_SCAN_MS);
    return () => {
      window.removeEventListener("resize", scan);
      window.clearInterval(interval);
    };
  }, [gl]);

  useEffect(() => {
    const now = performance.now() / 1000;
    const existing = new Map(entriesRef.current.map((e) => [e.id, e]));    entriesRef.current = stars.map((star) => {
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
        speedFactor: 0.3 + 0.4 * noise3D(Math.random() * 1000, 1, 0),
        birth: now,
        hover: 0,
      };
    });
    hoverIndexRef.current = -1;
  }, [stars]);

  // Native pointerdown + manual raycast: starts drags without depending on
  // r3f's event system, which is unreliable right after a hard refresh
  useEffect(() => {
    const canvas = gl.domElement;
    const onPointerDown = (ev: PointerEvent) => {
      const mesh = meshRef.current;
      if (!mesh) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      ndcRef.current.set(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycasterRef.current.setFromCamera(ndcRef.current, cameraRef.current);
      const hits = raycasterRef.current.intersectObject(mesh);
      if (hits.length === 0) return;
      const index = hits[0].instanceId ?? -1;
      if (index < 0 || !entriesRef.current[index]) return;
      dragRef.current = {
        index,
        last: entriesRef.current[index].pos.clone(),
        time: performance.now(),
        vel: new THREE.Vector3(),
      };
      hoverIndexRef.current = -1;
      onHover(null);
      document.body.style.cursor = "grabbing";
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    return () => canvas.removeEventListener("pointerdown", onPointerDown);
  }, [gl, onHover]);

  // Window-level drag: pointer capture on the object is unreliable across
  // browsers/touch, so movement and release are tracked globally instead
  useEffect(() => {
    const onWindowMove = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const entry = entriesRef.current[drag.index];
      if (!entry) return;
      const cam = cameraRef.current;
      const vector = new THREE.Vector3(
        (ev.clientX / window.innerWidth) * 2 - 1,
        -(ev.clientY / window.innerHeight) * 2 + 1,
        0.5,
      );
      vector.unproject(cam);
      const dir = vector.sub(cam.position).normalize();
      const distance = (entry.pos.z - cam.position.z) / dir.z;
      const pos = cam.position.clone().add(dir.multiplyScalar(distance));
      const now = performance.now();
      const dt = Math.max((now - drag.time) / 1000, 0.001);
      drag.vel
        .set(pos.x - drag.last.x, pos.y - drag.last.y, pos.z - drag.last.z)
        .divideScalar(dt);
      drag.last.copy(pos);
      drag.time = now;
      entry.pos.copy(pos);
    };

    const finalizeDrag = () => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      document.body.style.cursor = "auto";
      const entry = entriesRef.current[drag.index];
      if (!entry) return;
      // Throw: hand the drag velocity back to the star for momentum
      entry.vel.copy(drag.vel).clampLength(0, 8);
      onDragEnd(entry.id, { x: entry.pos.x, y: entry.pos.y, z: entry.pos.z });
    };

    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", finalizeDrag);
    window.addEventListener("pointercancel", finalizeDrag);
    return () => {
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", finalizeDrag);
      window.removeEventListener("pointercancel", finalizeDrag);
    };
  }, [onDragEnd]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    cameraRef.current = state.camera;
    const t = state.clock.elapsedTime;
    const tWall = performance.now() / 1000;
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
        const speed = 0.9 * depth * e.speedFactor;

        e.vel.x += fx * speed * dt;
        e.vel.y += fy * speed * dt;
        e.vel.z += fz * speed * dt * 0.4;

        e.pos.x += e.vel.x * dt;
        e.pos.y += e.vel.y * dt;
        e.pos.z += e.vel.z * dt;

        // Screen boundaries for bouncing, computed in camera space so they
        // match the true view frustum: viewport.getCurrentViewport() sizes
        // the frustum by euclidean distance, which overestimates for stars
        // far off-axis and lets them poke off the screen
        camera.updateMatrixWorld();
        const cs = _cameraSpace.copy(e.pos).applyMatrix4(camera.matrixWorldInverse);
        const viewDepth = -cs.z;
        const tanHalf = Math.tan(
          ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 360,
        );
        const halfW = viewDepth * tanHalf * state.viewport.aspect;
        const halfH = viewDepth * tanHalf;

        const marginX = SCREEN_MARGIN_X;
        const marginBottom = SCREEN_MARGIN_BOTTOM;
        const marginTop = SCREEN_MARGIN_TOP;

        const maxX = (1 - marginX) * halfW;
        const minX = -(1 - marginX) * halfW;
        const maxY = (1 - marginTop) * halfH;
        const minY = -(1 - marginBottom) * halfH;

        if (cs.x > maxX) {
          cs.x = maxX;
          e.vel.x *= -0.8;
        } else if (cs.x < minX) {
          cs.x = minX;
          e.vel.x *= -0.8;
        }

        if (cs.y > maxY) {
          cs.y = maxY;
          e.vel.y *= -0.8;
        } else if (cs.y < minY) {
          cs.y = minY;
          e.vel.y *= -0.8;
        }

        if (cs.z < -FAR_DEPTH) {
          cs.z = -FAR_DEPTH;
          e.vel.z *= -0.8;
        } else if (cs.z > -NEAR_DEPTH) {
          cs.z = -NEAR_DEPTH;
          e.vel.z *= -0.8;
        }

        // Bounce off UI elements (app title, entry bar, search, stats...):
        // each screen rect becomes a camera-space box at the star's depth,
        // so a thrown star deflects off whichever edge it crosses. Two
        // passes so overlapping rects resolve into a stable push-out.
        // The bounce decision uses total speed (not the axis component) so
        // glancing hits reflect too; the normal component is the one flipped
        const uiRects = uiRectsRef.current;
        for (let pass = 0; pass < 2; pass++) {
          for (const rect of uiRects) {
            const l = rect.l * halfW;
            const rgt = rect.r * halfW;
            const b = rect.b * halfH;
            const top = rect.t * halfH;
            // boundary counts as outside: a star pushed onto an edge must not
            // be processed again (or its velocity flips twice per frame and
            // it pings against the element, bleeding speed)
            if (cs.x <= l || cs.x >= rgt || cs.y <= b || cs.y >= top) continue;
            const penL = cs.x - l;
            const penR = rgt - cs.x;
            const penB = cs.y - b;
            const penT = top - cs.y;
            const minPen = Math.min(penL, penR, penB, penT);
            const hit = e.vel.length() > UI_BOUNCE_SPEED;
            // Flip the component along the pushed axis — the min-pen edge is
            // the one the star crossed, so that component must reflect
            // (y is up in camera space); slow contacts are absorbed
            if (minPen === penL) {
              cs.x = l;
              e.vel.x = hit ? -e.vel.x * UI_RESTITUTION : 0;
            } else if (minPen === penR) {
              cs.x = rgt;
              e.vel.x = hit ? -e.vel.x * UI_RESTITUTION : 0;
            } else if (minPen === penB) {
              cs.y = b;
              e.vel.y = hit ? -e.vel.y * UI_RESTITUTION : 0;
            } else {
              cs.y = top;
              e.vel.y = hit ? -e.vel.y * UI_RESTITUTION : 0;
            }
          }
        }

        e.pos.copy(cs).applyMatrix4(camera.matrixWorld);

        // Gentle pull home so stars keep their spot in the sky
        const pull = 0.15 * dt;
        e.pos.x += (e.home.x - e.pos.x) * pull;
        e.pos.y += (e.home.y - e.pos.y) * pull;
        e.pos.z += (e.home.z - e.pos.z) * pull * 0.5;

        e.vel.multiplyScalar(Math.exp(-dt * 0.5));
      }

      e.hover = THREE.MathUtils.lerp(e.hover, hoverIndexRef.current === i ? 1 : 0, dt * 10);

      const spawn = easeOutCubic(
        THREE.MathUtils.clamp((tWall - e.birth) / SPAWN_DURATION, 0, 1),
      );
      const scale = Math.max(spawn * (1 + 0.3 * e.hover), 0.001);

      _quaternion.setFromAxisAngle(
        THREE.Object3D.DEFAULT_UP,
        t * 0.15 + e.phase * 0.1,
      );
      _scale.set(scale, scale, scale);
      _matrix.compose(e.pos, _quaternion, _scale);
      mesh.setMatrixAt(i, _matrix);

      _color.set(emotionColor(e.journal.emotion)).multiplyScalar(1.5);
      mesh.setColorAt(i, _color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  });

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (dragRef.current) return; // movement handled by window listener
    const index = e.instanceId ?? -1;

    if (index !== hoverIndexRef.current) {
      hoverIndexRef.current = index;
      const entry = entriesRef.current[index];
      if (entry) {
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
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

export default InstancedJournalStars;
