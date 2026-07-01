'use client';

import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════
// CUSTOM PARALLAX + WIND + GOD-RAY SHADER
// ═══════════════════════════════════════════════════════════

const ParallaxShader = {
  uniforms: {
    uTexture: { value: null },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uTime: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform vec2 uMouse;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      // Procedural depth estimation:
      // The trees on the left and right are close (foreground = high parallax shift)
      // The path center and horizon are far away (background = low parallax shift)
      float distToCenter = abs(vUv.x - 0.5);
      
      // Outer tree trunks get highest depth value
      float depth = smoothstep(0.05, 0.42, distToCenter);
      
      // Bottom of the screen (ground foreground) is closer to the viewer
      depth += (1.0 - vUv.y) * 0.38;
      depth = clamp(depth, 0.08, 1.0);

      // Smooth parallax translation based on cursor location
      vec2 parallax = uMouse * depth * 0.024;

      // Tree wind sway (applies sine-wave distortion primarily to the sides/canopy)
      float windCycle = sin(uTime * 1.35 + vUv.y * 6.0) * 0.0035;
      float windMask = smoothstep(0.3, 1.0, vUv.y) * smoothstep(0.12, 0.5, distToCenter);
      vec2 windOffset = vec2(windCycle * windMask, 0.0);

      // Final coordinates clamped to avoid wrapping borders
      vec2 finalUv = vUv + parallax + windOffset;
      finalUv = clamp(finalUv, 0.002, 0.998);

      vec4 texColor = texture2D(uTexture, finalUv);

      // Cinematic God-Ray Highlight
      // Pulses and drifts slowly based on time and cursor position
      float rays = sin(vUv.x * 2.6 - uTime * 0.16 + uMouse.x * 0.4) 
                 * cos(vUv.y * 1.7 + uTime * 0.09) 
                 * 0.038;
      
      vec3 rayColor = vec3(1.0, 0.9, 0.72); // Warm sunbeam gold
      texColor.rgb += rayColor * max(0.0, rays) * smoothstep(0.35, 0.85, vUv.y);

      // Vignette effect to draw focus to the path
      float vignette = distToCenter * 0.35 + (1.0 - vUv.y) * 0.15;
      texColor.rgb *= (1.0 - vignette * 0.4);

      gl_FragColor = texColor;
    }
  `
};

function ParallaxBackground() {
  const materialRef = useRef();
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  
  // Get canvas viewport dimensions at z = 0
  const { width, height } = useThree((state) => state.viewport);

  // Load background texture
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/forest-bg-v5.jpg');
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  // Update mouse position on window moves
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.set(x, y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    if (!materialRef.current) return;
    const t = state.clock.getElapsedTime();
    materialRef.current.uniforms.uTime.value = t;

    // Smooth lerp mouse positioning for cinematic inertia
    const currentMouse = materialRef.current.uniforms.uMouse.value;
    currentMouse.x += (mouseRef.current.x - currentMouse.x) * 0.05;
    currentMouse.y += (mouseRef.current.y - currentMouse.y) * 0.05;
  });

  return (
    <mesh scale={[width, height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        args={[ParallaxShader]}
        uniforms-uTexture-value={texture}
        transparent
      />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN FOREST CANVAS COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ForestCanvas() {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ scene }) => { scene.background = null; }}
      >
        <Suspense fallback={null}>
          <ParallaxBackground />
        </Suspense>
      </Canvas>
    </div>
  );
}
