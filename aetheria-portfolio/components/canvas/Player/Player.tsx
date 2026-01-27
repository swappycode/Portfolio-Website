import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, AnimationMixer } from 'three';
import { WORLD_RADIUS, COLORS } from '../../../config/world.config';
import { ErrorBoundary } from '../../utils/ErrorBoundary';

interface PlayerProps {
  isMoving: boolean;
  rotationVelocity?: { x: number; y: number; z: number };
}

const PlayerModelGLTF = ({ isMoving }: { isMoving: boolean }) => {
  const { scene, animations } = useGLTF('/models/character.glb');
  const mixerRef = useRef<AnimationMixer>();
  const [idleAction, setIdleAction] = useState<any>();
  const [walkAction, setWalkAction] = useState<any>();

  // Initialize animation mixer and actions
  useEffect(() => {
    if (animations && animations.length > 0) {
      try {
        mixerRef.current = new AnimationMixer(scene);
        
        // Find the idle and walk animations
        const idleClip = animations.find(clip => clip.name.toLowerCase().includes('idle'));
        const walkClip = animations.find(clip => clip.name.toLowerCase().includes('walk'));
        
        if (idleClip) {
          const action = mixerRef.current.clipAction(idleClip);
          action.play();
          setIdleAction(action);
        }
        
        if (walkClip) {
          const action = mixerRef.current.clipAction(walkClip);
          setWalkAction(action);
        }
      } catch (error) {
        console.warn('Failed to initialize animations:', error);
      }
    }

    // Cleanup function
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = undefined;
      }
    };
  }, [animations, scene]);

  // Track current animation state and transition progress
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'walk' | null>(null);
  const [targetAnimation, setTargetAnimation] = useState<'idle' | 'walk' | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize animations on mount
  useEffect(() => {
    if (idleAction && walkAction) {
      // Set initial state to idle
      setCurrentAnimation('idle');
      setTargetAnimation('idle');
      setTransitionProgress(0);
      setIsInitialized(true);

      // Set initial weights
      idleAction.setEffectiveWeight(1.0);
      walkAction.setEffectiveWeight(0.0);
      idleAction.enabled = true;
      walkAction.enabled = true;
    }
  }, [idleAction, walkAction]);

  // Update animations based on movement state
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Determine target animation
    const newTargetAnimation = isMoving ? 'walk' : 'idle';
    
    // Initialize animations if needed
    if (idleAction && walkAction && isInitialized) {
      if (!idleAction.isRunning()) idleAction.play();
      if (!walkAction.isRunning()) walkAction.play();
      
      idleAction.enabled = true;
      walkAction.enabled = true;
    }

    // Check if we need to start a new transition
    if (newTargetAnimation !== targetAnimation && isInitialized) {
      setTargetAnimation(newTargetAnimation);
      setTransitionProgress(0);
      setCurrentAnimation(currentAnimation || newTargetAnimation);
    }

    // Smooth blending between animations
    if (targetAnimation && currentAnimation && targetAnimation !== currentAnimation && isInitialized) {
      // Faster transition speed for smoother experience
      const transitionSpeed = delta * 4.0; // Increased from 2.5 to 4.0 for faster transitions
      setTransitionProgress(Math.min(transitionProgress + transitionSpeed, 1));

      if (currentAnimation === 'idle') {
        // Transitioning from idle to walk
        idleAction.setEffectiveWeight(Math.max(1 - transitionProgress, 0));
        walkAction.setEffectiveWeight(Math.min(transitionProgress, 1));

        if (transitionProgress >= 1) {
          setCurrentAnimation('walk');
          setTransitionProgress(0);
        }
      } else {
        // Transitioning from walk to idle
        walkAction.setEffectiveWeight(Math.max(1 - transitionProgress, 0));
        idleAction.setEffectiveWeight(Math.min(transitionProgress, 1));

        if (transitionProgress >= 1) {
          setCurrentAnimation('idle');
          setTransitionProgress(0);
        }
      }
    } else if (targetAnimation && !currentAnimation && isInitialized) {
      // Initial state - set the target animation
      setCurrentAnimation(targetAnimation);
      if (targetAnimation === 'walk') {
        walkAction.setEffectiveWeight(1.0);
        idleAction.setEffectiveWeight(0.0);
      } else {
        idleAction.setEffectiveWeight(1.0);
        walkAction.setEffectiveWeight(0.0);
      }
    }
  });

  // Rotate 180 if model faces wrong way, or adjust scale
  return <primitive object={scene} scale={0.5} position={[0, 0, 0]} rotation={[0, Math.PI, 0]} />;
}

const PlayerPlaceholder = () => (
  <group>
    {/* Body */}
    <mesh position={[0, 0.75, 0]} castShadow>
      <boxGeometry args={[0.5, 0.8, 0.3]} />
      <meshStandardMaterial color={COLORS.player} />
    </mesh>
    
    {/* Head */}
    <mesh position={[0, 1.4, 0]} castShadow>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial color="#f0d0b0" />
    </mesh>
    
    {/* Backpack / Detail */}
    <mesh position={[0, 1.0, 0.25]} castShadow>
      <boxGeometry args={[0.4, 0.5, 0.2]} />
      <meshStandardMaterial color="#555" />
    </mesh>
  </group>
);

export const Player: React.FC<PlayerProps> = ({ isMoving, rotationVelocity = { x: 0, y: 0, z: 0 } }) => {
  const groupRef = useRef<Group>(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [targetRotation, setTargetRotation] = useState(0);
  const rotationSpeed = 5.0; // Adjust this value for faster/slower rotation

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Keep character static at top of sphere (no bobbing)
    groupRef.current.position.set(0, WORLD_RADIUS, 0);
    
    // Remove all tilting animations - character should be static
    groupRef.current.rotation.set(0, 0, 0);
    
    // Smooth rotation to face the direction of movement
    if (isMoving && (rotationVelocity.x !== 0 || rotationVelocity.y !== 0 || rotationVelocity.z !== 0)) {
      // Calculate the direction the world is rotating
      // Since the world rotates under the character, we need to rotate the character in the opposite direction
      const rotationSpeedMagnitude = Math.sqrt(rotationVelocity.x**2 + rotationVelocity.y**2 + rotationVelocity.z**2);
      
      if (rotationSpeedMagnitude > 0.001) { // Only rotate if there's significant movement
        // Calculate the rotation angle based on the world's rotation
        // The character should face the direction opposite to the world's rotation
        const newTargetRotation = -Math.atan2(rotationVelocity.z, rotationVelocity.x);
        
        // Update target rotation if it has changed
        if (Math.abs(newTargetRotation - targetRotation) > 0.01) {
          setTargetRotation(newTargetRotation);
        }
        
        // Smoothly interpolate current rotation towards target rotation
        const rotationDiff = targetRotation - currentRotation;
        
        // Handle angle wrapping (ensure shortest path)
        const normalizedDiff = ((rotationDiff + Math.PI) % (2 * Math.PI)) - Math.PI;
        
        // Apply smooth rotation interpolation
        const rotationStep = normalizedDiff * Math.min(delta * rotationSpeed, 1);
        const newCurrentRotation = currentRotation + rotationStep;
        
        setCurrentRotation(newCurrentRotation);
        
        // Apply the smooth rotation to the character group
        groupRef.current.rotation.y = newCurrentRotation;
      }
    } else {
      // When not moving, gradually return to default rotation (optional)
      // You can remove this section if you want the character to stay facing the last direction
      const rotationDiff = 0 - currentRotation;
      const normalizedDiff = ((rotationDiff + Math.PI) % (2 * Math.PI)) - Math.PI;
      const rotationStep = normalizedDiff * Math.min(delta * rotationSpeed * 0.5, 1);
      const newCurrentRotation = currentRotation + rotationStep;
      
      setCurrentRotation(newCurrentRotation);
      groupRef.current.rotation.y = newCurrentRotation;
    }
  });

  return (
    <group ref={groupRef}>
      <ErrorBoundary fallback={<PlayerPlaceholder />}>
        <React.Suspense fallback={<PlayerPlaceholder />}>
           <PlayerModelGLTF isMoving={isMoving} />
        </React.Suspense>
      </ErrorBoundary>

      {/* Shadow Blob (Always render shadow manually for grounding) */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color="#000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};
