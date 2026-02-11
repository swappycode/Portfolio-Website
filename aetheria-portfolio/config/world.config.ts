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
    modelPath: '/models/Demon.glb',
    interruptAnim: {
      name: 'weapon',
      interval: 5,
    },
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
    modelPath: '/models/Fish.glb',
    interruptAnim: {
      name: 'hitreact',
    },
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
    modelPath: '/models/Ninja.glb',
    interruptAnim: {
      name: ['jump', 'jump_idle', 'jump_land'],
    },
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
    modelPath: '/models/Cactoro.glb',
    interruptAnim: {
      name: 'duck',
    },
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

// Path configuration for anime-style roads and paths
export const PATH_CONFIG = {
  // Main path properties
  mainPath: {
    width: 1.2,
    textureScale: 6.0,
    brickColor: '#b87333', // Warm bronze/copper
    mortarColor: '#6b4f31', // Dark brown
    segments: 16
  },
  // Side path properties
  sidePath: {
    width: 0.8,
    textureScale: 10.0,
    brickColor: '#a0522d', // Saddle brown
    mortarColor: '#5d4037', // Dark coffee brown
    segments: 16
  },
  // Path placement and elevation
  elevationOffset: 0.02, // How far above ground paths are placed
  // Path types and their positions
  pathLayout: {
    equator: true, // Main horizontal path
    primeMeridian: true, // Main vertical path
    additionalMeridian: true // Secondary vertical path
  }
};

// Tree placement configuration for structured forest distribution
export const TREE_CONFIG = {
  // Total tree count
  totalTrees: 80,

  // Path-side forest configuration
  pathForests: {
    // Distance from path edges where trees can spawn
    minDistanceFromPath: 0.8,
    maxDistanceFromPath: 2.5,
    // Number of trees per path segment
    treesPerPathSegment: 6,
    // Variation in tree size near paths
    sizeVariation: 0.3
  },

  // Forest clearing configuration
  forestClearings: {
    // Number of forest clusters
    clusterCount: 8,
    // Trees per cluster
    treesPerCluster: 5,
    // Cluster radius (how spread out trees are in a cluster)
    clusterRadius: 1.5,
    // Minimum distance between clusters
    minClusterDistance: 3.0
  },

  // Tree size configuration
  treeSizes: {
    minScale: 0.45,
    maxScale: 0.45,
    // Size variation based on location (paths vs forests)
    pathSizeMultiplier: 0.8,
    forestSizeMultiplier: 1.0
  },

  // Forest zone definitions (spherical coordinates)
  forestZones: [
    // Zone 1: Northern hemisphere, east side
    { center: { theta: Math.PI / 4, phi: Math.PI / 3 }, radius: 1.2 },
    // Zone 2: Northern hemisphere, west side  
    { center: { theta: -Math.PI / 4, phi: Math.PI / 3 }, radius: 1.2 },
    // Zone 3: Southern hemisphere, east side
    { center: { theta: Math.PI / 4, phi: 2 * Math.PI / 3 }, radius: 1.2 },
    // Zone 4: Southern hemisphere, west side
    { center: { theta: -Math.PI / 4, phi: 2 * Math.PI / 3 }, radius: 1.2 },
    // Zone 5: Upper northern area
    { center: { theta: 0, phi: Math.PI / 6 }, radius: 1.0 },
    // Zone 6: Upper southern area
    { center: { theta: 0, phi: 5 * Math.PI / 6 }, radius: 1.0 },
    // Zone 7: Side northern area
    { center: { theta: Math.PI / 2, phi: Math.PI / 3 }, radius: 1.0 },
    // Zone 8: Side southern area
    { center: { theta: -Math.PI / 2, phi: 2 * Math.PI / 3 }, radius: 1.0 }
  ]
};
