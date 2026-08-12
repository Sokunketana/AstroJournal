import { createNoise3D } from "simplex-noise";

export const noise3D = createNoise3D();

const EPS = 0.1;
const SCALE = 0.35;

const H = (x: number, y: number, z: number, t: number) =>
  noise3D(x * SCALE, y * SCALE, z * SCALE + t * 0.5);

// Curl of a scalar noise field: divergence-free flow, so objects riding it
// swirl smoothly without pooling into sinks or orbits around a point
export function flowVelocity(
  x: number,
  y: number,
  z: number,
  t: number,
): [number, number, number] {
  const dx = (H(x + EPS, y, z, t) - H(x - EPS, y, z, t)) / (2 * EPS);
  const dy = (H(x, y + EPS, z, t) - H(x, y - EPS, z, t)) / (2 * EPS);
  const dz = (H(x, y, z + EPS, t) - H(x, y, z - EPS, t)) / (2 * EPS);
  return [dz - dy, dx - dz, dy - dx];
}
