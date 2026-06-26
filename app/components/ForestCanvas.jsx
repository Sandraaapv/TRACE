'use client';

/**
 * ForestCanvas — Cinematic Hybrid Background System
 *
 * Architecture:
 *  Layer 0 : Photorealistic AI-generated forest background image (CSS, full-cover)
 *  Layer 1 : Atmospheric gradient overlays  (CSS — fog, vignette, god-ray boost)
 *  Layer 2 : R3F Canvas (alpha:true)        — 3D InstancedMesh leaves + firefly Points
 *  Layer 3 : HTML5 Canvas 2D               — cursor-driven wet footprint rendering
 */

import { useRef, useEffect, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════
// FOOTPRINT RENDERER (HTML5 Canvas 2D)
// Draws realistic mud footprints with soft green glow
// ═══════════════════════════════════════════════════════════

function drawFootprint(ctx, x, y, isLeft, alpha, angle) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.translate(x, y);
  ctx.rotate(angle);

  const s   = 1.05; // scale
  const xM  = isLeft ? -1 : 1; // mirror for left/right

  // — outer glow —
  ctx.shadowColor = `rgba(80, 210, 120, ${alpha * 0.85})`;
  ctx.shadowBlur  = 22;

  // — mud fill —
  const mudFill = `rgba(22, 45, 28, ${alpha * 0.88})`;
  ctx.fillStyle  = mudFill;

  // Heel
  ctx.beginPath();
  ctx.ellipse(xM * 5, 22 * s, 8 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mid-arch (connects heel to ball)
  ctx.beginPath();
  ctx.ellipse(xM * 6, 8 * s, 7 * s, 14 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball of foot
  ctx.beginPath();
  ctx.ellipse(xM * 8, -5 * s, 10 * s, 9 * s, 0.12, 0, Math.PI * 2);
  ctx.fill();

  // 5 toes (largest to smallest laterally)
  const TOES = [
    [xM * -1,  -17 * s, 4.5 * s, 5.5 * s],
    [xM *  5,  -21 * s, 4.0 * s, 5.0 * s],
    [xM * 11,  -20 * s, 3.5 * s, 4.5 * s],
    [xM * 16,  -17 * s, 3.0 * s, 4.0 * s],
    [xM * 20,  -12 * s, 2.5 * s, 3.2 * s],
  ];
  TOES.forEach(([tx, ty, rw, rh]) => {
    ctx.beginPath();
    ctx.ellipse(tx, ty, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // — subtle inner highlight for wet look —
  ctx.shadowBlur = 0;
  ctx.globalAlpha = alpha * 0.18;
  ctx.fillStyle = 'rgba(140, 220, 160, 1)';
  ctx.beginPath();
  ctx.ellipse(xM * 6, 6 * s, 5 * s, 10 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════
// 3D FALLING LEAVES  (InstancedMesh — 60 leaves)
// ═══════════════════════════════════════════════════════════

const LEAF_COUNT  = 60;
const LEAF_COLORS = ['#2d5a1e', '#3a7028', '#1e4015', '#4a6020', '#3d5818', '#2a4a18'];

function FallingLeaves() {
  const meshRef = useRef();
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  // Create a simple leaf shape using a PlaneGeometry with slight warp
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.20, 0.30, 1, 2);
    // Warp middle verts slightly to give leaf curvature
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getY(i)) < 0.08) {
        pos.setX(i, pos.getX(i) * 0.6); // narrow mid-section
      }
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color:       '#2e5a1e',
    side:        THREE.DoubleSide,
    transparent: true,
    opacity:     0.80,
    depthWrite:  false,
  }), []);

  const leaves = useMemo(() => Array.from({ length: LEAF_COUNT }, () => ({
    x:       (Math.random() - 0.5) * 38,
    y:       3  + Math.random() * 22,
    z:       -Math.random() * 28,
    vx:      (Math.random() - 0.5) * 0.005,
    vy:      -(0.007 + Math.random() * 0.011),
    rx:      Math.random() * Math.PI * 2,
    ry:      Math.random() * Math.PI * 2,
    rz:      Math.random() * Math.PI * 2,
    vrx:     (Math.random() - 0.5) * 0.022,
    vry:     (Math.random() - 0.5) * 0.028,
    vrz:     (Math.random() - 0.5) * 0.016,
    phase:   Math.random() * Math.PI * 2,
    sway:    0.005 + Math.random() * 0.008,
  })), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    for (let i = 0; i < LEAF_COUNT; i++) {
      const l = leaves[i];
      l.x  += l.vx + Math.sin(t * 0.65 + l.phase) * l.sway;
      l.y  += l.vy;
      l.z  += (Math.random() - 0.5) * 0.002;
      l.rx += l.vrx; l.ry += l.vry; l.rz += l.vrz;

      if (l.y < -2.5) {
        l.x     = (Math.random() - 0.5) * 38;
        l.y     = 12 + Math.random() * 16;
        l.z     = -Math.random() * 28;
        l.phase = Math.random() * Math.PI * 2;
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

// ═══════════════════════════════════════════════════════════
// 3D FIREFLY PARTICLES  (THREE.Points with additive blending)
// ═══════════════════════════════════════════════════════════

const FF_COUNT = 90;

function Fireflies() {
  const pointsRef = useRef();

  const { basePos, phases } = useMemo(() => {
    const basePos = new Float32Array(FF_COUNT * 3);
    const phases  = new Float32Array(FF_COUNT);
    for (let i = 0; i < FF_COUNT; i++) {
      basePos[i * 3]     = (Math.random() - 0.5) * 28;
      basePos[i * 3 + 1] = 0.5 + Math.random() * 11;
      basePos[i * 3 + 2] = -1 - Math.random() * 26;
      phases[i]          = Math.random() * Math.PI * 2;
    }
    return { basePos, phases };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(basePos.slice(), 3));
    return g;
  }, [basePos]);

  const mat = useMemo(() => new THREE.PointsMaterial({
    color:          '#c0ffcc',
    size:           0.14,
    transparent:    true,
    opacity:        0.90,
    sizeAttenuation: true,
    blending:       THREE.AdditiveBlending,
    depthWrite:     false,
  }), []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t   = clock.elapsedTime;
    const pos = pointsRef.current.geometry.attributes.position;

    for (let i = 0; i < FF_COUNT; i++) {
      const p = phases[i];
      pos.setXYZ(
        i,
        basePos[i * 3]     + Math.cos(t * 0.55 + p * 1.1) * 0.28,
        basePos[i * 3 + 1] + Math.sin(t * 0.80 + p)       * 0.32,
        basePos[i * 3 + 2] + Math.sin(t * 0.40 + p * 0.7) * 0.18,
      );
    }
    pos.needsUpdate = true;

    // Global pulse — simulates firefly collective blinking
    pointsRef.current.material.opacity = 0.55 + Math.abs(Math.sin(t * 1.2)) * 0.40;
  });

  return <points ref={pointsRef} geometry={geo} material={mat} />;
}

// ═══════════════════════════════════════════════════════════
// ATMOSPHERIC FOG PARTICLES (slow-drifting mist dots)
// ═══════════════════════════════════════════════════════════

const MIST_COUNT = 120;

function MistParticles() {
  const pointsRef = useRef();

  const { basePos, phases } = useMemo(() => {
    const basePos = new Float32Array(MIST_COUNT * 3);
    const phases  = new Float32Array(MIST_COUNT);
    for (let i = 0; i < MIST_COUNT; i++) {
      basePos[i * 3]     = (Math.random() - 0.5) * 30;
      basePos[i * 3 + 1] = Math.random() * 5;
      basePos[i * 3 + 2] = -3 - Math.random() * 22;
      phases[i]          = Math.random() * Math.PI * 2;
    }
    return { basePos, phases };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(basePos.slice(), 3));
    return g;
  }, [basePos]);

  const mat = useMemo(() => new THREE.PointsMaterial({
    color:          '#c8e8d0',
    size:           0.30,
    transparent:    true,
    opacity:        0.18,
    sizeAttenuation: true,
    blending:       THREE.AdditiveBlending,
    depthWrite:     false,
  }), []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t   = clock.elapsedTime * 0.12;
    const pos = pointsRef.current.geometry.attributes.position;

    for (let i = 0; i < MIST_COUNT; i++) {
      const p = phases[i];
      pos.setX(i, basePos[i * 3] + Math.sin(t + p) * 0.4);
      pos.setY(i, basePos[i * 3 + 1] + Math.sin(t * 0.6 + p * 1.2) * 0.12);
    }
    pos.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geo} material={mat} />;
}

// ═══════════════════════════════════════════════════════════
// MAIN FOREST CANVAS COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ForestCanvas() {
  const fpCanvasRef   = useRef(null);
  const footprintsRef = useRef([]);
  const lastPosRef    = useRef(null);
  const isLeftRef     = useRef(true);
  const rafRef        = useRef(null);

  // ── Setup HTML5 Canvas + footprint animation loop ──────
  useEffect(() => {
    const canvas = fpCanvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();

      footprintsRef.current = footprintsRef.current.filter(fp => {
        const age   = (now - fp.createdAt) / 1000;
        const alpha = Math.max(0, 1 - age / fp.lifespan);
        if (alpha <= 0) return false;
        drawFootprint(ctx, fp.x, fp.y, fp.isLeft, alpha, fp.angle);
        return true;
      });

      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Cursor footprint stamping ──────────────────────────
  const handleMouseMove = useCallback((e) => {
    const pos = { x: e.clientX, y: e.clientY };

    if (!lastPosRef.current) {
      lastPosRef.current = pos;
      return;
    }

    const dx   = pos.x - lastPosRef.current.x;
    const dy   = pos.y - lastPosRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Only stamp when cursor has moved the threshold distance (natural gait)
    if (dist > 32) {
      const moveAngle = Math.atan2(dy, dx);
      const perpAngle = moveAngle + Math.PI / 2;
      const offset    = 15;
      const side      = isLeftRef.current ? -1 : 1;

      footprintsRef.current.push({
        x:         pos.x + Math.cos(perpAngle) * offset * side,
        y:         pos.y + Math.sin(perpAngle) * offset * side,
        isLeft:    isLeftRef.current,
        angle:     moveAngle - Math.PI / 2, // orient footprint in direction of travel
        createdAt: Date.now(),
        lifespan:  2.5 + Math.random() * 0.8,
      });

      // Memory cap
      if (footprintsRef.current.length > 50) {
        footprintsRef.current.shift();
      }

      isLeftRef.current  = !isLeftRef.current;
      lastPosRef.current = pos;
    }
  }, []);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
    >
      {/* ── Layer 0: Photorealistic AI-generated forest background ── */}
      <div
        style={{
          position:           'absolute',
          inset:              0,
          backgroundImage:    "url('/forest-bg.jpg')",
          backgroundSize:     'cover',
          backgroundPosition: 'center center',
          backgroundRepeat:   'no-repeat',
        }}
      />

      {/* ── Layer 1a: Vignette (darkens edges, focuses on center path) ── */}
      <div
        style={{
          position:   'absolute',
          inset:      0,
          background: 'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 15%, rgba(4,10,6,0.32) 65%, rgba(2,7,4,0.72) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 1b: Top gradient (nav readability) ── */}
      <div
        style={{
          position:   'absolute',
          top: 0, left: 0, right: 0,
          height:     '220px',
          background: 'linear-gradient(to bottom, rgba(2,8,4,0.80) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 1c: Bottom gradient (hero text readability) ── */}
      <div
        style={{
          position:   'absolute',
          bottom: 0, left: 0, right: 0,
          height:     '65%',
          background: 'linear-gradient(to top, rgba(2,8,4,0.96) 0%, rgba(2,8,4,0.65) 40%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 1d: God-ray glow boost (warm centre glow) ── */}
      <div
        style={{
          position:   'absolute',
          inset:      0,
          background: 'radial-gradient(ellipse 30% 50% at 50% 38%, rgba(200,170,80,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      />

      {/* ── Layer 2: R3F Transparent Canvas (leaves + fireflies + mist) ── */}
      <Canvas
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        camera={{ position: [0, 5, 14], fov: 68 }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={({ scene }) => { scene.background = null; }}
      >
        <Suspense fallback={null}>
          <FallingLeaves />
          <Fireflies />
          <MistParticles />
        </Suspense>
      </Canvas>

      {/* ── Layer 3: HTML5 Canvas for cursor footprints ── */}
      <canvas
        ref={fpCanvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}
      />
    </div>
  );
}
