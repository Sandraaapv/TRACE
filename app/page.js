'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, LogIn, Sun, Moon, Shield, Lock, AlertTriangle, Phone, Eye, Leaf } from 'lucide-react';

// ── Dynamic import with ssr: false — prevents Three.js window/WebGL errors during SSR ──
const ForestCanvas = dynamic(
  () => import('./components/ForestCanvas'),
  {
    ssr: false,
    loading: () => (
      // Fallback while canvas loads — matches forest bg color
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundColor: '#0d1a0f' }} />
    ),
  }
);

// ═══════════════════════════════════════════════════════════
// GLASS CARD helper
// ═══════════════════════════════════════════════════════════

function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      backgroundColor: 'rgba(10, 20, 12, 0.55)',
      backdropFilter:  'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border:          '1px solid rgba(255,255,255,0.10)',
      borderRadius:    '16px',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function LandingPage() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('trace_theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('trace_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleQuickHide = () => {
    window.history.replaceState(null, '', '/');
    document.title = 'Home Gardening Tips';
    window.location.replace('/decoy');
  };

  return (
    <div style={{ backgroundColor: '#0d1a0f', color: '#ffffff', fontFamily: 'var(--font-sans)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── 3D Forest Canvas (z: 0) ── */}
      <ForestCanvas theme={theme} />

      {/* ══════════════════════════════════════════════════════
          HERO SECTION — full-viewport overlay (z: 10)
      ══════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 10, width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', pointerEvents: 'none' }}>

        {/* Top gradient — darkens sky for nav legibility */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '200px', zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(8,18,10,0.82) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Bottom gradient — darkens ground for hero text legibility */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', zIndex: 1,
          background: 'linear-gradient(to top, rgba(8,18,10,0.96) 0%, rgba(8,18,10,0.65) 45%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* ── NAVIGATION ── */}
        <header style={{ position: 'relative', zIndex: 20, padding: '1.6rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'auto' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', letterSpacing: '2.5px', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
            <img src="/shield-logo.png" alt="" style={{ width: '26px', height: '26px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            TRACE
          </div>

          {/* Nav pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

            {/* Active connection indicator */}
            <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.4rem 0.9rem', borderRadius: '30px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4ade80', boxShadow: '0 0 8px #4ade80', flexShrink: 0 }} />
              <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.5px', color: '#ffffff' }}>secure connection</span>
            </GlassCard>

            {/* Theme toggle */}
            <button onClick={toggleTheme} title="Toggle Theme" style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0' }}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Quick hide */}
            <button onClick={handleQuickHide} style={{ backgroundColor: 'rgba(180,30,30,0.65)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', padding: '0.45rem 1rem', borderRadius: '9px', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🌿 Hide Site
            </button>

            {/* Log In */}
            <Link href="/login" style={{ backgroundColor: 'rgba(255,255,255,0.94)', color: '#0d1a0f', padding: '0.5rem 1.3rem', borderRadius: '9px', fontWeight: '800', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.4)', letterSpacing: '0.2px' }}>
              <LogIn size={14} /> Log In
            </Link>
          </div>
        </header>

        {/* ── HERO TEXT + SAFETY CARD ── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, padding: '2.5rem 3.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '2rem', pointerEvents: 'auto' }}>

          {/* LEFT — main hero copy */}
          <div style={{ flex: '1', maxWidth: '620px' }}>

            {/* Label */}
            <div style={{ fontSize: '0.70rem', fontWeight: '800', letterSpacing: '3.5px', textTransform: 'uppercase', color: 'rgba(160,255,184,0.75)', marginBottom: '0.8rem' }}>
              TRACE SAFETY NETWORK
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.1rem)', fontWeight: '900', color: '#ffffff', lineHeight: '1.08', margin: '0 0 1rem 0', textShadow: '0 4px 24px rgba(0,0,0,0.65)' }}>
              Your Journey,<br />
              <span style={{ color: '#6dea8a' }}>Your Footprints</span>
            </h1>

            {/* Body */}
            <p style={{ fontSize: '0.97rem', color: 'rgba(220,240,225,0.80)', lineHeight: '1.65', margin: '0 0 1.8rem 0', maxWidth: '500px', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
              TRACE operates silently in any browser — no app install, no history traces.
              Detect abuse patterns, store tamper-proof evidence, and trigger emergency alerts to safety supervisors.
            </p>

            {/* CTA */}
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', backgroundColor: '#ffffff', color: '#0d1a0f', padding: '0.9rem 2.1rem', borderRadius: '11px', fontWeight: '800', fontSize: '0.93rem', textDecoration: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.45)', letterSpacing: '0.2px' }}>
              Enter Secure Console <ArrowRight size={18} />
            </Link>

            {/* Footprint hint */}
            <div style={{ marginTop: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', color: 'rgba(255,255,255,0.42)' }}>
              <span>🖱️</span>
              <span>Move your cursor along the path to leave <span style={{ color: 'rgba(110,220,140,0.75)', fontWeight: '600' }}>footprints</span> that fade away</span>
            </div>
          </div>

          {/* RIGHT — glassmorphism safety status card */}
          <GlassCard style={{ padding: '1.6rem', minWidth: '265px', maxWidth: '295px', flexShrink: 0 }}>
            <h4 style={{ fontSize: '0.7rem', fontWeight: '800', letterSpacing: '2px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', margin: '0 0 1.1rem 0' }}>
              Safety Status
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { icon: <Lock size={14} color="#4ade80" />, bg: 'rgba(74,222,128,0.12)', title: 'End-to-End Encrypted', sub: 'All data stored locally only' },
                { icon: <Shield size={14} color="#60a5fa" />, bg: 'rgba(96,165,250,0.12)', title: 'Stealth Mode Active', sub: 'Decoy site ready to deploy' },
                { icon: <AlertTriangle size={14} color="#fb923c" />, bg: 'rgba(251,146,60,0.12)', title: 'SOS Routing Ready', sub: 'Emergency dispatch connected' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.1rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.1rem', paddingTop: '1.1rem', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.67rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              Press ESC anytime to activate camouflage
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BOTTOM INFO BAR — 4 compact feature chips
      ══════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', zIndex: 10, backgroundColor: 'rgba(8,18,10,0.92)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem 3.5rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>

        {[
          { icon: <Leaf size={18} />, label: 'STAY HIDDEN', text: 'Disguise mode keeps you safe.', color: '#4ade80' },
          { icon: <Shield size={18} />, label: 'STAY SECURE', text: 'Your evidence. Your control. Always protected.', color: '#60a5fa' },
          { icon: <Eye size={18} />, label: 'STAY STRONG', text: 'Help is closer than you think.', color: '#f472b6' },
        ].map((item, i) => (
          <GlassCard key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1.25rem', flex: '1', minWidth: '200px', borderRadius: '12px' }}>
            <div style={{ color: item.color, flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '1.5px', color: item.color, marginBottom: '0.15rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', lineHeight: '1.4' }}>{item.text}</div>
            </div>
          </GlassCard>
        ))}

        {/* Emergency number chip */}
        <GlassCard style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1.25rem', flex: '1', minWidth: '200px', borderRadius: '12px', borderColor: 'rgba(251,146,60,0.25)' }}>
          <Phone size={18} color="#fb923c" />
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '1.5px', color: '#fb923c', marginBottom: '0.15rem' }}>NEED HELP NOW?</div>
            <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#ffffff' }}>1800-123-TRACE</div>
            <div style={{ fontSize: '0.70rem', color: 'rgba(255,255,255,0.45)' }}>You are not alone.</div>
          </div>
        </GlassCard>
      </div>

      {/* ══════════════════════════════════════════════════════
          EMERGENCY RESOURCES SECTION
      ══════════════════════════════════════════════════════ */}
      <section id="support" style={{ position: 'relative', zIndex: 10, backgroundColor: '#080e09', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '5rem 0' }}>
        <div className="container">

          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3.5rem auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#f0fff4', marginBottom: '0.75rem' }}>
              Emergency Hotlines & Safety Resources
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'rgba(180,220,190,0.65)', lineHeight: '1.6' }}>
              If you are in immediate danger, please dial local emergency services (911) or contact the organisations below.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
            {[
              {
                icon: <Shield size={24} />,
                title: 'Emergency Dispatch',
                highlight: 'Call 911 Immediately',
                text: 'For immediate physical danger, police dispatch, medical emergencies, or urgent escape assistance.',
                color: '#f87171', bg: 'rgba(248,113,113,0.10)',
              },
              {
                icon: <Phone size={24} />,
                title: 'National DV Helpline',
                highlight: '1-800-799-SAFE (7233)',
                text: 'Free, confidential 24/7 support. Text "START" to 88788 for private text guidance.',
                color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',
              },
              {
                icon: <Eye size={24} />,
                title: 'Discreet Browsing Guide',
                highlight: 'Browse Safely',
                text: 'Use Incognito tabs, clear history logs, or access TRACE from a secure trusted device.',
                color: '#4ade80', bg: 'rgba(74,222,128,0.10)',
              },
            ].map((card, i) => (
              <div key={i} style={{ backgroundColor: '#0d1a0f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '2.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 6px 24px rgba(0,0,0,0.4)' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, marginBottom: '0.25rem' }}>
                  {card.icon}
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f0fff4', margin: 0 }}>{card.title}</h4>
                <p style={{ fontSize: '1.05rem', fontWeight: '800', color: card.color, margin: 0 }}>{card.highlight}</p>
                <p style={{ fontSize: '0.85rem', color: 'rgba(180,220,190,0.60)', margin: 0, lineHeight: '1.55' }}>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 10, backgroundColor: '#050c06', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '2rem 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ color: '#ffffff', fontWeight: '800', letterSpacing: '2px', fontSize: '1.1rem' }}>TRACE</span>
            <span style={{ marginLeft: '0.75rem', fontSize: '0.78rem', color: 'rgba(180,220,190,0.40)' }}>Technology for Reporting Abuse, Crisis & Escape</span>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <Link href="/login" style={{ fontSize: '0.82rem', color: 'rgba(180,220,190,0.45)', textDecoration: 'none', fontWeight: '600' }}>Secure Portal</Link>
            <a href="#" onClick={e => { e.preventDefault(); handleQuickHide(); }} style={{ fontSize: '0.82rem', color: 'rgba(180,220,190,0.45)', textDecoration: 'none', fontWeight: '600' }}>Toggle Disguise</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
