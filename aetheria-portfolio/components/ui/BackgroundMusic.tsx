
import React, { useEffect, useRef, useState } from 'react';

interface BackgroundMusicProps {
    isMobile: boolean;
}

export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({ isMobile }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [volume, setVolume] = useState(0.4); // Start with a reasonable volume

    useEffect(() => {
        // Try to play automatically on mount
        const playAudio = async () => {
            if (audioRef.current) {
                try {
                    audioRef.current.volume = volume;
                    await audioRef.current.play();
                    setIsPlaying(true);
                } catch (err) {
                    console.log('Autoplay blocked, waiting for interaction');
                    setIsPlaying(false);
                }
            }
        };

        playAudio();

        // If autoplay was blocked, we need a user interaction to start it
        const handleInteraction = () => {
            if (!hasInteracted && audioRef.current) {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    setHasInteracted(true);
                }).catch(e => console.error("Playback failed:", e));
            }
        };

        const options = { capture: true, once: true };
        document.addEventListener('click', handleInteraction, options);
        document.addEventListener('touchstart', handleInteraction, options);
        document.addEventListener('keydown', handleInteraction, options);

        return () => {
            document.removeEventListener('click', handleInteraction, options);
            document.removeEventListener('touchstart', handleInteraction, options);
            document.removeEventListener('keydown', handleInteraction, options);
        };
    }, [hasInteracted]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.error(e));
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className={`fixed z-50 ${isMobile ? 'bottom-[72px] right-[20px]' : 'bottom-6 right-6'}`}>
            <audio
                ref={audioRef}
                src="/models/bgmusic.mp3"
                loop
            />

            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent ensuring interaction logic triggers unnecessarily
                    togglePlay();
                }}
                style={{
                    background: 'linear-gradient(180deg, rgba(26,21,32,0.92) 0%, rgba(19,16,28,0.95) 100%)',
                    border: '1px solid rgba(139,105,20,0.4)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4), 0 0 10px rgba(139,105,20,0.1)',
                    color: isPlaying ? '#e8d5a3' : '#6b5e50',
                    width: isMobile ? '56px' : '48px',
                    height: isMobile ? '56px' : '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: isPlaying ? 'scale(1)' : 'scale(0.95)'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(200,160,80,0.8)';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(200,160,80,0.3)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(139,105,20,0.4)';
                    e.currentTarget.style.color = isPlaying ? '#e8d5a3' : '#6b5e50';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 10px rgba(139,105,20,0.1)';
                }}
                aria-label={isPlaying ? "Mute Music" : "Play Music"}
            >
                {isPlaying ? (
                    // Volume / Speaker Icon
                    <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? "24" : "20"} height={isMobile ? "24" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                ) : (
                    // Mute Icon
                    <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? "24" : "20"} height={isMobile ? "24" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                )}
            </button>
        </div>
    );
};
