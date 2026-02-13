import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { NPC_CONFIG } from '../../config/world.config';

export const Navbar: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const { startAutoWalk, activeNPC, isAutoWalking } = useGameStore();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    audioRef.current = new Audio('/models/click.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  const playClickSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }
  };

  return (
    <nav className={`absolute top-0 left-0 right-0 ${isMobile ? 'p-2' : 'p-8'} flex justify-center items-start pointer-events-none z-20`}>
      <div
        className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'} pointer-events-auto max-w-full`}
        style={{
          background: 'linear-gradient(180deg, rgba(26,21,32,0.92) 0%, rgba(19,16,28,0.95) 100%)',
          border: '1px solid rgba(139,105,20,0.4)',
          borderRadius: '12px',
          padding: isMobile ? '4px' : '8px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 20px rgba(139,105,20,0.1), inset 0 1px 0 rgba(200,160,80,0.1)',
        }}
      >

        {/* Ornamental left edge - hidden on mobile */}
        {!isMobile && (
          <div style={{
            width: '4px', height: '40px', borderRadius: '2px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(200,160,80,0.4) 50%, transparent 100%)',
            marginLeft: '4px',
            flexShrink: 0,
          }} />
        )}

        {NPC_CONFIG.map((npc) => {
          const isActive = activeNPC === npc.id;
          return (
            <button
              key={npc.id}
              onClick={() => {
                playClickSound();
                startAutoWalk(npc.id);
              }}
              disabled={isAutoWalking && isActive}
              style={{
                padding: isMobile ? '6px 10px' : '12px 24px',
                borderRadius: '8px',
                fontSize: isMobile ? '11px' : '14px',
                fontWeight: 700,
                letterSpacing: isMobile ? '0.5px' : '1px',
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
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                textShadow: isActive ? '0 0 8px rgba(200,160,80,0.3)' : 'none',
                whiteSpace: 'nowrap',
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
        {!isMobile && (
          <div style={{
            width: '4px', height: '40px', borderRadius: '2px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(200,160,80,0.4) 50%, transparent 100%)',
            marginRight: '4px',
            flexShrink: 0,
          }} />
        )}
      </div>
    </nav>
  );
};
