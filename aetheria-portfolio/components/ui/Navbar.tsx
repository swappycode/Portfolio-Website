import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { NPC_CONFIG } from '../../config/world.config';

export const Navbar: React.FC = () => {
  const { startAutoWalk, activeNPC, isAutoWalking } = useGameStore();

  return (
    <nav className="absolute top-0 left-0 right-0 p-4 flex justify-center items-start pointer-events-none z-20">
      <div
        className="flex items-center gap-1 pointer-events-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(26,21,32,0.92) 0%, rgba(19,16,28,0.95) 100%)',
          border: '1px solid rgba(139,105,20,0.4)',
          borderRadius: '8px',
          padding: '4px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 20px rgba(139,105,20,0.1), inset 0 1px 0 rgba(200,160,80,0.1)',
        }}
      >
        {/* Ornamental left edge */}
        <div style={{
          width: '3px', height: '28px', borderRadius: '2px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(200,160,80,0.4) 50%, transparent 100%)',
          marginLeft: '4px',
        }} />

        {NPC_CONFIG.map((npc) => {
          const isActive = activeNPC === npc.id;
          return (
            <button
              key={npc.id}
              onClick={() => startAutoWalk(npc.id)}
              disabled={isAutoWalking && isActive}
              style={{
                padding: '6px 16px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase' as const,
                cursor: isAutoWalking && isActive ? 'default' : 'pointer',
                border: isActive
                  ? '1px solid rgba(200,160,80,0.5)'
                  : '1px solid transparent',
                background: isActive
                  ? 'linear-gradient(180deg, rgba(200,160,80,0.2) 0%, rgba(200,160,80,0.08) 100%)'
                  : 'transparent',
                color: isActive ? '#e8d5a3' : '#6b5e50',
                transition: 'all 0.25s ease',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                textShadow: isActive ? '0 0 8px rgba(200,160,80,0.3)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#c8b8a0';
                  e.currentTarget.style.background = 'rgba(200,160,80,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(200,160,80,0.15)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#6b5e50';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              {npc.role.replace('_', ' ')}
            </button>
          );
        })}

        {/* Ornamental right edge */}
        <div style={{
          width: '3px', height: '28px', borderRadius: '2px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(200,160,80,0.4) 50%, transparent 100%)',
          marginRight: '4px',
        }} />
      </div>
    </nav>
  );
};
