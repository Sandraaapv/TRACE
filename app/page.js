'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight, LogIn, Sun, Moon, Shield,
  Lock, AlertTriangle, Phone, Eye, Leaf, Heart
} from 'lucide-react';

// SSR-safe dynamic import — Three.js requires browser APIs
const ForestCanvas = dynamic(
  () => import('./components/ForestCanvas'),
  {
    ssr:     false,
    loading: () => <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundColor: '#03080a' }} />,
  }
);

// ─── Glassmorphism card component ────────────────────────────
function Glass({ children, style = {}, glowColor = 'rgba(80,200,120,0.08)' }) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(5,14,8,0.58)',
        backdropFilter:  'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border:          '1px solid rgba(255,255,255,0.09)',
        boxShadow:       `0 0 40px 0 ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        borderRadius:    '18px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Floating badge component ─────────────────────────────────
function FloatingBadge({ children, style = {} }) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(5,14,8,0.55)',
        backdropFilter:  'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border:          '1px solid rgba(255,255,255,0.10)',
        borderRadius:    '30px',
        display:         'flex',
        alignItems:      'center',
        gap:             '0.45rem',
        padding:         '0.4rem 0.95rem',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function LandingPage() {
  const [theme, setTheme] = useState('dark');
  const [safetyCardHover, setSafetyCardHover] = useState(false);

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

  const quickHide = () => {
    document.title = 'Home Gardening Tips';
    window.location.replace('/decoy');
  };

  return (
    <div style={{
      backgroundColor: '#030a04',
      color:           '#ffffff',
      fontFamily:      'var(--font-sans)',
      minHeight:       '100vh',
      overflowX:       'hidden',
    }}>

      {/* ══ FULLSCREEN 3D FOREST CANVAS (z:0) ══ */}
      <ForestCanvas theme={theme} />

      {/* ══════════════════════════════════════════════════════
          HERO SECTION — viewport height, all overlaid on canvas
      ══════════════════════════════════════════════════════ */}
      <section style={{
        position:      'relative',
        zIndex:        10,
        width:         '100%',
        height:        '100vh',
        display:       'flex',
        flexDirection: 'column',
        pointerEvents: 'none',  // pass mouse through to canvas (footprints)
      }}>

        {/* ── TOP NAVIGATION ──────────────────────────────── */}
        <header style={{
          position:       'relative',
          zIndex:         20,
          padding:        '1.6rem 2.5rem',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          pointerEvents:  'auto',
        }}>

          {/* Logo */}
          <div style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '0.55rem',
            fontSize:    '1.3rem',
            fontWeight:  '800',
            color:       '#ffffff',
            letterSpacing: '2.5px',
            textShadow:  '0 2px 16px rgba(0,0,0,0.7)',
          }}>
            <img
              src="/shield-logo.png"
              alt="TRACE"
              style={{ width: '24px', height: '24px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }}
            />
            TRACE
          </div>

          {/* Nav items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              style={{
                width:   '38px',
                height:  '38px',
                borderRadius: '50%',
                backgroundColor: 'rgba(5,14,8,0.55)',
                backdropFilter:  'blur(14px)',
                border:  '1px solid rgba(255,255,255,0.10)',
                cursor:  'pointer',
                color:   'rgba(220,255,230,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Hide Site */}
            <button
              onClick={quickHide}
              style={{
                backgroundColor: 'rgba(160,30,30,0.60)',
                backdropFilter:  'blur(14px)',
                border:          '1px solid rgba(255,80,80,0.20)',
                color:           '#ffffff',
                padding:         '0.45rem 1.05rem',
                borderRadius:    '10px',
                fontWeight:      '700',
                fontSize:        '0.78rem',
                cursor:          'pointer',
                display:         'flex',
                alignItems:      'center',
                gap:             '0.35rem',
                letterSpacing:   '0.3px',
              }}
            >
              🌿 Hide Site
            </button>

            {/* Log In */}
            <Link
              href="/login"
              style={{
                backgroundColor: 'rgba(255,255,255,0.92)',
                color:           '#030a04',
                padding:         '0.5rem 1.3rem',
                borderRadius:    '10px',
                fontWeight:      '800',
                fontSize:        '0.86rem',
                display:         'flex',
                alignItems:      'center',
                gap:             '0.35rem',
                textDecoration:  'none',
                boxShadow:       '0 6px 24px rgba(0,0,0,0.45)',
                letterSpacing:   '0.2px',
              }}
            >
              <LogIn size={14} /> Log In
            </Link>
          </div>
        </header>

        {/* ── HERO CONTENT + SAFETY CARD ───────────────────── */}
        <div style={{
          position:    'absolute',
          bottom:      0,
          left:        0,
          right:       0,
          zIndex:      20,
          padding:     '2.8rem 2.8rem',
          display:     'flex',
          alignItems:  'flex-end',
          justifyContent: 'space-between',
          gap:         '2rem',
          pointerEvents: 'auto',
        }}>

          {/* LEFT: Main hero typography */}
          <div style={{ flex: 1, maxWidth: '580px' }}>

            {/* Eyebrow label */}
            <div style={{
              fontSize:      '0.68rem',
              fontWeight:    '800',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              color:         'rgba(100,220,140,0.70)',
              marginBottom:  '0.7rem',
            }}>
              TRACE SAFETY NETWORK
            </div>

            {/* Main headline */}
            <h1 style={{
              fontSize:    'clamp(2.1rem, 4.5vw, 3.4rem)',
              fontWeight:  '900',
              color:       '#ffffff',
              lineHeight:  '1.05',
              margin:      '0 0 1rem 0',
              textShadow:  '0 4px 32px rgba(0,0,0,0.80)',
              letterSpacing: '-0.5px',
            }}>
              Your Journey,<br />
              <span style={{
                color:      '#6dea8a',
                textShadow: '0 0 40px rgba(80,220,120,0.4), 0 4px 32px rgba(0,0,0,0.80)',
              }}>
                Your Footprints
              </span>
            </h1>

            {/* Body copy */}
            <p style={{
              fontSize:    '0.94rem',
              color:       'rgba(195,235,210,0.78)',
              lineHeight:  '1.68',
              margin:      '0 0 2rem 0',
              maxWidth:    '480px',
              textShadow:  '0 1px 10px rgba(0,0,0,0.6)',
            }}>
              TRACE operates silently in any browser — no app install, no history traces.
              Detect abuse patterns, store tamper-proof evidence, and trigger emergency alerts to safety supervisors.
            </p>

            {/* CTA Button */}
            <Link
              href="/login"
              style={{
                display:         'inline-flex',
                alignItems:      'center',
                gap:             '0.6rem',
                backgroundColor: 'rgba(255,255,255,0.95)',
                color:           '#030a04',
                padding:         '0.92rem 2.2rem',
                borderRadius:    '12px',
                fontWeight:      '800',
                fontSize:        '0.93rem',
                textDecoration:  'none',
                boxShadow:       '0 8px 32px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.1)',
                letterSpacing:   '0.1px',
              }}
            >
              Enter Secure Console <ArrowRight size={18} />
            </Link>


          </div>

          {/* RIGHT: Safety Status floating glass card */}
          <Glass
            glowColor="rgba(80,200,120,0.12)"
            style={{
              padding:   '1.75rem',
              minWidth:  '272px',
              maxWidth:  '300px',
              flexShrink: 0,
              transform:  safetyCardHover ? 'translateY(-6px)' : 'translateY(0)',
              transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow:  safetyCardHover
                ? '0 24px 64px rgba(0,0,0,0.5), 0 0 50px rgba(80,200,120,0.14)'
                : '0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(80,200,120,0.08)',
              cursor: 'default',
            }}
            onMouseEnter={() => setSafetyCardHover(true)}
            onMouseLeave={() => setSafetyCardHover(false)}
          >
            <h4 style={{
              fontSize:      '0.68rem',
              fontWeight:    '800',
              letterSpacing: '2.5px',
              color:         'rgba(255,255,255,0.38)',
              textTransform: 'uppercase',
              margin:        '0 0 1.2rem 0',
            }}>
              Safety Status
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
              {[
                {
                  icon:  <Lock size={14} />,
                  color: '#4ade80',
                  bg:    'rgba(74,222,128,0.12)',
                  title: 'End-to-End Encrypted',
                  sub:   'All data stored locally only',
                },
                {
                  icon:  <Shield size={14} />,
                  color: '#60a5fa',
                  bg:    'rgba(96,165,250,0.12)',
                  title: 'Stealth Mode Active',
                  sub:   'Decoy site ready to deploy',
                },
                {
                  icon:  <AlertTriangle size={14} />,
                  color: '#fb923c',
                  bg:    'rgba(251,146,60,0.12)',
                  title: 'SOS Routing Ready',
                  sub:   'Emergency dispatch connected',
                },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width:           '32px',
                    height:          '32px',
                    borderRadius:    '9px',
                    backgroundColor: item.bg,
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    color:           item.color,
                    flexShrink:      0,
                    border:          `1px solid ${item.color}22`,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.08rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.42)' }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop:   '1.2rem',
              paddingTop:  '1.2rem',
              borderTop:   '1px solid rgba(255,255,255,0.07)',
              fontSize:    '0.66rem',
              color:       'rgba(255,255,255,0.26)',
              textAlign:   'center',
              letterSpacing: '0.3px',
            }}>
              Press ESC anytime to activate camouflage
            </div>
          </Glass>
        </div>

        {/* ── SCROLL INDICATOR ─────────────────────────────── */}
        <div style={{
          position:       'absolute',
          bottom:         '1.5rem',
          left:           '50%',
          transform:      'translateX(-50%)',
          zIndex:         20,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            '0.3rem',
          color:          'rgba(255,255,255,0.22)',
          fontSize:       '0.62rem',
          letterSpacing:  '2px',
          textTransform:  'uppercase',
          pointerEvents:  'none',
          animation:      'bobDown 2.5s ease-in-out infinite',
        }}>
          <span>Scroll to explore</span>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1L6 7L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BOTTOM INFO BAR — 4 feature chips
      ══════════════════════════════════════════════════════ */}
      <div style={{
        position:       'relative',
        zIndex:         10,
        backgroundColor: 'rgba(2,8,4,0.90)',
        backdropFilter: 'blur(16px)',
        borderTop:      '1px solid rgba(255,255,255,0.05)',
        padding:        '1.1rem 2.8rem',
        display:        'flex',
        gap:            '1rem',
        flexWrap:       'wrap',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}>
        {[
          { icon: <Leaf size={17} />,   label: 'STAY HIDDEN',  text: 'Disguise mode keeps you safe.',          color: '#4ade80' },
          { icon: <Shield size={17} />, label: 'STAY SECURE',  text: 'Your evidence. Your control. Always protected.', color: '#60a5fa' },
          { icon: <Heart size={17} />,  label: 'STAY STRONG',  text: 'Help is closer than you think.',         color: '#f472b6' },
        ].map((item, i) => (
          <Glass key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1.2rem', flex: 1, minWidth: '185px', borderRadius: '13px' }}>
            <div style={{ color: item.color, opacity: 0.80, flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: '0.66rem', fontWeight: '800', letterSpacing: '1.5px', color: item.color, marginBottom: '0.15rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.77rem', color: 'rgba(200,235,210,0.62)', lineHeight: '1.4' }}>{item.text}</div>
            </div>
          </Glass>
        ))}

        {/* Emergency number */}
        <Glass glowColor="rgba(251,146,60,0.10)" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1.2rem', flex: 1, minWidth: '200px', borderRadius: '13px', borderColor: 'rgba(251,146,60,0.18)' }}>
          <Phone size={17} color="#fb923c" style={{ opacity: 0.85, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.66rem', fontWeight: '800', letterSpacing: '1.5px', color: '#fb923c', marginBottom: '0.15rem' }}>NEED HELP NOW?</div>
            <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#ffffff' }}>1800-123-TRACE</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)' }}>You are not alone.</div>
          </div>
        </Glass>
      </div>

      {/* ══════════════════════════════════════════════════════
          EMERGENCY RESOURCES SECTION
      ══════════════════════════════════════════════════════ */}
      <section id="support" style={{
        position:        'relative',
        zIndex:          10,
        backgroundColor: '#030a04',
        borderTop:       '1px solid rgba(255,255,255,0.05)',
        padding:         '5rem 0',
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '660px', margin: '0 auto 3.5rem auto' }}>
            <h2 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#f0fff4', marginBottom: '0.7rem' }}>
              Emergency Hotlines & Safety Resources
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'rgba(160,210,175,0.60)', lineHeight: '1.65' }}>
              If you are in immediate danger, please dial local emergency services (911) or contact one of the organisations below.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))', gap: '1.75rem' }}>
            {[
              { icon: <Shield size={22} />, title: 'Emergency Dispatch',     highlight: 'Call 911 Immediately',        text: 'For immediate physical danger, police dispatch, medical emergencies, or urgent escape assistance.',                                 color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
              { icon: <Phone  size={22} />, title: 'National DV Helpline',   highlight: '1-800-799-SAFE (7233)',       text: 'Free, confidential 24/7 support. Text "START" to 88788 for private text guidance.',                                              color: '#60a5fa', bg: 'rgba(96,165,250,0.10)'  },
              { icon: <Eye    size={22} />, title: 'Discreet Browsing Guide', highlight: 'Browse Safely',               text: 'Use Incognito/Private tabs, clear browser history, or access TRACE from a secure trusted device.',                               color: '#4ade80', bg: 'rgba(74,222,128,0.10)'  },
            ].map((card, i) => (
              <div key={i} style={{
                backgroundColor: '#070f08',
                border:          '1px solid rgba(255,255,255,0.06)',
                borderRadius:    '16px',
                padding:         '2.2rem 1.85rem',
                display:         'flex',
                flexDirection:   'column',
                gap:             '0.7rem',
                boxShadow:       '0 6px 30px rgba(0,0,0,0.40)',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '11px',
                  backgroundColor: card.bg,
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  color:           card.color,
                  marginBottom:    '0.2rem',
                }}>
                  {card.icon}
                </div>
                <h4 style={{ fontSize: '1.02rem', fontWeight: '700', color: '#edfff3', margin: 0 }}>{card.title}</h4>
                <p style={{ fontSize: '1.02rem', fontWeight: '800', color: card.color, margin: 0 }}>{card.highlight}</p>
                <p style={{ fontSize: '0.83rem', color: 'rgba(160,210,175,0.55)', margin: 0, lineHeight: '1.55' }}>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        position:        'relative',
        zIndex:          10,
        backgroundColor: '#020604',
        borderTop:       '1px solid rgba(255,255,255,0.04)',
        padding:         '2rem 0',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#ffffff', fontWeight: '800', letterSpacing: '2px', fontSize: '1.05rem' }}>TRACE</span>
            <span style={{ fontSize: '0.76rem', color: 'rgba(160,210,175,0.35)', marginLeft: '0.4rem' }}>
              Technology for Reporting Abuse, Crisis & Escape
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/login" style={{ fontSize: '0.80rem', color: 'rgba(160,210,175,0.40)', textDecoration: 'none', fontWeight: '600' }}>Secure Portal</Link>
            <a href="#" onClick={e => { e.preventDefault(); quickHide(); }} style={{ fontSize: '0.80rem', color: 'rgba(160,210,175,0.40)', textDecoration: 'none', fontWeight: '600' }}>Toggle Disguise</a>
          </div>
        </div>
      </footer>

      {/* ── GLOBAL CSS ANIMATIONS ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px 3px rgba(74,222,128,0.55); }
          50%       { opacity: 0.7; box-shadow: 0 0 4px 1px rgba(74,222,128,0.30); }
        }
        @keyframes bobDown {
          0%, 100% { transform: translateX(-50%) translateY(0);    opacity: 0.22; }
          50%       { transform: translateX(-50%) translateY(5px);  opacity: 0.38; }
        }
      `}</style>
    </div>
  );
}
