import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useProgress } from '@react-three/drei';
import { Experience } from './components/canvas/Experience';
import { Navbar } from './components/ui/Navbar';
import { FloatingCard } from './components/ui/FloatingCard';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { Joystick } from './components/ui/Joystick';
import { BackgroundMusic } from './components/ui/BackgroundMusic';

function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  const { active, progress } = useProgress();
  const isLoading = active || progress < 100;

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isTouchDevice || isMobileUA);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle joystick movement
  const handleJoystickMove = useCallback((x: number, y: number) => {
    setJoystickInput({ x, y });

    // Dispatch keyboard-like events for the Experience component
    const threshold = 0.3;

    const forward = y > threshold;
    const backward = y < -threshold;
    const left = x < -threshold;
    const right = x > threshold;

    // Create and dispatch custom events that Experience can listen to
    window.dispatchEvent(new CustomEvent('joystickinput', {
      detail: { forward, backward, left, right }
    }));
  }, []);

  const handleJoystickEnd = useCallback(() => {
    setJoystickInput({ x: 0, y: 0 });
    window.dispatchEvent(new CustomEvent('joystickinput', {
      detail: { forward: false, backward: false, left: false, right: false }
    }));
  }, []);

  return (
    <div className="w-full h-screen relative bg-blue-50 overflow-hidden">

      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <Experience isMobile={isMobile} />
        </Suspense>
      </div>

      {/* UI Layer */}
      <BackgroundMusic isMobile={isMobile} />
      <Navbar isMobile={isMobile} />
      <FloatingCard isMobile={isMobile} />

      {/* Mobile Joystick - hidden during loading */}
      {isMobile && !isLoading && (
        <Joystick onMove={handleJoystickMove} onEnd={handleJoystickEnd} />
      )}

      {/* Controls hint - desktop only */}
      {!isMobile && (
        <div className="absolute bottom-8 left-8 pointer-events-none z-10">
          <div style={{
            background: 'linear-gradient(180deg, rgba(26,21,32,0.92) 0%, rgba(19,16,28,0.95) 100%)',
            border: '1px solid rgba(139,105,20,0.4)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#c8b8a0',
            fontSize: '12px',
            fontFamily: "'Segoe UI', sans-serif",
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 10px rgba(139,105,20,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ color: '#e8d5a3', fontWeight: 700, letterSpacing: '0.5px' }}>CONTROLS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(200,160,80,0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(200,160,80,0.2)', fontSize: '10px', fontWeight: 700 }}>WASD</span>
              <span>/</span>
              <span style={{ background: 'rgba(200,160,80,0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(200,160,80,0.2)', fontSize: '10px', fontWeight: 700 }}>ARROWS</span>
              <span>to Move</span>
            </div>
            <div style={{ fontSize: '11px', opacity: 0.8, fontStyle: 'italic' }}>Walk to NPCs to interact</div>
          </div>
        </div>
      )}

      <LoadingScreen />
    </div>
  );
}

export default App;
