import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, KeyboardControls } from '@react-three/drei';
import { World } from './World/World';
import { Player } from './Player/Player';
import { AnimeSky } from './Sky/AnimeSky';
import { WORLD_RADIUS, CAMERA_DISTANCE, CAMERA_HEIGHT, COLORS } from '../../config/world.config';
import { useGameStore } from '../../store/gameStore';
import { Vector3 } from 'three';

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
            setInput({...keys});
        };
        const handleUp = (e: KeyboardEvent) => {
            if (e.key === 'w' || e.key === 'ArrowUp') keys.forward = false;
            if (e.key === 's' || e.key === 'ArrowDown') keys.backward = false;
            if (e.key === 'a' || e.key === 'ArrowLeft') keys.left = false;
            if (e.key === 'd' || e.key === 'ArrowRight') keys.right = false;
            setInput({...keys});
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

export const Experience: React.FC = () => {
  const [input, setInput] = useState({ forward: false, backward: false, left: false, right: false });
  const [rotationVelocity, setRotationVelocity] = useState({ x: 0, y: 0, z: 0 });
  
  // FIX: Extract hook from logical OR expression to ensure consistent execution order
  const isAutoWalking = useGameStore((s) => s.isAutoWalking);
  const isMoving = input.forward || input.backward || input.left || input.right || isAutoWalking;

  return (
    <Canvas shadows className="w-full h-full bg-blue-100">
        <InputHandler setInput={setInput} />
        
        {/* Camera Setup: Fixed angle looking down at player */}
        <PerspectiveCamera 
            makeDefault 
            position={[0, CAMERA_HEIGHT, CAMERA_DISTANCE]} 
            fov={50} 
            onUpdate={c => c.lookAt(0, WORLD_RADIUS + 0.8, 0)} // Look at character's chest level for smaller character
        />

        {/* Lighting */}
        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight 
            castShadow 
            position={[10, 20, 10]} 
            intensity={1.5} 
            shadow-mapSize={[2048, 2048]} 
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

    </Canvas>
  );
};
