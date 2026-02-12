import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Preload } from '@react-three/drei';
import { World } from './World/World';
import { Player } from './Player/Player';
import { AnimeSky } from './Sky/AnimeSky';
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
      if ((e.key === 'w' || e.key === 'ArrowUp') && !keysRef.current.forward) {
        keysRef.current.forward = true;
        changed = true;
      }
      if ((e.key === 's' || e.key === 'ArrowDown') && !keysRef.current.backward) {
        keysRef.current.backward = true;
        changed = true;
      }
      if ((e.key === 'a' || e.key === 'ArrowLeft') && !keysRef.current.left) {
        keysRef.current.left = true;
        changed = true;
      }
      if ((e.key === 'd' || e.key === 'ArrowRight') && !keysRef.current.right) {
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

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    window.addEventListener('joystickinput' as any, handleJoystickInput);
    
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      window.removeEventListener('joystickinput' as any, handleJoystickInput);
    };
  }, [setInput]);
  return null;
}

const CameraRig: React.FC<{
  isAutoWalking: boolean;
  cameraRef: React.RefObject<ThreePerspectiveCamera>;
}> = ({ isAutoWalking, cameraRef }) => {
  const { camera } = useThree();
  const cameraLookAtRef = useRef(new Vector3(0, WORLD_RADIUS + 0.8, 0));
  const CAMERA_SMOOTHING = 3.5;

  const manualCameraPos = useMemo(
    () => new Vector3(0, CAMERA_HEIGHT, CAMERA_DISTANCE),
    []
  );
  const autoCameraPos = useMemo(
    () => new Vector3(0, CAMERA_HEIGHT + 0.8, CAMERA_DISTANCE + 1.5),
    []
  );
  const manualLookAt = useMemo(
    () => new Vector3(0, WORLD_RADIUS + 0.8, 0),
    []
  );
  const autoLookAt = useMemo(
    () => new Vector3(0, WORLD_RADIUS + 1.2, 0),
    []
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

export const Experience: React.FC = () => {
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
        fov={50}
      />
      <CameraRig
        isAutoWalking={isAutoWalking}
        cameraRef={cameraRef}
      />

      {/* Lighting — warm anime golden-hour */}
      <ambientLight intensity={1.4} color="#ffeedd" />
      <hemisphereLight args={['#87CEEB', '#b4e88c', 0.5]} />
      <directionalLight
        castShadow
        position={[10, 20, 10]}
        intensity={1.8}
        color="#fff5e6"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      >
        <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
      </directionalLight>

      {/* Anime Sky */}
      <AnimeSky
        radius={150}
        sunPosition={new Vector3(30, 25, -20)}
      />

      {/* Fog for depth — soft blue matching sky horizon */}
      <fog attach="fog" args={['#c8dff5', 8, 30]} />

      <World input={input} onRotationVelocityChange={setRotationVelocity} />
      <Player isMoving={isMoving} rotationVelocity={rotationVelocity} />

      <Preload all />
    </Canvas>
  );
};
