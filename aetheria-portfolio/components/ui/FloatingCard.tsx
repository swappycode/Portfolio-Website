import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { NPC_CONFIG } from '../../config/world.config';
import { NPCRole, ProjectItem, ServiceCategory, ServiceItem } from '../../types';
import { ApiService } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ═══════════════════════════════════════════════════════
   HOLOGRAPHIC 3D PANEL — Interactive mouse-tracked card
   ═══════════════════════════════════════════════════════
   
   Features:
   • Mouse-tracked tilt (rotateX/Y based on cursor)
   • Moving specular glare that follows mouse
   • Depth layers with parallax (translateZ)
   • Edge glow that shifts position
   • Smooth spring-based return to neutral
*/

// ── RPG color tokens ──
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

// ── 3D tilt config ──
const TILT_MAX = 8;        // max degrees of tilt
const GLARE_OPACITY = 0.12; // glare intensity

const SERVICE_DATA: Record<ServiceCategory, ServiceItem[]> = {
  SERVICES: [], // Populated from NPC config
  ACHIEVEMENTS: [
    {
      id: "technex-2024",
      title: "Technex Game Jam Winner — IIT BHU (2024)",
      description: "Built a complete RTS game in 48 hours with AI, pathfinding, animation systems, and UI logic.",
      details: [
        "Designed resource systems, combat logic, and event-driven gameplay architecture.",
        "Optimized game loops and ensured stable real-time performance.",
        "First Place Winner in Game Development track."
      ],
      image: "/models/gamejampng.png"
    },
    {
      id: "overnight-2024",
      title: "Overnight Coding Finalist — IIT Kharagpur (2024)",
      description: "Solved system-level and algorithmic problems using highly optimized C++.",
      details: [
        "Improved runtimes through multi-stage pruning and memoization.",
        "Implemented bitwise optimization techniques for memory efficiency.",
        "Finalist in competitive coding challenge."
      ],
      image: "/models/overnite.png"
    }
  ],
  CERTIFICATIONS: [
    {
      id: "trendsetters-arvr",
      title: "Game Development Using AR / VR",
      description: "Trendsetters Infoservices - Process Design and Development",
      details: [
        "Developed marker-based and markerless AR/VR applications.",
        "Hands-on experience in game, AR, and VR development workflows."
      ],
      image: "/models/arvrcertificate.jpeg"
    }
  ]
};

const CURSOR_STYLE = "url('/models/cursor.png'), auto";

export const FloatingCard: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const { activeNPC, dialogueOpen, projectCategory, setProjectCategory, serviceCategory, setServiceCategory } = useGameStore();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [isFetchingReadme, setIsFetchingReadme] = useState(false);
  const [showReadme, setShowReadme] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // 3D tilt state
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const npc = NPC_CONFIG.find(n => n.id === activeNPC);
  const isProjects = npc?.role === NPCRole.PROJECTS;
  const isServices = npc?.role === NPCRole.SERVICES;

  // ── Global mouse tracking — tilts even when cursor is outside the panel ──
  useEffect(() => {
    if (!dialogueOpen) return;

    const AMBIENT_STRENGTH = 0.3; // 30% tilt when outside panel
    const DIRECT_STRENGTH = 0.4;  // 40% tilt when hovering panel

    const onMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalize relative to card center
      const normalX = (e.clientX - centerX) / (rect.width / 2);
      const normalY = (e.clientY - centerY) / (rect.height / 2);

      // Check if mouse is over the card
      const isOver = e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;

      // Full strength on card, dampened outside
      const strength = isOver ? DIRECT_STRENGTH : AMBIENT_STRENGTH;

      // Clamp after strength — outside can go beyond -1..1 but we dampen
      const clampedX = Math.max(-1, Math.min(1, normalX));
      const clampedY = Math.max(-1, Math.min(1, normalY));

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setTilt({
          x: -clampedY * TILT_MAX * strength,
          y: clampedX * TILT_MAX * strength,
        });
        setGlarePos({
          x: (clampedX + 1) * 50,
          y: (clampedY + 1) * 50,
        });
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [dialogueOpen]);

  // Animate in and Play Sound
  useEffect(() => {
    if (dialogueOpen && npc) {
      requestAnimationFrame(() => setAnimateIn(true));

      // Play NPC Sound
      try {
        let soundFile = '';
        if (npc.role === NPCRole.ABOUT) soundFile = '/models/demon.mp3';
        else if (npc.role === NPCRole.PROJECTS) soundFile = '/models/fish.mp3';
        else if (npc.role === NPCRole.SERVICES) soundFile = '/models/Ninja.mp3';
        else if (npc.role === NPCRole.CONTACT) soundFile = '/models/contact.mp3';

        if (soundFile) {
          const audio = new Audio(soundFile);
          audio.volume = 0.5; // Moderate volume
          audio.play().catch(e => console.warn('NPC sound blocked/failed', e));
        }
      } catch (err) {
        console.error('Error playing NPC sound:', err);
      }
    } else {
      setAnimateIn(false);
    }
  }, [dialogueOpen, npc]);

  // Fetch projects
  useEffect(() => {
    if (activeNPC && npc?.role === NPCRole.PROJECTS && dialogueOpen) {
      setLoading(true);
      setSelectedProject(null);
      setShowReadme(false);
      ApiService.getProjects(projectCategory)
        .then(setProjects)
        .finally(() => setLoading(false));
    }
  }, [activeNPC, projectCategory, dialogueOpen, npc?.role]);

  // Reset on close
  useEffect(() => {
    if (!dialogueOpen) {
      setSelectedProject(null);
      setShowReadme(false);
      setReadmeContent('');
    }
  }, [dialogueOpen]);

  // ESC key — cascading close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dialogueOpen) {
        if (showReadme) setShowReadme(false);
        else if (selectedProject) setSelectedProject(null);
        else useGameStore.getState().setDialogueOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogueOpen, showReadme, selectedProject]);

  // Audio ref for clicks
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    clickAudioRef.current = new Audio('/models/click.mp3');
    clickAudioRef.current.volume = 0.5;
  }, []);

  const playClick = () => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play().catch(e => console.error("Click audio error", e));
    }
  };

  const closePanel = () => {
    playClick();
    useGameStore.getState().setDialogueOpen(false);
  };

  const openProjectDetails = (project: ProjectItem) => {
    playClick();
    setSelectedProject(project);
    setShowReadme(false);
  };

  const fetchReadme = async (project: ProjectItem) => {
    playClick();
    setShowReadme(true);
    setIsFetchingReadme(true);
    try {
      if (projectCategory === 'GAME_DEV') {
        const slug = project.slug || project.id;
        const gameDetail = await ApiService.getItchGameDetail(slug);
        setReadmeContent(gameDetail.readme || 'No README available.');
      } else {
        // Use project title or ID as the repo name. 
        // Assuming project.id corresponds to repo name for now based on api.ts transformation.
        const repoName = project.id;
        const repoDetail = await ApiService.getGitHubProjectDetail(repoName);
        setReadmeContent(repoDetail.readme || 'No README available.');
      }
    } catch {
      setReadmeContent('Error loading README.');
    } finally {
      setIsFetchingReadme(false);
    }
  };

  if (!dialogueOpen || !npc) return null;

  // 3D transform string
  const transform3D = animateIn
    ? `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1)`
    : 'perspective(1200px) rotateX(12deg) rotateY(0deg) scale(0.85)';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
      fontFamily: "'Segoe UI', 'Inter', system-ui, sans-serif",
    }}>
      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'auto',
        background: 'radial-gradient(ellipse at center, rgba(10,6,20,0.5) 0%, rgba(5,3,12,0.7) 100%)',
        opacity: animateIn ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }} onClick={closePanel} />

      {/* ═══ 3D HOLOGRAPHIC CARD ═══ */}
      <div
        ref={cardRef}
        style={{
          position: 'relative',
          pointerEvents: 'auto',
          width: isProjects ? 'min(880px, 90vw)' : 'min(720px, 90vw)',
          height: isProjects ? 'min(540px, 80vh)' : 'auto',
          maxHeight: '80vh',
          // 3D transform — smooth spring transition
          transform: transform3D,
          opacity: animateIn ? 1 : 0,
          transition: 'transform 0.2s ease-out, opacity 0.35s ease',
          transformStyle: 'preserve-3d' as const,
          // Card face
          background: 'linear-gradient(170deg, #1e1628 0%, #13101c 40%, #1a1225 100%)',
          borderRadius: '16px',
          border: `2px solid ${RPG.border}`,
          boxShadow: `
            0 ${6 + Math.abs(tilt.x) * 3}px ${35 + Math.abs(tilt.x) * 5}px rgba(0,0,0,0.6),
            0 ${2 + Math.abs(tilt.x)}px ${10 + Math.abs(tilt.x) * 2}px rgba(0,0,0,0.4),
            0 0 50px rgba(139,105,20,${0.18 + Math.abs(tilt.y) * 0.04}),
            0 0 100px rgba(139,105,20,0.08),
            inset 0 2px 0 rgba(200,160,80,0.18),
            inset 0 -2px 4px rgba(0,0,0,0.4),
            inset 2px 0 4px rgba(0,0,0,0.15),
            inset -2px 0 4px rgba(0,0,0,0.15)
          `,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column' as const,
          cursor: CURSOR_STYLE,
        }}
      >
        {/* ── GLARE / SPECULAR REFLECTION — follows mouse ── */}
        <div style={{
          position: 'absolute',
          inset: '-50%',
          pointerEvents: 'none',
          zIndex: 100,
          background: `radial-gradient(
            ellipse at ${glarePos.x}% ${glarePos.y}%,
            rgba(255,240,200,${GLARE_OPACITY}) 0%,
            rgba(255,240,200,0.04) 30%,
            transparent 60%
          )`,
          mixBlendMode: 'overlay' as const,
          transition: 'background 0.1s ease-out',
        }} />

        {/* ── EDGE LIGHT — shifts with tilt ── */}
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 99,
          borderRadius: '16px',
          border: '1px solid transparent',
          background: `linear-gradient(${135 + tilt.y * 3}deg, rgba(200,160,80,${0.15 + Math.abs(tilt.y) * 0.05}) 0%, transparent 40%, transparent 60%, rgba(200,160,80,${0.1 + Math.abs(tilt.y) * 0.04}) 100%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude' as any,
          padding: '2px',
        }} />

        {/* ── ORNAMENTAL TOP BAR with embossed ridge ── */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(200,160,80,0.15) 15%, rgba(200,160,80,0.5) 50%, rgba(200,160,80,0.15) 85%, transparent 100%)',
          }} />
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 85%, transparent 100%)',
          }} />
        </div>

        {/* ── CORNER ORNAMENTS ── */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => {
          const isTop = corner.includes('top');
          const isLeft = corner.includes('left');
          return (
            <div key={corner} style={{
              position: 'absolute',
              [isTop ? 'top' : 'bottom']: '4px',
              [isLeft ? 'left' : 'right']: '4px',
              width: '16px', height: '16px',
              pointerEvents: 'none', zIndex: 101,
              borderTop: isTop ? '2px solid rgba(200,160,80,0.35)' : 'none',
              borderBottom: !isTop ? '2px solid rgba(200,160,80,0.35)' : 'none',
              borderLeft: isLeft ? '2px solid rgba(200,160,80,0.35)' : 'none',
              borderRight: !isLeft ? '2px solid rgba(200,160,80,0.35)' : 'none',
              borderRadius: corner === 'top-left' ? '14px 0 0 0' : corner === 'top-right' ? '0 14px 0 0' : corner === 'bottom-left' ? '0 0 0 14px' : '0 0 14px 0',
            }} />
          );
        })}

        {/* ═══ HEADER — at higher Z depth for parallax ═══ */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px 10px',
          borderBottom: `1px solid ${RPG.borderFaint}`,
          background: 'linear-gradient(180deg, rgba(200,160,80,0.06) 0%, transparent 100%)',
          flexShrink: 0,
          transform: 'translateZ(20px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: `linear-gradient(135deg, ${npc.color}, ${npc.color}88)`,
              border: '2px solid rgba(200,160,80,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '16px',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              boxShadow: `0 0 12px ${npc.color}44`,
            }}>{npc.name[0]}</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: RPG.goldBright, letterSpacing: '0.4px' }}>{npc.name}</h2>
              <p style={{ margin: 0, fontSize: '9px', color: RPG.goldDim, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' as const }}>{npc.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={closePanel} style={{
            background: 'rgba(200,160,80,0.08)', border: `1px solid ${RPG.borderSoft}`, borderRadius: '6px',
            color: RPG.goldDim, cursor: CURSOR_STYLE, padding: '5px 7px', display: 'flex', alignItems: 'center', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = RPG.goldBright; e.currentTarget.style.borderColor = 'rgba(200,160,80,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = RPG.goldDim; e.currentTarget.style.borderColor = RPG.borderSoft; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* ═══ CONTENT — recessed inner panel for 3D depth ═══ */}
        <div style={{
          flex: 1, overflow: 'hidden', display: 'flex', minHeight: 0,
          transform: 'translateZ(10px)',
          margin: '0 6px', borderRadius: '8px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.02) 100%)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2), inset 0 -1px 3px rgba(200,160,80,0.04)',
        }}>
          {isProjects ? (
            <ProjectsView
              projects={projects} loading={loading}
              projectCategory={projectCategory} setProjectCategory={(cat) => { playClick(); setProjectCategory(cat); }}
              selectedProject={selectedProject} onSelectProject={openProjectDetails}
              readmeContent={readmeContent} showReadme={showReadme}
              isFetchingReadme={isFetchingReadme} onFetchReadme={fetchReadme}
              onCloseReadme={() => { playClick(); setShowReadme(false); }}
              onBack={() => { playClick(); setSelectedProject(null); }}
              npcColor={npc.color}
              isMobile={isMobile}
              playClick={playClick}
            />
          ) : isServices ? (
            <ServicesView
              npc={npc}
              serviceCategory={serviceCategory}
              setServiceCategory={(cat) => { playClick(); setServiceCategory(cat); }}
              isMobile={isMobile}
              playClick={playClick}
            />
          ) : (
            <GenericContent npc={npc} isMobile={isMobile} />
          )}
        </div>

        {/* ═══ FOOTER — at higher Z depth ═══ */}
        <div style={{
          padding: '7px 18px', borderTop: `1px solid ${RPG.borderFaint}`,
          textAlign: 'center' as const, fontSize: '10px', color: '#4a4050', flexShrink: 0,
          background: 'linear-gradient(0deg, rgba(200,160,80,0.03) 0%, transparent 100%)',
          transform: 'translateZ(20px)',
        }}>
          Press <span style={{
            background: 'rgba(200,160,80,0.12)', border: `1px solid ${RPG.borderFaint}`, borderRadius: '3px',
            padding: '1px 6px', fontFamily: 'monospace', color: RPG.goldDim, fontSize: '9px',
          }}>ESC</span> or walk away to close
        </div>

        {/* ── HOLOGRAM SCANLINE EFFECT ── */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 98,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(200,160,80,0.012) 2px, rgba(200,160,80,0.012) 4px)',
          borderRadius: '16px',
        }} />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Generic NPC Content (About / Services / Contact)
   ───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   Generic NPC Content (About / Services / Contact)
   ───────────────────────────────────────────── */
const GenericContent: React.FC<{ npc: any, isMobile: boolean }> = ({ npc, isMobile }) => {
  const { image, listItems, links, resumes } = npc.dialogue;

  return (
    <div style={{
      flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%',
      overflow: 'hidden'
    }}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div style={{
        flex: 1, overflow: 'auto',
        padding: isMobile ? '14px 16px' : '20px 24px',
        scrollbarWidth: 'thin' as const, scrollbarColor: '#3a2e45 transparent',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y' as const
      }}>
        {/* ── PROFILE HEADER (IMAGE + BIO) ── */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', marginBottom: '20px' }}>
          {image && (
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: isMobile ? '80px' : '100px', height: isMobile ? '80px' : '100px',
                borderRadius: '12px', border: `2px solid ${RPG.gold}`,
                overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                background: '#000',
              }}>
                <img src={image} alt={npc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          )}
          <div>
            <p style={{ color: RPG.textBody, fontSize: isMobile ? '13px' : '15px', lineHeight: 1.6, margin: '0 0 12px', fontWeight: 500 }}>
              {npc.dialogue.intro}
            </p>
            {npc.dialogue.details && (
              <div style={{
                color: RPG.textMuted, fontSize: '13px', lineHeight: 1.6,
                background: 'rgba(200,160,80,0.04)', padding: '10px 14px', borderRadius: '8px',
                borderLeft: `3px solid ${RPG.goldDim}`
              }}>{npc.dialogue.details}</div>
            )}
          </div>
        </div>

        {/* ── SERVICE LIST ITEMS ── */}
        {listItems && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            {listItems.map((item: any, i: number) => (
              <div key={i} style={{
                background: 'linear-gradient(180deg, rgba(200,160,80,0.08) 0%, rgba(200,160,80,0.02) 100%)',
                border: `1px solid ${RPG.borderFaint}`, borderRadius: '8px', padding: '12px',
              }}>
                <h4 style={{ margin: '0 0 4px', color: RPG.goldBright, fontSize: '13px', fontWeight: 700 }}>{item.title}</h4>
                <p style={{ margin: 0, color: RPG.textDim, fontSize: '11px', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── CONTACT LINKS ── */}
        {links && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
            {links.map((link: any, i: number) => (
              <a key={i} href={link.url} target="_blank" rel="noreferrer" style={{
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '6px',
                background: 'rgba(200,160,80,0.1)', border: `1px solid ${RPG.borderSoft}`,
                color: RPG.gold, fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,160,80,0.2)'; e.currentTarget.style.color = RPG.goldBright; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,160,80,0.1)'; e.currentTarget.style.color = RPG.gold; }}
              >
                <span>{link.icon}</span> {link.label}
              </a>
            ))}
          </div>
        )}

        {/* ── RESUME DOWNLOADS ── */}
        {resumes && (
          <div style={{ marginTop: '24px', borderTop: `1px solid ${RPG.borderFaint}`, paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px', color: RPG.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Resume</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {resumes.map((resume: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '1px' }}>
                  <a href={resume.url} target="_blank" rel="noreferrer" style={{
                    textDecoration: 'none', padding: '8px 14px',
                    background: `linear-gradient(180deg, ${RPG.gold} 0%, ${RPG.goldDim} 100%)`,
                    borderRadius: '6px 0 0 6px', color: '#1a1520', fontSize: '12px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    👁️ View {resume.label}
                  </a>
                  <a href={resume.url} download style={{
                    textDecoration: 'none', padding: '8px 10px',
                    background: `linear-gradient(180deg, ${RPG.goldDim} 0%, #6b5e50 100%)`,
                    borderRadius: '0 6px 6px 0', color: '#1a1520', fontSize: '12px', fontWeight: 700,
                    borderLeft: '1px solid rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center'
                  }}>
                    ⬇
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Projects Panel — Grid + Detail Sidebar
   ───────────────────────────────────────────── */
interface ProjectsViewProps {
  projects: ProjectItem[];
  loading: boolean;
  projectCategory: string;
  setProjectCategory: (cat: any) => void;
  selectedProject: ProjectItem | null;
  onSelectProject: (p: ProjectItem) => void;
  readmeContent: string;
  showReadme: boolean;
  isFetchingReadme: boolean;
  onFetchReadme: (p: ProjectItem) => void;
  onCloseReadme: () => void;
  onBack: () => void;
  npcColor: string;
  isMobile: boolean;
  playClick: () => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects, loading, projectCategory, setProjectCategory,
  selectedProject, onSelectProject, readmeContent, showReadme,
  isFetchingReadme, onFetchReadme, onCloseReadme, onBack,
  isMobile, playClick
}) => {
  const TabBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{
      padding: isMobile ? '4px 10px' : '5px 14px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px',
      textTransform: 'uppercase' as const, borderRadius: '5px',
      border: active ? '1px solid rgba(200,160,80,0.45)' : '1px solid rgba(200,160,80,0.1)',
      background: active ? 'linear-gradient(180deg, rgba(200,160,80,0.18) 0%, rgba(200,160,80,0.06) 100%)' : 'transparent',
      color: active ? RPG.goldBright : RPG.textDim, cursor: 'pointer', transition: 'all 0.2s',
      flex: isMobile ? 1 : 'initial',
    }}>{label}</button>
  );

  // Mobile Logic: If a project is selected, hide the list entirely
  const showList = !isMobile || !selectedProject;
  const showDetails = selectedProject;

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* LEFT: Project Grid */}
      {showList && (
        <div style={{
          flex: selectedProject && !isMobile ? '0 0 52%' : '1',
          display: 'flex', flexDirection: 'column' as const,
          borderRight: selectedProject && !isMobile ? `1px solid ${RPG.borderFaint}` : 'none',
          minHeight: 0, transition: 'flex 0.3s ease',
          width: '100%',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px', padding: '10px 14px', borderBottom: `1px solid ${RPG.borderFaint}`, flexShrink: 0 }}>
            <TabBtn label="Game Dev" active={projectCategory === 'GAME_DEV'} onClick={() => setProjectCategory('GAME_DEV')} />
            <TabBtn label="Software Eng" active={projectCategory === 'SDE'} onClick={() => setProjectCategory('SDE')} />
          </div>

          {/* Grid */}
          <div style={{ flex: 1, overflow: 'auto', padding: '10px', scrollbarWidth: 'thin' as const, scrollbarColor: '#3a2e45 transparent' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div style={{ width: '26px', height: '26px', border: '3px solid rgba(200,160,80,0.2)', borderTopColor: RPG.gold, borderRadius: '50%', animation: 'rpg-spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? '1fr'
                  : selectedProject ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: '8px',
              }}>
                {projects.map(project => (
                  <ProjectCard key={project.id} project={project} isSelected={selectedProject?.id === project.id} onClick={() => onSelectProject(project)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RIGHT: Detail Sidebar */}
      {showDetails && (
        <div style={{ flex: isMobile ? '1' : '0 0 48%', display: 'flex', flexDirection: 'column' as const, minHeight: 0, overflow: 'hidden' }}>
          {isMobile && !showReadme && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: `1px solid ${RPG.borderFaint}`, flexShrink: 0 }}>
              <span style={{ color: RPG.goldBright, fontSize: '11px', fontWeight: 700 }}>DETAILS</span>
              <button onClick={onBack} style={{
                fontSize: '10px', color: RPG.gold, background: 'rgba(200,160,80,0.08)',
                border: `1px solid ${RPG.borderSoft}`, borderRadius: '4px', padding: '3px 10px', cursor: 'pointer', fontWeight: 600,
              }}>← Back</button>
            </div>
          )}
          {showReadme ? (
            <div style={{ display: 'flex', flexDirection: 'column' as const, height: '100%', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: `1px solid ${RPG.borderFaint}`, flexShrink: 0 }}>
                <span style={{ color: RPG.goldBright, fontSize: '11px', fontWeight: 700 }}>📖 README</span>
                <button onClick={onCloseReadme} style={{
                  fontSize: '10px', color: RPG.gold, background: 'rgba(200,160,80,0.08)',
                  border: `1px solid ${RPG.borderSoft}`, borderRadius: '4px', padding: '3px 10px', cursor: 'pointer', fontWeight: 600,
                }}>← Back</button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', fontSize: '12px', lineHeight: 1.7, color: '#b0a090', scrollbarWidth: 'thin' as const, scrollbarColor: '#3a2e45 transparent' }}>
                {isFetchingReadme ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                    <div style={{ width: '22px', height: '22px', border: '3px solid rgba(200,160,80,0.2)', borderTopColor: RPG.gold, borderRadius: '50%', animation: 'rpg-spin 0.8s linear infinite' }} />
                  </div>
                ) : (
                  <div className="rpg-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{readmeContent}</ReactMarkdown></div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ overflow: 'auto', height: '100%', scrollbarWidth: 'thin' as const, scrollbarColor: '#3a2e45 transparent' }}>
              {selectedProject.imageUrl && (
                <div style={{ width: '100%', height: '150px', overflow: 'hidden', borderBottom: `1px solid ${RPG.borderFaint}` }}>
                  <img src={selectedProject.imageUrl} alt={selectedProject.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <div style={{ padding: '14px 16px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: RPG.goldBright }}>{selectedProject.title}</h3>
                <p style={{ margin: '0 0 12px', fontSize: '13px', lineHeight: 1.7, color: RPG.textMuted }}>{selectedProject.description}</p>

                {selectedProject.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '5px', marginBottom: '14px' }}>
                    {selectedProject.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                        background: 'rgba(200,160,80,0.06)', border: `1px solid ${RPG.borderFaint}`, color: RPG.goldDim, fontWeight: 600,
                      }}>{tag}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                  {selectedProject.link && selectedProject.link !== '#' && (
                    <a href={selectedProject.link} target="_blank" rel="noreferrer" style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px',
                      fontSize: '11px', fontWeight: 700, color: RPG.bgDark,
                      background: `linear-gradient(180deg, ${RPG.goldBright} 0%, ${RPG.gold} 100%)`,
                      border: `1px solid ${RPG.gold}`, borderRadius: '6px', textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(200,160,80,0.2)',
                    }}>Open Project ↗</a>
                  )}
                  <button onClick={() => onFetchReadme(selectedProject)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px',
                    fontSize: '11px', fontWeight: 700, color: RPG.gold, background: 'rgba(200,160,80,0.08)',
                    border: `1px solid ${RPG.borderSoft}`, borderRadius: '6px', cursor: 'pointer',
                  }}>📖 README</button>
                </div>
                <button onClick={onBack} style={{
                  marginTop: '14px', fontSize: '10px', color: RPG.textDim, background: 'none',
                  border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0,
                }}>← Back to all projects</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────
   Project Card — 3D hover effect
   ────────────────────────────── */
const ProjectCard: React.FC<{
  project: ProjectItem;
  isSelected: boolean;
  onClick: () => void;
}> = ({ project, isSelected, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCardMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const normalX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const normalY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setCardTilt({ x: -normalY * 8, y: normalX * 8 });
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setCardTilt({ x: 0, y: 0 }); }}
      onMouseMove={handleCardMouse}
      style={{
        position: 'relative',
        background: isSelected
          ? 'linear-gradient(180deg, rgba(200,160,80,0.14) 0%, rgba(200,160,80,0.04) 100%)'
          : hovered
            ? 'linear-gradient(180deg, rgba(30,22,40,0.95) 0%, rgba(22,16,30,0.98) 100%)'
            : 'linear-gradient(180deg, rgba(26,21,32,0.8) 0%, rgba(19,16,28,0.9) 100%)',
        border: isSelected ? '1px solid rgba(200,160,80,0.5)' : `1px solid ${RPG.borderFaint}`,
        borderRadius: '10px',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: hovered ? 'transform 0.1s ease-out, box-shadow 0.15s ease' : 'all 0.3s ease',
        transform: hovered
          ? `perspective(500px) rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg) scale(1.04)`
          : 'perspective(500px) rotateX(0deg) rotateY(0deg) scale(1)',
        boxShadow: isSelected
          ? '0 4px 16px rgba(200,160,80,0.2), 0 0 20px rgba(200,160,80,0.08), inset 0 1px 0 rgba(200,160,80,0.15)'
          : hovered
            ? `0 ${10 + Math.abs(cardTilt.x)}px 25px rgba(0,0,0,0.5), 0 0 15px rgba(200,160,80,0.12), inset 0 1px 0 rgba(200,160,80,0.12)`
            : '0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(200,160,80,0.06)',
        transformStyle: 'preserve-3d' as const,
      }}
    >
      {/* Thumbnail — properly fitted */}
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a1225 0%, #0f0c18 100%)',
        borderBottom: `1px solid ${RPG.borderFaint}`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain', // Changed from cover to contain
              objectPosition: 'center',
              display: 'block',
              opacity: hovered ? 1 : 0.85,
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              backgroundColor: '#0f0c18' // Background for contained images
            }}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              // Show a fallback sibling if we had one, but simple hiding reveals the background
              // For a better fallback, we'd need state, but this CSS approach works for now to hide broken icon
              e.currentTarget.parentElement?.classList.add('image-error');
            }}
          />
        ) : (
          <div style={{
            fontSize: '24px', fontWeight: 700, color: RPG.goldDim,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${RPG.bgDark}, ${RPG.borderFaint})`
          }}>
            {project.title.charAt(0)}
          </div>
        )}

        {/* Placeholder for broken images (using CSS adjacent selector logic if we could, but here we just rely on the background) */}

        {/* Image overlay gradient  */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
          background: 'linear-gradient(0deg, rgba(19,16,28,0.8) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        {/* Inner bevel on image area */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(200,160,80,0.05)',
          borderRadius: '10px 10px 0 0',
        }} />
      </div>

      {/* Text content — raised layer */}
      <div style={{
        padding: '8px 10px 9px',
        transform: 'translateZ(8px)',
        position: 'relative',
      }}>
        <h4 style={{
          margin: 0, fontSize: '11px', fontWeight: 700,
          color: isSelected ? RPG.goldBright : hovered ? '#d4c4a4' : '#b8a890',
          whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'color 0.2s ease',
        }}>{project.title}</h4>
        <p style={{
          margin: '4px 0 0', fontSize: '9px', color: RPG.textDim,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          lineHeight: 1.45,
        }}>{project.description}</p>
      </div>

      {/* Specular glare — follows mouse on card */}
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse at ${(cardTilt.y / 8 + 0.5) * 100}% ${(-cardTilt.x / 8 + 0.5) * 100}%, rgba(255,240,200,0.12) 0%, rgba(255,240,200,0.02) 40%, transparent 65%)`,
          borderRadius: '10px',
          mixBlendMode: 'overlay' as const,
        }} />
      )}

      {/* Selected indicator glow ring */}
      {isSelected && (
        <div style={{
          position: 'absolute', inset: '-1px', pointerEvents: 'none',
          borderRadius: '11px',
          border: '1px solid rgba(200,160,80,0.3)',
          boxShadow: '0 0 10px rgba(200,160,80,0.1)',
        }} />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Services View — Supports Services, Achievements, Certifications
   ───────────────────────────────────────────── */
interface ServicesViewProps {
  npc: any;
  serviceCategory: ServiceCategory;
  setServiceCategory: (cat: ServiceCategory) => void;
  isMobile: boolean;
  playClick: () => void;
}

const ServicesView: React.FC<ServicesViewProps> = ({
  npc, serviceCategory, setServiceCategory, isMobile, playClick
}) => {
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  // Reset selection when changing tabs
  useEffect(() => {
    setSelectedItem(null);
    setShowCertificate(false);
  }, [serviceCategory]);

  const items = serviceCategory === 'SERVICES'
    ? (npc.dialogue.listItems?.map((item: any, i: number) => ({
      id: `service-${i}`,
      title: item.title,
      description: item.desc
    })) || [])
    : SERVICE_DATA[serviceCategory];

  const TabBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{
      padding: isMobile ? '4px 10px' : '10px 20px', fontSize: isMobile ? '11px' : '14px', fontWeight: 700, letterSpacing: '0.8px',
      textTransform: 'uppercase' as const, borderRadius: '5px',
      border: active ? '1px solid rgba(200,160,80,0.45)' : '1px solid rgba(200,160,80,0.1)',
      background: active ? 'linear-gradient(180deg, rgba(200,160,80,0.18) 0%, rgba(200,160,80,0.06) 100%)' : 'transparent',
      color: active ? RPG.goldBright : RPG.textDim, cursor: CURSOR_STYLE, transition: 'all 0.2s',
      flex: isMobile ? 1 : 'initial', whiteSpace: 'nowrap'
    }}>{label}</button>
  );

  const showList = (!isMobile || !selectedItem) && !showCertificate;
  const showDetails = !!selectedItem;

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: 0, overflow: 'hidden', flexDirection: 'column', userSelect: 'none', cursor: CURSOR_STYLE }}>

      {/* ── TABS ── */}
      <div style={{
        display: 'flex', gap: '6px', padding: '10px 14px',
        borderBottom: `1px solid ${RPG.borderFaint}`, flexShrink: 0,
        overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none'
      }}>
        <TabBtn label="Services" active={serviceCategory === 'SERVICES'} onClick={() => setServiceCategory('SERVICES')} />
        <TabBtn label="Achievements" active={serviceCategory === 'ACHIEVEMENTS'} onClick={() => setServiceCategory('ACHIEVEMENTS')} />
        <TabBtn label="Certifications" active={serviceCategory === 'CERTIFICATIONS'} onClick={() => setServiceCategory('CERTIFICATIONS')} />
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ── LIST / GRID VIEW ── */}
        {showList && (
          <div style={{
            flex: (selectedItem && !isMobile) ? '0 0 50%' : '1',
            display: 'flex', flexDirection: 'column',
            borderRight: (selectedItem && !isMobile) ? `1px solid ${RPG.borderFaint}` : 'none',
            overflow: 'auto', padding: '12px',
            transition: 'flex 0.3s ease'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : serviceCategory === 'SERVICES'
                  ? 'repeat(2, 1fr)'
                  : 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '10px'
            }}>
              {items.map((item: ServiceItem) => (
                <div key={item.id}
                  onClick={() => {
                    if (serviceCategory !== 'SERVICES') {
                      playClick(); setSelectedItem(item); setShowCertificate(false);
                    }
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: selectedItem?.id === item.id
                      ? 'linear-gradient(180deg, rgba(200,160,80,0.14) 0%, rgba(200,160,80,0.04) 100%)'
                      : 'linear-gradient(180deg, rgba(200,160,80,0.08) 0%, rgba(200,160,80,0.02) 100%)',
                    border: selectedItem?.id === item.id
                      ? '1px solid rgba(200,160,80,0.5)'
                      : `1px solid ${RPG.borderFaint}`,
                    cursor: CURSOR_STYLE, transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', gap: '4px'
                  }}
                >
                  <h4 style={{ margin: 0, color: RPG.goldBright, fontSize: isMobile ? '13px' : '16px', fontWeight: 700 }}>{item.title}</h4>
                  <p style={{ margin: 0, color: RPG.textDim, fontSize: isMobile ? '11px' : '14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DETAILS VIEW ── */}
        {showDetails && selectedItem && (
          <div style={{
            flex: (isMobile || showCertificate) ? '1' : '0 0 50%',
            display: 'flex', flexDirection: 'column',
            minHeight: 0, overflow: 'hidden',
            background: 'rgba(0,0,0,0.2)'
          }}>
            {/* Header / Back Button for Mobile */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px', borderBottom: `1px solid ${RPG.borderFaint}`, flexShrink: 0
            }}>
              <span style={{ color: RPG.goldBright, fontSize: '11px', fontWeight: 700 }}>
                {showCertificate ? 'CERTIFICATE PREVIEW' : 'DETAILS'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {showCertificate && (
                  <button onClick={() => setShowCertificate(false)} style={{
                    fontSize: '10px', color: RPG.gold, background: 'rgba(200,160,80,0.08)',
                    border: `1px solid ${RPG.borderSoft}`, borderRadius: '4px', padding: '3px 10px', cursor: CURSOR_STYLE, fontWeight: 600,
                  }}>Close Preview</button>
                )}
                <button onClick={() => { playClick(); setSelectedItem(null); }} style={{
                  fontSize: '10px', color: RPG.gold, background: 'rgba(200,160,80,0.08)',
                  border: `1px solid ${RPG.borderSoft}`, borderRadius: '4px', padding: '3px 10px', cursor: CURSOR_STYLE, fontWeight: 600,
                }}>← Back</button>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {showCertificate ? (
                <div style={{ flex: 1, overflow: 'auto', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0c18' }}>
                  {selectedItem.pdf ? (
                    <iframe src={selectedItem.pdf} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '4px' }} title="Certificate PDF" />
                  ) : selectedItem.image ? (
                    <img src={selectedItem.image} alt={selectedItem.title} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '4px', border: `1px solid ${RPG.borderFaint}` }} />
                  ) : (
                    <div style={{ color: RPG.textDim }}>No certificate file available.</div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '24px', overflow: 'auto' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: isMobile ? '16px' : '22px', fontWeight: 700, color: RPG.goldBright, lineHeight: 1.4 }}>
                    {selectedItem.title}
                  </h3>
                  <div style={{ marginBottom: '20px', fontSize: isMobile ? '13px' : '16px', lineHeight: 1.6, color: RPG.textBody }}>
                    {selectedItem.description}
                  </div>

                  {selectedItem.details && (
                    <div style={{ marginBottom: '20px' }}>
                      {selectedItem.details.map((detail, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: '8px', marginBottom: '8px',
                          fontSize: isMobile ? '12px' : '15px', lineHeight: 1.6, color: RPG.textMuted
                        }}>
                          <span style={{ color: RPG.goldDim }}>•</span>
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(selectedItem.image || selectedItem.pdf) && (
                    <button
                      onClick={() => { playClick(); setShowCertificate(true); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 16px', width: '100%', justifyContent: 'center',
                        background: `linear-gradient(180deg, ${RPG.gold} 0%, ${RPG.goldDim} 100%)`,
                        border: 'none', borderRadius: '6px',
                        color: '#1a1520', fontSize: '13px', fontWeight: 700,
                        cursor: CURSOR_STYLE, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>📜</span> View Certificate
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
