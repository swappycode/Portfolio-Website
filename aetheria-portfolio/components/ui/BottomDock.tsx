import React, { useMemo } from 'react';
import { NPC_CONFIG } from '../../config/world.config';
import { useGameStore } from '../../store/gameStore';
import { NPCRole } from '../../types';

const EnvelopeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V6a2 2 0 00-2-2H3a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const GitHubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 0.297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.467-1.333-5.467-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.807 5.625-5.48 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.216.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12z"
    />
  </svg>
);

const TwitterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43.36a8.94 8.94 0 0 1-2.83 1.08A4.48 4.48 0 0 0 16.11 0c-2.5 0-4.5 2.24-3.93 4.66A12.94 12.94 0 0 1 1.64.88a4.48 4.48 0 0 0 1.39 6A4.41 4.41 0 0 1 .96 6v.06a4.48 4.48 0 0 0 3.59 4.39 4.48 4.48 0 0 1-2.02.08 4.48 4.48 0 0 0 4.18 3.11A9 9 0 0 1 0 19.54a12.68 12.68 0 0 0 6.92 2.03c8.3 0 12.84-7.2 12.56-13.67A9.18 9.18 0 0 0 23 3z" />
  </svg>
);

type ContactDetails = {
  email?: string;
  github?: string;
  twitter?: string;
};

const parseContactDetails = (details?: string): ContactDetails => {
  if (!details) return {};

  const email = details.match(/email:\s*([^|\s]+)/i)?.[1];
  const githubRaw = details.match(/github:\s*([^|\s]+)/i)?.[1];
  const twitterRaw = details.match(/twitter:\s*([^|\s]+)/i)?.[1];

  const github = githubRaw?.replace(/^@/, '');
  const twitter = twitterRaw?.replace(/^@/, '');

  return { email, github, twitter };
};

export const BottomDock: React.FC = () => {
  const { startAutoWalk, activeNPC, isAutoWalking } = useGameStore();

  const navItems = useMemo(
    () => NPC_CONFIG.filter((n) => n.role !== NPCRole.CONTACT),
    []
  );

  const contactNPC = useMemo(
    () => NPC_CONFIG.find((n) => n.role === NPCRole.CONTACT),
    []
  );
  const contact = useMemo(
    () => parseContactDetails(contactNPC?.dialogue.details),
    [contactNPC?.dialogue.details]
  );

  const emailHref = contact.email ? `mailto:${contact.email}` : undefined;
  const githubHref = contact.github ? `https://github.com/${contact.github}` : undefined;
  const twitterHref = contact.twitter ? `https://x.com/${contact.twitter}` : undefined;

  return (
    <div className="absolute bottom-6 right-6 z-50 pointer-events-none">
      <div className="pointer-events-auto aeth-glass-frame">
        <div className="aeth-glass-panel px-3 py-2 flex items-center gap-3 text-white">
          <div className="flex items-center gap-1">
            {navItems.map((npc) => {
              const isActive = activeNPC === npc.id;
              const isDisabled = isAutoWalking && activeNPC === npc.id;
              return (
                <button
                  key={npc.id}
                  onClick={() => startAutoWalk(npc.id)}
                  disabled={isDisabled}
                  className={[
                    'px-3 py-2 rounded-xl text-[11px] font-bold tracking-[0.16em] uppercase transition-all',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70',
                    isActive ? 'bg-white/12 text-white border border-white/12' : 'text-white/55 hover:text-white hover:bg-white/8',
                    isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  ].join(' ')}
                >
                  {npc.role}
                </button>
              );
            })}
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <a
              href={emailHref ?? '#'}
              onClick={(e) => {
                if (!emailHref) e.preventDefault();
              }}
              aria-disabled={!emailHref}
              className={[
                'aeth-icon-btn text-fuchsia-100 ring-1 ring-fuchsia-400/25 shadow-[0_0_20px_rgba(217,70,239,0.22)]',
                !emailHref ? 'opacity-40 pointer-events-none' : ''
              ].join(' ')}
              aria-label="Email"
              title={emailHref ? 'Email' : 'Email (set in world.config.ts)'}
            >
              <EnvelopeIcon className="h-5 w-5" />
            </a>

            <a
              href={githubHref ?? '#'}
              target={githubHref ? '_blank' : undefined}
              rel={githubHref ? 'noreferrer' : undefined}
              onClick={(e) => {
                if (!githubHref) e.preventDefault();
              }}
              aria-disabled={!githubHref}
              className={[
                'aeth-icon-btn text-sky-100 ring-1 ring-sky-400/25 shadow-[0_0_20px_rgba(56,189,248,0.2)]',
                !githubHref ? 'opacity-40 pointer-events-none' : ''
              ].join(' ')}
              aria-label="GitHub"
              title={githubHref ? 'GitHub' : 'GitHub (set in world.config.ts)'}
            >
              <GitHubIcon className="h-5 w-5" />
            </a>

            <a
              href={twitterHref ?? '#'}
              target={twitterHref ? '_blank' : undefined}
              rel={twitterHref ? 'noreferrer' : undefined}
              onClick={(e) => {
                if (!twitterHref) e.preventDefault();
              }}
              aria-disabled={!twitterHref}
              className={[
                'aeth-icon-btn text-cyan-100 ring-1 ring-cyan-300/25 shadow-[0_0_20px_rgba(34,211,238,0.18)]',
                !twitterHref ? 'opacity-40 pointer-events-none' : ''
              ].join(' ')}
              aria-label="Twitter"
              title={twitterHref ? 'Twitter/X' : 'Twitter/X (set in world.config.ts)'}
            >
              <TwitterIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
