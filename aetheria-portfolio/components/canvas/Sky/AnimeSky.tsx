import React, { useMemo } from 'react';
import { ShaderMaterial, Color, Vector3 } from 'three';

interface AnimeSkyProps {
  radius?: number;
  sunPosition?: Vector3;
}

const vertexShader = `
    varying vec3 vWorldPosition;
    varying vec3 vWorldDir;
    
    void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vWorldDir = normalize(worldPos.xyz - cameraPosition);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Fantasy RPG sky — uses view-space vertical angle so the full gradient
// is always visible regardless of camera position/angle.
const fragmentShader = `
    uniform vec3 uSunDirection;
    
    // Fantasy palette
    uniform vec3 uColorDeep;    // Deep purple/indigo at top
    uniform vec3 uColorMid;     // Vivid blue in the middle
    uniform vec3 uColorLow;     // Cyan/teal transition 
    uniform vec3 uColorHorizon; // Golden/amber at horizon
    uniform vec3 uColorBelow;   // Warm rose below horizon
    
    varying vec3 vWorldPosition;
    varying vec3 vWorldDir;
    
    void main() {
        // Use the view direction's Y component for the gradient.
        // This maps the gradient to what the camera ACTUALLY SEES,
        // not the sphere's geometric coordinates.
        vec3 viewDir = normalize(vWorldDir);
        
        // viewDir.y: +1 = looking straight up, -1 = straight down
        // Remap to 0..1 range where 0 = bottom of view, 1 = top
        float t = viewDir.y * 0.5 + 0.5;
        
        // === Multi-stop gradient (5 colors, fantasy RPG) ===
        vec3 skyColor;
        
        if (t > 0.75) {
            // Top quarter — deep to mid blue
            float blend = (t - 0.75) / 0.25;
            skyColor = mix(uColorMid, uColorDeep, blend);
        } else if (t > 0.5) {
            // Upper middle — mid blue to cyan/teal
            float blend = (t - 0.5) / 0.25;
            skyColor = mix(uColorLow, uColorMid, blend);
        } else if (t > 0.3) {
            // Lower middle — cyan to golden horizon
            float blend = (t - 0.3) / 0.2;
            skyColor = mix(uColorHorizon, uColorLow, blend);
        } else {
            // Bottom — golden to warm rose
            float blend = t / 0.3;
            skyColor = mix(uColorBelow, uColorHorizon, blend);
        }
        
        // Smooth the transitions slightly to avoid hard bands
        // Re-derive using smoothstep mix for continuous gradient
        float s1 = smoothstep(0.70, 0.80, t);
        float s2 = smoothstep(0.45, 0.55, t);
        float s3 = smoothstep(0.25, 0.35, t);
        
        vec3 smoothSky = mix(uColorBelow, uColorHorizon, smoothstep(0.0, 0.15, t));
        smoothSky = mix(smoothSky, uColorLow, smoothstep(0.10, 0.30, t));
        smoothSky = mix(smoothSky, uColorMid, smoothstep(0.25, 0.55, t));
        smoothSky = mix(smoothSky, uColorDeep, smoothstep(0.65, 0.95, t));
        
        skyColor = smoothSky;
        
        // === Sun disc and glow ===
        vec3 sunDir = normalize(uSunDirection);
        vec3 dir = normalize(vWorldPosition);
        float sunAngle = dot(dir, sunDir);
        
        // Hard sun disc (anime/RPG style)
        float sunDisc = smoothstep(0.9975, 0.999, sunAngle);
        
        // Inner halo — intense warm glow
        float innerHalo = pow(max(0.0, sunAngle), 48.0) * 0.9;
        
        // Wide atmospheric halo
        float outerHalo = pow(max(0.0, sunAngle), 6.0) * 0.35;
        
        // Horizon-hugging warm band near the sun
        float horizonGlow = pow(max(0.0, sunAngle), 2.5) * (1.0 - abs(viewDir.y)) * 0.5;
        
        // Sun colors
        vec3 sunDiskColor = vec3(1.0, 0.98, 0.9);
        vec3 sunGlowColor = vec3(1.0, 0.82, 0.4);
        
        // Apply sun effects
        skyColor = mix(skyColor, sunGlowColor, outerHalo + horizonGlow);
        skyColor = mix(skyColor, sunGlowColor * 1.4, innerHalo);
        skyColor += sunDiskColor * sunDisc * 1.5;
        
        // === Subtle atmospheric scattering for fantasy feel ===
        // Adds a gentle color wash that shifts with view angle
        float scatter = pow(1.0 - abs(viewDir.y), 3.0) * 0.15;
        skyColor += vec3(0.9, 0.5, 0.3) * scatter;
        
        // Subtle dithering to prevent banding
        float noise = fract(sin(dot(dir.xy, vec2(12.9898, 78.233))) * 43758.5453);
        skyColor += vec3(noise * 0.006 - 0.003);
        
        gl_FragColor = vec4(skyColor, 1.0);
    }
`;

export const AnimeSky: React.FC<AnimeSkyProps> = ({
  radius = 150,
  sunPosition = new Vector3(30, 25, -20),
}) => {
  const material = useMemo(() => {
    const mat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uSunDirection: { value: sunPosition.clone().normalize() },
        // Fantasy RPG palette — vivid, magical, blue-dominant
        uColorDeep: { value: new Color('#0d1b4a') },  // Deep midnight indigo
        uColorMid: { value: new Color('#1976d2') },  // Vivid bright blue
        uColorLow: { value: new Color('#4dd0e1') },  // Bright aqua/cyan
        uColorHorizon: { value: new Color('#ffe082') },  // Soft golden glow
        uColorBelow: { value: new Color('#f48fb1') },  // Soft rose-pink
      },
      side: 1, // BackSide
      transparent: false,
      depthWrite: false,
    });

    return mat;
  }, [sunPosition]);

  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 32, 32]} />
    </mesh>
  );
};