import * as THREE from "three";

let cached: THREE.ExtrudeGeometry | null = null;

// Shape radius (0.15) plus its bevel (0.02). Collision centers stop this far
// from a week divider so the visible tip of the star touches the shared wall.
export const JOURNAL_STAR_RADIUS = 0.17;

// One shared star geometry for all instanced journal stars
export function getStarGeometry(): THREE.ExtrudeGeometry {
  if (cached) return cached;

  const shape = new THREE.Shape();
  const spikes = 5;
  const outerRadius = 0.15;
  const innerRadius = 0.06;
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / (spikes * 2)) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  cached = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 1,
  });
  return cached;
}
