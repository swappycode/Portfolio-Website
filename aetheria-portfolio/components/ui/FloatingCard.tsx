import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import { Vector3, Quaternion, Euler } from 'three';
import { useGameStore } from '../../store/gameStore';
import { NPC_CONFIG } from '../../config/world.config';
import { NPCRole, ProjectItem } from '../../types';
import { ApiService } from '../../services/api';

interface FloatingCardProps {
  cameraPosition: Vector3;
  cameraRotation: Euler;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({ cameraPosition, cameraRotation }) => {
  const { activeNPC, dialogueOpen, projectCategory, setProjectCategory } = useGameStore();
  const groupRef = useRef<THREE.Group>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState(0);

  const CARD_SIZE = { w: 2.5, h: 1.8, d: 0.2 };
  const BORDER_SIZE = { w: 2.6, h: 1.9, d: 0.1 };
  const PANEL_PX_PER_UNIT = 120;
  const PANEL_SIZE_PX = {
    w: CARD_SIZE.w * PANEL_PX_PER_UNIT,
    h: CARD_SIZE.h * PANEL_PX_PER_UNIT
  };
  const PANEL_DISTANCE_FACTOR = 400 / PANEL_PX_PER_UNIT;

  const npc = NPC_CONFIG.find(n => n.id === activeNPC);

  // Calculate screen-side position relative to camera
  const cardPosition = useMemo(() => {
    if (!dialogueOpen || !npc) return new Vector3(0, 0, 0);

    // Position card to the upper-right of the player to avoid blocking the character
    // Larger x/z values push it to the side and a bit farther from the camera
    const offset = new Vector3(2.4, 1.2, -6); // x: right, y: up, z: back
    
    // Apply camera rotation to maintain screen-relative position
    const rotation = new Quaternion();
    rotation.setFromEuler(cameraRotation);
    offset.applyQuaternion(rotation);
    
    return cameraPosition.clone().add(offset);
  }, [dialogueOpen, npc, cameraPosition, cameraRotation]);

  // Fetch projects when NPC changes
  useEffect(() => {
    if (activeNPC && npc?.role === NPCRole.PROJECTS && dialogueOpen) {
      setLoading(true);
      ApiService.getProjects(projectCategory)
        .then(setProjects)
        .finally(() => setLoading(false));
    }
  }, [activeNPC, projectCategory, dialogueOpen, npc?.role]);

  // Handle visibility state changes
  useEffect(() => {
    console.log('FloatingCard state change:', { dialogueOpen, npcId: npc?.id, isVisible });
    if (dialogueOpen && npc) {
      setIsVisible(true);
      // Animate scale from 0 to 1
      setScale(0);
      const timer = setTimeout(() => setScale(1), 50);
      return () => clearTimeout(timer);
    } else {
      // Animate scale from 1 to 0
      setScale(0);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [dialogueOpen, npc]);

  // Handle ESC key to close dialogue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dialogueOpen) {
        useGameStore.getState().setDialogueOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogueOpen]);

  // Animation logic
  useFrame((state, delta) => {
    if (!groupRef.current || !npc) return;

    const targetPosition = cardPosition;
    const currentPosition = groupRef.current.position;
    
    // Smooth interpolation for position
    currentPosition.lerp(targetPosition, 5 * delta);
    
    // Always face the camera (billboard effect)
    groupRef.current.lookAt(cameraPosition);
    
    // Apply scale animation (only if dialogue is open, otherwise show at full scale for testing)
    if (dialogueOpen) {
      groupRef.current.scale.setScalar(scale);
    } else {
      // For testing, show at full scale when not in dialogue
      groupRef.current.scale.setScalar(1);
    }
    
    // Debug: Log card position and scale
    if (Math.random() < 0.1) {
      console.log('Card position:', groupRef.current.position.toArray(), 'Scale:', groupRef.current.scale.x);
    }
    
    // Slight rotation to make it more dynamic
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
  });

  // Temporary test: force visibility for debugging
  // if (!isVisible || !npc) return null;
  
  // For now, let's always render if there's an NPC to test positioning
  if (!npc) return null;

  return (
    <group ref={groupRef}>
      {/* Main Card Body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[CARD_SIZE.w, CARD_SIZE.h, CARD_SIZE.d]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.95}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Card Border Glow */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[BORDER_SIZE.w, BORDER_SIZE.h, BORDER_SIZE.d]} />
        <meshBasicMaterial 
          color={npc.color} 
          transparent 
          opacity={0.3}
          side={2} // DoubleSide
        />
      </mesh>

      {/* Content via HTML overlay - attached to the 3D card */}
      <Html position={[0, 0, 0.2]} center transform distanceFactor={PANEL_DISTANCE_FACTOR}>
        <div 
          className="bg-gradient-to-br from-white/95 to-gray-50/90 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 flex flex-col"
          style={{ 
            width: `${PANEL_SIZE_PX.w}px`,
            height: `${PANEL_SIZE_PX.h}px`,
            opacity: dialogueOpen ? Math.min(scale * 1.2, 1) : 1 
          }}
        >
          
          {/* Header */}
          <div className="flex justify-between items-start p-4 bg-gradient-to-r from-gray-50 to-transparent border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                style={{ backgroundColor: npc.color }}
              >
                {npc.name[0]}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{npc.name}</h2>
                <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase">{npc.role.replace('_', ' ')}</p>
              </div>
            </div>
            <button 
              onClick={() => useGameStore.getState().setDialogueOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Default Content */}
            {npc.role !== NPCRole.PROJECTS && (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">{npc.dialogue.intro}</p>
                {npc.dialogue.details && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-600">
                    {npc.dialogue.details}
                  </div>
                )}
              </div>
            )}

            {/* Projects Specific Logic */}
            {npc.role === NPCRole.PROJECTS && (
              <div className="space-y-3">
                <div className="flex gap-3 border-b border-gray-200 pb-2">
                  <button 
                    onClick={() => setProjectCategory('GAME_DEV')}
                    className={`px-3 py-1 text-xs font-bold transition-colors rounded ${projectCategory === 'GAME_DEV' ? 'text-indigo-600 bg-indigo-50 border border-indigo-200' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Game Dev
                  </button>
                  <button 
                    onClick={() => setProjectCategory('SDE')}
                    className={`px-3 py-1 text-xs font-bold transition-colors rounded ${projectCategory === 'SDE' ? 'text-indigo-600 bg-indigo-50 border border-indigo-200' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Software Eng
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projects.map(project => (
                      <div key={project.id} className="bg-white hover:bg-indigo-50 p-2 rounded border border-gray-100 transition-colors cursor-pointer group">
                        <h3 className="font-medium text-gray-800 text-sm group-hover:text-indigo-700">{project.title}</h3>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.tags.map(tag => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded border border-gray-200">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Hint */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">Press <span className="font-mono bg-gray-200 px-1 rounded text-xs">ESC</span> or walk away to close</p>
          </div>
        </div>
      </Html>

      {/* Floating particles effect */}
      <group position={[0, 2, 0.3]}>
        <mesh>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color={npc.color} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Subtle floating animation */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, Math.sin(Date.now() * 0.002) * 0.1, 0]}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      </group>
    </group>
  );
};
