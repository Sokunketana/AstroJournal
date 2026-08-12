import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BackgroundStarsProps {
  count: number;
}

const vertexShader = `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    // Layered sines per star = pseudo-random, non-repeating shimmer
    float tw =
      0.55 + 0.45 * sin(uTime * 0.8 + aPhase * 6.2831) *
      sin(uTime * 1.35 + aPhase * 12.9898);
    vAlpha = max(tw, 0.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = max(aSize * 260.0 / -mv.z * uPixelRatio * tw, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(uColor * a, a * vAlpha);
  }
`;

const BackgroundStars: React.FC<BackgroundStarsProps> = ({ count }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = THREE.MathUtils.randFloatSpread(50);
      pos[i * 3 + 1] = THREE.MathUtils.randFloatSpread(50);
      pos[i * 3 + 2] = THREE.MathUtils.randFloatSpread(50);
    }
    return pos;
  }, [count]);

  const phases = useMemo(
    () =>
      Float32Array.from({ length: count }, () => THREE.MathUtils.randFloat(0, 1)),
    [count],
  );

  const sizes = useMemo(
    () =>
      Float32Array.from(
        { length: count },
        () => THREE.MathUtils.randFloat(0.08, 0.35),
      ),
    [count],
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uColor: { value: new THREE.Color("#ffffff") },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default BackgroundStars;
