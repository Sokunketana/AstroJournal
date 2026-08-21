import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Constellation } from '../../types';

interface ConstellationLinesProps {
  constellations: Constellation[];
  positionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>;
  draft?: { journalIds: string[]; color: string } | null;
}

interface Segment {
  fromId: string;
  toId: string;
  color: THREE.Color;
}

const ConstellationLines: React.FC<ConstellationLinesProps> = ({ constellations, positionsRef, draft }) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const segments = useMemo<Segment[]>(() => {
    const sources = draft ? [...constellations, draft] : constellations;
    return sources.flatMap((constellation) => {
      const color = new THREE.Color(constellation.color);
      return constellation.journalIds.slice(0, -1).map((fromId, index) => ({
        fromId,
        toId: constellation.journalIds[index + 1],
        color,
      }));
    });
  }, [constellations, draft]);

  const positions = useMemo(() => new Float32Array(Math.max(segments.length * 6, 6)), [segments.length]);
  const colors = useMemo(() => {
    const values = new Float32Array(Math.max(segments.length * 6, 6));
    segments.forEach((segment, index) => {
      segment.color.toArray(values, index * 6);
      segment.color.toArray(values, index * 6 + 3);
    });
    return values;
  }, [segments]);

  useFrame(() => {
    const geometry = geometryRef.current;
    if (!geometry || segments.length === 0) return;

    segments.forEach((segment, index) => {
      const from = positionsRef.current.get(segment.fromId);
      const to = positionsRef.current.get(segment.toId);
      const offset = index * 6;
      if (from && to) {
        from.toArray(positions, offset);
        to.toArray(positions, offset + 3);
      } else {
        positions.fill(0, offset, offset + 6);
      }
    });
    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere();
  });

  if (segments.length === 0) return null;

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
