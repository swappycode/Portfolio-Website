import { Vector3 } from 'three';

/**
 * Check if a position on a sphere collides with a set of path points
 * using sphere-to-sphere distance checks
 */
export const checkCollisionWithPathPoints = (
  treePosition: Vector3,
  pathPoints: Vector3[],
  collisionRadius: number
): boolean => {
  for (const pathPoint of pathPoints) {
    const distance = treePosition.distanceTo(pathPoint);
    if (distance < collisionRadius) {
      return true; // Collision detected
    }
  }
  return false; // No collision
};

/**
 * Convert spherical coordinates to Cartesian
 */
export const sphericalToCartesian = (
  theta: number,
  phi: number,
  radius: number
): Vector3 => {
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new Vector3(x, y, z);
};

/**
 * Convert Cartesian to spherical coordinates
 */
export const cartesianToSpherical = (
  vec: Vector3
): { theta: number; phi: number } => {
  const r = vec.length();
  const theta = Math.atan2(vec.z, vec.x);
  const phi = Math.acos(vec.y / r);
  return { theta, phi };
};

/**
 * Calculate distance on a sphere surface using Haversine formula
 */
export const distanceOnSphere = (
  theta1: number,
  phi1: number,
  theta2: number,
  phi2: number,
  radius: number
): number => {
  const dTheta = theta2 - theta1;
  const dPhi = phi2 - phi1;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dTheta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
};
