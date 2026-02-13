
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Color, DoubleSide, AdditiveBlending, ShaderMaterial, Group } from 'three';

interface PlanetProps {
    position?: [number, number, number];
    size?: number;
    color?: string;
    ringColor?: string;
}

// === Black Hole Event Horizon Shader ===
const blackHoleVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const blackHoleFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv; // We need UVs for texture
  uniform float uTime;

  // Pseudo-random function
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Noise function
  float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float res = mix(mix(hash(i + vec2(0, 0)), hash(i + vec2(1, 0)), f.x),
                      mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
      return res;
  }

  // FBM
  float fbm(vec2 p) {
      float total = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 4; i++) {
          total += noise(p) * amplitude;
          p *= 2.0;
          amplitude *= 0.5;
      }
      return total;
  }

  void main() {
    vec3 viewDir = normalize(vViewPosition); // Camera direction
    vec3 normal = normalize(vNormal);
    
    // Fake "Scenic" Lighting - Light coming from top-left-front to illuminate the face
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0)); 
    float ndotl = max(0.0, dot(normal, lightDir)); 
    
    // Rim lighting (Atmosphere)
    float fresnel = pow(1.0 - dot(normal, viewDir), 2.0);
    
    // === Surface Texture ===
    vec2 uv = vUv;
    float time = uTime * 0.05;
    
    // Warp domain
    vec2 q = vec2(fbm(uv + vec2(0.0, time)), fbm(uv + vec2(5.2, 1.3)));
    vec2 r = vec2(fbm(uv + 4.0 * q + vec2(time, 9.2)), fbm(uv + 4.0 * q + vec2(8.3, 2.8)));
    
    // Base Noise
    float f = fbm(uv * 3.0 + r);
    float detail = fbm(uv * 20.0 - time * 2.0);
    float veins = smoothstep(0.4, 0.6, abs(sin(f * 10.0 + detail)));
    
    // Brighter Palette (Astral/Sunset Theme)
    vec3 colDeep = vec3(0.12, 0.05, 0.25);  // Deep Indigo/Navy
    vec3 colMid  = vec3(0.8, 0.1, 0.5);     // Vibrant Magenta/Pink
    vec3 colHigh = vec3(0.1, 0.9, 1.0);     // Electric Cyan (Matches Rings)
    vec3 colGold = vec3(1.0, 0.6, 0.4);     // Sunset Peach/Rose Gold
    
    // Mix
    vec3 surfaceColor = mix(colDeep, colMid, f);
    surfaceColor = mix(surfaceColor, colHigh, smoothstep(0.3, 0.9, f * detail));
    surfaceColor += colGold * veins * 0.5 * f; 
    
    // Lighting: High Ambient (0.5) so it's never black
    vec3 litColor = surfaceColor * (ndotl * 0.6 + 0.5);
    
    // Atmosphere Glow
    vec3 atmosphereColor = vec3(0.5, 0.8, 1.0);
    vec3 finalColor = litColor + atmosphereColor * fresnel * 0.5;
    
    // Specular
    vec3 halfVector = normalize(lightDir + viewDir);
    float NdotH = max(0.0, dot(normal, halfVector));
    float specular = pow(NdotH, 16.0);
    finalColor += vec3(1.0) * specular * 0.3;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// === Animated Accretion Disk Shader ===
const ringVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;

  // Pseudo-random function
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Noise function
  float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float res = mix(mix(hash(i + vec2(0, 0)), hash(i + vec2(1, 0)), f.x),
                      mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
      return res;
  }

  // Fractal Brownian Motion for detail
  float fbm(vec2 p) {
      float total = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
          total += noise(p) * amplitude;
          p *= 2.0;
          amplitude *= 0.5;
      }
      return total;
  }

  void main() {
    // Polar coordinates
    vec2 centered = vUv * 2.0 - 1.0;
    float r = length(centered); // Radius
    float a = atan(centered.y, centered.x); // Angle

    // Soft ring boundaries
    if (r > 1.0 || r < 0.35) discard;

    // Keplerian Velocity Simulation: Inner parts move faster than outer parts
    // We add uTime scaled by 1/r to create the shear effect of an accretion disk
    float speed = 3.0 + (3.0 / (r + 0.05)); // ULTRA FAST speed
    float angle = a - uTime * speed * 2.0; // Rapid flow

    // Create "streaks" by stretching noise along the angle
    // r * 4.0 gives radial rings, angle * 20.0 gives streaks along the ring
    float noiseVal = fbm(vec2(r * 6.0, angle * 12.0));
    
    // Add a second layer of noise for complexity
    float noiseVal2 = fbm(vec2(r * 12.0 - uTime * 2.0, angle * 20.0));
    float intensity = (noiseVal + noiseVal2) * 0.6;
    
    // Color Gradient: Hotter (whiter) near center, cooler (bluer) near edge
    // r goes from 0.35 (inner) to 1.0 (outer)
    // normalizedR goes 0.0 (inner) to 1.0 (outer)
    float normalizedR = (r - 0.35) / 0.65;
    
    vec3 innerColor = vec3(0.9, 0.95, 1.0); // Intense white-hot center
    vec3 outerColor = uColor;              // The uniform color (cyan/deep blue)
    
    // Mix based on radius and noise intensity
    vec3 finalColor = mix(innerColor, outerColor, normalizedR + (1.0 - intensity) * 0.4);
    
    // boost intensity for glowing look
    finalColor *= (intensity * 4.0 + 0.5);

    // Alpha mask for smooth edges
    float alpha = smoothstep(0.35, 0.40, r) * smoothstep(1.0, 0.8, r);

    gl_FragColor = vec4(finalColor, alpha * intensity);
  }
`;

export const Planet: React.FC<PlanetProps> = ({
    position = [50, 40, -60],
    size = 15,
    color = '#000000', // Black for hole
    ringColor = '#00ffff'
}) => {
    const planetRef = useRef<Group>(null);
    const ringGroupRef = useRef<Group>(null);
    const ringRef1 = useRef<Group>(null);
    const ringRef2 = useRef<Group>(null);
    const ringRef3 = useRef<Group>(null);

    // Black Hole Material
    const sphereMaterial = useMemo(() => new ShaderMaterial({
        vertexShader: blackHoleVertexShader,
        fragmentShader: blackHoleFragmentShader,
        uniforms: { uTime: { value: 0 } }
    }), []);

    // Accretion Disk Material
    const ringMaterial = useMemo(() => new ShaderMaterial({
        vertexShader: ringVertexShader,
        fragmentShader: ringFragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new Color('#00d0ff') } // Cyan/Blue glow
        },
        side: DoubleSide,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false
    }), []);

    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;

        if (sphereMaterial) sphereMaterial.uniforms.uTime.value = time;
        if (ringMaterial) ringMaterial.uniforms.uTime.value = time;

        // Rotate rings independently - TURBO MODE rotation
        if (ringRef1.current) ringRef1.current.rotation.z = time * 0.6; // Main disk
        if (ringRef2.current) ringRef2.current.rotation.z = time * 1.2 + 1.0; // Inner fast ring
        if (ringRef3.current) ringRef3.current.rotation.z = -time * 0.3 + 2.0; // Outer halo

        // Precession / Wobble of the entire ring system
        if (ringGroupRef.current) {
            // Slowly tilt the axis of rotation
            ringGroupRef.current.rotation.x = Math.PI / 2.5 + Math.sin(time * 0.2) * 0.1;
            ringGroupRef.current.rotation.y = Math.cos(time * 0.15) * 0.1;
        }

        // Bobbing motion for the whole group
        if (planetRef.current) {
            planetRef.current.position.y = position[1] + Math.sin(time * 0.5) * 2.0;
        }
    });

    return (
        <group ref={planetRef} position={new Vector3(...position)}>
            {/* The Black Hole Sphere (Event Horizon) */}
            <mesh>
                <sphereGeometry args={[size, 64, 64]} />
                <primitive object={sphereMaterial} attach="material" />
            </mesh>

            {/* Accretion Disk Rings - Tilted Group */}
            <group ref={ringGroupRef} rotation={[Math.PI / 2.5, 0, 0]}>

                {/* Main Swirling Disk */}
                <mesh ref={ringRef1 as any}>
                    <ringGeometry args={[size * 1.5, size * 3.5, 128]} />
                    <primitive object={ringMaterial} attach="material" />
                </mesh>

                {/* Inner Fast Ring */}
                <mesh ref={ringRef2 as any} position={[0, 0, 0.1]}>
                    <ringGeometry args={[size * 1.2, size * 1.8, 128]} />
                    <meshBasicMaterial
                        color="#4000ff"
                        side={DoubleSide}
                        transparent
                        opacity={0.6}
                        blending={AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>

                {/* Outer Halo */}
                <mesh ref={ringRef3 as any} position={[0, 0, -0.1]}>
                    <ringGeometry args={[size * 3.2, size * 3.6, 128]} />
                    <meshBasicMaterial
                        color="#00ffff"
                        side={DoubleSide}
                        transparent
                        opacity={0.3}
                        blending={AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>

            </group>
        </group>
    );
};
