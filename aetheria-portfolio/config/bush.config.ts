// Bush placement configuration
export const BUSH_CONFIG = {
  // Total bush count
  totalBushes: 80,
  
  // Bush size configuration
  bushSizes: {
    minScale: 0.1,
    maxScale: 0.1
  },
  
  // Bush models available (will randomly select between bush1.glb and bush2.glb)
  bushModels: ['bush1', 'bush2']
};

// Fallen tree placement configuration
export const FALLENTREE_CONFIG = {
  // Total fallen tree count
  totalFallenTrees: 40,
  
  // Fallen tree size configuration
  fallenTreeSizes: {
    minScale: 0.1,
    maxScale: 0.1
  }
};

// Dead tree placement configuration
export const DEADTREE_CONFIG = {
  // Total dead tree count
  totalDeadTrees: 30,
  
  // Dead tree size configuration
  deadTreeSizes: {
    minScale: 0.1,
    maxScale: 0.1
  }
};

// Rock placement configuration
export const ROCK_CONFIG = {
  // Total rock count
  totalRocks: 80,
  
  // Rock size configuration
  rockSizes: {
    minScale: 0.07,
    maxScale: 0.1
  }
};
