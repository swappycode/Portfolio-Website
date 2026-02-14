import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

// ── RPG color tokens (matching FloatingCard) ──
const RPG = {
    bgDark: '#1a1520',
    border: '#8b6914',
    borderSoft: 'rgba(200,160,80,0.25)',
    borderFaint: 'rgba(200,160,80,0.12)',
    gold: '#c8a050',
    goldBright: '#e8d5a3',
    goldDim: '#8b7d6b',
    textBody: '#c8b8a0',
    textMuted: '#9e8e7a',
    textDim: '#6b5e50',
};

export const WelcomePanel: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
    const { showWelcome, setShowWelcome } = useGameStore();
    const [animateIn, setAnimateIn] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (showWelcome) {
            requestAnimationFrame(() => setAnimateIn(true));
            audioRef.current = new Audio('/models/click.mp3');
            audioRef.current.volume = 0.5;
        } else {
            setAnimateIn(false);
        }
    }, [showWelcome]);

    const handleClose = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });
        }
        setShowWelcome(false);
    };

    if (!showWelcome) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Segoe UI', 'Inter', system-ui, sans-serif",
        }}>
            {/* Backdrop */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at center, rgba(10,6,20,0.6) 0%, rgba(5,3,12,0.8) 100%)',
                opacity: animateIn ? 1 : 0,
                transition: 'opacity 0.4s ease',
                backdropFilter: 'blur(4px)',
            }} />

            {/* Main Panel */}
            <div style={{
                position: 'relative',
                width: 'min(500px, 90vw)',
                opacity: animateIn ? 1 : 0,
                transform: animateIn ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                background: 'linear-gradient(170deg, #1e1628 0%, #13101c 40%, #1a1225 100%)',
                borderRadius: '16px',
                border: `2px solid ${RPG.border}`,
                boxShadow: `
          0 10px 40px rgba(0,0,0,0.6),
          0 0 50px rgba(139,105,20,0.1),
          inset 0 1px 0 rgba(200,160,80,0.2)
        `,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}>

                {/* Header */}
                <div style={{
                    padding: '24px 24px 16px',
                    borderBottom: `1px solid ${RPG.borderFaint}`,
                    background: 'linear-gradient(180deg, rgba(200,160,80,0.06) 0%, transparent 100%)',
                    textAlign: 'center',
                }}>
                    <h2 style={{
                        margin: 0, fontSize: '24px', fontWeight: 700, color: RPG.goldBright,
                        fontFamily: "'Cinzel', serif", letterSpacing: '1px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}>Welcome, Traveler</h2>
                    <p style={{
                        margin: '8px 0 0', fontSize: '12px', color: RPG.textMuted,
                        textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600
                    }}>Mission Briefing</p>
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>

                    {/* Section 1: Controls */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{
                            margin: '0 0 12px', fontSize: '13px', color: RPG.gold,
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <span style={{ fontSize: '16px' }}>🎮</span> Controls
                        </h3>
                        <div style={{
                            background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px',
                            border: `1px solid ${RPG.borderFaint}`,
                            display: 'flex', gap: '12px', alignItems: 'center'
                        }}>
                            {isMobile ? (
                                <div style={{ fontSize: '14px', color: RPG.textBody }}>
                                    Use the <strong style={{ color: RPG.goldBright }}>Virtual Joystick</strong> at the bottom of your screen to move.
                                </div>
                            ) : (
                                <div style={{ fontSize: '14px', color: RPG.textBody }}>
                                    Use <strong style={{ color: RPG.goldBright, background: 'rgba(200,160,80,0.1)', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${RPG.borderSoft}` }}>WASD</strong> or <strong style={{ color: RPG.goldBright, background: 'rgba(200,160,80,0.1)', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${RPG.borderSoft}` }}>Arrow Keys</strong> to explore.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Navigation */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{
                            margin: '0 0 12px', fontSize: '13px', color: RPG.gold,
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <span style={{ fontSize: '16px' }}>🧭</span> Navigation
                        </h3>
                        <div style={{ fontSize: '14px', color: RPG.textBody, lineHeight: 1.6 }}>
                            Click the top <strong style={{ color: RPG.goldBright }}>Menu Buttons</strong> to activate <em>Auto-Pilot</em>. Your character will automatically travel to the destination.
                        </div>
                    </div>

                    {/* Section 3: Interaction */}
                    <div>
                        <h3 style={{
                            margin: '0 0 12px', fontSize: '13px', color: RPG.gold,
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <span style={{ fontSize: '16px' }}>💬</span> Interaction
                        </h3>
                        <div style={{ fontSize: '14px', color: RPG.textBody, lineHeight: 1.6 }}>
                            Walk close to any <strong style={{ color: RPG.goldBright }}>Character</strong> to open their profile details, projects, and bio.
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div style={{
                    padding: '24px',
                    borderTop: `1px solid ${RPG.borderFaint}`,
                    background: 'linear-gradient(0deg, rgba(200,160,80,0.08) 0%, transparent 100%)',
                    display: 'flex', justifyContent: 'center'
                }}>
                    <button
                        onClick={handleClose}
                        style={{
                            padding: '14px 40px',
                            background: `linear-gradient(180deg, ${RPG.gold} 0%, #a08040 100%)`, // Richer gradient
                            border: `1px solid ${RPG.goldBright}`,
                            borderRadius: '8px',
                            color: '#1a1520',
                            fontSize: '15px', fontWeight: 800, letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            boxShadow: `0 0 20px rgba(200,160,80,0.4), inset 0 1px 0 rgba(255,255,255,0.3)`, // Enhanced glow
                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            position: 'relative',
                            overflow: 'hidden',
                            textShadow: '0 1px 0 rgba(255,255,255,0.2)'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 10px 30px rgba(200,160,80,0.6), inset 0 1px 0 rgba(255,255,255,0.4)`;
                            e.currentTarget.style.filter = 'brightness(1.1)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1) translateY(0)';
                            e.currentTarget.style.boxShadow = `0 0 20px rgba(200,160,80,0.4), inset 0 1px 0 rgba(255,255,255,0.3)`;
                            e.currentTarget.style.filter = 'brightness(1)';
                        }}
                        onMouseDown={e => {
                            e.currentTarget.style.transform = 'scale(0.98) translateY(1px)';
                            e.currentTarget.style.boxShadow = `0 0 10px rgba(200,160,80,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`;
                        }}
                        onMouseUp={e => {
                            e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 10px 30px rgba(200,160,80,0.6), inset 0 1px 0 rgba(255,255,255,0.4)`;
                        }}
                    >
                        <span style={{ position: 'relative', zIndex: 1 }}>Begin Journey</span>
                        {/* Shine effect */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.2) 50%, transparent 55%)',
                            backgroundSize: '200% 200%',
                            animation: 'shine 3s infinite linear',
                        }} />
                    </button>
                </div>

                {/* Scanline Effect */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 98,
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(200,160,80,0.012) 2px, rgba(200,160,80,0.012) 4px)',
                }} />

                <style>{`
            @keyframes shine {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `}</style>
            </div>
        </div>
    );
};
