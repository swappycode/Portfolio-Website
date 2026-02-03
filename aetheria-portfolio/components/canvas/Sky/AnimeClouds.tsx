import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Color, ShaderMaterial, Group, DoubleSide } from 'three';
import { WORLD_RADIUS } from '../../../config/world.config';

const cloud3DVertexShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    // Subtle organic "warping" so spheres aren't perfectly round
    vec3 pos = position;
    float noise = sin(pos.x * 2.0 + uTime) * 0.1;
    pos += normal * noise;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const cloud3DFragmentShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  uniform vec3 uBaseColor;
  uniform vec3 uShadowColor;
  uniform vec3 uLightDir;

  void main() {
    float d = dot(vNormal, normalize(uLightDir));
    
    // Ghibli lighting usually has 3 distinct steps: Highlight, Mid, Shadow
    float shadowStep = smoothstep(-0.2, -0.15, d);
    float highlightStep = smoothstep(0.4, 0.45, d);
    
    vec3 color = uShadowColor;
    color = mix(color, uBaseColor, shadowStep);
    color = mix(color, vec3(1.0), highlightStep); // Extra bright white highlights
    
    // Soften the edges to look more like paint brush strokes
    float edge = dot(vNormal, vec3(0.0, 0.0, 1.0));
    float alpha = smoothstep(0.1, 0.3, edge);

    gl_FragColor = vec4(color, alpha);
  }
`;

const CloudGroup = ({ position, scale }: { position: Vector3; scale: number }) => {
  const material = useMemo(() => new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBaseColor: { value: new Color('#ffffff') },
      uShadowColor: { value: new Color('#b0c4de') }, // Soft blue-grey shadow
      uLightDir: { value: new Vector3(1, 1, 0.5) }
    },
    vertexShader: cloud3DVertexShader,
    fragmentShader: cloud3DFragmentShader,
    transparent: true,
    side: DoubleSide,
  }), []);

  // Increase density: More spheres but packed tighter
  const puffs = useMemo(() => {
    const p = [];
    const count = 12; // Increased from 5 to 12
    for (let i = 0; i < count; i++) {
      p.push({
        pos: new Vector3(
          (Math.random() - 0.5) * 1.8,
          (Math.random() - 0.5) * 0.6, // Kept flatter on Y axis
          (Math.random() - 0.5) * 1.2
        ),
        s: 0.5 + Math.random() * 0.8, // Smaller individual spheres
      });
    }
    return p;
  }, []);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group position={position} scale={scale}>
      {puffs.map((puff, i) => (
        <mesh key={i} position={puff.pos} scale={puff.s}>
          <sphereGeometry args={[1, 12, 12]} />
          <primitive object={material} attach="material" />
        </mesh>
      ))}
    </group>
  );
};

export const AnimeClouds = () => {
  const mainGroup = useRef<Group>(null);
  
  const cloudData = useMemo(() => {
    const data = [];
    const count = 15; // More clouds total
    const dist = WORLD_RADIUS + 15; // Further away to appear smaller

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random();
      const latitude = 0.3 + Math.random() * 0.4;
      
      const x = Math.cos(angle) * dist * Math.cos(latitude);
      const z = Math.sin(angle) * dist * Math.cos(latitude);
      const y = Math.sin(latitude) * dist;
      
      data.push({
        pos: new Vector3(x, y, z),
        // REDUCED GLOBAL SCALE: from (2-5) down to (0.8-1.5)
        scale: 0.8 + Math.random() * 1.5 
      });
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (mainGroup.current) {
      mainGroup.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group ref={mainGroup}>
      {cloudData.map((c, i) => (
        <CloudGroup key={i} position={c.pos} scale={c.scale} />
      ))}
    </group>
  );
};