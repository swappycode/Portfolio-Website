import React, { useMemo } from 'react';
import { Vector3, CatmullRomCurve3, BufferGeometry, Float32BufferAttribute } from 'three';
import { PathShaderMaterial } from './PathShaderMaterial';
import { WORLD_RADIUS } from '../../../config/world.config';

// --- CONFIGURATION ---
const PATH_WIDTH = 1.75; // Wider "Road" feel
const PATH_ELEVATION = 0.08; // Higher clearance to stop Z-fighting
const PATH_COLOR = '#e8c495'; // Ghibli dirt road color

// --- CUSTOM RIBBON GEOMETRY ---
const createRibbonGeometry = (curve: CatmullRomCurve3, width: number, segments: number) => {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const points = curve.getSpacedPoints(segments);

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    
    // 1. Get Normal (Up vector)
    const normal = point.clone().normalize(); 
    
    // 2. Get Tangent (Forward direction)
    const tangent = curve.getTangent(i / segments); 
    
    // 3. Get Binormal (Sideways direction)
    const binormal = new Vector3().crossVectors(normal, tangent).normalize();

    // 4. Create Edges
    const left = point.clone()
      .add(binormal.clone().multiplyScalar(width * 0.5))
      .add(normal.clone().multiplyScalar(PATH_ELEVATION));
      
    const right = point.clone()
      .add(binormal.clone().multiplyScalar(-width * 0.5))
      .add(normal.clone().multiplyScalar(PATH_ELEVATION));

    positions.push(left.x, left.y, left.z);
    positions.push(right.x, right.y, right.z);

    // UVs: Repeat texture every 4 units of length
    const uvY = (i / segments) * 20; 
    uvs.push(0, uvY);
    uvs.push(1, uvY);

    if (i < segments) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
};

const SphericalPath: React.FC<{ points: Vector3[] }> = ({ points }) => {
  const geometry = useMemo(() => {
    // Closed loop = true, Tension = 0 for perfect circles
    const curve = new CatmullRomCurve3(points, true, 'catmullrom', 0);
    return createRibbonGeometry(curve, PATH_WIDTH, 150); // High segment count for smooth curves
  }, [points]);

  return (
    <mesh geometry={geometry} frustumCulled={false}>
       <PathShaderMaterial color={PATH_COLOR} opacity={0.95} />
    </mesh>
  );
};

// --- STRUCTURED PATH GENERATION ---
export const generateStructuredPaths = () => {
  const allPaths: Vector3[][] = [];

  // Helper to create a circle at a specific latitude/orientation
  // axis: 'x', 'y', or 'z' (which axis is the "pole")
  // offset: angle offset for "parallel" circles (latitude)
  const createCircle = (axis: 'x' | 'y' | 'z', offsetAngle: number = 0) => {
    const path: Vector3[] = [];
    const segments = 60;
    const radiusAtOffset = Math.cos(offsetAngle) * WORLD_RADIUS;
    const heightOffset = Math.sin(offsetAngle) * WORLD_RADIUS;

    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      
      let x = 0, y = 0, z = 0;
      
      // Math to rotate the circle based on axis
      if (axis === 'y') { 
        // Horizontal circles (Equator/Tropics)
        x = Math.cos(theta) * radiusAtOffset;
        z = Math.sin(theta) * radiusAtOffset;
        y = heightOffset;
      } else if (axis === 'x') {
        // Vertical circles (Meridians)
        y = Math.cos(theta) * radiusAtOffset;
        z = Math.sin(theta) * radiusAtOffset;
        x = heightOffset;
      } else {
        // Z-Axis circles
        x = Math.cos(theta) * radiusAtOffset;
        y = Math.sin(theta) * radiusAtOffset;
        z = heightOffset;
      }

      path.push(new Vector3(x, y, z));
    }
    return path;
  };

  // 1. The "Equator" (Main Horizontal Road)
  allPaths.push(createCircle('y', 0));

  // 2. The "Prime Meridian" (Main Vertical Road)
  allPaths.push(createCircle('x', 0));
  
  // 3. The "Anti-Meridian" (Cross Vertical Road)
  allPaths.push(createCircle('z', 0));

  // 4. "Tropic" Roads (Smaller circles above and below equator for structure)
  // Latitude ~30 degrees (0.5 radians)
  allPaths.push(createCircle('y', 0.5)); 
  allPaths.push(createCircle('y', -0.5));

  return allPaths;
};

export const Paths: React.FC = () => {
  const pathsData = useMemo(() => generateStructuredPaths(), []);

  return (
    <group>
      {pathsData.map((points, i) => (
        <SphericalPath key={i} points={points} />
      ))}
    </group>
  );
};