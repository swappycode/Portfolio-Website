import { create } from 'zustand';
import { GameState, NPCRole, ProjectCategory } from '../types';
import { NPC_CONFIG, WORLD_RADIUS } from '../config/world.config';
import { Quaternion, Vector3 } from 'three';

interface GameStore extends GameState {
}

export const useGameStore = create<GameStore>((set, get) => ({
  activeNPC: null,
  visitedNPCs: {},
  isAutoWalking: false,
  targetRotationQuaternion: null,
  dialogueOpen: false,
  projectCategory: 'GAME_DEV',

  setActiveNPC: (id) => set({ activeNPC: id }),

  setVisitedNPC: (id) => set((state) => ({
    visitedNPCs: { ...state.visitedNPCs, [id]: true }
  })),

  startAutoWalk: (npcId) => {
    const npc = NPC_CONFIG.find(n => n.id === npcId);
    if (!npc) return;

    // Calculate the target rotation for the world so NPC is at (0, Radius, 0)
    // Actually, logic is handled in Scene, we just set flag here
    // But for a robust calculation, we need the NPC's base position.

    // Simplification: We just tell the renderer "Go to this NPC" 
    // and let the Scene component calculate the Quaternion.
    set({
      isAutoWalking: true,
      activeNPC: npcId,
      dialogueOpen: false // Close dialogue while moving
    });
  },

  cancelAutoWalk: () => set({ isAutoWalking: false, targetRotationQuaternion: null }),

  setDialogueOpen: (isOpen) => set({ dialogueOpen: isOpen }),

  setProjectCategory: (category) => set({ projectCategory: category })
}));
