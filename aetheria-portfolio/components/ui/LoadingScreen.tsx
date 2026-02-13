import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

interface LoadingScreenProps {
  onStarted?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onStarted }) => {
  const { active, progress } = useProgress();
  const [smoothedProgress, setSmoothedProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [readyToStart, setReadyToStart] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/models/click.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    // Only update progress if it's higher than current (prevent backtracking)
    setSmoothedProgress(prev => Math.max(prev, progress));
  }, [progress]);

  useEffect(() => {
    if (!active && smoothedProgress >= 100) {
      setReadyToStart(true);
    }

    if (active) {
      setReadyToStart(false);
      setIsVisible(true);
      setIsFading(false);
    }
  }, [active, smoothedProgress]);

  const handleStart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }
    if (onStarted) onStarted();
    setIsFading(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 900);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#1a1520] text-[#e8d5a3] transition-opacity duration-700 ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
    >
      <div className="w-[320px] sm:w-[420px] text-center flex flex-col items-center">
        {/* RPG Title */}
        <div className="text-3xl font-bold tracking-wider uppercase text-[#e8d5a3] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-8"
          style={{ fontFamily: "'Cinzel', serif", textShadow: '0 0 10px rgba(200,160,80,0.3)' }}
        >
          Loading Swapnil's World
        </div>
        <div style={{ color: '#e8d5a3', marginTop: '10px', fontSize: '14px' }}>(Initializing 3D Engine)</div>

        {/* Ornament line */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#8b6914] to-transparent mb-8 opacity-50" />

        {/* Progress Bar Container */}
        <div className="relative w-full h-3 bg-[#0a0810] border border-[#8b6914]/30 rounded-full overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          {/* Progress Fill */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#8b6914] via-[#c8a050] to-[#8b6914] transition-[width] duration-300 ease-out"
            style={{ width: `${Math.min(smoothedProgress, 100)}%`, boxShadow: '0 0 10px rgba(200,160,80,0.4)' }}
          />
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] animate-[shimmer_2s_infinite]" />
        </div>

        {/* Status / Button */}
        <div className="mt-8 flex flex-col items-center justify-center h-[60px]">
          {!readyToStart ? (
            <>
              <div className="text-sm font-mono text-[#9e8e7a] tracking-widest mb-2">
                {Math.round(smoothedProgress)}%
              </div>
              <div className="text-xs text-[#6b5e50] italic animate-pulse">
                Summoning assets from the void...
              </div>
            </>
          ) : (
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-gradient-to-r from-[#8b6914] to-[#c8a050] text-[#1a1520] font-bold tracking-widest uppercase rounded-sm shadow-[0_0_20px_rgba(200,160,80,0.4)] hover:shadow-[0_0_30px_rgba(200,160,80,0.6)] hover:scale-105 transition-all duration-300 border border-[#e8d5a3]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Enter World
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
