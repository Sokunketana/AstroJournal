import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RocketLaunchData } from "./SkyBackground.types";

const BURST_DURATION = 0.8;

// The rocket is rendered by the supplied Lottie asset. This retains only the
// in-world impact effect that turns the launched entry into a star.
const StarBurst: React.FC<{ launch: RocketLaunchData }> = ({ launch }) => {
  const burstRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Mesh[]>([]);
  const elapsed = useRef(0);
  const burstStart = useRef<number | null>(null);
  const target = useMemo(
    () => new THREE.Vector3(launch.target.x, launch.target.y, launch.target.z),
    [launch.target.x, launch.target.y, launch.target.z],
  );

  const particleDirections = useMemo(
    () =>
      Array.from({ length: 26 }, (_, index) => {
        const angle = index * 2.4;
        return new THREE.Vector3(
          Math.cos(angle) * (0.55 + (index % 3) * 0.2),
          Math.sin(angle) * (0.55 + ((index + 1) % 3) * 0.2),
          ((index % 5) - 2) * 0.22,
        ).normalize();
      }),
    [],
  );

  useFrame((_, delta) => {
    elapsed.current += Math.min(delta, 0.05);
    if (launch.confirmed && burstStart.current === null) burstStart.current = elapsed.current;

    const burstProgress = burstStart.current === null
      ? -1
      : (elapsed.current - burstStart.current) / BURST_DURATION;
    if (!burstRef.current || !glowRef.current) return;

    if (burstProgress < 0) {
      burstRef.current.visible = false;
      return;
    }

    burstRef.current.visible = burstProgress <= 1;
    if (burstProgress > 1) return;

    const explosion = Math.min(burstProgress, 1);
    const expansion = 0.35 + Math.sin(explosion * Math.PI * 0.5) * 3.1;
    glowRef.current.scale.setScalar(1.7 - explosion * 0.9);
    (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - explosion;

    particlesRef.current.forEach((particle, index) => {
      const direction = particleDirections[index];
      const distance = expansion * (0.7 + (index % 4) * 0.12);
      particle.position.copy(direction).multiplyScalar(distance);
      particle.scale.setScalar(Math.max(0.08, (1 - explosion) * 0.22));
      (particle.material as THREE.MeshBasicMaterial).opacity = 1 - explosion * 0.75;
    });
  });

  return (
    <group ref={burstRef} position={target} visible={false}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.32, 18, 18]} />
        <meshBasicMaterial color="#fff4b2" transparent />
      </mesh>
      <pointLight color="#ffd36a" intensity={5} distance={7} />
      {particleDirections.map((_, index) => (
        <mesh
          key={index}
          ref={(node) => {
            if (node) particlesRef.current[index] = node;
          }}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={index % 3 === 0 ? "#ffffff" : "#ffd36a"} transparent />
        </mesh>
      ))}
    </group>
  );
};

export default StarBurst;
