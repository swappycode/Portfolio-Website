import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, KeyboardControls, Preload } from '@react-three/drei';
import { World } from './World/World';
import { Player } from './Player/Player';
import { AnimeSky } from './Sky/AnimeSky';
import { FloatingCard } from '../ui/FloatingCard';
import { WORLD_RADIUS, CAMERA_DISTANCE, CAMERA_HEIGHT, COLORS } from '../../config/world.config';
import { useGameStore } from '../../store/gameStore';
import { Vector3, Euler, PerspectiveCamera as ThreePerspectiveCamera } from 'three';

// Custom hook to bridge KeyboardControls with our loop
function InputHandler({ setInput }: { setInput: (i: any) => void }) {
  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'ArrowUp') keys.forward = true;
      if (e.key === 's' || e.key === 'ArrowDown') keys.backward = true;
      if (e.key === 'a' || e.key === 'ArrowLeft') keys.left = true;
      if (e.key === 'd' || e.key === 'ArrowRight') keys.right = true;
      setInput({ ...keys });
    };
    const handleUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'ArrowUp') keys.forward = false;
      if (e.key === 's' || e.key === 'ArrowDown') keys.backward = false;
      if (e.key === 'a' || e.key === 'ArrowLeft') keys.left = false;
      if (e.key === 'd' || e.key === 'ArrowRight') keys.right = false;
      setInput({ ...keys });
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    }
  }, []);
  return null;
}

const CameraRig: React.FC<{
  isAutoWalking: boolean;
  cameraRef: React.RefObject<ThreePerspectiveCamera>;
  onCameraUpdate: (position: Vector3, rotation: Euler) => void;
}> = ({ isAutoWalking, cameraRef, onCameraUpdate }) => {
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

    onCameraUpdate(cam.position.clone(), cam.rotation.clone());
  });

  return null;
};

export const Experience: React.FC = () => {
  const [input, setInput] = useState({ forward: false, backward: false, left: false, right: false });
  const [rotationVelocity, setRotationVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [cameraPosition, setCameraPosition] = useState(new Vector3());
  const [cameraRotation, setCameraRotation] = useState(new Euler());
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
        onCameraUpdate={(pos, rot) => {
          setCameraPosition(pos);
          setCameraRotation(rot);
        }}
      />

      {/* Lighting */}
      <ambientLight intensity={2} color="#ffffff" />
      <directionalLight
        castShadow
        position={[10, 20, 10]}
        intensity={1.5}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      >
        <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
      </directionalLight>






      {/* Anime Sky Shader - Beautiful Dawn Theme */}
      <AnimeSky
        radius={150}            // Smaller radius for better color visibility
        sunPosition={new Vector3(20, 30, -30)}  // Higher sun position for dawn
        colorTop="#fff5ec"      // Light blue (top)
        colorMiddle="#2ab0ee"   // Medium purple (middle)
        colorBottom="#fcf800"   // Pink (bottom)
        sunColor="#f700ff"      // Golden yellow sun
        intensity={1.0}
      />

      {/* Fog for depth */}
      <fog attach="fog" args={[COLORS.sky, 5, 25]} /> {/* Adjusted fog for closer view */}

      <World input={input} onRotationVelocityChange={setRotationVelocity} />
      <Player isMoving={isMoving} rotationVelocity={rotationVelocity} />

      {/* Floating Card System */}
      <FloatingCard cameraPosition={cameraPosition} cameraRotation={cameraRotation} />

      <Preload all />
    </Canvas>
  );
};
