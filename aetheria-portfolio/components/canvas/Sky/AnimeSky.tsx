import React, { useMemo } from 'react';
import { ShaderMaterial, Color, Vector3 } from 'three';

interface AnimeSkyProps {
  radius?: number;
  sunPosition?: Vector3;
  colorTop?: Color | string | number;
  colorMiddle?: Color | string | number;
  colorBottom?: Color | string | number;
  sunColor?: Color | string | number;
  intensity?: number;
}

const vertexShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform vec3 uSunPosition;
    uniform vec3 uColorTop;
    uniform vec3 uColorMiddle;
    uniform vec3 uColorBottom;
    uniform vec3 uSunColor;
    uniform float uIntensity;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
        // Normalize position to get direction from center
        vec3 dir = normalize(vPosition);
        
        // Calculate vertical position (y component) for gradient
        float y = dir.y;
        
        // Improved color blending logic for better visibility
        // Top color (0.2 to 1.0 range) - much wider range
        vec3 topColor = mix(vec3(0.0), uColorTop, smoothstep(0.2, 1.0, y));
        
        // Middle color (-0.4 to 0.6 range) - wider range with more overlap
        vec3 middleColor = mix(uColorMiddle, vec3(0.0), smoothstep(-0.4, 0.6, y));
        
        // Bottom color (-1.0 to 0.2 range) - wider range
        vec3 bottomColor = mix(uColorBottom, vec3(0.0), smoothstep(-1.0, 0.2, y));
        
        // Combine all colors with better blending
        vec3 skyColor = topColor + middleColor + bottomColor;
        
        // Normalize the color to prevent oversaturation
        skyColor = skyColor / max(0.1, max(skyColor.r, max(skyColor.g, skyColor.b)));
        
        // Add sun glow effect with stronger visibility
        vec3 sunDir = normalize(uSunPosition);
        float sunDot = dot(dir, sunDir);
        
        // Sun core - very bright and visible
        float sunCore = smoothstep(0.995, 1.0, sunDot);
        
        // Sun glow - broader and more visible
        float sunGlow = smoothstep(0.9, 1.0, sunDot);
        sunGlow += pow(max(0.0, dot(dir, sunDir)), 10.0) * 2.0;
        
        // Combine sky color with sun effects - make sun much more prominent
        vec3 finalColor = skyColor;
        finalColor = mix(finalColor, uSunColor * 2.0, sunCore); // Strong sun core
        finalColor = mix(finalColor, uSunColor * 1.5, sunGlow * 0.8); // Strong sun glow
        
        // Add subtle vignette effect
        float vignette = smoothstep(0.8, 0.2, length(gl_FragCoord.xy / vec2(1920.0, 1080.0) - 0.5));
        finalColor *= vignette;
        
        // Add subtle noise for anime texture
        float noise = fract(sin(dot(vPosition.xy, vec2(12.9898, 78.233))) * 43758.5453);
        finalColor += vec3(noise * 0.005);
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

export const AnimeSky: React.FC<AnimeSkyProps> = ({
  radius = 100,
  sunPosition = new Vector3(50, 30, -20),
  colorTop = '#4b0082', // Indigo
  colorMiddle = '#ff69b4', // Hot Pink
  colorBottom = '#ffa500', // Orange
  sunColor = '#ffff66', // Yellow
  intensity = 1.0
}) => {
  const material = useMemo(() => {
    const mat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uSunPosition: { value: sunPosition.normalize() },
        uColorTop: { value: new Color(colorTop) },
        uColorMiddle: { value: new Color(colorMiddle) },
        uColorBottom: { value: new Color(colorBottom) },
        uSunColor: { value: new Color(sunColor) },
        uIntensity: { value: intensity }
      },
      side: 1, // BackSide - render inside of sphere
      transparent: false,
      depthWrite: false // Don't write to depth buffer
    });
    
    return mat;
  }, [sunPosition, colorTop, colorMiddle, colorBottom, sunColor, intensity]);

  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 64, 64]} />
    </mesh>
  );
};