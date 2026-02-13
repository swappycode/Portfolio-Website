
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface StarfieldProps {
    count?: number;
    radius?: number;
    depth?: number;
    size?: number;
    color?: string;
}

const starVertexShader = `
  attribute float size;
  attribute vec3 color; // Per-vertex color
  attribute float timeOffset; // Per-vertex twinkle offset
  
  varying vec3 vColor;
  varying float vTimeOffset;
  
  void main() {
    vColor = color;
    vTimeOffset = timeOffset;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size * (300.0 / -mvPosition.z); // Size attenuation
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vTimeOffset;
  
  uniform float uTime;
  
  void main() {
    // Circle shape
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    
    // Soft edge
    float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
    
    // Twinkle effect (sine wave based on time + random offset)
    float twinkle = sin(uTime * 2.0 + vTimeOffset) * 0.5 + 0.5;
    // Remap twinkle to be mostly bright, occasionally dim
    twinkle = pow(twinkle, 0.5); 
    
    gl_FragColor = vec4(vColor, alpha * twinkle * 2.0); // Boost brightness
  }
`;

export const Starfield: React.FC<StarfieldProps> = ({
    count = 5000,
    radius = 200,
    depth = 50,
    size = 1.5,
    color = '#ffffff'
}) => {
    const points = useRef<THREE.Points>(null);

    const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: starVertexShader,
        fragmentShader: starFragmentShader,
        uniforms: {
            uTime: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    }), []);

    const [positions, colors, sizes, timeOffsets] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const cols = new Float32Array(count * 3);
        const szs = new Float32Array(count);
        const offs = new Float32Array(count);

        const baseColor = new THREE.Color(color);

        for (let i = 0; i < count; i++) {
            // Positions (Spherical shell)
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = radius + Math.random() * depth;

            let x = r * Math.sin(phi) * Math.cos(theta);
            let y = r * Math.sin(phi) * Math.sin(theta);
            let z = r * Math.cos(phi);

            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;

            // Custom Size Variation (some big, some small)
            // Power distribution for more small stars, fewer big ones
            const s = Math.pow(Math.random(), 3.0) * size * 3.0 + size * 0.5;
            szs[i] = s;

            // Colors - Subtle variations
            // Mix between base white/blue and some warm/cool colors
            const variation = Math.random();
            let starColor = baseColor.clone();

            if (variation > 0.9) starColor.setHex(0xffccaa); // Rare Orange/Red giant
            else if (variation > 0.7) starColor.setHex(0xaaccff); // Blue giant
            else if (variation > 0.5) starColor.setHex(0xffffff); // White

            cols[i * 3] = starColor.r;
            cols[i * 3 + 1] = starColor.g;
            cols[i * 3 + 2] = starColor.b;

            // Random time offset for twinkling
            offs[i] = Math.random() * 100.0;
        }
        return [pos, cols, szs, offs];
    }, [count, radius, depth, color, size]);

    useFrame((state, delta) => {
        if (points.current) {
            points.current.rotation.y -= delta * 0.005; // Slow drift
        }
        shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={colors.length / 3}
                    array={colors}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={sizes.length}
                    array={sizes}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-timeOffset"
                    count={timeOffsets.length}
                    array={timeOffsets}
                    itemSize={1}
                />
            </bufferGeometry>
            {/* Explicitly attach shader material */}
            <primitive object={shaderMaterial} attach="material" />
        </points>
    );
};
