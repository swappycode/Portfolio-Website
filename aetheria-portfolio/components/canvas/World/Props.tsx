import React, { useMemo } from 'react';
import { Instance as DreiInstance, Instances, useGLTF } from '@react-three/drei';
import { Vector3, Quaternion, Mesh, Object3D } from 'three';
import { WORLD_RADIUS, TREE_CONFIG } from '../../../config/world.config';
import { BUSH_CONFIG, FALLENTREE_CONFIG, DEADTREE_CONFIG, ROCK_CONFIG } from '../../../config/bush.config';
import { ErrorBoundary } from '../../utils/ErrorBoundary';
import { sphericalToCartesian, checkCollisionWithPathPoints } from '../utils/collisionDetection';
import { generateStructuredPaths } from './Paths';

// Cast Instance to any to resolve TypeScript errors
const Instance = DreiInstance as any;

// Seeded pseudorandom number generator for deterministic tree placement
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Mulberry32 algorithm - produces consistent random numbers from a seed
  next(): number {
    this.seed |= 0;
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

// Fixed seed for consistent tree placement across page reloads
const TREE_SPAWN_SEED = 42; // Fixed seed - trees will always spawn the same way
const seededRandom = new SeededRandom(TREE_SPAWN_SEED);

// Fixed seed for consistent bush placement across page reloads
const BUSH_SPAWN_SEED = 123; // Different seed than trees
const bushSeededRandom = new SeededRandom(BUSH_SPAWN_SEED);

// Collision detection parameters
const TREE_COLLISION_RADIUS = 0.5; // Radius of tree bounding sphere
const PATH_COLLISION_BUFFER = 0.2; // Extra buffer around path for collision
const COLLISION_CHECK_RADIUS = TREE_COLLISION_RADIUS + PATH_COLLISION_BUFFER;
const BUSH_COLLISION_RADIUS = 0.4; // Smaller collision radius for bushes

// Generate trees with seeded random spawning and collision filtering
const useRandomTreeData = () => {
  return useMemo(() => {
    const trees: any[] = [];
    const _up = new Vector3(0, 1, 0);
    const _q = new Quaternion();

    // Get all path points from the actual path generation
    const pathsData = generateStructuredPaths();
    const allPathPoints = pathsData.flat(); // Flatten all path segments into one array

    const maxAttempts = TREE_CONFIG.totalTrees * 5; // Attempt up to 5x the target count
    let attempts = 0;

    // Spawn trees randomly across the sphere, filtering out those that collide with paths
    while (trees.length < TREE_CONFIG.totalTrees && attempts < maxAttempts) {
      attempts++;

      // Generate seeded random position on sphere surface using spherical coordinates
      const theta = seededRandom.next() * Math.PI * 2; // 0 to 2π (around)
      const phi = Math.acos(2 * seededRandom.next() - 1); // 0 to π (pole to pole, uniform distribution)
      const treePos = sphericalToCartesian(theta, phi, WORLD_RADIUS);

      // Check collision with all path points
      if (checkCollisionWithPathPoints(treePos, allPathPoints, COLLISION_CHECK_RADIUS)) {
        continue; // Skip this position if it collides with a path
      }

      // Calculate rotation to align tree with sphere normal
      _q.setFromUnitVectors(_up, treePos.clone().normalize());
      const correctionRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
      _q.multiply(correctionRotation);

      // Seeded random scale for variety
      const scale = TREE_CONFIG.treeSizes.minScale + seededRandom.next() *
        (TREE_CONFIG.treeSizes.maxScale - TREE_CONFIG.treeSizes.minScale);
      const finalScale = scale * (0.85 + seededRandom.next() * 0.3); // Add some variation

      trees.push({
        position: [treePos.x, treePos.y, treePos.z],
        quaternion: [_q.x, _q.y, _q.z, _q.w],
        scale: finalScale
      });
    }

    return trees;
  }, []);
};

// Generate bushes with seeded random spawning and collision filtering
const useRandomBushData = () => {
  return useMemo(() => {
    const bushes: any[] = [];
    const _up = new Vector3(0, 1, 0);
    const _q = new Quaternion();

    // Get all path points from the actual path generation
    const pathsData = generateStructuredPaths();
    const allPathPoints = pathsData.flat();

    const maxAttempts = BUSH_CONFIG.totalBushes * 5;
    let attempts = 0;

    // Spawn bushes randomly across the sphere, filtering out those that collide with paths
    while (bushes.length < BUSH_CONFIG.totalBushes && attempts < maxAttempts) {
      attempts++;

      // Generate seeded random position on sphere surface
      const theta = bushSeededRandom.next() * Math.PI * 2;
      const phi = Math.acos(2 * bushSeededRandom.next() - 1);
      const bushPos = sphericalToCartesian(theta, phi, WORLD_RADIUS);

      // Check collision with all path points (smaller collision radius for bushes)
      if (checkCollisionWithPathPoints(bushPos, allPathPoints, BUSH_COLLISION_RADIUS + PATH_COLLISION_BUFFER)) {
        continue; // Skip if collides with path
      }

      // Calculate rotation to align bush with sphere normal
      _q.setFromUnitVectors(_up, bushPos.clone().normalize());
      const correctionRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
      _q.multiply(correctionRotation);

      // Seeded random scale for variety
      const scale = BUSH_CONFIG.bushSizes.minScale + bushSeededRandom.next() *
        (BUSH_CONFIG.bushSizes.maxScale - BUSH_CONFIG.bushSizes.minScale);
      const finalScale = scale * (0.9 + bushSeededRandom.next() * 0.2);

      // Randomly select which bush model
      const bushModelIndex = Math.floor(bushSeededRandom.next() * BUSH_CONFIG.bushModels.length);
      const bushModel = BUSH_CONFIG.bushModels[bushModelIndex];

      bushes.push({
        position: [bushPos.x, bushPos.y, bushPos.z],
        quaternion: [_q.x, _q.y, _q.z, _q.w],
        scale: finalScale,
        model: bushModel
      });
    }

    return bushes;
  }, []);
};

// Component that tries to load external GLTF
const GLTFTrees: React.FC<{ data: any[] }> = ({ data }) => {
  // Expects a model at /models/tree.glb
  const { scene } = useGLTF('/models/tree.glb');

  // Find the first mesh in the GLTF to use as geometry source
  const treeMesh = useMemo(() => {
    let mesh: Mesh | null = null;
    scene.traverse((child) => {
      if ((child as Mesh).isMesh && !mesh) {
        mesh = child as Mesh;
      }
    });
    return mesh;
  }, [scene]);

  if (!treeMesh) throw new Error("No mesh found in tree.glb");

  return (
    <Instances range={data.length} geometry={treeMesh.geometry} material={treeMesh.material}>
      {data.map((d, i) => (
        <Instance
          key={i}
          position={d.position}
          quaternion={d.quaternion}
          scale={d.scale}
        />
      ))}
    </Instances>
  );
};

// Load both bush models and render them separately
const GLTFBushes: React.FC<{ data: any[] }> = ({ data }) => {
  const { scene: bush1Scene } = useGLTF('/models/bush1.glb');
  const { scene: bush2Scene } = useGLTF('/models/bush2.glb');

  // Find meshes in both bush models
  const bush1Mesh = useMemo(() => {
    let mesh: Mesh | null = null;
    bush1Scene.traverse((child) => {
      if ((child as Mesh).isMesh && !mesh) {
        mesh = child as Mesh;
      }
    });
    return mesh;
  }, [bush1Scene]);

  const bush2Mesh = useMemo(() => {
    let mesh: Mesh | null = null;
    bush2Scene.traverse((child) => {
      if ((child as Mesh).isMesh && !mesh) {
        mesh = child as Mesh;
      }
    });
    return mesh;
  }, [bush2Scene]);

  const bush1Data = data.filter(b => b.model === 'bush1');
  const bush2Data = data.filter(b => b.model === 'bush2');

  return (
    <group>
      {bush1Mesh && bush1Data.length > 0 && (
        <Instances range={bush1Data.length} geometry={bush1Mesh.geometry} material={bush1Mesh.material}>
          {bush1Data.map((d, i) => (
            <Instance
              key={`bush1-${i}`}
              position={d.position}
              quaternion={d.quaternion}
              scale={d.scale}
            />
          ))}
        </Instances>
      )}
      {bush2Mesh && bush2Data.length > 0 && (
        <Instances range={bush2Data.length} geometry={bush2Mesh.geometry} material={bush2Mesh.material}>
          {bush2Data.map((d, i) => (
            <Instance
              key={`bush2-${i}`}
              position={d.position}
              quaternion={d.quaternion}
              scale={d.scale}
            />
          ))}
        </Instances>
      )}
    </group>
  );
};

// Fallback Procedural Trees
const ProceduralTrees: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <group>
      {/* Trunks */}
      <Instances range={data.length}>
        <cylinderGeometry args={[0.1, 0.15, 1, 6]} />
        <meshStandardMaterial color="#8B4513" />
        {data.map((d, i) => (
          <Instance
            key={`trunk-${i}`}
            position={d.position}
            quaternion={d.quaternion}
            scale={d.scale}
          />
        ))}
      </Instances>

      {/* Foliage */}
      <Instances range={data.length}>
        <coneGeometry args={[0.6, 1.5, 7]} />
        <meshStandardMaterial color="#2d5a27" flatShading />
        {data.map((d, i) => (
          <Instance
            key={`leaf-${i}`}
            position={d.position}
            quaternion={d.quaternion}
            scale={d.scale}
          >
            {/* Note: In a real scenario, we'd offset the cone geometry or use a group. 
                 For this fallback, we'll accept the cone pivot is center, so it sits slightly inside trunk. 
                 To fix, we'd translate geometry. */}
          </Instance>
        ))}
      </Instances>
    </group>
  );
};

export const Trees: React.FC = () => {
  const treesData = useRandomTreeData();

  return (
    <ErrorBoundary fallback={<ProceduralTrees data={treesData} />}>
      <React.Suspense fallback={<ProceduralTrees data={treesData} />}>
        <GLTFTrees data={treesData} />
      </React.Suspense>
    </ErrorBoundary>
  );
};

export const Bushes: React.FC = () => {
  const bushesData = useRandomBushData();

  return (
    <ErrorBoundary fallback={<group />}>
      <React.Suspense fallback={<group />}>
        <GLTFBushes data={bushesData} />
      </React.Suspense>
    </ErrorBoundary>
  );
};
// Fixed seed for consistent fallen tree placement
const FALLENTREE_SPAWN_SEED = 456;
const fallenTreeSeededRandom = new SeededRandom(FALLENTREE_SPAWN_SEED);

// Generate fallen trees with seeded random spawning and collision filtering
const useRandomFallenTreeData = () => {
  return useMemo(() => {
    const fallenTrees: any[] = [];
    const _up = new Vector3(0, 1, 0);
    const _q = new Quaternion();

    // Get all path points from the actual path generation
    const pathsData = generateStructuredPaths();
    const allPathPoints = pathsData.flat();

    const { totalFallenTrees } = FALLENTREE_CONFIG;
    const { fallenTreeSizes: { minScale: ftMinScale, maxScale: ftMaxScale } } = FALLENTREE_CONFIG;

    const maxAttempts = totalFallenTrees * 5;
    let attempts = 0;

    while (fallenTrees.length < totalFallenTrees && attempts < maxAttempts) {
      attempts++;

      const theta = fallenTreeSeededRandom.next() * Math.PI * 2;
      const phi = Math.acos(2 * fallenTreeSeededRandom.next() - 1);
      const ftPos = sphericalToCartesian(theta, phi, WORLD_RADIUS);

      // Check collision with all path points
      if (checkCollisionWithPathPoints(ftPos, allPathPoints, TREE_COLLISION_RADIUS + PATH_COLLISION_BUFFER)) {
        continue;
      }

      // Calculate rotation to align with sphere normal
      _q.setFromUnitVectors(_up, ftPos.clone().normalize());
      const correctionRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
      _q.multiply(correctionRotation);

      // Seeded random scale for variety
      const scale = ftMinScale + fallenTreeSeededRandom.next() * (ftMaxScale - ftMinScale);
      const finalScale = scale * (0.9 + fallenTreeSeededRandom.next() * 0.2);

      fallenTrees.push({
        position: [ftPos.x, ftPos.y, ftPos.z],
        quaternion: [_q.x, _q.y, _q.z, _q.w],
        scale: finalScale
      });
    }

    return fallenTrees;
  }, []);
};

// Load fallen tree model and render
const GLTFFallenTrees: React.FC<{ data: any[] }> = ({ data }) => {
  const { scene } = useGLTF('/models/fallentree.glb');

  const ftMesh = useMemo(() => {
    let mesh: Mesh | null = null;
    scene.traverse((child) => {
      if ((child as Mesh).isMesh && !mesh) {
        mesh = child as Mesh;
      }
    });
    return mesh;
  }, [scene]);

  if (!ftMesh || data.length === 0) return null;

  return (
    <Instances range={data.length} geometry={ftMesh.geometry} material={ftMesh.material}>
      {data.map((d, i) => (
        <Instance
          key={i}
          position={d.position}
          quaternion={d.quaternion}
          scale={d.scale}
        />
      ))}
    </Instances>
  );
};

export const FallenTrees: React.FC = () => {
  const fallenTreesData = useRandomFallenTreeData();

  return (
    <ErrorBoundary fallback={<group />}>
      <React.Suspense fallback={<group />}>
        <GLTFFallenTrees data={fallenTreesData} />
      </React.Suspense>
    </ErrorBoundary>
  );
};
// Fixed seed for consistent dead tree placement
const DEADTREE_SPAWN_SEED = 789;
const deadTreeSeededRandom = new SeededRandom(DEADTREE_SPAWN_SEED);

// Generate dead trees with seeded random spawning and collision filtering
const useRandomDeadTreeData = () => {
  return useMemo(() => {
    const deadTrees: any[] = [];
    const _up = new Vector3(0, 1, 0);
    const _q = new Quaternion();

    // Get all path points from the actual path generation
    const pathsData = generateStructuredPaths();
    const allPathPoints = pathsData.flat();

    const { totalDeadTrees } = DEADTREE_CONFIG;
    const { deadTreeSizes: { minScale: dtMinScale, maxScale: dtMaxScale } } = DEADTREE_CONFIG;

    const maxAttempts = totalDeadTrees * 5;
    let attempts = 0;

    while (deadTrees.length < totalDeadTrees && attempts < maxAttempts) {
      attempts++;

      const theta = deadTreeSeededRandom.next() * Math.PI * 2;
      const phi = Math.acos(2 * deadTreeSeededRandom.next() - 1);
      const dtPos = sphericalToCartesian(theta, phi, WORLD_RADIUS);

      // Check collision with all path points
      if (checkCollisionWithPathPoints(dtPos, allPathPoints, TREE_COLLISION_RADIUS + PATH_COLLISION_BUFFER)) {
        continue;
      }

      // Calculate rotation to align with sphere normal
      _q.setFromUnitVectors(_up, dtPos.clone().normalize());
      const correctionRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
      _q.multiply(correctionRotation);

      // Seeded random scale for variety
      const scale = dtMinScale + deadTreeSeededRandom.next() * (dtMaxScale - dtMinScale);
      const finalScale = scale * (0.9 + deadTreeSeededRandom.next() * 0.2);

      deadTrees.push({
        position: [dtPos.x, dtPos.y, dtPos.z],
        quaternion: [_q.x, _q.y, _q.z, _q.w],
        scale: finalScale
      });
    }

    return deadTrees;
  }, []);
};

// Load dead tree model and render
const GLTFDeadTrees: React.FC<{ data: any[] }> = ({ data }) => {
  const { scene } = useGLTF('/models/deadtree.glb');

  const dtMesh = useMemo(() => {
    let mesh: Mesh | null = null;
    scene.traverse((child) => {
      if ((child as Mesh).isMesh && !mesh) {
        mesh = child as Mesh;
      }
    });
    return mesh;
  }, [scene]);

  if (!dtMesh || data.length === 0) return null;

  return (
    <Instances range={data.length} geometry={dtMesh.geometry} material={dtMesh.material}>
      {data.map((d, i) => (
        <Instance
          key={i}
          position={d.position}
          quaternion={d.quaternion}
          scale={d.scale}
        />
      ))}
    </Instances>
  );
};

export const DeadTrees: React.FC = () => {
  const deadTreesData = useRandomDeadTreeData();

  return (
    <ErrorBoundary fallback={<group />}>
      <React.Suspense fallback={<group />}>
        <GLTFDeadTrees data={deadTreesData} />
      </React.Suspense>
    </ErrorBoundary>
  );
};

// Fixed seed for consistent rock placement
const ROCK_SPAWN_SEED = 1010;
const rockSeededRandom = new SeededRandom(ROCK_SPAWN_SEED);

// Collision detection parameters for rocks
const ROCK_COLLISION_RADIUS = 0.3;

// Generate rocks with seeded random spawning and collision filtering
const useRandomRockData = () => {
  return useMemo(() => {
    const rocks: any[] = [];
    const _up = new Vector3(0, 1, 0);
    const _q = new Quaternion();

    // Get all path points from the actual path generation
    const pathsData = generateStructuredPaths();
    const allPathPoints = pathsData.flat();

    const { totalRocks } = ROCK_CONFIG;
    const { rockSizes: { minScale: rockMinScale, maxScale: rockMaxScale } } = ROCK_CONFIG;

    const maxAttempts = totalRocks * 5;
    let attempts = 0;

    while (rocks.length < totalRocks && attempts < maxAttempts) {
      attempts++;

      const theta = rockSeededRandom.next() * Math.PI * 2;
      const phi = Math.acos(2 * rockSeededRandom.next() - 1);
      const rockPos = sphericalToCartesian(theta, phi, WORLD_RADIUS);

      // Check collision with all path points
      if (checkCollisionWithPathPoints(rockPos, allPathPoints, ROCK_COLLISION_RADIUS + PATH_COLLISION_BUFFER)) {
        continue;
      }

      // Calculate rotation to align with sphere normal
      _q.setFromUnitVectors(_up, rockPos.clone().normalize());
      const correctionRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
      _q.multiply(correctionRotation);

      // Seeded random scale for variety
      const scale = rockMinScale + rockSeededRandom.next() * (rockMaxScale - rockMinScale);
      const finalScale = scale * (0.85 + rockSeededRandom.next() * 0.3);

      rocks.push({
        position: [rockPos.x, rockPos.y, rockPos.z],
        quaternion: [_q.x, _q.y, _q.z, _q.w],
        scale: finalScale
      });
    }

    return rocks;
  }, []);
};

// Load rock model and render
const GLTFRocks: React.FC<{ data: any[] }> = ({ data }) => {
  const { scene } = useGLTF('/models/rock.glb');

  const rockMesh = useMemo(() => {
    let mesh: Mesh | null = null;
    scene.traverse((child) => {
      if ((child as Mesh).isMesh && !mesh) {
        mesh = child as Mesh;
      }
    });
    return mesh;
  }, [scene]);

  if (!rockMesh || data.length === 0) return null;

  return (
    <Instances range={data.length} geometry={rockMesh.geometry} material={rockMesh.material}>
      {data.map((d, i) => (
        <Instance
          key={i}
          position={d.position}
          quaternion={d.quaternion}
          scale={d.scale}
        />
      ))}
    </Instances>
  );
};

export const Rocks: React.FC = () => {
  const rocksData = useRandomRockData();

  return (
    <ErrorBoundary fallback={<group />}>
      <React.Suspense fallback={<group />}>
        <GLTFRocks data={rocksData} />
      </React.Suspense>
    </ErrorBoundary>
  );
};

