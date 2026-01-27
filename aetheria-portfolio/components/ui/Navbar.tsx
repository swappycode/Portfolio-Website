import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { NPC_CONFIG } from '../../config/world.config';

export const Navbar: React.FC = () => {
  const { startAutoWalk, activeNPC, isAutoWalking } = useGameStore();

  return (
    <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-20">
      <div className="pointer-events-auto">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight bg-white/80 backdrop-blur px-4 py-2 rounded-xl shadow-sm">
          Aetheria<span className="text-indigo-500">.</span>
        </h1>
      </div>

      <div className="flex gap-2 pointer-events-auto bg-white/80 backdrop-blur px-2 py-2 rounded-xl shadow-sm">
        {NPC_CONFIG.map((npc) => (
          <button
            key={npc.id}
            onClick={() => startAutoWalk(npc.id)}
            disabled={isAutoWalking && activeNPC === npc.id}
            className={`
              px-4 py-2 rounded-lg text-sm font-bold transition-all
              ${activeNPC === npc.id 
                ? 'bg-indigo-600 text-white shadow-md transform scale-105' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'}
            `}
          >
            {npc.role.replace('_', ' ')}
          </button>
        ))}
      </div>
    </nav>
  );
};
