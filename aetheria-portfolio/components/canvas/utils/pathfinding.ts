import { Vector3 } from 'three';

/**
 * Finds the closest point on all available paths to a given position
 */
export const findClosestPointOnPaths = (
  pos: Vector3,
  allPaths: Vector3[][]
): { point: Vector3; pathIndex: number; pointIndex: number } => {
  let closestPoint = new Vector3();
  let closestDistance = Infinity;
  let closestPathIndex = 0;
  let closestPointIndex = 0;

  for (let pathIdx = 0; pathIdx < allPaths.length; pathIdx++) {
    const path = allPaths[pathIdx];
    for (let ptIdx = 0; ptIdx < path.length; ptIdx++) {
      const point = path[ptIdx];
      const distance = distanceOnSphere(pos, point);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point.clone();
        closestPathIndex = pathIdx;
        closestPointIndex = ptIdx;
      }
    }
  }

  return {
    point: closestPoint,
    pathIndex: closestPathIndex,
    pointIndex: closestPointIndex
  };
};

/**
 * Calculates the angular distance between two positions on a sphere surface
 */
export const distanceOnSphere = (pos1: Vector3, pos2: Vector3): number => {
  const normalizedPos1 = pos1.clone().normalize();
  const normalizedPos2 = pos2.clone().normalize();
  const dotProduct = normalizedPos1.dot(normalizedPos2);
  const clampedDot = Math.max(-1, Math.min(1, dotProduct));
  return Math.acos(clampedDot);
};

/**
 * Gets waypoints along a single path between two indices (takes the SHORTEST direction)
 */
const getPathSegmentWaypoints = (
  path: Vector3[],
  startIdx: number,
  endIdx: number
): Vector3[] => {
  const waypoints: Vector3[] = [];
  const pathLength = path.length;

  // Calculate both possible directions on the circular path
  let forwardDistance: number;
  let backwardDistance: number;

  if (startIdx <= endIdx) {
    forwardDistance = endIdx - startIdx;
    backwardDistance = pathLength - (endIdx - startIdx);
  } else {
    forwardDistance = pathLength - (startIdx - endIdx);
    backwardDistance = startIdx - endIdx;
  }

  // Take the shorter direction
  const useForward = forwardDistance <= backwardDistance;

  if (useForward) {
    if (startIdx <= endIdx) {
      for (let i = startIdx; i <= endIdx; i++) { // Sample every point for strict path adherence
        waypoints.push(path[i].clone());
      }
      // Ensure endpoint is included
      if (pathLength > 0 && waypoints[waypoints.length - 1] !== path[endIdx]) {
        waypoints.push(path[endIdx].clone());
      }
    } else {
      for (let i = startIdx; i < pathLength; i++) {
        waypoints.push(path[i].clone());
      }
      for (let i = 0; i <= endIdx; i++) {
        waypoints.push(path[i].clone());
      }
      if (waypoints[waypoints.length - 1] !== path[endIdx]) {
        waypoints.push(path[endIdx].clone());
      }
    }
  } else {
    // Go backwards
    if (startIdx > endIdx) {
      for (let i = startIdx; i >= endIdx; i--) {
        waypoints.push(path[i].clone());
      }
      if (waypoints[waypoints.length - 1] !== path[endIdx]) {
        waypoints.push(path[endIdx].clone());
      }
    } else {
      for (let i = startIdx; i >= 0; i--) {
        waypoints.push(path[i].clone());
      }
      for (let i = pathLength - 1; i >= endIdx; i--) {
        waypoints.push(path[i].clone());
      }
      if (waypoints[waypoints.length - 1] !== path[endIdx]) {
        waypoints.push(path[endIdx].clone());
      }
    }
  }

  return waypoints;
};

/**
 * Finds the intersection point between two paths
 */
const findPathIntersection = (
  path1: Vector3[],
  path2: Vector3[]
): { point1: Vector3; point2: Vector3; idx1: number; idx2: number } => {
  let minDistance = Infinity;
  let bestIdx1 = 0;
  let bestIdx2 = 0;

  const step1 = Math.max(1, Math.floor(path1.length / 20));
  const step2 = Math.max(1, Math.floor(path2.length / 20));

  for (let i = 0; i < path1.length; i += step1) {
    for (let j = 0; j < path2.length; j += step2) {
      const distance = distanceOnSphere(path1[i], path2[j]);
      if (distance < minDistance) {
        minDistance = distance;
        bestIdx1 = i;
        bestIdx2 = j;
      }
    }
  }

  return {
    point1: path1[bestIdx1].clone(),
    point2: path2[bestIdx2].clone(),
    idx1: bestIdx1,
    idx2: bestIdx2
  };
};

/**
 * Calculates the shortest path along predefined paths from player to NPC
 */
export const findPathWaypoints = (
  playerPos: Vector3,
  targetNPCPos: Vector3,
  allPaths: Vector3[][]
): Vector3[] => {
  const playerClosest = findClosestPointOnPaths(playerPos, allPaths);
  const targetClosest = findClosestPointOnPaths(targetNPCPos, allPaths);

  const waypoints: Vector3[] = [];

  // Always start by moving to the closest point on a path
  // This prevents cutting through the forest at the start
  waypoints.push(playerClosest.point.clone());

  // Case 1: Both on the same path - direct route
  if (playerClosest.pathIndex === targetClosest.pathIndex) {
    const path = allPaths[playerClosest.pathIndex];
    const startIdx = playerClosest.pointIndex;
    const endIdx = targetClosest.pointIndex;

    const segmentWaypoints = getPathSegmentWaypoints(path, startIdx, endIdx);
    
    // Skip first waypoint to avoid duplicate with playerClosest.point
    for (let i = 1; i < segmentWaypoints.length; i++) {
      waypoints.push(segmentWaypoints[i]);
    }

    return waypoints.length > 1
      ? waypoints
      : [playerClosest.point.clone(), targetClosest.point.clone()];
  }

  // Case 2: On different paths - find shortest route through intersections
  const path1 = allPaths[playerClosest.pathIndex];
  const path2 = allPaths[targetClosest.pathIndex];

  const startIdx = playerClosest.pointIndex;
  const intersection = findPathIntersection(path1, path2);

  // Get segment from player on path1 to the intersection on path1
  const path1Segment = getPathSegmentWaypoints(path1, startIdx, intersection.idx1);
  
  // Skip first point to avoid duplicate with playerClosest.point
  for (let i = 1; i < path1Segment.length; i++) {
    waypoints.push(path1Segment[i]);
  }

  // Only find intersection if on different paths
  if (playerClosest.pathIndex !== targetClosest.pathIndex) {
    // Add intersection point on path1 (handle empty list safely)
    const lastWaypoint = waypoints[waypoints.length - 1];
    if (!lastWaypoint || distanceOnSphere(lastWaypoint, intersection.point1) > 0.05) {
      waypoints.push(intersection.point1);
    }

    // Switch to path2 at intersection
    if (distanceOnSphere(intersection.point2, waypoints[waypoints.length - 1]) > 0.01) {
      waypoints.push(intersection.point2);
    }

    // Get segment from intersection to target on path2
    const startIdx2 = intersection.idx2;
    const endIdx2 = targetClosest.pointIndex;
    const path2Waypoints = getPathSegmentWaypoints(path2, startIdx2, endIdx2);

    // Skip first point to avoid duplicate at intersection
    for (let i = 1; i < path2Waypoints.length; i++) {
      waypoints.push(path2Waypoints[i]);
    }
  }

  return waypoints;
};
