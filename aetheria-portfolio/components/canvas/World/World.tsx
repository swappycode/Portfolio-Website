import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Quaternion, Vector3, Euler, MathUtils } from 'three';
import { useGameStore } from '../../../store/gameStore';
import { NPC_CONFIG, WORLD_RADIUS, COLORS, CEL_SHADER_CONFIG } from '../../../config/world.config';
import { NPC } from '../NPC/NPC';
import { Trees } from './Props';
import { CelShaderMaterial } from './CelShaderMaterial';
import * as maath from 'maath';

interface WorldProps {
  input: { forward: boolean; backward: boolean; left: boolean; right: boolean };
  onRotationVelocityChange?: (velocity: { x: number; y: number; z: number }) => void;
}

export const World: React.FC<WorldProps> = ({ input, onRotationVelocityChange }) => {
  const worldRef = useRef<Group>(null);
  
  // Game State
  const { isAutoWalking, activeNPC, cancelAutoWalk, startAutoWalk, setDialogueOpen } = useGameStore();
  
  // Physics Constants
  const SPEED = 0.02; // Reduced walking speed for better control
  const ROTATION_SMOOTHING = 0.1;
  
  // Internal state for rotation logic
  const targetQuaternion = useRef(new Quaternion());
  const autoWalkTarget = useRef<Quaternion | null>(null);
  const lastQuaternion = useRef(new Quaternion());
  const rotationVelocity = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    // Calculate target quaternion for auto-walk whenever activeNPC changes during auto-walk
    if (isAutoWalking && activeNPC) {
        const npc = NPC_CONFIG.find(n => n.id === activeNPC);
        if (npc) {
            // Logic to rotate sphere so NPC is at top (0, R, 0)
            // NPC Original Pos: P_local
            // Desired Pos: (0, R, 0)
            // We need a rotation R such that R * P_local = (0, R, 0)
            
            const npcPos = new Vector3(...npc.position).normalize();
            const topPos = new Vector3(0, 1, 0); // Normalized top
            
            // Create quaternion from unit vectors
            const q = new Quaternion().setFromUnitVectors(npcPos, topPos);
            autoWalkTarget.current = q;
        }
    } else {
        autoWalkTarget.current = null;
    }
  }, [isAutoWalking, activeNPC]);

  useFrame((state, delta) => {
    if (!worldRef.current) return;

    // 1. Handle Input Interrupt
    if (isAutoWalking && (input.forward || input.backward || input.left || input.right)) {
        cancelAutoWalk();
        autoWalkTarget.current = null;
    }

    const currentQ = worldRef.current.quaternion;

    if (isAutoWalking && autoWalkTarget.current) {
        // --- AUTO WALK LOGIC ---
        // Slerp towards target (reduced speed)
        currentQ.slerp(autoWalkTarget.current, 1.5 * delta);
        
        // Check arrival
        if (currentQ.angleTo(autoWalkTarget.current) < 0.01) {
            // Snap to exact
            worldRef.current.quaternion.copy(autoWalkTarget.current);
            
            // Arrival Sequence: Stop walking, Open Dialogue
            cancelAutoWalk();
            setDialogueOpen(true);
            
            autoWalkTarget.current = null;
        }
    } else {
        // --- MANUAL WALK LOGIC ---
        // Basic Logic: 
        // W/S rotates world around X axis.
        // A/D rotates world around Z axis.
        
        // Create small rotation quaternions based on input
        const xAxis = new Vector3(1, 0, 0);
        const zAxis = new Vector3(0, 0, 1);
        
        const moveQ = new Quaternion();
        
        if (input.forward) {
            const q = new Quaternion().setFromAxisAngle(xAxis, SPEED);
            moveQ.multiply(q);
        }
        if (input.backward) {
            const q = new Quaternion().setFromAxisAngle(xAxis, -SPEED);
            moveQ.multiply(q);
        }
        if (input.left) {
             // Rotate around Z axis (or camera-relative axis)
             const q = new Quaternion().setFromAxisAngle(zAxis, -SPEED);
             moveQ.multiply(q);
        }
        if (input.right) {
             const q = new Quaternion().setFromAxisAngle(zAxis, SPEED);
             moveQ.multiply(q);
        }

        // Apply rotation: NewWorldQ = MoveQ * OldWorldQ
        // Order matters for local vs global. 
        // We want to rotate the world "under" the player, which feels like local rotation relative to camera view.
        // Since Camera is fixed looking -Z, Right is +X, Up is +Y.
        
        if (input.forward || input.backward || input.left || input.right) {
            worldRef.current.quaternion.multiplyQuaternions(moveQ, currentQ);
        }
    }

    // Calculate rotation velocity for character facing direction
    const currentQuaternion = worldRef.current.quaternion;
    const deltaQuaternion = new Quaternion().copy(currentQuaternion).multiply(lastQuaternion.current.clone().invert());
    
    // Convert quaternion difference to angular velocity
    const angle = 2 * Math.acos(Math.max(-1, Math.min(1, deltaQuaternion.w)));
    const axis = new Vector3(deltaQuaternion.x, deltaQuaternion.y, deltaQuaternion.z).normalize();
    
    // Calculate velocity components
    const velocityMagnitude = angle / delta;
    const velocity = {
        x: axis.x * velocityMagnitude,
        y: axis.y * velocityMagnitude,
        z: axis.z * velocityMagnitude
    };
    
    // Update rotation velocity
    rotationVelocity.current = velocity;
    
    // Notify parent component of rotation velocity change
    if (onRotationVelocityChange) {
        onRotationVelocityChange(velocity);
    }
    
    // Store current quaternion for next frame
    lastQuaternion.current.copy(currentQuaternion);
  });

  return (
    <group ref={worldRef}>
      {/* The Sphere Ground */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[WORLD_RADIUS, 64, 64]} />
        <CelShaderMaterial
          color={CEL_SHADER_CONFIG.baseColor}
          outlineColor={CEL_SHADER_CONFIG.outlineColor}
          outlineThickness={CEL_SHADER_CONFIG.outlineThickness}
          shadowLevels={CEL_SHADER_CONFIG.shadowLevels}
          rimLighting={CEL_SHADER_CONFIG.rimLighting}
          lightDirection={new Vector3(
            CEL_SHADER_CONFIG.lightDirection.x,
            CEL_SHADER_CONFIG.lightDirection.y,
            CEL_SHADER_CONFIG.lightDirection.z
          )}
        />
      </mesh>
      
      {/* Decorative Props */}
      <Trees />

      {/* NPCs */}
      {NPC_CONFIG.map(npc => (
        <NPC key={npc.id} data={npc} worldRotation={new Vector3()} />
      ))}
      
      {/* Roads / Path decoration (Simple Rings) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[WORLD_RADIUS + 0.01, 0.5, 16, 100]} />
          <meshStandardMaterial color={COLORS.path} transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[WORLD_RADIUS + 0.01, 0.5, 16, 100]} />
          <meshStandardMaterial color={COLORS.path} transparent opacity={0.3} />
      </mesh>

    </group>
  );
};