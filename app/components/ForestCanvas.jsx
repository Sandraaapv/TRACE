'use client';

/**
 * ForestCanvas — Standalone R3F 3D Background Component
 * Separated into its own 'use client' file for Next.js App Router SSR compatibility.
 *
 * Features:
 *  - Wind-shader foliage (layered sine-wave GLSL vertex deformation)
 *  - CatmullRom winding dirt path + undulating forest floor
 *  - FallingLeaves InstancedMesh particle system (50 leaves, physics-based)
 *  - FootprintSystem: raycaster plane → stamped footprints that fade in 2-3s
 *  - Atmospheric Sparkles (fireflies/spores from @react-three/drei)
 *  - Gentle procedural camera drift via useFrame
 */

import { useRef, useMemo, useCallback, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// ══════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════

const FOLIAGE_PALETTE = [
  '#1a4014', '#1e4818', '#244d1c', '#1b4015',
  '#265c20', '#1a3c12', '#2d5a1e', '#223818',
];

// ══════════════════════════════════════════════════════════
// WIND SHADERS
// ══════════════════════════════════════════════════════════

const WIND_VERT = `
  uniform float uTime;
  uniform float uWindStrength;
  uniform float uWindOffset;

  void main() {
    vec3 pos = position;
    float h = max(0.0, pos.y - 0.12);
    float w1 = sin(uTime * 1.65 + uWindOffset + pos.z * 1.9 + pos.x * 0.6) * uWindStrength * h;
    float w2 = sin(uTime * 2.40 + uWindOffset * 1.3 + pos.x * 2.6)         * uWindStrength * 0.28 * h;
    float w3 = cos(uTime * 1.10 + uWindOffset * 0.7 + pos.x * 1.55)        * uWindStrength * 0.32 * h;
    float w4 = sin(uTime * 0.85 + uWindOffset + pos.z * 0.8)                * uWindStrength * 0.15 * h;
    pos.x += w1 + w2;
    pos.z += w3;
    pos.y += w4;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const WIND_FRAG = `
  uniform vec3 uColor;
  void main() {
    gl_FragColor = vec4(uColor, 1.0);
  }
`;

// ══════════════════════════════════════════════════════════
// TREE — trunk + 3 foliage spheres with wind shader
// ══════════════════════════════════════════════════════════

function Tree({ position, scale = 1.0, windOffset = 0.0 }) {
  const matsRef    = useRef([]);

  const baseColor  = useMemo(() => FOLIAGE_PALETTE[Math.floor(Math.random() * FOLIAGE_PALETTE.length)], []);
  const trunkH     = useMemo(() => (1.7 + Math.random() * 0.6) * scale, [scale]);

  const trunkGeo   = useMemo(() => new THREE.CylinderGeometry(0.06 * scale, 0.15 * scale, trunkH, 8), [scale, trunkH]);
  const trunkMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a2618', roughness: 1.0 }), []);

  const layers = useMemo(() => {
    const sizes  = [0.90, 0.72, 0.55];
    const ySteps = [0.50, 1.10, 1.65];
    const tints  = [0.00, 0.06, 0.13];
    return sizes.map((r, i) => {
      const c = new THREE.Color(baseColor);
      c.g = Math.min(1, c.g + tints[i] * 0.12);
      c.r = Math.max(0, c.r - tints[i] * 0.04);
      return {
        geo: new THREE.SphereGeometry(r * scale, 8, 7),
        mat: new THREE.ShaderMaterial({
          uniforms: {
            uTime:         { value: 0 },
            uWindStrength: { value: 0.052 + Math.random() * 0.034 },
            uWindOffset:   { value: windOffset + i * 0.55 },
            uColor:        { value: c },
          },
          vertexShader:   WIND_VERT,
          fragmentShader: WIND_FRAG,
        }),
        y: trunkH + ySteps[i] * scale,
        x: (Math.random() - 0.5) * 0.14 * scale,
        z: (Math.random() - 0.5) * 0.14 * scale,
      };
    });
  }, [scale, baseColor, windOffset, trunkH]);

  matsRef.current = layers.map(l => l.mat);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    matsRef.current.forEach(m => { m.uniforms.uTime.value = t; });
  });

  return (
    <group position={position}>
      <mesh geometry={trunkGeo} material={trunkMat} position={[0, trunkH / 2, 0]} castShadow receiveShadow />
      {layers.map((layer, i) => (
        <mesh key={i} geometry={layer.geo} material={layer.mat}
          position={[layer.x, layer.y, layer.z]} castShadow />
      ))}
    </group>
  );
}

// ══════════════════════════════════════════════════════════
// GROUND & PATH
// ══════════════════════════════════════════════════════════

function GroundAndPath() {
  const groundGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(90, 130, 24, 24);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      if (Math.abs(x) > 5) pos.setY(i, Math.sin(x * 0.28) * 0.28 + Math.cos(z * 0.14) * 0.38);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  const groundMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a3d1a', roughness: 1.0 }), []);

  const pathGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3( 0.0, 0, 13),
      new THREE.Vector3( 0.5, 0,  6),
      new THREE.Vector3(-0.4, 0,  0),
      new THREE.Vector3( 0.6, 0, -9),
      new THREE.Vector3(-0.3, 0,-19),
      new THREE.Vector3( 0.4, 0,-32),
      new THREE.Vector3( 0.0, 0,-55),
    ]);
    const pts = curve.getPoints(140);
    const W = 5.2;
    const verts = [], uvs = [], indices = [];

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const t = i / (pts.length - 1);
      const next = pts[Math.min(i + 1, pts.length - 1)];
      const prev = pts[Math.max(i - 1, 0)];
      const dir  = next.clone().sub(prev).normalize();
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);
      const edge = Math.sin(i * 0.55) * 0.22;
      verts.push(
        p.x + perp.x * (W / 2 + edge), 0.018, p.z + perp.z * (W / 2 + edge),
        p.x - perp.x * (W / 2 - edge), 0.018, p.z - perp.z * (W / 2 - edge),
      );
      uvs.push(0, t * 14, 1, t * 14);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const b = i * 2;
      indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,   2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);

  const pathMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8b6947', roughness: 0.96 }), []);
  const centerGeo = useMemo(() => new THREE.PlaneGeometry(1.9, 130), []);
  const centerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9e7a55', roughness: 0.90 }), []);

  return (
    <group>
      <mesh geometry={groundGeo} material={groundMat} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      <mesh geometry={pathGeo}   material={pathMat}   receiveShadow />
      <mesh geometry={centerGeo} material={centerMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, -22]} receiveShadow />
    </group>
  );
}

// ══════════════════════════════════════════════════════════
// FALLING LEAVES — InstancedMesh, 50 leaves with physics
// ══════════════════════════════════════════════════════════

const LEAF_COUNT = 50;

function FallingLeaves() {
  const meshRef = useRef();
  const dummy   = useMemo(() => new THREE.Object3D(), []);
  const geo     = useMemo(() => new THREE.PlaneGeometry(0.16, 0.23), []);
  const mat     = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#3a6b2a', side: THREE.DoubleSide, transparent: true, opacity: 0.72, depthWrite: false,
  }), []);

  const leaves = useMemo(() => Array.from({ length: LEAF_COUNT }, () => ({
    x: (Math.random() - 0.5) * 36, y: 2 + Math.random() * 22, z: -Math.random() * 45,
    vx: (Math.random() - 0.5) * 0.0055, vy: -(0.009 + Math.random() * 0.011), vz: (Math.random() - 0.5) * 0.004,
    rx: Math.random() * Math.PI * 2, ry: Math.random() * Math.PI * 2, rz: Math.random() * Math.PI * 2,
    vrx: (Math.random() - 0.5) * 0.024, vry: (Math.random() - 0.5) * 0.024, vrz: (Math.random() - 0.5) * 0.014,
    phase: Math.random() * Math.PI * 2,
    swayAmp: 0.007 + Math.random() * 0.009,
  })), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < LEAF_COUNT; i++) {
      const l = leaves[i];
      l.x += l.vx + Math.sin(t * 0.72 + l.phase) * l.swayAmp;
      l.y += l.vy;
      l.z += l.vz;
      l.rx += l.vrx; l.ry += l.vry; l.rz += l.vrz;
      if (l.y < -1.5) {
        l.x = (Math.random() - 0.5) * 36; l.y = 10 + Math.random() * 14;
        l.z = -Math.random() * 45; l.phase = Math.random() * Math.PI * 2;
      }
      dummy.position.set(l.x, l.y, l.z);
      dummy.rotation.set(l.rx, l.ry, l.rz);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, LEAF_COUNT]} />;
}

// ══════════════════════════════════════════════════════════
// FOOTPRINT SYSTEM — raycaster + stamped footprints that fade
// ══════════════════════════════════════════════════════════

function FootprintSystem() {
  const { scene }     = useThree();
  const footprintsRef = useRef([]);
  const lastPosRef    = useRef(null);
  const isLeftRef     = useRef(true);
  const clockRef      = useRef(0);

  // Shared base geometries (reused across footprint instances)
  const soleGeo = useMemo(() => { const g = new THREE.CylinderGeometry(0.13, 0.13, 0.01, 10); g.scale(1.1, 1, 1.78); return g; }, []);
  const heelGeo = useMemo(() => { const g = new THREE.CylinderGeometry(0.09, 0.09, 0.01, 8);  g.scale(1.05, 1, 1.1); return g; }, []);
  const toeGeo  = useMemo(() => new THREE.CylinderGeometry(0.027, 0.027, 0.01, 6), []);

  useEffect(() => () => { soleGeo.dispose(); heelGeo.dispose(); toeGeo.dispose(); }, [soleGeo, heelGeo, toeGeo]);

  useFrame(({ clock }) => {
    clockRef.current = clock.elapsedTime;
    footprintsRef.current = footprintsRef.current.filter(fp => {
      const opacity = Math.max(0, fp.startOpacity * (1 - (clockRef.current - fp.createdAt) / fp.lifespan));
      fp.mat.opacity = opacity;
      if (opacity <= 0) { scene.remove(fp.group); fp.mat.dispose(); return false; }
      return true;
    });
  });

  const stampFootprint = useCallback((point, isLeft) => {
    const mat = new THREE.MeshBasicMaterial({ color: '#4aad60', transparent: true, opacity: 0.78, depthWrite: false });
    const group = new THREE.Group();

    const sole = new THREE.Mesh(soleGeo, mat); sole.position.set(0, 0, 0.10); group.add(sole);
    const heel = new THREE.Mesh(heelGeo, mat); heel.position.set(0, 0, -0.12); group.add(heel);

    for (let i = 0; i < 5; i++) {
      const toe = new THREE.Mesh(toeGeo, mat);
      const a = (i / 4) * Math.PI * 0.46;
      toe.position.set((isLeft ? -0.068 : 0.058) + Math.cos(a) * 0.088, 0, 0.265 + Math.sin(a) * 0.054);
      group.add(toe);
    }

    let dirAngle = 0;
    if (lastPosRef.current) {
      dirAngle = Math.atan2(point.x - lastPosRef.current.x, point.z - lastPosRef.current.z) + Math.PI;
    }
    const perpAngle = dirAngle + Math.PI / 2;
    group.position.set(point.x + Math.cos(perpAngle) * 0.20 * (isLeft ? -1 : 1), 0.022, point.z);
    group.rotation.y = dirAngle;
    scene.add(group);

    footprintsRef.current.push({ group, mat, createdAt: clockRef.current, lifespan: 2.3 + Math.random() * 0.7, startOpacity: 0.78 });

    // Memory cap — evict oldest if over limit
    if (footprintsRef.current.length > 28) {
      const oldest = footprintsRef.current.shift();
      scene.remove(oldest.group); oldest.mat.dispose();
    }
  }, [scene, soleGeo, heelGeo, toeGeo]);

  const handlePointerMove = useCallback((e) => {
    e.stopPropagation();
    const point = e.point;
    if (!lastPosRef.current) { lastPosRef.current = point.clone(); return; }
    if (lastPosRef.current.distanceTo(point) > 0.62) {
      stampFootprint(point, isLeftRef.current);
      isLeftRef.current = !isLeftRef.current;
      lastPosRef.current = point.clone();
    }
  }, [stampFootprint]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, -10]} onPointerMove={handlePointerMove}>
      <planeGeometry args={[5.5, 90]} />
      {/* Fully transparent — raycaster surface only */}
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ══════════════════════════════════════════════════════════
// LIGHTING
// ══════════════════════════════════════════════════════════

function Lights() {
  return (
    <>
      <ambientLight color="#1a3020" intensity={0.55} />
      <hemisphereLight skyColor="#b0d8c0" groundColor="#1a2a10" intensity={0.45} />
      <directionalLight
        color="#d0f4a0" intensity={1.3} position={[4, 14, -4]} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-22} shadow-camera-right={22}
        shadow-camera-top={22}  shadow-camera-bottom={-22}
        shadow-bias={-0.0012}
      />
      {/* Volumetric glow at the vanishing point of the path */}
      <pointLight color="#b0ffcc" intensity={10} distance={28} decay={2} position={[0, 5, -22]} />
      <pointLight color="#80e8a0" intensity={6}  distance={16} decay={2} position={[0, 2, -12]} />
      {/* Side rim lights for tree silhouette depth */}
      <pointLight color="#1e4830" intensity={3}  distance={20} decay={2} position={[-8, 6, -8]} />
      <pointLight color="#1e4830" intensity={3}  distance={20} decay={2} position={[ 8, 6, -8]} />
    </>
  );
}

// ══════════════════════════════════════════════════════════
// TREE PLACEMENT
// ══════════════════════════════════════════════════════════

const TREE_DATA = [
  // [x, y, z, scale, windOffset]
  [-4.2, 0,  -1, 1.10, 0.00], [-5.8, 0,  -6, 0.90, 0.37], [-4.6, 0, -12, 1.25, 0.74],
  [-7.0, 0, -17, 0.95, 1.11], [-5.3, 0, -23, 1.20, 1.48], [-8.5, 0, -29, 0.80, 1.85],
  [-6.2, 0, -35, 1.15, 2.22], [-9.0, 0, -41, 0.88, 2.59], [-4.0, 0,   4, 1.00, 2.96],
  [-6.5, 0,   2, 0.85, 3.33], [-11,  0,  -7, 0.78, 3.70], [-12,  0, -20, 0.72, 4.07],
  [-13,  0, -32, 0.68, 4.44], [-15,  0, -14, 0.65, 4.81],
  [ 4.2, 0,  -1, 1.10, 1.50], [ 5.8, 0,  -6, 1.00, 1.91], [ 4.6, 0, -12, 1.25, 2.32],
  [ 7.0, 0, -17, 0.92, 2.73], [ 5.3, 0, -23, 1.20, 3.14], [ 8.5, 0, -29, 0.80, 3.55],
  [ 6.2, 0, -35, 1.15, 3.96], [ 9.0, 0, -41, 0.88, 4.37], [ 4.0, 0,   4, 1.00, 4.78],
  [ 6.5, 0,   2, 0.85, 5.19], [ 11,  0,  -7, 0.78, 5.60], [ 12,  0, -20, 0.72, 6.01],
  [ 13,  0, -32, 0.68, 6.42], [ 15,  0, -14, 0.65, 6.83],
];

function ForestTrees() {
  return (
    <>
      {TREE_DATA.map(([x, y, z, scale, wo], i) => (
        <Tree key={i} position={[x, y, z]} scale={scale} windOffset={wo} />
      ))}
    </>
  );
}

// ══════════════════════════════════════════════════════════
// CAMERA DRIFT — subtle floating sensation
// ══════════════════════════════════════════════════════════

function CameraDrift() {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime;
    camera.position.x = Math.sin(t * 0.35) * 0.18;
    camera.position.y = 3.0 + Math.sin(t * 0.25) * 0.06;
    camera.lookAt(Math.sin(t * 0.20) * 0.25, 1.4, -22);
  });
  return null;
}

// ══════════════════════════════════════════════════════════
// FOREST CANVAS — exported default
// ══════════════════════════════════════════════════════════

export default function ForestCanvas({ theme = 'dark' }) {
  const isDark  = theme !== 'light';
  const bgColor = isDark ? '#0d1a0f' : '#1a2a12';
  const fogHex  = isDark ? '#18241b' : '#1e2e18';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'auto' }}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 3.0, 12], fov: 65, near: 0.1, far: 130 }}
        shadows
        gl={{
          antialias:           true,
          toneMapping:         THREE.ACESFilmicToneMapping,
          toneMappingExposure: isDark ? 0.85 : 1.0,
        }}
        onCreated={({ scene, gl }) => {
          scene.fog        = new THREE.FogExp2(fogHex, 0.020);
          scene.background = new THREE.Color(bgColor);
          gl.shadowMap.type = THREE.PCFShadowMap;
        }}
      >
        <Suspense fallback={null}>
          <CameraDrift />
          <Lights />
          <GroundAndPath />
          <ForestTrees />
          <FallingLeaves />
          <FootprintSystem />
          {/* Atmospheric fireflies — low canopy */}
          <Sparkles count={65} scale={[22, 12, 28]} position={[0, 3.5, -12]} size={2.8} speed={0.28} color="#a0ffb8" opacity={0.55} />
          {/* High-canopy faint spores */}
          <Sparkles count={30} scale={[18, 6,  20]} position={[0, 7.0, -15]} size={1.6} speed={0.15} color="#c8ffd8" opacity={0.30} />
        </Suspense>
      </Canvas>
    </div>
  );
}
