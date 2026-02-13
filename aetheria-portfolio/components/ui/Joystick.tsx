import React, { useRef, useState, useCallback, useEffect } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove, onEnd }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const maxDistance = 50; // Maximum joystick movement in pixels

  const calculateJoystickPosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      dx = Math.cos(angle) * maxDistance;
      dy = Math.sin(angle) * maxDistance;
    }

    return { x: dx, y: dy };
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number, touchId?: number) => {
    setActive(true);

    if (touchId !== undefined) touchIdRef.current = touchId;
    const pos = calculateJoystickPosition(clientX, clientY);
    setPosition(pos);
    onMove(pos.x / maxDistance, -pos.y / maxDistance); // Invert Y for natural feel
  }, [calculateJoystickPosition, onMove]);

  const handleMove = useCallback((clientX: number, clientY: number, touchId?: number) => {
    if (!active) return;
    if (touchId !== undefined && touchIdRef.current !== touchId) return;

    const pos = calculateJoystickPosition(clientX, clientY);
    setPosition(pos);
    onMove(pos.x / maxDistance, -pos.y / maxDistance);
  }, [active, calculateJoystickPosition, onMove]);

  const handleEnd = useCallback((touchId?: number) => {
    if (touchId !== undefined && touchIdRef.current !== touchId) return;

    setActive(false);
    setPosition({ x: 0, y: 0 });
    touchIdRef.current = null;
    onEnd();
  }, [onEnd]);

  // Touch events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      handleStart(touch.clientX, touch.clientY, touch.identifier);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current);
      if (touch) {
        handleMove(touch.clientX, touch.clientY, touch.identifier);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current);
      if (touch) {
        handleEnd(touch.identifier);
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  // Mouse events (for desktop testing)
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);

    const onMouseMove = (ev: MouseEvent) => {
      handleMove(ev.clientX, ev.clientY);
    };

    const onMouseUp = () => {
      handleEnd();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      style={{
        position: 'fixed',
        bottom: '40px',
        left: '40px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'rgba(26, 21, 32, 0.6)',
        border: '2px solid rgba(200, 160, 80, 0.3)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.3s ease, transform 0.2s ease',
        opacity: active ? 1 : 0.7,
        transform: active ? 'scale(1.05)' : 'scale(1)',
        boxShadow: active
          ? '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(200,160,80,0.15)'
          : '0 4px 16px rgba(0,0,0,0.3)',
      }}
    >
      {/* Inner ring */}
      <div style={{
        position: 'absolute',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        border: '1px solid rgba(200, 160, 80, 0.15)',
      }} />

      {/* Center dot */}
      <div style={{
        position: 'absolute',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'rgba(200, 160, 80, 0.4)',
      }} />

      {/* Joystick knob */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: active
          ? 'radial-gradient(circle at 30% 30%, rgba(232, 213, 163, 0.9), rgba(200, 160, 80, 0.7))'
          : 'radial-gradient(circle at 30% 30%, rgba(200, 160, 80, 0.8), rgba(139, 105, 20, 0.6))',
        border: `2px solid ${active ? 'rgba(232, 213, 163, 0.8)' : 'rgba(200, 160, 80, 0.5)'}`,
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: active ? 'none' : 'transform 0.15s ease-out',
        boxShadow: active
          ? '0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(200,160,80,0.4)'
          : '0 2px 8px rgba(0,0,0,0.3)',
      }} />
    </div>
  );
};

export default Joystick;
