'use client';

import { useMemo } from 'react';

const LEAF_PATH =
  'M12 2C12 2 4 8 4 16C4 22 8 26 12 28C16 26 20 22 20 16C20 8 12 2 12 2Z';

function Leaf({ leaf }) {
  return (
    <div
      className="falling-leaf"
      style={{
        left: `${leaf.left}%`,
        width: leaf.size,
        height: leaf.size * 1.35,
        animationDelay: `${leaf.delay}s`,
        animationDuration: `${leaf.duration}s`,
        '--sway': `${leaf.sway}px`,
        '--spin-start': `${leaf.rotation}deg`,
        '--leaf-hue': leaf.hue,
        '--leaf-opacity': leaf.opacity,
      }}
    >
      <svg viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`lg-${leaf.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`hsl(${leaf.hue}, 52%, 38%)`} />
            <stop offset="45%" stopColor={`hsl(${leaf.hue + 8}, 48%, 32%)`} />
            <stop offset="100%" stopColor={`hsl(${leaf.hue - 12}, 55%, 22%)`} />
          </linearGradient>
        </defs>
        <path d={LEAF_PATH} fill={`url(#lg-${leaf.id})`} opacity="0.92" />
        <path
          d="M12 4C12 4 8 10 8 16C8 20 10 23 12 24"
          stroke={`hsl(${leaf.hue - 20}, 40%, 18%)`}
          strokeWidth="0.6"
          fill="none"
          opacity="0.55"
        />
      </svg>
    </div>
  );
}

export default function FallingLeaves({ count = 48 }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: -(Math.random() * 18),
        duration: 9 + Math.random() * 14,
        size: 16 + Math.random() * 28,
        rotation: Math.random() * 360,
        hue: 88 + Math.random() * 42,
        opacity: 0.55 + Math.random() * 0.45,
        sway: 30 + Math.random() * 70,
      })),
    [count]
  );

  return (
    <div className="falling-leaves-layer" aria-hidden="true">
      {leaves.map((leaf) => (
        <Leaf key={leaf.id} leaf={leaf} />
      ))}
    </div>
  );
}
