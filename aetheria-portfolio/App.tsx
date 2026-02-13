import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useProgress } from '@react-three/drei';
import { Experience } from './components/canvas/Experience';
import { Navbar } from './components/ui/Navbar';
import { FloatingCard } from './components/ui/FloatingCard';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { Joystick } from './components/ui/Joystick';

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
      <Navbar isMobile={isMobile} />
      <FloatingCard isMobile={isMobile} />

      {/* Mobile Joystick - hidden during loading */}
      {isMobile && !isLoading && (
        <Joystick onMove={handleJoystickMove} onEnd={handleJoystickEnd} />
      )}

      {/* Controls hint - desktop only */}
      {!isMobile && (
        <div className="absolute bottom-6 left-6 pointer-events-none text-gray-400 text-xs font-mono z-10">
          <div className="bg-white/50 p-2 rounded backdrop-blur-sm">
            WASD / ARROWS to Move<br />
            Walk to NPCs to interact
          </div>
        </div>
      )}

      <LoadingScreen />
    </div>
  );
}

export default App;
