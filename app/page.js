'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, Shield, Cpu, ArrowRight, LogIn, Sun, Moon, Phone, AlertTriangle, Lock } from 'lucide-react';
import * as THREE from 'three';

export default function LandingPage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('trace_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('trace_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleQuickHide = () => {
    window.history.replaceState(null, '', '/');
    window.history.pushState(null, '', '/decoy');
    document.title = 'Home Gardening Tips';
    window.location.replace('/decoy');
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const isDark = theme === 'dark';
    const W = window.innerWidth;
    const H = window.innerHeight;

    // Scene
    const scene = new THREE.Scene();

    // Sky gradient via background color + fog
    if (isDark) {
      scene.background = new THREE.Color('#0d1117');
      scene.fog = new THREE.Fog('#0d1117', 18, 55);
    } else {
      scene.background = new THREE.Color('#b8d4e8');
      scene.fog = new THREE.Fog('#c8dff0', 20, 60);
    }

    // Camera — low angle, looking forward like POV on path
    const camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 120);
    camera.position.set(0, 2.8, 10);
    camera.lookAt(0, 1.5, -30);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvasRef.current,
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 0.6 : 1.1;

    // ---- LIGHTING ----
    const ambientLight = new THREE.AmbientLight(isDark ? '#1a2040' : '#ffffff', isDark ? 0.4 : 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(isDark ? '#3a4a80' : '#fff8e0', isDark ? 0.6 : 1.4);
    sunLight.position.set(8, 18, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 80;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(
      isDark ? '#1a2040' : '#87ceeb',
      isDark ? '#050810' : '#4a7c40',
      isDark ? 0.5 : 0.8
    );
    scene.add(hemiLight);

    // ---- SKY DOME ----
    const skyGeo = new THREE.SphereGeometry(90, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: isDark ? '#0d1117' : '#c2dff5',
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // ---- GROUND ----
    const groundGeo = new THREE.PlaneGeometry(80, 120, 30, 30);
    // Slight undulation for realism
    const groundPos = groundGeo.attributes.position;
    for (let i = 0; i < groundPos.count; i++) {
      const x = groundPos.getX(i);
      const z = groundPos.getZ(i);
      // Keep center path flat, undulate sides
      const distFromCenter = Math.abs(x);
      if (distFromCenter > 5) {
        groundPos.setY(i, Math.sin(x * 0.3) * 0.3 + Math.cos(z * 0.15) * 0.4);
      }
    }
    groundPos.needsUpdate = true;
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: isDark ? '#1a2410' : '#3d5a28',
      roughness: 1.0,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ---- DIRT PATH ----
    // Main center path using CatmullRom curve for natural winding
    const pathCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.01, 10),
      new THREE.Vector3(0.3, 0.01, 5),
      new THREE.Vector3(-0.2, 0.01, 0),
      new THREE.Vector3(0.5, 0.01, -8),
      new THREE.Vector3(0, 0.01, -20),
      new THREE.Vector3(0.2, 0.01, -40),
      new THREE.Vector3(0, 0.01, -60),
    ]);

    // Create path surface as wide band
    const pathPoints = pathCurve.getPoints(100);
    const pathWidth = 5.5;
    const pathVertices = [];
    const pathIndices = [];
    const pathUvs = [];

    for (let i = 0; i < pathPoints.length; i++) {
      const p = pathPoints[i];
      const t = i / (pathPoints.length - 1);

      // Direction
      let dir;
      if (i < pathPoints.length - 1) {
        dir = pathPoints[i + 1].clone().sub(p).normalize();
      } else {
        dir = p.clone().sub(pathPoints[i - 1]).normalize();
      }
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);

      const left = p.clone().add(perp.clone().multiplyScalar(pathWidth / 2));
      const right = p.clone().sub(perp.clone().multiplyScalar(pathWidth / 2));

      // Slight random waviness on path edges
      const wave = Math.sin(i * 0.6) * 0.15;
      left.x += wave;
      right.x -= wave;

      pathVertices.push(left.x, 0.015, left.z);
      pathVertices.push(right.x, 0.015, right.z);

      pathUvs.push(0, t * 10);
      pathUvs.push(1, t * 10);
    }

    for (let i = 0; i < pathPoints.length - 1; i++) {
      const base = i * 2;
      pathIndices.push(base, base + 1, base + 2);
      pathIndices.push(base + 1, base + 3, base + 2);
    }

    const pathGeo = new THREE.BufferGeometry();
    pathGeo.setAttribute('position', new THREE.Float32BufferAttribute(pathVertices, 3));
    pathGeo.setAttribute('uv', new THREE.Float32BufferAttribute(pathUvs, 2));
    pathGeo.setIndex(pathIndices);
    pathGeo.computeVertexNormals();

    const pathMat = new THREE.MeshStandardMaterial({
      color: isDark ? '#3a2e1e' : '#c4956a',
      roughness: 0.95,
      metalness: 0.0,
    });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.receiveShadow = true;
    scene.add(pathMesh);

    // Path center lighter strip (worn center)
    const centerPathGeo = new THREE.PlaneGeometry(1.5, 120);
    const centerPathMat = new THREE.MeshStandardMaterial({
      color: isDark ? '#4a3c28' : '#d4a878',
      roughness: 0.9,
    });
    const centerPath = new THREE.Mesh(centerPathGeo, centerPathMat);
    centerPath.rotation.x = -Math.PI / 2;
    centerPath.position.set(0, 0.02, -20);
    centerPath.receiveShadow = true;
    scene.add(centerPath);

    // ---- TREES ----
    const createTree = (x, z, scale = 1.0, lean = 0) => {
      const group = new THREE.Group();

      // Trunk - tapered cylinder
      const trunkH = (1.5 + Math.random() * 0.8) * scale;
      const trunkGeo = new THREE.CylinderGeometry(
        0.08 * scale,
        0.18 * scale,
        trunkH,
        8
      );
      const trunkMat = new THREE.MeshStandardMaterial({
        color: isDark ? '#2a1f14' : '#5c3d1e',
        roughness: 1.0,
      });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      group.add(trunk);

      // Foliage — layered spheres for round deciduous look
      const foliageColors = isDark
        ? ['#1a3020', '#162814', '#0f2010']
        : ['#2d5a1e', '#3a7028', '#4a8832', '#1e4015'];

      const layers = 3 + Math.floor(Math.random() * 2);
      for (let l = 0; l < layers; l++) {
        const r = (0.9 - l * 0.12) * scale * (0.8 + Math.random() * 0.4);
        const foliageGeo = new THREE.SphereGeometry(r, 8, 7);
        // Flatten slightly for more tree-like
        const fMat = new THREE.MeshStandardMaterial({
          color: foliageColors[l % foliageColors.length],
          roughness: 0.9,
          flatShading: l > 1,
        });
        const foliage = new THREE.Mesh(foliageGeo, fMat);
        foliage.scale.y = 1.2 + l * 0.1;
        foliage.position.y = trunkH + l * r * 0.55;
        foliage.position.x = (Math.random() - 0.5) * 0.3 * scale;
        foliage.castShadow = true;
        group.add(foliage);
      }

      group.position.set(x, 0, z);
      group.rotation.z = lean;
      group.rotation.y = Math.random() * Math.PI * 2;
      scene.add(group);
    };

    // Left side trees — dense forest feel
    const leftTrees = [
      [-4.5, -2], [-6.0, -7], [-5.2, -12], [-7.5, -17], [-5.8, -22],
      [-8.0, -27], [-6.5, -32], [-9.0, -37], [-7.0, -42],
      [-4.0, 0], [-5.5, 5], [-7.0, 8],
      [-10, -5], [-12, -12], [-10, -20], [-13, -28], [-11, -35],
      [-14, -15], [-16, -8], [-15, -22],
    ];
    const rightTrees = [
      [4.5, -2], [6.0, -7], [5.2, -12], [7.5, -17], [5.8, -22],
      [8.0, -27], [6.5, -32], [9.0, -37], [7.0, -42],
      [4.0, 0], [5.5, 5], [7.0, 8],
      [10, -5], [12, -12], [10, -20], [13, -28], [11, -35],
      [14, -15], [16, -8], [15, -22],
    ];

    leftTrees.forEach(([x, z]) => {
      const scale = 0.7 + Math.random() * 0.7;
      const lean = (Math.random() - 0.5) * 0.08;
      createTree(x, z, scale, lean);
    });
    rightTrees.forEach(([x, z]) => {
      const scale = 0.7 + Math.random() * 0.7;
      const lean = (Math.random() - 0.5) * 0.08;
      createTree(x, z, scale, -lean);
    });

    // ---- GRASS TUFTS (on sides) ----
    const createGrassTuft = (x, z) => {
      const geo = new THREE.ConeGeometry(0.12, 0.4, 4);
      const mat = new THREE.MeshStandardMaterial({
        color: isDark ? '#1a2e10' : '#4a7228',
        roughness: 1.0,
      });
      for (let i = 0; i < 5; i++) {
        const blade = new THREE.Mesh(geo, mat);
        blade.position.set(
          x + (Math.random() - 0.5) * 0.8,
          0.2,
          z + (Math.random() - 0.5) * 0.8
        );
        blade.rotation.z = (Math.random() - 0.5) * 0.4;
        blade.rotation.y = Math.random() * Math.PI * 2;
        scene.add(blade);
      }
    };

    for (let z = 5; z > -50; z -= 1.5) {
      // Left grass tufts
      if (Math.random() > 0.5) createGrassTuft(-3.5 - Math.random() * 2.5, z);
      // Right grass tufts
      if (Math.random() > 0.5) createGrassTuft(3.5 + Math.random() * 2.5, z);
    }

    // ---- FOOTPRINT SYSTEM ----
    const footprints = [];
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let lastPosition = new THREE.Vector3(0, 0, 0);
    let leftFoot = true;
    let hasMoved = false;

    const footprintColor = isDark ? '#10b981' : '#8b5e3c';

    const createFootprintMesh = (pos, angle, isLeft) => {
      const group = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({
        color: footprintColor,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });

      // Sole
      const soleGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.01, 14);
      const sole = new THREE.Mesh(soleGeo, mat);
      sole.scale.set(1.2, 1, 1.9);
      sole.position.set(0, 0.02, 0.15);
      group.add(sole);

      // Heel
      const heelGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.01, 10);
      const heel = new THREE.Mesh(heelGeo, mat);
      heel.scale.set(1.1, 1, 1.2);
      heel.position.set(0, 0.02, -0.15);
      group.add(heel);

      // Toes
      for (let i = 0; i < 5; i++) {
        const toeGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.01, 7);
        const toe = new THREE.Mesh(toeGeo, mat);
        const a = (i / 4) * Math.PI * 0.5;
        toe.position.set(
          (isLeft ? -0.08 : 0.04) + Math.cos(a) * 0.1,
          0.02,
          0.34 + Math.sin(a) * 0.07
        );
        group.add(toe);
      }

      group.position.copy(pos);
      group.rotation.y = angle;
      scene.add(group);

      return { mesh: group, materials: [mat], age: 0, maxAge: 220 };
    };

    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([pathMesh, centerPath, ground]);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        if (!hasMoved) {
          lastPosition.copy(point);
          hasMoved = true;
          return;
        }
        const dist = lastPosition.distanceTo(point);
        if (dist > 0.7) {
          const angle = Math.atan2(point.x - lastPosition.x, point.z - lastPosition.z) + Math.PI;
          const perpAngle = angle + Math.PI / 2;
          const spawnPos = point.clone();
          spawnPos.x += Math.cos(perpAngle) * 0.22 * (leftFoot ? -1 : 1);
          spawnPos.y = 0.02;
          footprints.push(createFootprintMesh(spawnPos, angle, leftFoot));
          leftFoot = !leftFoot;
          lastPosition.copy(point);
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // ---- SUBTLE CAMERA DRIFT ANIMATION ----
    let time = 0;

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.003;

      // Gentle camera sway
      camera.position.x = Math.sin(time * 0.4) * 0.15;
      camera.position.y = 2.8 + Math.sin(time * 0.3) * 0.05;
      camera.lookAt(Math.sin(time * 0.2) * 0.3, 1.5, -30);

      // Animate footprint fade
      for (let i = footprints.length - 1; i >= 0; i--) {
        const fp = footprints[i];
        fp.age += 1;
        const ratio = fp.age / fp.maxAge;
        fp.materials.forEach(m => {
          m.opacity = Math.max(0, 0.85 * (1 - ratio));
        });
        fp.mesh.scale.y = 1 - ratio * 0.6;
        if (fp.age >= fp.maxAge) {
          scene.remove(fp.mesh);
          fp.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
          fp.materials.forEach(m => m.dispose());
          footprints.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
    };
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <div style={{ backgroundColor: isDark ? '#0d1117' : '#f0ede6', color: isDark ? '#e2e8d8' : '#2d3828', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ======== FULLSCREEN HERO WITH 3D BACKGROUND ======== */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* 3D Canvas — fullscreen background */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
          }}
        />

        {/* Gradient overlays for text readability */}
        {/* Top gradient for nav */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '180px', zIndex: 1,
          background: isDark
            ? 'linear-gradient(to bottom, rgba(13,17,23,0.85) 0%, transparent 100%)'
            : 'linear-gradient(to bottom, rgba(30,40,20,0.6) 0%, transparent 100%)',
        }} />
        {/* Bottom gradient for hero text */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', zIndex: 1,
          background: isDark
            ? 'linear-gradient(to top, rgba(13,17,23,0.95) 0%, rgba(13,17,23,0.7) 50%, transparent 100%)'
            : 'linear-gradient(to top, rgba(20,28,15,0.90) 0%, rgba(20,28,15,0.6) 50%, transparent 100%)',
        }} />

        {/* ---- NAV (floating over canvas) ---- */}
        <header style={{ position: 'relative', zIndex: 10, padding: '1.5rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.4rem', fontWeight: '800', color: '#ffffff', letterSpacing: '2px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            <img src="/shield-logo.png" alt="TRACE" style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            TRACE
          </div>

          {/* Nav Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Tracking active badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              backgroundColor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '30px',
              padding: '0.4rem 0.9rem',
              fontSize: '0.75rem',
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: '0.5px',
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }}></span>
              secure connection
            </div>

            {/* Theme toggle */}
            <button onClick={toggleTheme} title="Toggle Theme" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Quick hide */}
            <button onClick={handleQuickHide} style={{ backgroundColor: 'rgba(200,50,50,0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '0.45rem 1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', letterSpacing: '0.5px' }}>
              🌿 Hide Site
            </button>

            {/* Login */}
            <Link href="/login" style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: '#1a2a12', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
              <LogIn size={15} /> Log In
            </Link>
          </div>
        </header>

        {/* ---- HERO TEXT (bottom-left overlay like reference image) ---- */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: '3rem 4rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '2rem' }}>

          {/* Left: main hero text */}
          <div style={{ flex: 1, maxWidth: '640px' }}>
            {/* Small label */}
            <div style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '0.75rem' }}>
              TRACE SAFETY NETWORK
            </div>

            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: '800', color: '#ffffff', lineHeight: '1.1', marginBottom: '1rem', textShadow: '0 3px 20px rgba(0,0,0,0.6)' }}>
              Your Journey,<br />Your Footprints
            </h1>

            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.82)', lineHeight: '1.6', marginBottom: '2rem', maxWidth: '520px', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
              TRACE operates silently in any browser — no app install, no history traces. 
              Detect abuse patterns, store tamper-proof evidence, and trigger emergency alerts to safety supervisors.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffffff', color: '#1a2a12', padding: '0.85rem 2rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 8px 25px rgba(0,0,0,0.4)', transition: 'transform 0.2s ease' }}>
                Enter Secure Console <ArrowRight size={18} />
              </Link>
            </div>

            {/* Footprint hint */}
            <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🖱️</span>
              <span>Move your cursor along the path to leave footprints that fade away</span>
            </div>
          </div>

          {/* Right: glassmorphism info card */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            padding: '1.75rem',
            minWidth: '260px',
            maxWidth: '300px',
          }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', margin: '0 0 1rem 0' }}>
              Safety Status
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={15} color="#4ade80" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ffffff' }}>End-to-End Encrypted</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>All data stored locally only</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(96,165,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={15} color="#60a5fa" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ffffff' }}>Stealth Mode Active</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Decoy site ready to deploy</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(251,146,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={15} color="#fb923c" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ffffff' }}>SOS Routing Ready</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Emergency dispatch connected</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              Press ESC anytime to activate camouflage
            </div>
          </div>
        </div>
      </section>

      {/* ======== EMERGENCY RESOURCES ======== */}
      <section id="support" style={{ padding: '5rem 0', backgroundColor: isDark ? '#0d1117' : '#faf7f2', borderTop: isDark ? '1px solid #1e2530' : '1px solid #e8e0d0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.5rem auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: isDark ? '#e2e8d8' : '#2d4828', marginBottom: '0.75rem' }}>
              Emergency Hotlines & Safety Resources
            </h2>
            <p style={{ fontSize: '1rem', color: isDark ? '#8f9c8a' : '#5a6a55' }}>
              If you are in immediate danger, please dial local emergency services (911) or contact the organizations below.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '2.5rem' }}>
            {[
              {
                icon: <Shield size={26} />,
                title: 'Emergency Dispatch',
                highlight: 'Call 911 Immediately',
                text: 'For immediate physical danger, police dispatch, medical emergencies, or urgent escape assistance.',
                color: isDark ? '#f87171' : '#dc2626',
                bg: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.06)',
              },
              {
                icon: <Phone size={26} />,
                title: 'National DV Helpline',
                highlight: '1-800-799-SAFE (7233)',
                text: 'Free, confidential 24/7 support. Text "START" to 88788 for private text guidance.',
                color: isDark ? '#60a5fa' : '#2563eb',
                bg: isDark ? 'rgba(96,165,250,0.08)' : 'rgba(37,99,235,0.06)',
              },
              {
                icon: <Eye size={26} />,
                title: 'Discreet Browsing Guide',
                highlight: 'Browse Safely',
                text: 'Use Incognito/Private tabs, delete browser history logs, or access TRACE from a secure trusted device.',
                color: isDark ? '#4ade80' : '#16a34a',
                bg: isDark ? 'rgba(74,222,128,0.08)' : 'rgba(22,163,74,0.06)',
              },
            ].map((card, i) => (
              <div key={i} style={{
                backgroundColor: isDark ? '#13181f' : '#ffffff',
                border: isDark ? '1px solid #1e2530' : '1px solid #e8e0d0',
                borderRadius: '16px',
                padding: '2.25rem 2rem',
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, marginBottom: '0.5rem' }}>
                  {card.icon}
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: isDark ? '#e2e8d8' : '#2d4828', margin: 0 }}>
                  {card.title}
                </h4>
                <p style={{ fontSize: '1.1rem', fontWeight: '800', color: card.color, margin: 0 }}>
                  {card.highlight}
                </p>
                <p style={{ fontSize: '0.88rem', color: isDark ? '#8f9c8a' : '#5a6a55', margin: 0, lineHeight: '1.55' }}>
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== FOOTER ======== */}
      <footer style={{ backgroundColor: isDark ? '#080b10' : '#1e2e14', color: isDark ? '#8f9c8a' : '#a0b898', padding: '2.5rem 0', borderTop: isDark ? '1px solid #1e2530' : '1px solid #2d4020' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem', letterSpacing: '1px' }}>TRACE</h3>
            <p style={{ fontSize: '0.82rem', margin: 0 }}>Technology for Reporting Abuse, Crisis, and Escape.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link href="/login" style={{ fontSize: '0.85rem', color: isDark ? '#8f9c8a' : '#a0b898', textDecoration: 'none', fontWeight: '600' }}>Secure Portal</Link>
            <span style={{ opacity: 0.3 }}>•</span>
            <a href="#" onClick={(e) => { e.preventDefault(); handleQuickHide(); }} style={{ fontSize: '0.85rem', color: isDark ? '#8f9c8a' : '#a0b898', textDecoration: 'none', fontWeight: '600' }}>Toggle Disguise</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
