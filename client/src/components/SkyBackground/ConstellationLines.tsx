import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Constellation } from '../../types';

interface ConstellationLinesProps {
  constellations: Constellation[];
  positionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>;
  weekIndexes: Map<string, number>;
  draft?: { journalIds: string[]; color: string } | null;
  focusedConstellationId?: string;
}

interface Segment {
  fromId: string;
  toId: string;
  color: THREE.Color;
  weekSpan: number;
  focused: boolean;
}

interface LinePiece extends Segment {
  startT: number;
  endT: number;
}

const ARC_THRESHOLD_WEEKS = 2;
const MIN_ARC_STEPS = 10;
const MAX_ARC_STEPS = 24;

const ConstellationLines: React.FC<ConstellationLinesProps> = ({
  constellations,
  positionsRef,
  weekIndexes,
  draft,
  focusedConstellationId,
}) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const segments = useMemo<Segment[]>(() => {
    const sources = draft ? [...constellations, draft] : constellations;
    return sources.flatMap((constellation) => {
      const color = new THREE.Color(constellation.color);
      return constellation.journalIds.slice(0, -1).map((fromId, index) => {
        const toId = constellation.journalIds[index + 1];
        return {
          fromId,
          toId,
          color,
          weekSpan: Math.abs((weekIndexes.get(toId) ?? 0) - (weekIndexes.get(fromId) ?? 0)),
          focused: !!focusedConstellationId && '_id' in constellation
            && constellation._id === focusedConstellationId,
        };
      });
    });
  }, [constellations, draft, focusedConstellationId, weekIndexes]);

  const pieces = useMemo<LinePiece[]>(() => segments.flatMap((segment) => {
    const steps = segment.weekSpan >= ARC_THRESHOLD_WEEKS
      ? Math.min(MAX_ARC_STEPS, MIN_ARC_STEPS + segment.weekSpan * 2)
      : 1;
    return Array.from({ length: steps }, (_, index) => ({
      ...segment,
      startT: index / steps,
      endT: (index + 1) / steps,
    }));
  }), [segments]);

  const positions = useMemo(() => new Float32Array(Math.max(pieces.length * 6, 6)), [pieces.length]);
  const colors = useMemo(() => {
    const values = new Float32Array(Math.max(pieces.length * 6, 6));
    pieces.forEach((piece, index) => {
      const startGlow = piece.weekSpan >= ARC_THRESHOLD_WEEKS
        ? 0.4 + Math.sin(piece.startT * Math.PI) * 0.6
        : 1;
      const endGlow = piece.weekSpan >= ARC_THRESHOLD_WEEKS
        ? 0.4 + Math.sin(piece.endT * Math.PI) * 0.6
        : 1;
      const focusStrength = focusedConstellationId
        ? (piece.focused ? 1.8 : 0.22)
        : 1;
      piece.color.clone().multiplyScalar(startGlow * focusStrength).toArray(values, index * 6);
      piece.color.clone().multiplyScalar(endGlow * focusStrength).toArray(values, index * 6 + 3);
    });
    return values;
  }, [focusedConstellationId, pieces]);

  useFrame(() => {
    const geometry = geometryRef.current;
    if (!geometry || pieces.length === 0) return;

    pieces.forEach((piece, index) => {
      const from = positionsRef.current.get(piece.fromId);
      const to = positionsRef.current.get(piece.toId);
      const offset = index * 6;
      if (from && to) {
        if (piece.weekSpan < ARC_THRESHOLD_WEEKS) {
          from.toArray(positions, offset);
          to.toArray(positions, offset + 3);
          return;
        }

        const arcHeight = Math.min(7, 1.4 + piece.weekSpan * 0.72);
        const controlX = (from.x + to.x) / 2;
        const controlY = Math.max(from.y, to.y) + arcHeight;
        const controlZ = Math.min(from.z, to.z) - Math.min(1, piece.weekSpan * 0.08);
        const writePoint = (t: number, targetOffset: number) => {
          const inverse = 1 - t;
          positions[targetOffset] = inverse * inverse * from.x + 2 * inverse * t * controlX + t * t * to.x;
          positions[targetOffset + 1] = inverse * inverse * from.y + 2 * inverse * t * controlY + t * t * to.y;
          positions[targetOffset + 2] = inverse * inverse * from.z + 2 * inverse * t * controlZ + t * t * to.z;
        };
        writePoint(piece.startT, offset);
        writePoint(piece.endT, offset + 3);
      } else {
        positions.fill(0, offset, offset + 6);
      }
    });
    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere();
  });

  if (pieces.length === 0) return null;

  return (
    <lineSegments frustumCulled={false} renderOrder={-1}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.58}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  );
};

export default ConstellationLines;
