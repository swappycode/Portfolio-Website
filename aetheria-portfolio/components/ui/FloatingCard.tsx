import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import { Vector3, Quaternion, Euler } from 'three';
import { useGameStore } from '../../store/gameStore';
import { NPC_CONFIG } from '../../config/world.config';
import { NPCRole, ProjectItem, BackendApiResponse, GitHubProject, ItchGame } from '../../types';
import { ApiService } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Get API base URL for direct fetch calls
const getApiBaseUrl = () => {
  // Fallback: Check if we're in development mode using hostname
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  
  // In production, use empty string for same-origin
  return '';
};

const API_BASE_URL = getApiBaseUrl();

interface FloatingCardProps {
  cameraPosition: Vector3;
  cameraRotation: Euler;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({ cameraPosition, cameraRotation }) => {
  const { activeNPC, dialogueOpen, projectCategory, setProjectCategory } = useGameStore();
  const rightGroupRef = useRef<THREE.Group>(null);
  const leftGroupRef = useRef<THREE.Group>(null);
  const readmeGroupRef = useRef<THREE.Group>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState(0);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [detailsProject, setDetailsProject] = useState<ProjectItem | null>(null);
  const [detailsScale, setDetailsScale] = useState(0);
  const [readmeProject, setReadmeProject] = useState<ProjectItem | null>(null);
  const [readmeScale, setReadmeScale] = useState(0);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [isFetchingReadme, setIsFetchingReadme] = useState(false);
  const [gameDetail, setGameDetail] = useState<ProjectItem & { readme?: string } | null>(null);

  const CARD_SIZE = { w: 2.5, h: 1.8, d: 0.2 };
  const BORDER_SIZE = { w: 2.6, h: 1.9, d: 0.1 };
  const PANEL_PX_PER_UNIT = 120;
  const PANEL_SIZE_PX = {
    w: CARD_SIZE.w * PANEL_PX_PER_UNIT,
    h: CARD_SIZE.h * PANEL_PX_PER_UNIT
  };
  const PANEL_DISTANCE_FACTOR = 400 / PANEL_PX_PER_UNIT;
  // Ensure UI cards render on top of world geometry (trees/props) to avoid occlusion.
  const UI_RENDER_ORDER = 10_000;
  const HTML_Z_INDEX_RANGE: [number, number] = [10_000, 0];

  const npc = NPC_CONFIG.find(n => n.id === activeNPC);

  // Calculate screen-side position relative to camera
  const rightCardPosition = useMemo(() => {
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

  const leftCardPosition = useMemo(() => {
    if (!dialogueOpen || !npc) return new Vector3(0, 0, 0);
    if (npc.role !== NPCRole.PROJECTS || !detailsProject) return new Vector3(0, 0, 0);

    // Mirror the right panel to the left side when showing details
    const offset = new Vector3(-2.4, 1.2, -6);
    const rotation = new Quaternion();
    rotation.setFromEuler(cameraRotation);
    offset.applyQuaternion(rotation);

    return cameraPosition.clone().add(offset);
  }, [dialogueOpen, npc, detailsProject, cameraPosition, cameraRotation]);

  // Calculate middle position for README panel
  const readmeCardPosition = useMemo(() => {
    if (!dialogueOpen || !npc) return new Vector3(0, 0, 0);
    if (npc.role !== NPCRole.PROJECTS || !readmeProject) return new Vector3(0, 0, 0);

    // Position README panel in the middle of the screen
    const offset = new Vector3(0, 1.5, -5);
    const rotation = new Quaternion();
    rotation.setFromEuler(cameraRotation);
    offset.applyQuaternion(rotation);

    return cameraPosition.clone().add(offset);
  }, [dialogueOpen, npc, readmeProject, cameraPosition, cameraRotation]);

  // Fetch projects when NPC changes
  useEffect(() => {
    if (activeNPC && npc?.role === NPCRole.PROJECTS && dialogueOpen) {
      setLoading(true);
      ApiService.getProjects(projectCategory)
        .then(setProjects)
        .finally(() => setLoading(false));
    }
  }, [activeNPC, projectCategory, dialogueOpen, npc?.role]);

  // Reset details panel when context changes
  useEffect(() => {
    setSelectedProject(null);
    setDetailsProject(null);
    setDetailsScale(0);
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

  const openProjectDetails = (project: ProjectItem) => {
    setSelectedProject(project);
    setDetailsProject(project);
    setDetailsScale(0);
    setTimeout(() => setDetailsScale(1), 50);
  };

  const closeProjectDetails = () => {
    setSelectedProject(null);
    setDetailsScale(0);
    setTimeout(() => setDetailsProject(null), 250);
  };

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
    if (!npc) return;

    if (rightGroupRef.current) {
      const targetPosition = rightCardPosition;
      const currentPosition = rightGroupRef.current.position;

      // Smooth interpolation for position
      currentPosition.lerp(targetPosition, 5 * delta);

      // Always face the camera (billboard effect)
      rightGroupRef.current.lookAt(cameraPosition);

      // Apply scale animation (only if dialogue is open, otherwise show at full scale for testing)
      if (dialogueOpen) {
        rightGroupRef.current.scale.setScalar(scale);
      } else {
        // For testing, show at full scale when not in dialogue
        rightGroupRef.current.scale.setScalar(1);
      }

      // Debug: Log card position and scale
      if (Math.random() < 0.1) {
        console.log('Card position:', rightGroupRef.current.position.toArray(), 'Scale:', rightGroupRef.current.scale.x);
      }

      // Slight rotation to make it more dynamic
      rightGroupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }

    if (leftGroupRef.current) {
      const targetPosition = leftCardPosition;
      const currentPosition = leftGroupRef.current.position;
      currentPosition.lerp(targetPosition, 5 * delta);
      leftGroupRef.current.lookAt(cameraPosition);

      const s = dialogueOpen && detailsProject ? detailsScale : 0;
      leftGroupRef.current.scale.setScalar(s);
      leftGroupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }

    // README panel animation logic
    if (readmeGroupRef.current && readmeProject) {
      const targetPosition = readmeCardPosition;
      const currentPosition = readmeGroupRef.current.position;
      currentPosition.lerp(targetPosition, 5 * delta);
      readmeGroupRef.current.lookAt(cameraPosition);

      const s = dialogueOpen && readmeProject ? readmeScale : 0;
      readmeGroupRef.current.scale.setScalar(s);
      readmeGroupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  // Temporary test: force visibility for debugging
  // if (!isVisible || !npc) return null;
  
  // For now, let's always render if there's an NPC to test positioning
  if (!npc) return null;

  return (
    <>
    <group ref={rightGroupRef}>
      {/* Main Card Body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow renderOrder={UI_RENDER_ORDER}>
        <boxGeometry args={[CARD_SIZE.w, CARD_SIZE.h, CARD_SIZE.d]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.95}
          roughness={0.1}
          metalness={0.1}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Card Border Glow */}
      <mesh position={[0, 0, 0.1]} renderOrder={UI_RENDER_ORDER + 1}>
        <boxGeometry args={[BORDER_SIZE.w, BORDER_SIZE.h, BORDER_SIZE.d]} />
        <meshBasicMaterial 
          color={npc.color} 
          transparent 
          opacity={0.3}
          side={2} // DoubleSide
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Content via HTML overlay - attached to the 3D card */}
      <Html
        position={[0, 0, 0.2]}
        center
        transform
        distanceFactor={PANEL_DISTANCE_FACTOR}
        occlude={false}
        zIndexRange={HTML_Z_INDEX_RANGE}
      >
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
                      <div
                        key={project.id}
                        onClick={() => openProjectDetails(project)}
                        className={`p-2 rounded border transition-colors cursor-pointer group ${
                          selectedProject?.id === project.id
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-white hover:bg-indigo-50 border-gray-100'
                        }`}
                      >
                        {/* Project Image */}
                        <div className="mb-2">
                          <img 
                            src={project.imageUrl || '/placeholder-image.jpg'} 
                            alt={project.title}
                            className="w-full h-16 object-cover rounded border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMTIwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNjAiIGZpbGw9IiM5YmE4YjMiLz4KICA8dGV4dCB4PSI2MCIgeT0iMzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzIzMTgxOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPgo=';
                            }}
                          />
                        </div>
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
        <mesh renderOrder={UI_RENDER_ORDER + 2}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial
            color={npc.color}
            transparent
            opacity={0.5}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Subtle floating animation */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, Math.sin(Date.now() * 0.002) * 0.1, 0]} renderOrder={UI_RENDER_ORDER + 2}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthTest={false} depthWrite={false} />
        </mesh>
      </group>
    </group>

    {/* Left-side project details panel */}
    {npc.role === NPCRole.PROJECTS && detailsProject && (
      <group ref={leftGroupRef}>
        {/* Main Card Body */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow renderOrder={UI_RENDER_ORDER}>
          <boxGeometry args={[CARD_SIZE.w, CARD_SIZE.h, CARD_SIZE.d]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.95}
            roughness={0.1}
            metalness={0.1}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        {/* Card Border Glow */}
        <mesh position={[0, 0, 0.1]} renderOrder={UI_RENDER_ORDER + 1}>
          <boxGeometry args={[BORDER_SIZE.w, BORDER_SIZE.h, BORDER_SIZE.d]} />
          <meshBasicMaterial
            color={npc.color}
            transparent
            opacity={0.3}
            side={2} // DoubleSide
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        <Html
          position={[0, 0, 0.2]}
          center
          transform
          distanceFactor={PANEL_DISTANCE_FACTOR}
          occlude={false}
          zIndexRange={HTML_Z_INDEX_RANGE}
        >
          <div
            className="bg-gradient-to-br from-white/95 to-gray-50/90 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 flex flex-col"
            style={{
              width: `${PANEL_SIZE_PX.w}px`,
              height: `${PANEL_SIZE_PX.h}px`,
              opacity: dialogueOpen ? Math.min(detailsScale * 1.2, 1) : 1
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-start p-4 bg-gradient-to-r from-gray-50 to-transparent border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  style={{ backgroundColor: npc.color }}
                >
                  {detailsProject.title[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Project</h2>
                  <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase">Details</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={closeProjectDetails}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded bg-indigo-50 border border-indigo-200"
                >
                  Back
                </button>
                <button
                  onClick={() => useGameStore.getState().setDialogueOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

              {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{detailsProject.title}</h3>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">{detailsProject.description}</p>
              </div>

              {detailsProject.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {detailsProject.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {detailsProject.link && (
                <a
                  href={detailsProject.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors"
                >
                  Open Project
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10v11h11" />
                  </svg>
                </a>
              )}

              {/* README Button for both SDE and Game Dev Projects */}
              {(projectCategory === 'SDE' || projectCategory === 'GAME_DEV') && (
                <button
                  onClick={async () => {
                    setReadmeProject(detailsProject);
                    setReadmeScale(0);
                    setIsFetchingReadme(true);
                    setTimeout(() => setReadmeScale(1), 50);
                    
                    try {
                      if (projectCategory === 'SDE') {
                        // For GitHub projects, we would need to implement a similar detail fetch
                        // For now, show a message
                        setReadmeContent('GitHub project README fetching not yet implemented in this component.');
                      } else {
                        // Game Dev projects (Itch.io) - use the proper API service
                        const slug = detailsProject.slug || detailsProject.id;
                        const gameDetail = await ApiService.getItchGameDetail(slug);
                        
                        if (gameDetail.readme) {
                          setReadmeContent(gameDetail.readme);
                        } else {
                          setReadmeContent('No README available for this game.');
                        }
                      }
                    } catch (error) {
                      console.error('Error fetching README:', error);
                      setReadmeContent('Error loading README content.');
                    } finally {
                      setIsFetchingReadme(false);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
                >
                  View README
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </button>
              )}
            </div>

            {/* Footer Hint */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-400">Click <span className="font-mono bg-gray-200 px-1 rounded text-xs">Back</span> to return</p>
            </div>
          </div>
        </Html>
      </group>
    )}

    {/* Middle README panel */}
    {npc.role === NPCRole.PROJECTS && readmeProject && (
      <group ref={readmeGroupRef}>
        {/* Main Card Body */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow renderOrder={UI_RENDER_ORDER}>
          <boxGeometry args={[CARD_SIZE.w, CARD_SIZE.h, CARD_SIZE.d]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.95}
            roughness={0.1}
            metalness={0.1}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        {/* Card Border Glow */}
        <mesh position={[0, 0, 0.1]} renderOrder={UI_RENDER_ORDER + 1}>
          <boxGeometry args={[BORDER_SIZE.w, BORDER_SIZE.h, BORDER_SIZE.d]} />
          <meshBasicMaterial
            color={npc.color}
            transparent
            opacity={0.3}
            side={2} // DoubleSide
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        <Html
          position={[0, 0, 0.2]}
          center
          transform
          distanceFactor={PANEL_DISTANCE_FACTOR}
          occlude={false}
          zIndexRange={HTML_Z_INDEX_RANGE}
        >
          <div
            className="bg-gradient-to-br from-white/95 to-gray-50/90 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 flex flex-col"
            style={{
              width: `${PANEL_SIZE_PX.w}px`,
              height: `${PANEL_SIZE_PX.h}px`,
              opacity: dialogueOpen ? Math.min(readmeScale * 1.2, 1) : 1
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-start p-4 bg-gradient-to-r from-gray-50 to-transparent border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  style={{ backgroundColor: npc.color }}
                >
                  📖
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">README</h2>
                  <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase">{readmeProject.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setReadmeScale(0);
                    setTimeout(() => setReadmeProject(null), 250);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded bg-indigo-50 border border-indigo-200"
                >
                  Close
                </button>
                <button
                  onClick={() => useGameStore.getState().setDialogueOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {isFetchingReadme ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <p className="ml-2 text-sm text-gray-600">Loading README...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  {readmeContent ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {readmeContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No README content available for this project.</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer Hint */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-400">README content from GitHub repository</p>
            </div>
          </div>
        </Html>
      </group>
    )}
    </>
  );
};
