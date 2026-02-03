import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

export const LoadingScreen: React.FC = () => {
  const { active, progress } = useProgress();
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!active && progress >= 100) {
      const fadeTimer = setTimeout(() => setIsFading(true), 200);
      const hideTimer = setTimeout(() => setIsVisible(false), 900);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }

    setIsVisible(true);
    setIsFading(false);
  }, [active, progress]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 text-white transition-opacity duration-700 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-[320px] sm:w-[420px] text-center">
        <div className="text-2xl font-bold tracking-wide">Loading Aetheria</div>
        <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 transition-[width] duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-white/70">{Math.round(progress)}%</div>
        <div className="mt-4 text-xs text-white/50">
          Preparing world assets...
        </div>
      </div>
    </div>
  );
};
