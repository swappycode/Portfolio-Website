import React, { useEffect, useMemo, useState } from 'react';
import { NPC_CONFIG, WORLD_RADIUS } from '../../config/world.config';
import { useGameStore } from '../../store/gameStore';
import { ApiService } from '../../services/api';
import { ProfileData } from '../../types';

type Marker = {
  id: string;
  role: string;
  color: string;
  x: number; // -1..1
  y: number; // -1..1
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const HUD: React.FC = () => {
  const activeNPC = useGameStore((s) => s.activeNPC);
  const visitedNPCs = useGameStore((s) => s.visitedNPCs);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let mounted = true;
    ApiService.getProfile()
      .then((data) => {
        if (mounted) setProfile(data);
      })
      .catch(() => {
        // ApiService already falls back; ignore.
      });
    return () => {
      mounted = false;
    };
  }, []);

  const markers = useMemo<Marker[]>(() => {
    return NPC_CONFIG.map((npc) => {
      const [x, , z] = npc.position;
      const nx = clamp(x / WORLD_RADIUS, -1, 1);
      const ny = clamp(-z / WORLD_RADIUS, -1, 1);
      return { id: npc.id, role: npc.role, color: npc.color, x: nx, y: ny };
    });
  }, []);

  const displayName = profile?.name ?? 'Developer';
  const displayRole = profile?.role ?? 'Creative Developer';

  return (
    <div className="absolute bottom-6 left-6 z-50 pointer-events-none">
      <div className="aeth-glass-frame">
        <div className="aeth-glass-panel px-4 py-3 text-white w-[340px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-base border border-white/15 bg-white/5 shadow-[0_0_18px_rgba(56,189,248,0.18)]">
                {displayName[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold tracking-tight truncate">
                  {displayName}
                </div>
                <div className="mt-0.5 text-[11px] text-white/60 font-semibold tracking-[0.22em] uppercase truncate">
                  {displayRole}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-white/55 font-semibold tracking-[0.26em] uppercase">
              Stats
            </div>
          </div>

          <div className="mt-3 flex items-start gap-4">
            <div className="flex-1 space-y-2">
              {NPC_CONFIG.map((npc) => {
                const isActive = activeNPC === npc.id;
                const isVisited = Boolean(visitedNPCs?.[npc.id]);
                const fill = isVisited || isActive ? 1 : 0.22;

                return (
                  <div key={npc.id} className="flex items-center gap-3">
                    <div className="w-[92px] text-[11px] font-bold tracking-[0.18em] uppercase text-white/70">
                      {npc.role}
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round(fill * 100)}%`,
                          background: `linear-gradient(90deg, ${npc.color}cc, rgba(255,255,255,0.08))`,
                          boxShadow: isActive
                            ? `0 0 18px ${npc.color}55`
                            : undefined
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="w-[112px] shrink-0">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-auto"
                  aria-label="Mini map"
                >
                  <defs>
                    <filter id="aethGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2.2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="rgba(2,6,23,0.35)"
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth="1.5"
                  />
                  <line x1="50" y1="6" x2="50" y2="94" stroke="rgba(255,255,255,0.08)" />
                  <line x1="6" y1="50" x2="94" y2="50" stroke="rgba(255,255,255,0.08)" />

                  {/* Player */}
                  <circle
                    cx="50"
                    cy="50"
                    r="3"
                    fill="rgba(255,255,255,0.9)"
                    filter="url(#aethGlow)"
                  />

                  {markers.map((m) => {
                    const cx = 50 + m.x * 38;
                    const cy = 50 + m.y * 38;
                    const isActive = activeNPC === m.id;
                    const isVisited = Boolean(visitedNPCs?.[m.id]);

                    return (
                      <circle
                        key={m.id}
                        cx={cx}
                        cy={cy}
                        r={isActive ? 4.3 : 3.2}
                        fill={m.color}
                        opacity={isVisited || isActive ? 0.9 : 0.45}
                        filter={isActive ? 'url(#aethGlow)' : undefined}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t aeth-glass-divider text-[11px] text-white/55 font-mono">
            WASD / ARROWS to move · ESC to close panels
          </div>
        </div>
      </div>
    </div>
  );
};
