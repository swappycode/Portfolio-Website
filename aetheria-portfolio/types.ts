export enum NPCRole {
  ABOUT = 'ABOUT',
  PROJECTS = 'PROJECTS',
  SERVICES = 'SERVICES',
  CONTACT = 'CONTACT'
}

export interface NPCData {
  id: string;
  role: NPCRole;
  name: string;
  position: [number, number, number]; // x, y, z relative to sphere center
  color: string;
  dialogue: {
    intro: string;
    details?: string;
  };
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  link?: string;
}

export type ProjectCategory = 'GAME_DEV' | 'SDE';

export interface GameState {
  // Navigation
  activeNPC: string | null;
  isAutoWalking: boolean;
  targetRotationQuaternion: [number, number, number, number] | null;
  
  // Interaction
  dialogueOpen: boolean;
  projectCategory: ProjectCategory;
  
  // Actions
  setActiveNPC: (id: string | null) => void;
  startAutoWalk: (npcId: string) => void;
  cancelAutoWalk: () => void;
  setDialogueOpen: (isOpen: boolean) => void;
  setProjectCategory: (category: ProjectCategory) => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: string]: any;
    }
  }
}