import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Preload } from '@react-three/drei';
import { World } from './World/World';
import { Player } from './Player/Player';
import { AnimeSky } from './Sky/AnimeSky';
import { Starfield } from './Environment/Starfield';
import { Planet } from './Environment/Planet';
import { Aurora } from './Environment/Aurora';
import { WORLD_RADIUS, CAMERA_DISTANCE, CAMERA_HEIGHT } from '../../config/world.config';
import { useGameStore } from '../../store/gameStore';
import { Vector3, Quaternion, PerspectiveCamera as ThreePerspectiveCamera } from 'three';

interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

// Custom hook to bridge KeyboardControls and Joystick with our loop
function InputHandler({ setInput }: { setInput: (i: InputState) => void }) {
  const keysRef = useRef<InputState>({
    forward: false,
    backward: false,
    left: false,
    right: false
  });

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      let changed = false;
      const key = e.key;
      const isMovementKey = key === 'w' || key === 'ArrowUp' ||
        key === 's' || key === 'ArrowDown' ||
        key === 'a' || key === 'ArrowLeft' ||
        key === 'd' || key === 'ArrowRight';

      if (isMovementKey) {
        e.preventDefault();
      }

      if ((key === 'w' || key === 'ArrowUp') && !keysRef.current.forward) {
        keysRef.current.forward = true;
        changed = true;
      }
      if ((key === 's' || key === 'ArrowDown') && !keysRef.current.backward) {
        keysRef.current.backward = true;
        changed = true;
      }
      if ((key === 'a' || key === 'ArrowLeft') && !keysRef.current.left) {
        keysRef.current.left = true;
        changed = true;
      }
      if ((key === 'd' || key === 'ArrowRight') && !keysRef.current.right) {
        keysRef.current.right = true;
        changed = true;
      }
      if (changed) setInput({ ...keysRef.current });
    };
    const handleUp = (e: KeyboardEvent) => {
      let changed = false;
      if ((e.key === 'w' || e.key === 'ArrowUp') && keysRef.current.forward) {
        keysRef.current.forward = false;
        changed = true;
      }
      if ((e.key === 's' || e.key === 'ArrowDown') && keysRef.current.backward) {
        keysRef.current.backward = false;
        changed = true;
      }
      if ((e.key === 'a' || e.key === 'ArrowLeft') && keysRef.current.left) {
        keysRef.current.left = false;
        changed = true;
      }
      if ((e.key === 'd' || e.key === 'ArrowRight') && keysRef.current.right) {
        keysRef.current.right = false;
        changed = true;
      }
      if (changed) setInput({ ...keysRef.current });
    };

    // Handle joystick input from mobile
    const handleJoystickInput = (e: CustomEvent<InputState>) => {
      keysRef.current = { ...e.detail };
      setInput({ ...e.detail });
    };

    const handleBlur = () => {
      keysRef.current = {
        forward: false,
        backward: false,
        left: false,
        right: false
      };
      setInput({ ...keysRef.current });
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    window.addEventListener('joystickinput' as any, handleJoystickInput);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('contextmenu', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      window.removeEventListener('joystickinput' as any, handleJoystickInput);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('contextmenu', handleBlur);
    };
  }, [setInput]);
  return null;
}

const CameraRig: React.FC<{
  isAutoWalking: boolean;
  cameraRef: React.RefObject<ThreePerspectiveCamera>;
  isMobile: boolean;
}> = ({ isAutoWalking, cameraRef, isMobile }) => {
  const { camera } = useThree();
  const cameraLookAtRef = useRef(new Vector3(0, WORLD_RADIUS + 0.8, 0));
  const CAMERA_SMOOTHING = 3.5;

  const manualCameraPos = useMemo(
    () => new Vector3(
      0,
      isMobile ? CAMERA_HEIGHT + 0.8 : CAMERA_HEIGHT,
      isMobile ? CAMERA_DISTANCE + 1.5 : CAMERA_DISTANCE
    ),
    [isMobile]
  );

  const autoCameraPos = useMemo(
    () => new Vector3(
      0,
      isMobile ? CAMERA_HEIGHT + 2.5 : CAMERA_HEIGHT + 0.8,
      isMobile ? CAMERA_DISTANCE + 4.0 : CAMERA_DISTANCE + 1.5
    ),
    [isMobile]
  );

  const manualLookAt = useMemo(
    () => new Vector3(0, WORLD_RADIUS + (isMobile ? 1.0 : 0.8), 0),
    [isMobile]
  );

  const autoLookAt = useMemo(
    () => new Vector3(0, WORLD_RADIUS + (isMobile ? 0.0 : 1.2), 0),
    [isMobile]
  );

  useFrame((state, delta) => {
    const cam = cameraRef.current ?? (camera as ThreePerspectiveCamera);
    const targetPos = isAutoWalking ? autoCameraPos : manualCameraPos;
    const targetLookAt = isAutoWalking ? autoLookAt : manualLookAt;
    const t = 1 - Math.exp(-CAMERA_SMOOTHING * delta);

    cam.position.lerp(targetPos, t);
    cameraLookAtRef.current.lerp(targetLookAt, t);
    cam.lookAt(cameraLookAtRef.current);
  });

  return null;
};

export const Experience: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const [input, setInput] = useState({ forward: false, backward: false, left: false, right: false });
  const [rotationVelocity, setRotationVelocity] = useState({ x: 0, y: 0, z: 0 });
  const cameraRef = useRef<ThreePerspectiveCamera>(null);

  // FIX: Extract hook from logical OR expression to ensure consistent execution order
  const isAutoWalking = useGameStore((s) => s.isAutoWalking);
  const isMoving = input.forward || input.backward || input.left || input.right || isAutoWalking;

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ powerPreference: 'high-performance', antialias: true }}
      className="w-full h-full bg-blue-100"
    >
      <InputHandler setInput={setInput} />

      {/* Camera Setup: Fixed angle looking down at player */}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[0, CAMERA_HEIGHT, CAMERA_DISTANCE]}
        fov={isMobile ? 65 : 50}
      />
      <CameraRig
        isAutoWalking={isAutoWalking}
        cameraRef={cameraRef}
        isMobile={isMobile}
      />

      {/* Lighting — Dramatic Fantasy / Astral Sunset (MATCHED AESTHETIC) */}
      {/* Increased ambient brightness and warmth to fix "too dark" shadows */}
      <ambientLight intensity={2.0} color="#d9a6c2" />
      {/* Hemisphere: Sky (Deep Indigo) vs Ground (Rose Gold Reflection) */}
      <hemisphereLight args={['#2e004f', '#ffb380', 1.5]} />

      {/* Main Sun Light - Rose Gold / Peach Tint */}
      <directionalLight
        castShadow
        position={[30, 50, 30]} // Front-right lighting for visibility
        intensity={3.0}
        color="#ffd6ba"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      >
        <orthographicCamera attach="shadow-camera" args={[-50, 50, 50, -50]} />
      </directionalLight>

      {/* Environment */}
      {/* Stars: Increased count, size, and brightness to ensure visibility */}
      <Starfield count={5000} radius={350} size={2.5} color="#ffffff" />

      {/* Planet: Adjusted for composition */}
      <Planet position={[0, 0, -120]} size={15} color="#4b0082" ringColor="#00ffff" />

      {/* Anime Sky Gradient */}
      <AnimeSky
        radius={450}
        sunPosition={new Vector3(0, -5, -120)}
      />

      {/* Aurora Borealis Effect */}
      <Aurora position={[0, 45, -150]} scale={[2.0, 1.5, 1]} />

      {/* Fog - Lighter to match new ambient levels */}
      <fog attach="fog" args={['#6a4c93', 20, 100]} />

      <World input={input} onRotationVelocityChange={setRotationVelocity} isMobile={isMobile} />
      <Player isMoving={isMoving} rotationVelocity={rotationVelocity} />

      <Preload all />
    </Canvas>
  );
};
