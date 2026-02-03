import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import { Vector3, Group, Mesh } from 'three';
import { NPCData, NPCRole } from '../../../types';
import { useGameStore } from '../../../store/gameStore';
import { WORLD_RADIUS } from '../../../config/world.config';

interface NPCProps {
  data: NPCData;
  worldRotation: Vector3; // Reference to world rotation to calculate distance
}

export const NPC: React.FC<NPCProps> = ({ data }) => {
  const groupRef = useRef<Group>(null);
  const { activeNPC, setActiveNPC, setDialogueOpen, isAutoWalking } = useGameStore();
  const [hovered, setHovered] = useState(false);

  // Constants
  const INTERACTION_DIST = 4; // Distance to trigger
  const EXIT_DIST = 5;
  
  useFrame((state) => {
    if (!groupRef.current) return;

    // Get World Position of NPC
    const worldPos = new Vector3();
    groupRef.current.getWorldPosition(worldPos);

    // Player is fixed at roughly (0, WORLD_RADIUS, 0)
    // Actually, player feet are at (0, WORLD_RADIUS, 0).
    const playerPos = new Vector3(0, WORLD_RADIUS, 0);
    
    const dist = worldPos.distanceTo(playerPos);

    // Logic: If close and not auto-walking, trigger
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
    
    // Simple idle animation (reduced speed)
    groupRef.current.rotation.y += 0.005;
  });

  return (
    <group 
      ref={groupRef} 
      position={data.position as any} 
    >
      {/* Correct orientation: Up is away from center. 
          lookAt(0,0,0) makes Z axis point to center. 
          We need to rotate it so Y points away.
      */}
      <group rotation={[Math.PI / 2, 0, 0]}> 
        {/* Visual Body */}
        <mesh position={[0, 0.75, 0]} castShadow>
          <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
          <meshStandardMaterial color={data.color} />
        </mesh>
        
        {/* Head */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <sphereGeometry args={[0.25]} />
          <meshStandardMaterial color="#ffdecb" />
        </mesh>

        {/* Role Text Floating */}
        <Html position={[0, 2.2, 0]} center distanceFactor={12}>
          <div className="bg-white/80 px-2 py-1 rounded-md shadow-sm text-xs font-bold text-gray-800 whitespace-nowrap backdrop-blur-sm transform transition-transform" style={{ opacity: 0.9 }}>
             {data.role}
          </div>
        </Html>
      </group>
    </group>
  );
};
