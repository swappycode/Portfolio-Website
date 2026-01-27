import React, { useMemo } from 'react';
import { ShaderMaterial, Color, Vector3 } from 'three';

interface CelShaderMaterialProps {
  color?: Color | string | number;
  outlineColor?: Color | string | number;
  outlineThickness?: number;
  shadowLevels?: number;
  rimLighting?: number;
  lightDirection?: Vector3;
}

const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    uniform vec3 uColor;
    uniform vec3 uOutlineColor;
    uniform float uOutlineThickness;
    uniform int uShadowLevels;
    uniform float uRimLighting;
    uniform vec3 uLightDirection;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    
    void main() {
        // Normalize light direction
        vec3 lightDir = normalize(uLightDirection);
        
        // Calculate dot product for lighting
        float ndotl = dot(vNormal, lightDir);
        
        // Cel-shading: quantize lighting into discrete bands
        float celShade = floor(ndotl * float(uShadowLevels)) / float(uShadowLevels);
        celShade = max(celShade, 0.2); // Ensure minimum ambient light
        
        // Base color with cel-shading
        vec3 finalColor = uColor * celShade;
        
        // Rim lighting for anime effect
        vec3 viewDir = normalize(vViewPosition);
        float rimFactor = 1.0 - dot(vNormal, viewDir);
        float rimIntensity = pow(rimFactor, 2.0) * uRimLighting;
        finalColor += vec3(1.0) * rimIntensity;
        
        // Edge detection for outlines
        float edge = 0.0;
        
        // Silhouette edge detection (based on normal facing away from camera)
        float normalDotView = dot(vNormal, viewDir);
        edge += step(0.0, -normalDotView) * uOutlineThickness;
        
        // Crease edge detection (based on normal derivatives)
        float normalEdge = length(fwidth(vNormal));
        edge += normalEdge * 10.0 * uOutlineThickness;
        
        // Position-based edge detection for sphere curvature
        float positionEdge = length(fwidth(vPosition));
        edge += positionEdge * 0.5 * uOutlineThickness;
        
        // Apply outline
        if (edge > 0.5) {
            finalColor = mix(finalColor, uOutlineColor, min(edge, 1.0));
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

export const CelShaderMaterial: React.FC<CelShaderMaterialProps> = ({
  color = '#9be685',
  outlineColor = '#000000',
  outlineThickness = 0.5,
  shadowLevels = 4,
  rimLighting = 0.3,
  lightDirection = new Vector3(1, 1, 1)
}) => {
  const material = useMemo(() => {
    const mat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new Color(color) },
        uOutlineColor: { value: new Color(outlineColor) },
        uOutlineThickness: { value: outlineThickness },
        uShadowLevels: { value: shadowLevels },
        uRimLighting: { value: rimLighting },
        uLightDirection: { value: lightDirection.normalize() }
      },
      side: 2, // DoubleSide
      transparent: false
    });
    
    return mat;
  }, [color, outlineColor, outlineThickness, shadowLevels, rimLighting, lightDirection]);

  return <primitive object={material} />;
};