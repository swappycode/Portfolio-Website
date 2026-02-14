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
  modelPath?: string; // Optional path to GLB model
  interruptAnim?: {
    name: string | string[];  // Single clip name or sequence of clip names
    interval?: number;        // Optional delay (unused for alternating mode)
  };
  dialogue: {
    intro: string;
    details?: string;
    image?: string; // Profile picture
    listItems?: { title: string; desc: string }[]; // For Services list
    links?: { label: string; url: string; icon?: string }[]; // For Contact links
    resumes?: { label: string; url: string }[]; // For Resume downloads
  };
}

export interface ProjectItem {
  id: string;
  slug?: string; // For Itch.io games - extracted from itch.io URL
  title: string;
  description: string;
  tags: string[];
  link?: string;
  imageUrl?: string;
}

// Backend API Response Types
export interface BackendApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
}

export interface GitHubProject {
  name: string;
  description: string;
  tags: string[];
  githubUrl: string;
  imageUrl?: string;
  language?: string;
  stars?: number;
  forks?: number;
  homepage?: string;
  readme?: string;
}

export interface ItchGame {
  id: number;
  slug: string;
  title: string;
  description: string;
  cover?: string;
  url: string;
  stats: {
    views: number;
    downloads: number;
    purchases: number;
  };
  platforms: {
    windows: boolean;
    linux: boolean;
    mac: boolean;
    android: boolean;
  };
  pricing: {
    min_price: number;
    earnings: any[];
  };
  published: {
    published: boolean;
    published_at: string;
    created_at: string;
  };
  github?: {
    stars: number;
    forks: number;
    language: string;
    html_url: string;
  };
  readme?: string;
  download_page: string;
}

export interface ProfileData {
  name: string;
  role: string;
  bio: string;
}

export type ProjectCategory = 'GAME_DEV' | 'SDE';

export interface GameState {
  // Navigation
  activeNPC: string | null;
  visitedNPCs: Record<string, boolean>;
  isAutoWalking: boolean;
  targetRotationQuaternion: [number, number, number, number] | null;

  // Interaction
  dialogueOpen: boolean;
  projectCategory: ProjectCategory;
  serviceCategory: ServiceCategory;

  // Actions
  setActiveNPC: (id: string | null) => void;
  setVisitedNPC: (id: string) => void;
  startAutoWalk: (npcId: string) => void;
  cancelAutoWalk: () => void;
  setDialogueOpen: (isOpen: boolean) => void;
  setProjectCategory: (category: ProjectCategory) => void;
  setServiceCategory: (category: ServiceCategory) => void;
}

export type ServiceCategory = 'SERVICES' | 'ACHIEVEMENTS' | 'CERTIFICATIONS';

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  date?: string;
  details?: string[];
  image?: string; // For certificates
  pdf?: string;   // For achievements
  link?: string;
}


declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: string]: any;
    }
  }
}