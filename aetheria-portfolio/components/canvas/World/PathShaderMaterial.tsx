import React, { useMemo } from 'react';
import { ShaderMaterial, Color, Vector3, DoubleSide } from 'three';

interface PathShaderMaterialProps {
  color?: Color | string | number;
  opacity?: number;
}

const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform vec3 uColor;
    uniform float uOpacity;
    
    varying vec2 vUv;
    
    // --- Simplex Noise for Watercolor Effect ---
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
        // 1. Edge Softening (The "Brush Stroke" edge)
        // vUv.x goes from 0 (left) to 1 (right). 0.5 is center.
        float dist = abs(vUv.x - 0.5) * 2.0;
        
        // Add noise to the edge so it's not a perfect straight line
        float edgeNoise = snoise(vUv * vec2(20.0, 1.0)) * 0.1;
        float alpha = 1.0 - smoothstep(0.6 + edgeNoise, 1.0 - edgeNoise, dist);
        
        // 2. Watercolor Interior
        // Mix two earth tones based on noise
        float dirtNoise = snoise(vUv * vec2(4.0, 10.0));
        vec3 colorA = uColor; 
        vec3 colorB = uColor * 0.7; // Darker patch
        
        vec3 finalColor = mix(colorA, colorB, smoothstep(-0.2, 0.2, dirtNoise));
        
        gl_FragColor = vec4(finalColor, alpha * uOpacity);
    }
`;

export const PathShaderMaterial: React.FC<PathShaderMaterialProps> = ({
  color = '#d4a76a', // Anime dirt path color
  opacity = 0.9
}) => {
  const material = useMemo(() => {
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new Color(color) },
        uOpacity: { value: opacity },
      },
      side: DoubleSide,
      transparent: true,
      depthWrite: false, // Prevents z-fighting with the ground
    });
  }, [color, opacity]);

  return <primitive object={material} />;
};