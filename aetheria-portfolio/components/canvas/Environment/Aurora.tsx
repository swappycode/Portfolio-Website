
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, Color, DoubleSide, AdditiveBlending, Vector3, Euler } from 'three';

const auroraVertexShader = `
  varying vec2 vUv;
  varying float vHeight;
  uniform float uTime;

  // Simple noise for vertex displacement
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0, 0)), hash(i + vec2(1, 0)), f.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }

  void main() {
    vUv = uv;
    vHeight = position.y;
    
    vec3 newPos = position;
    
    // Create "Curtain" wave effect
    // Displace Z based on X and Time
    float wave = sin(position.x * 0.05 + uTime * 0.5) * 5.0;
    float wave2 = sin(position.x * 0.1 - uTime * 0.2) * 2.0;
    
    // Add noise displacement
    float n = noise(vec2(position.x * 0.05, uTime * 0.1)) * 5.0;
    
    // Combine displacements
    newPos.z += wave + wave2 + n;
    
    // Bend the plane slightly into an arc for better sky coverage
    // Simple parabolic bend
    float bend = (position.x * position.x) * 0.001; 
    newPos.z -= bend;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`;

const auroraFragmentShader = `
  varying vec2 vUv;
  varying float vHeight;
  uniform float uTime;
  uniform vec3 uColorLow;
  uniform vec3 uColorHigh;

  // FBM Noise for curtain texture
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0, 0)), hash(i + vec2(1, 0)), f.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float total = 0.0;
    float amp = 0.5;
    for(int i=0; i<4; i++){
      total += noise(p)*amp;
      p*=2.0;
      amp*=0.5;
    }
    return total;
  }

  void main() {
    // Vertical streaks
    // Stretch noise vertically by scaling x vs y
    float streaks = fbm(vec2(vUv.x * 10.0 + uTime * 0.1, vUv.y * 2.0));
    
    // Cutoff bottom and top for soft fade
    float alpha = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
    
    // Intensity mask based on noise
    float intensity = smoothstep(0.3, 0.8, streaks);
    
    // Color gradient
    // Mix low (Green/Teal) and high (Purple/Pink) based on height
    vec3 color = mix(uColorLow, uColorHigh, vUv.y + 0.2);
    
    // Add extra brightness/white core to streaks
    color += vec3(0.5) * intensity * 0.5;

    gl_FragColor = vec4(color, alpha * intensity * 0.6); // 0.6 opacity overall
  }
`;

interface AuroraProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const Aurora: React.FC<AuroraProps> = ({
  position = [0, 80, -100],
  rotation = [0, 0, 0],
  scale = [1, 1, 1]
}) => {
  const materialRef = useRef<ShaderMaterial>(null);

  const material = useMemo(() => new ShaderMaterial({
    vertexShader: auroraVertexShader,
    fragmentShader: auroraFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColorLow: { value: new Color('#00ff66') }, // Vibrant Electric Green
      uColorHigh: { value: new Color('#8800ff') } // Deep Astral Purple (Matching Sky)
    },
    side: DoubleSide,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <group position={new Vector3(...position)} rotation={new Euler(...rotation)} scale={new Vector3(...scale)}>
      {/* Layer 1: Main Curtain */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[400, 100, 64, 64]} />
        <primitive object={material} ref={materialRef} attach="material" />
      </mesh>
      {/* Layer 2: Secondary offset curtain for depth (Optional, can reuse material with offset UVs in shader if needed, but simple mesh dup is cheap) */}
      <mesh position={[0, 10, -20]} rotation={[0, 0, 0.05]}>
        <planeGeometry args={[450, 120, 64, 64]} />
        {/* We can clone material to offset time or just let them sync. 
             Ideally we'd want a separate uniform offset, but overlapping identical shaders with diff transforms works for now. 
             Actually, let's just stick to one big curtain first. */}
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  );
};
