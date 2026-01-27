import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { NPC_CONFIG } from '../../config/world.config';
import { NPCRole, ProjectItem } from '../../types';
import { ApiService } from '../../services/api';

export const DialoguePanel: React.FC = () => {
  const { 
    activeNPC, 
    dialogueOpen, 
    setDialogueOpen, 
    projectCategory, 
    setProjectCategory 
  } = useGameStore();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);

  const npc = NPC_CONFIG.find(n => n.id === activeNPC);

  useEffect(() => {
    if (activeNPC && npc?.role === NPCRole.PROJECTS && dialogueOpen) {
      setLoading(true);
      ApiService.getProjects(projectCategory)
        .then(setProjects)
        .finally(() => setLoading(false));
    }
  }, [activeNPC, projectCategory, dialogueOpen, npc?.role]);

  if (!dialogueOpen || !npc) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-2xl w-full mx-4 pointer-events-auto border-b-4 border-gray-200 transform transition-all animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner"
              style={{ backgroundColor: npc.color }}
            >
              {npc.name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{npc.name}</h2>
              <p className="text-sm text-gray-500 font-semibold tracking-wider uppercase">{npc.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={() => setDialogueOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[120px]">
          {/* Default Content */}
          {npc.role !== NPCRole.PROJECTS && (
            <div className="space-y-4">
              <p className="text-lg text-gray-700 leading-relaxed">{npc.dialogue.intro}</p>
              {npc.dialogue.details && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-600">
                  {npc.dialogue.details}
                </div>
              )}
            </div>
          )}

          {/* Projects Specific Logic */}
          {npc.role === NPCRole.PROJECTS && (
            <div>
              <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
                <button 
                  onClick={() => setProjectCategory('GAME_DEV')}
                  className={`pb-2 px-1 text-sm font-bold transition-colors ${projectCategory === 'GAME_DEV' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Game Dev
                </button>
                <button 
                  onClick={() => setProjectCategory('SDE')}
                  className={`pb-2 px-1 text-sm font-bold transition-colors ${projectCategory === 'SDE' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Software Eng
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map(project => (
                    <div key={project.id} className="bg-gray-50 hover:bg-indigo-50 p-4 rounded-lg border border-gray-100 transition-colors cursor-pointer group">
                      <h3 className="font-bold text-gray-800 group-hover:text-indigo-700">{project.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {project.tags.map(tag => (
                          <span key={tag} className="text-xs bg-white text-gray-500 px-2 py-1 rounded-full border border-gray-200">
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
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">Press <span className="font-mono bg-gray-100 px-1 rounded">ESC</span> or walk away to close</p>
        </div>
      </div>
    </div>
  );
};
