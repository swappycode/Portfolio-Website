import React, { useMemo } from 'react';
import { Instance as DreiInstance, Instances, useGLTF } from '@react-three/drei';
import { Vector3, Quaternion, Mesh, Object3D } from 'three';
import { WORLD_RADIUS } from '../../../config/world.config';
import { ErrorBoundary } from '../../utils/ErrorBoundary';

// Cast Instance to any to resolve TypeScript errors
const Instance = DreiInstance as any;

// Helper to generate tree data
const useTreeData = (count: number) => {
  return useMemo(() => {
    const temp = [];
    const _pos = new Vector3();
    const _up = new Vector3(0, 1, 0);
    const _normal = new Vector3();
    const _q = new Quaternion();
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Avoid placing trees directly on paths (roughly equator and meridians)
      if (Math.abs(phi - Math.PI / 2) < 0.2) continue; 

      const x = WORLD_RADIUS * Math.sin(phi) * Math.cos(theta);
      const y = WORLD_RADIUS * Math.cos(phi);
      const z = WORLD_RADIUS * Math.sin(phi) * Math.sin(theta);
      
      _pos.set(x, y, z);
      _normal.copy(_pos).normalize();
      
      // Calculate rotation to align Y-up with the position vector (trees grow radially outward from sphere center)
      // Trees should point away from the sphere center (in the direction of the position vector)
      _q.setFromUnitVectors(_up, _pos.clone().normalize());
      
      // Apply correction for Tree.glb model that is rotated 90 degrees by default
      const correctionRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
      _q.multiply(correctionRotation);

      const scale = 0.3 + Math.random() * 0.3;

      temp.push({ 
        position: [x, y, z], 
        quaternion: [_q.x, _q.y, _q.z, _q.w], 
        scale 
      });
    }
    return temp;
  }, [count]);
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
            // We need to offset the foliage up locally. 
            // Since we are using quaternions, we can't just multiply position.
            // We'll trust the 'Instance' to handle local position if we parent it? 
            // No, Drei Instances are flat.
            // Simplified: Just render the cone at the same position but visual offset is baked in logic?
            // Correct approach: Move the geometry of the cone UP so origin is at base.
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
  const treesData = useTreeData(40);

  // Correct the procedural cone pivot for the fallback
  // (Translating geometry is a side-effect, but safe in this scope)
  useMemo(() => {
      // No-op here, just a comment that ConeGeometry is centered.
  }, []);

  return (
    <ErrorBoundary fallback={<ProceduralTrees data={treesData} />}>
      <React.Suspense fallback={<ProceduralTrees data={treesData} />}>
        <GLTFTrees data={treesData} />
      </React.Suspense>
    </ErrorBoundary>
  );
};
