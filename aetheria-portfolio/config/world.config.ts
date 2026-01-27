import { Vector3, Euler } from 'three';
import { NPCData, NPCRole } from '../types';

export const WORLD_RADIUS = 10;
export const PLAYER_SIZE = 0.25; // Character is now half the size
export const CAMERA_DISTANCE = 1.6; // Slightly farther camera for better view
export const CAMERA_HEIGHT = 11.3; // Higher camera to see full character

// Helper to place items on sphere surface
const getPositionOnSphere = (radius: number, theta: number, phi: number): [number, number, number] => {
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
};

export const NPC_CONFIG: NPCData[] = [
  {
    id: 'npc-about',
    role: NPCRole.ABOUT,
    name: 'Guide',
    position: getPositionOnSphere(WORLD_RADIUS, 0, Math.PI / 2.5), // Front-ish
    color: '#FF9F1C',
    dialogue: {
      intro: "Hi! I represent the developer behind this world.",
      details: "I'm a Frontend Specialist with a passion for 3D web experiences. I love React, Three.js, and creating performant UIs."
    }
  },
  {
    id: 'npc-projects',
    role: NPCRole.PROJECTS,
    name: 'Builder',
    position: getPositionOnSphere(WORLD_RADIUS, Math.PI / 2, Math.PI / 2), // Right
    color: '#2EC4B6',
    dialogue: {
      intro: "This is the workshop. Check out what we've built."
    }
  },
  {
    id: 'npc-services',
    role: NPCRole.SERVICES,
    name: 'Merchant',
    position: getPositionOnSphere(WORLD_RADIUS, Math.PI, Math.PI / 2.5), // Back
    color: '#E71D36',
    dialogue: {
      intro: "Looking for collaboration? Here's what I can offer.",
      details: "Full Stack Development, 3D Web Integration, Performance Optimization, and Technical Consulting."
    }
  },
  {
    id: 'npc-contact',
    role: NPCRole.CONTACT,
    name: 'Messenger',
    position: getPositionOnSphere(WORLD_RADIUS, -Math.PI / 2, Math.PI / 2), // Left
    color: '#A06CD5',
    dialogue: {
      intro: "Ready to connect? Send a message.",
      details: "email: dev@example.com | github: @devprofile | twitter: @devtweets"
    }
  }
];

export const COLORS = {
  sky: '#87CEEB',
  ground: '#9be685', // bright pastel green
  path: '#eaddcf',
  water: '#4fc3f7',
  player: '#333333'
};

// Cel-shader configuration for anime-style rendering
export const CEL_SHADER_CONFIG = {
  // Base color for the sphere ground
  baseColor: '#9be685',
  // Outline color (black for classic anime look)
  outlineColor: '#000000',
  // Thickness of the outline (0.0 to 1.0)
  outlineThickness: 0.8,
  // Number of shadow bands (3-6 for good cel-shading)
  shadowLevels: 4,
  // Rim lighting intensity (0.0 to 1.0)
  rimLighting: 0.4,
  // Light direction for consistent shading
  lightDirection: { x: 1, y: 1, z: 1 }
};
