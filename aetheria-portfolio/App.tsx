import React, { Suspense } from 'react';
import { Experience } from './components/canvas/Experience';
import { Navbar } from './components/ui/Navbar';
import { DialoguePanel } from './components/ui/DialoguePanel';

function App() {
  return (
    <div className="w-full h-screen relative bg-blue-50 overflow-hidden">
      
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-indigo-500 font-bold">Loading World...</div>}>
          <Experience />
        </Suspense>
      </div>

      {/* UI Layer */}
      <Navbar />
      <DialoguePanel />

      {/* Mobile/Controls hint */}
      <div className="absolute bottom-6 left-6 pointer-events-none text-gray-400 text-xs font-mono">
        <div className="bg-white/50 p-2 rounded backdrop-blur-sm">
          WASD / ARROWS to Move<br/>
          Walk to NPCs to interact
        </div>
      </div>
    </div>
  );
}

export default App;
