import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RocketLaunchData } from "./SkyBackground.types";

const BURST_DURATION = 1.65;
const PARTICLE_COUNT = 32;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const smoothStep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const seededUnit = (seed: number, index: number) => {
  const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

// The rocket is rendered by the supplied Lottie asset. This retains only the
// in-world impact effect that turns the launched entry into a star.
const StarBurst: React.FC<{ launch: RocketLaunchData }> = ({ launch }) => {
  const burstRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const particlesRef = useRef<Array<THREE.Mesh | undefined>>([]);
  const elapsed = useRef(0);
  const burstStart = useRef<number | null>(null);
  const target = useMemo(
    () => new THREE.Vector3(launch.target.x, launch.target.y, launch.target.z),
    [launch.target.x, launch.target.y, launch.target.z],
  );

  const particleDirections = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
      const offset = index * 3;
      return new THREE.Vector3(
        seededUnit(launch.id, offset) * 2 - 1,
        seededUnit(launch.id, offset + 1) * 2 - 1,
        seededUnit(launch.id, offset + 2) * 2 - 1,
      ).normalize();
    });
  }, [launch.id]);

  const particleDelays = useMemo(() => {
    return Array.from(
      { length: PARTICLE_COUNT },
      (_, index) => 0.04 + seededUnit(launch.id + 17, index) * 0.2,
    );
  }, [launch.id]);

  const constellationTargets = useMemo(() => {
    const vertices = Array.from({ length: 10 }, (_, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI) / 5;
      const radius = index % 2 === 0 ? 1.25 : 0.55;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        ((index % 3) - 1) * 0.08,
      );
    });

    return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
      const progress = (index / PARTICLE_COUNT) * vertices.length;
      const edge = Math.floor(progress) % vertices.length;
      const amount = progress - Math.floor(progress);
      return vertices[edge].clone().lerp(vertices[(edge + 1) % vertices.length], amount);
    });
  }, []);

  useFrame((_, delta) => {
    elapsed.current += Math.min(delta, 0.05);
    if (launch.confirmed && burstStart.current === null) burstStart.current = elapsed.current;

    const burstProgress = burstStart.current === null
      ? -1
      : (elapsed.current - burstStart.current) / BURST_DURATION;
    if (
      !burstRef.current
      || !glowRef.current
      || !haloRef.current
      || !ringRef.current
      || !lightRef.current
    ) return;

    if (burstProgress < 0) {
      burstRef.current.visible = false;
      return;
    }

    burstRef.current.visible = burstProgress <= 1;
    if (burstProgress > 1) return;

    const explosion = Math.min(burstProgress, 1);
    const constellationBlend = smoothStep(0.42, 0.72, explosion);
    const particleFade = 1 - smoothStep(0.5, 1, explosion);
    const expansion = 0.35 + Math.sin(explosion * Math.PI * 0.5) * 3.1;

    glowRef.current.scale.setScalar(1.8 - explosion * 1.05);
    (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - explosion;
    haloRef.current.scale.setScalar(2.8 + explosion * 3.2);
    (haloRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - explosion) * 0.28;

    ringRef.current.scale.setScalar(0.35 + explosion * 4.8);
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - explosion) * 0.85;

    const flashFalloff = 1 - smoothStep(0, 0.34, explosion);
    lightRef.current.intensity = 8.8 * flashFalloff + 1.2 * (1 - explosion);

    particlesRef.current.forEach((particle, index) => {
      if (!particle) return;
      const direction = particleDirections[index];
      const particleProgress = clamp01(
        (explosion - particleDelays[index]) / (1 - particleDelays[index]),
      );
      const distance = expansion * (0.7 + (index % 4) * 0.12);
      const scattered = direction.clone().multiplyScalar(distance);
      const constellation = constellationTargets[index]
        .clone()
        .multiplyScalar(0.9 + explosion * 2.15);
      particle.position.copy(scattered.lerp(constellation, constellationBlend));
      particle.scale.setScalar(
        Math.max(0.02, (1 - particleProgress * 0.55) * 0.24 * particleFade),
      );
      (particle.material as THREE.MeshBasicMaterial).opacity =
        (1 - particleProgress * 0.25) * particleFade;
    });
  });

  return (
    <group ref={burstRef} position={target} visible={false}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.32, 18, 18]} />
        <meshBasicMaterial color="#fff4b2" transparent blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.55, 18, 18]} />
        <meshBasicMaterial
          color="#ffad5c"
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ringRef} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.24, 0.3, 64]} />
        <meshBasicMaterial
          color="#ffd36a"
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <pointLight ref={lightRef} color="#ffe7a8" intensity={10} distance={8} decay={2} />
      {particleDirections.map((_, index) => (
        <mesh
          key={index}
          ref={(node) => {
            particlesRef.current[index] = node ?? undefined;
          }}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial
            color={index % 3 === 0 ? "#ffffff" : "#ffd36a"}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};

export default StarBurst;
