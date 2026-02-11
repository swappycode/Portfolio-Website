import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { Vector3, Group, AnimationMixer, AnimationAction, AnimationClip, Quaternion, Matrix4, LoopOnce, LoopRepeat } from 'three';
import { NPCData } from '../../../types';
import { useGameStore } from '../../../store/gameStore';
import { WORLD_RADIUS } from '../../../config/world.config';

interface NPCProps {
  data: NPCData;
  worldRotation: Vector3;
}

// Animation states for the NPC state machine
type AnimState = 'idle' | 'wave' | 'yes' | string; // string allows 'interrupt_0', 'interrupt_1', etc.

const CROSSFADE_DURATION = 0.4; // seconds for smooth blend

interface InterruptAnimConfig {
  name: string | string[];
  interval?: number;
}

// Component to render GLB model for NPC with animation state machine
const NPCModelGLTF: React.FC<{
  modelPath: string;
  isNearPlayer: boolean;
  interruptAnim?: InterruptAnimConfig;
}> = ({ modelPath, isNearPlayer, interruptAnim }) => {
  const { scene, animations } = useGLTF(modelPath);
  const mixerRef = useRef<AnimationMixer>();
  const actionsRef = useRef<Record<string, AnimationAction>>({});
  const currentStateRef = useRef<string>('idle');
  const wasNearRef = useRef(false);
  const hasPlayedWaveRef = useRef(false);
  const isNearRef = useRef(false);
  const interruptCountRef = useRef(0); // how many interrupt clips we have

  // Find animation clips by name pattern
  const findClip = useCallback((pattern: string): AnimationClip | undefined => {
    if (!animations) return undefined;
    return animations.find(clip => clip.name.toLowerCase().includes(pattern.toLowerCase()));
  }, [animations]);

  // Crossfade from current action to target
  const crossfadeTo = useCallback((targetState: string) => {
    const actions = actionsRef.current;
    const currentState = currentStateRef.current;
    const currentAction = actions[currentState];
    const targetAction = actions[targetState];

    if (!targetAction || currentState === targetState) return;

    console.log(`[NPC Anim] Crossfade: ${currentState} → ${targetState}`);

    // Reset target action
    targetAction.reset();
    targetAction.setEffectiveTimeScale(1);
    targetAction.setEffectiveWeight(1);

    // Determine loop mode
    const isOneShot = targetState === 'wave' || targetState.startsWith('interrupt_');
    const hasInterrupts = interruptCountRef.current > 0;
    const isYesWithInterrupt = targetState === 'yes' && hasInterrupts;

    if (isOneShot || isYesWithInterrupt) {
      targetAction.setLoop(LoopOnce, 1);
      targetAction.clampWhenFinished = true;
    } else {
      targetAction.setLoop(LoopRepeat, Infinity);
    }

    // Crossfade
    if (currentAction) {
      targetAction.play();
      currentAction.crossFadeTo(targetAction, CROSSFADE_DURATION, true);
    } else {
      targetAction.play();
    }

    currentStateRef.current = targetState;
  }, []);

  // Initialize mixer and prepare all animation actions
  useEffect(() => {
    if (!animations || animations.length === 0) return;

    console.log('[NPC Anim] Available animations:', animations.map((a, i) => `${i}: "${a.name}"`));

    const mixer = new AnimationMixer(scene);
    mixerRef.current = mixer;

    // Find all relevant clips
    const idleClip = findClip('idle 02') || findClip('idle') || animations[0];
    const waveClip = findClip('wave');
    const yesClip = findClip('yes');

    // Create actions and store them
    const actions: Record<string, AnimationAction> = {};

    if (idleClip) {
      actions.idle = mixer.clipAction(idleClip);
      actions.idle.setLoop(LoopRepeat, Infinity);
      console.log('[NPC Anim] Idle clip:', idleClip.name);
    }

    if (waveClip) {
      actions.wave = mixer.clipAction(waveClip);
      actions.wave.setLoop(LoopOnce, 1);
      actions.wave.clampWhenFinished = true;
      console.log('[NPC Anim] Wave clip:', waveClip.name);
    }

    if (yesClip) {
      actions.yes = mixer.clipAction(yesClip);
      actions.yes.setLoop(LoopRepeat, Infinity);
      console.log('[NPC Anim] Yes clip:', yesClip.name);
    }

    // Handle interrupt animations (single or sequence)
    let numInterrupts = 0;
    if (interruptAnim) {
      const names = Array.isArray(interruptAnim.name) ? interruptAnim.name : [interruptAnim.name];
      names.forEach((name, i) => {
        const clip = findClip(name);
        if (clip) {
          const key = `interrupt_${i}`;
          actions[key] = mixer.clipAction(clip);
          actions[key].setLoop(LoopOnce, 1);
          actions[key].clampWhenFinished = true;
          console.log(`[NPC Anim] Interrupt[${i}] clip:`, clip.name);
          numInterrupts++;
        }
      });
    }
    interruptCountRef.current = numInterrupts;

    actionsRef.current = actions;

    // Start with idle
    if (actions.idle) {
      actions.idle.play();
      currentStateRef.current = 'idle';
    }

    // Listen for when animations finish
    const onFinished = (e: any) => {
      const current = currentStateRef.current;

      // Wave finished → go to yes
      if (actions.wave && e.action === actions.wave) {
        console.log('[NPC Anim] Wave finished → Yes');
        crossfadeTo('yes');
        return;
      }

      // Yes finished (only fires when LoopOnce) → start interrupt sequence
      if (actions.yes && e.action === actions.yes && numInterrupts > 0 && isNearRef.current) {
        console.log('[NPC Anim] Yes finished → Interrupt sequence');
        crossfadeTo('interrupt_0');
        return;
      }

      // Interrupt step finished → go to next step or back to yes
      if (current.startsWith('interrupt_')) {
        const idx = parseInt(current.split('_')[1]);
        const nextIdx = idx + 1;
        if (nextIdx < numInterrupts && actions[`interrupt_${nextIdx}`]) {
          console.log(`[NPC Anim] Interrupt[${idx}] finished → Interrupt[${nextIdx}]`);
          crossfadeTo(`interrupt_${nextIdx}`);
        } else {
          console.log(`[NPC Anim] Interrupt sequence done → Yes`);
          crossfadeTo('yes');
        }
      }
    };

    mixer.addEventListener('finished', onFinished);

    return () => {
      mixer.stopAllAction();
      mixer.removeEventListener('finished', onFinished);
      mixerRef.current = undefined;
    };
  }, [animations, scene, modelPath, findClip, crossfadeTo, interruptAnim]);

  // React to proximity changes
  useEffect(() => {
    const justArrived = isNearPlayer && !wasNearRef.current;
    const justLeft = !isNearPlayer && wasNearRef.current;
    isNearRef.current = isNearPlayer;

    if (justArrived) {
      console.log('[NPC Anim] Player arrived! Starting wave → yes sequence');
      hasPlayedWaveRef.current = false;

      if (actionsRef.current.wave) {
        crossfadeTo('wave');
      } else if (actionsRef.current.yes) {
        crossfadeTo('yes');
      }
    }

    if (justLeft) {
      console.log('[NPC Anim] Player left! Returning to idle');
      hasPlayedWaveRef.current = false;
      crossfadeTo('idle');
    }

    wasNearRef.current = isNearPlayer;
  }, [isNearPlayer, crossfadeTo]);

  // Update animation mixer each frame
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return <primitive object={scene} scale={0.3} position={[0, 0, 0]} rotation={[0, Math.PI, 0]} />;
};

// Default NPC geometry (capsule body + sphere head)
const NPCDefaultGeometry: React.FC<{ color: string }> = ({ color }) => (
  <>
    {/* Visual Body */}
    <mesh position={[0, 0.75, 0]} castShadow>
      <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>

    {/* Head */}
    <mesh position={[0, 1.4, 0]} castShadow>
      <sphereGeometry args={[0.25]} />
      <meshStandardMaterial color="#ffdecb" />
    </mesh>
  </>
);

export const NPC: React.FC<NPCProps> = ({ data }) => {
  const groupRef = useRef<Group>(null);
  const modelGroupRef = useRef<Group>(null);
  const [isNearPlayer, setIsNearPlayer] = useState(false);
  const { activeNPC, setActiveNPC, setDialogueOpen, isAutoWalking } = useGameStore();

  // Constants
  const INTERACTION_DIST = 4;
  const EXIT_DIST = 5;

  useFrame((state) => {
    if (!groupRef.current) return;

    // Get World Position of NPC
    const worldPos = new Vector3();
    groupRef.current.getWorldPosition(worldPos);

    // Player is fixed at roughly (0, WORLD_RADIUS, 0)
    const playerPos = new Vector3(0, WORLD_RADIUS, 0);

    const dist = worldPos.distanceTo(playerPos);

    // Make the NPC model always face the player
    if (modelGroupRef.current) {
      const dirToPlayer = playerPos.clone().sub(worldPos).normalize();
      const npcUp = worldPos.clone().normalize();
      const tangentDir = dirToPlayer.clone().sub(npcUp.clone().multiplyScalar(dirToPlayer.dot(npcUp))).normalize().negate();

      if (tangentDir.length() > 0.01) {
        const right = new Vector3().crossVectors(npcUp, tangentDir).normalize();
        const correctedForward = new Vector3().crossVectors(right, npcUp).normalize();

        const lookMatrix = new Matrix4().makeBasis(right, npcUp, correctedForward);
        const targetQuat = new Quaternion().setFromRotationMatrix(lookMatrix);

        const parentWorldQuat = new Quaternion();
        groupRef.current.getWorldQuaternion(parentWorldQuat);
        const localQuat = parentWorldQuat.clone().invert().multiply(targetQuat);

        modelGroupRef.current.quaternion.slerp(localQuat, 0.05);
      }
    }

    // Update proximity state for animation triggers
    if (dist < INTERACTION_DIST) {
      setIsNearPlayer(true);
    } else if (dist > EXIT_DIST) {
      setIsNearPlayer(false);
    }

    // Logic: If close and not auto-walking, trigger dialogue
    if (!isAutoWalking) {
      if (dist < INTERACTION_DIST) {
        if (activeNPC !== data.id) {
          console.log('NPC interaction triggered:', data.id, 'Distance:', dist);
          setActiveNPC(data.id);
          setDialogueOpen(true);
        }
      } else if (dist > EXIT_DIST) {
        if (activeNPC === data.id) {
          console.log('NPC interaction ended:', data.id, 'Distance:', dist);
          setActiveNPC(null);
          setDialogueOpen(false);
        }
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={data.position as any}
    >
      {/* Inner group that rotates to face the player */}
      <group ref={modelGroupRef}>
        {/* Render either GLB model or default geometry */}
        {data.modelPath ? (
          <React.Suspense fallback={<NPCDefaultGeometry color={data.color} />}>
            <NPCModelGLTF modelPath={data.modelPath} isNearPlayer={isNearPlayer} interruptAnim={data.interruptAnim} />
          </React.Suspense>
        ) : (
          <NPCDefaultGeometry color={data.color} />
        )}

        {/* Role Text Floating */}
        <Html position={[0, 1.3, 0]} center distanceFactor={8}>
          <div className="bg-white/80 px-1.5 py-0.5 rounded shadow-sm font-bold text-gray-800 whitespace-nowrap backdrop-blur-sm" style={{ opacity: 0.9, fontSize: '8px' }}>
            {data.role}
          </div>
        </Html>
      </group>
    </group>
  );
};
