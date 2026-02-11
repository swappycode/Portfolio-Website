import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Quaternion, Vector3 } from 'three';
import { useGameStore } from '../../../store/gameStore';
import { NPC_CONFIG, WORLD_RADIUS, CEL_SHADER_CONFIG } from '../../../config/world.config';
import { NPC } from '../NPC/NPC';
import { Trees, Bushes, FallenTrees, DeadTrees, Rocks } from './Props';
import { CelShaderMaterial } from './CelShaderMaterial';
import { Paths, generateStructuredPaths } from './Paths';
import { AnimeClouds } from '../Sky/AnimeClouds';
import { distanceOnSphere, findClosestPointOnPaths, findPathWaypoints } from '../utils/pathfinding';


interface WorldProps {
  input: { forward: boolean; backward: boolean; left: boolean; right: boolean };
  onRotationVelocityChange?: (velocity: { x: number; y: number; z: number }) => void;
}

export const World: React.FC<WorldProps> = ({ input, onRotationVelocityChange }) => {
  const worldRef = useRef<Group>(null);

  // Game State
  const { isAutoWalking, activeNPC, cancelAutoWalk, setDialogueOpen } = useGameStore();

  const pathsData = useMemo(() => generateStructuredPaths(), []);
  const npcDataOnPath = useMemo(() => {
    return NPC_CONFIG.map((npc) => {
      const closest = findClosestPointOnPaths(new Vector3(...npc.position), pathsData);
      return {
        ...npc,
        position: [closest.point.x, closest.point.y, closest.point.z] as [number, number, number]
      };
    });
  }, [pathsData]);

  // Physics Constants
  const SPEED = 0.02;
  const AUTO_WALK_ANGULAR_SPEED = 1.6; // Rad/sec for consistent, faster auto-walk
  const WAYPOINT_REACHED_ANGLE = 0.05; // Radians: how close before advancing waypoint
  const AUTO_WALK_STOP_ANGLE = 0.12; // Radians: stop before NPC so dialog doesn't overlap
  const autoWalkWaypoints = useRef<Vector3[]>([]);
  const currentWaypointIndex = useRef(0);
  const targetPathPointRef = useRef<Vector3 | null>(null);
  const lastQuaternion = useRef(new Quaternion());
  const rotationVelocity = useRef({ x: 0, y: 0, z: 0 });

  // Handle Auto-walking logic to NPCs
  useEffect(() => {
    if (isAutoWalking && activeNPC) {
      const npc = npcDataOnPath.find(n => n.id === activeNPC);
      if (npc && worldRef.current) {
        // Get current world rotation and determine player position
        const currentRotation = worldRef.current.quaternion;
        const playerPos = new Vector3(0, 1, 0)
          .applyQuaternion(currentRotation.clone().invert())
          .normalize()
          .multiplyScalar(WORLD_RADIUS);

        const npcPos = new Vector3(...npc.position);

        // Calculate waypoints using pathfinding algorithm
        const waypoints = findPathWaypoints(playerPos, npcPos, pathsData);
        const targetClosest = findClosestPointOnPaths(npcPos, pathsData);

        autoWalkWaypoints.current = waypoints;
        currentWaypointIndex.current = 0;
        targetPathPointRef.current = targetClosest.point.clone();
      }
    } else {
      autoWalkWaypoints.current = [];
      currentWaypointIndex.current = 0;
      targetPathPointRef.current = null;
    }
  }, [isAutoWalking, activeNPC, npcDataOnPath, pathsData]);

  useFrame((state, delta) => {
    if (!worldRef.current) return;

    // Interrupt auto-walk if player presses a key
    if (isAutoWalking && (input.forward || input.backward || input.left || input.right)) {
      cancelAutoWalk();
      autoWalkWaypoints.current = [];
      currentWaypointIndex.current = 0;
      targetPathPointRef.current = null;
    }

    const currentQ = worldRef.current.quaternion;

    if (isAutoWalking && autoWalkWaypoints.current.length > 0) {
      const playerPos = new Vector3(0, 1, 0)
        .applyQuaternion(currentQ.clone().invert())
        .normalize()
        .multiplyScalar(WORLD_RADIUS);

      const waypoints = autoWalkWaypoints.current;
      let currentIdx = currentWaypointIndex.current;

      const targetPathPoint = targetPathPointRef.current;
      if (targetPathPoint && distanceOnSphere(playerPos, targetPathPoint) <= AUTO_WALK_STOP_ANGLE) {
        cancelAutoWalk();
        setDialogueOpen(true);
        autoWalkWaypoints.current = [];
        currentWaypointIndex.current = 0;
        targetPathPointRef.current = null;
        return;
      }

      // If we've passed all waypoints, complete the journey
      if (currentIdx >= waypoints.length) {
        cancelAutoWalk();
        setDialogueOpen(true);
        autoWalkWaypoints.current = [];
        currentWaypointIndex.current = 0;
        targetPathPointRef.current = null;
        return;
      }

      const currentWaypoint = waypoints[Math.min(currentIdx, waypoints.length - 1)];
      if (distanceOnSphere(playerPos, currentWaypoint) < WAYPOINT_REACHED_ANGLE && currentIdx < waypoints.length - 1) {
        currentWaypointIndex.current += 1;
        currentIdx = currentWaypointIndex.current;
      }

      const targetWaypoint = waypoints[Math.min(currentIdx, waypoints.length - 1)];
      if (currentIdx >= waypoints.length - 1 && distanceOnSphere(playerPos, targetWaypoint) <= WAYPOINT_REACHED_ANGLE * 1.25) {
        cancelAutoWalk();
        setDialogueOpen(true);
        autoWalkWaypoints.current = [];
        currentWaypointIndex.current = 0;
        targetPathPointRef.current = null;
        return;
      }

      // Calculate target rotation to bring waypoint to top of world
      const topPos = new Vector3(0, 1, 0);
      const targetQ = new Quaternion().setFromUnitVectors(
        targetWaypoint.clone().normalize(),
        topPos
      );

      // Smoothly rotate world to target waypoint with constant angular speed
      const angle = currentQ.angleTo(targetQ);
      if (angle > 0.00001) {
        const t = Math.min(1, (AUTO_WALK_ANGULAR_SPEED * delta) / angle);
        currentQ.slerp(targetQ, t);
      }
    } else if (isAutoWalking && autoWalkWaypoints.current.length === 0) {
      cancelAutoWalk();
      setDialogueOpen(true);
      targetPathPointRef.current = null;
    } else {
      // Manual walking logic with smoothing
      const xAxis = new Vector3(1, 0, 0);
      const zAxis = new Vector3(0, 0, 1);
      const moveQ = new Quaternion();

      if (input.forward) moveQ.multiply(new Quaternion().setFromAxisAngle(xAxis, SPEED));
      if (input.backward) moveQ.multiply(new Quaternion().setFromAxisAngle(xAxis, -SPEED));
      if (input.left) moveQ.multiply(new Quaternion().setFromAxisAngle(zAxis, -SPEED));
      if (input.right) moveQ.multiply(new Quaternion().setFromAxisAngle(zAxis, SPEED));

      if (input.forward || input.backward || input.left || input.right) {
        worldRef.current.quaternion.multiplyQuaternions(moveQ, currentQ);
      }
    }

    // Calculate rotation velocity for physics effects (like hair/clothes swaying)
    const currentQuaternion = worldRef.current.quaternion;
    const deltaQuaternion = new Quaternion().copy(currentQuaternion).multiply(lastQuaternion.current.clone().invert());
    const angle = 2 * Math.acos(Math.max(-1, Math.min(1, deltaQuaternion.w)));
    const axis = new Vector3(deltaQuaternion.x, deltaQuaternion.y, deltaQuaternion.z).normalize();
    const velocityMagnitude = angle / delta;

    rotationVelocity.current = {
      x: axis.x * velocityMagnitude,
      y: axis.y * velocityMagnitude,
      z: axis.z * velocityMagnitude
    };

    if (onRotationVelocityChange) onRotationVelocityChange(rotationVelocity.current);
    lastQuaternion.current.copy(currentQuaternion);
  });

  return (
    <>
      {/* 3D Anime Clouds - Floating outside the rotating world */}
      <AnimeClouds />

      <group ref={worldRef}>
        <mesh receiveShadow castShadow>
          <sphereGeometry args={[WORLD_RADIUS, 64, 64]} />
          <CelShaderMaterial /* props */ />
        </mesh>

        <Trees />
        <Bushes />
        <FallenTrees />
        <DeadTrees />
        <Rocks />
        <Paths />

        {npcDataOnPath.map(npc => (
          <NPC key={npc.id} data={npc} worldRotation={new Vector3()} />
        ))}
      </group>
    </>
  );
};
