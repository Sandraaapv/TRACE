'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardBackground from '../../components/DashboardBackground';
import {
  Shield, User, LogOut, ShieldAlert, Clock, MapPin, AlertCircle,
  Volume2, VolumeX, CheckCircle, Navigation, ExternalLink,
  LayoutDashboard, Users, History, Settings, Sun, Moon,
  TrendingUp, Search, Info, Plus, ChevronRight, Check
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState('dashboard'); // 'dashboard', 'users', 'logs', 'settings'
  const [theme, setTheme] = useState('light');
  const [audioSuspended, setAudioSuspended] = useState(false);

  // Audio Context Ref for Web Audio API synthesizer
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Sync Theme with localStorage and Document Element
  useEffect(() => {
    const savedTheme = localStorage.getItem('trace_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Resume Audio Context on click/keypress if suspended
  useEffect(() => {
    const handleUserInteraction = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => {
          setAudioSuspended(false);
        });
      }
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('trace_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Check login session (sessionStorage only)
  useEffect(() => {
    const userStr = sessionStorage.getItem('trace_user');
    if (!userStr) {
      router.replace('/login');
    } else {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        router.replace('/dashboard/user');
      } else {
        setCurrentAdmin(user);
      }
    }
    setLoading(false);
  }, [router]);

  // Fetch SOS alerts and Polling
  useEffect(() => {
    if (loading || !currentAdmin) return;

    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/sos');
        if (!res.ok) throw new Error('Failed to fetch alerts');
        const data = await res.json();
        setActiveAlerts(data.alerts || []);
      } catch (err) {
        console.error('Error fetching alerts:', err);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setRegisteredUsers(data.users || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchAlerts();
    fetchUsers();
    pollIntervalRef.current = setInterval(() => {
      fetchAlerts();
      fetchUsers();
    }, 1500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [loading, currentAdmin]);

  // Alarm synthesis trigger based on activeAlerts status
  useEffect(() => {
    const hasActiveAlerts = activeAlerts.length > 0;

    if (hasActiveAlerts && !isMuted) {
      startSynthesizedAlarm();
    } else {
      stopSynthesizedAlarm();
    }

    return () => {
      stopSynthesizedAlarm();
    };
  }, [activeAlerts, isMuted]);

  const startSynthesizedAlarm = () => {
    if (typeof window === 'undefined') return;
    if (oscillatorRef.current) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        setAudioSuspended(true);
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;

      let count = 0;
      alarmIntervalRef.current = setInterval(() => {
        if (!oscillatorRef.current || !audioCtxRef.current) return;
        const now = audioCtxRef.current.currentTime;
        const nextFreq = count % 2 === 0 ? 800 : 550;
        oscillatorRef.current.frequency.exponentialRampToValueAtTime(nextFreq, now + 0.3);
        count++;
      }, 400);

    } catch (err) {
      console.error('Failed to initialize AudioContext:', err);
    }
  };

  const stopSynthesizedAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (e) {
      console.warn('Error clearing audio nodes:', e);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleAcknowledge = async (username) => {
    try {
      const res = await fetch(`/api/sos?username=${encodeURIComponent(username)}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to acknowledge alert');

      // Update state locally immediately
      setActiveAlerts(prev => prev.filter(a => a.username.toLowerCase() !== username.toLowerCase()));

      // Add to resolved logs history
      const savedLogs = JSON.parse(localStorage.getItem('resolved_logs') || '[]');
      const newLog = {
        id: 'AL-' + Math.floor(1000 + Math.random() * 9000),
        username,
        timestamp: new Date().toISOString(),
        location: activeAlerts.find(a => a.username === username)?.location || null,
        status: 'Resolved'
      };
      localStorage.setItem('resolved_logs', JSON.stringify([newLog, ...savedLogs]));

    } catch (err) {
      console.error(err);
      alert('Error clearing the alert.');
    }
  };

  const handleLogout = () => {
    stopSynthesizedAlarm();
    sessionStorage.removeItem('trace_user');
    router.push('/');
  };

  if (loading) {
    return <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: theme === 'dark' ? '#0c0d12' : 'var(--color-sand)',
      color: theme === 'dark' ? '#e2e8f0' : 'var(--color-forest)',
      fontSize: '1.2rem',
      fontWeight: '600'
    }}>Loading admin console...</div>;
  }

  const hasAlerts = activeAlerts.length > 0;
  const isDark = theme === 'dark';

  // Resolved Logs
  const resolvedLogs = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('resolved_logs') || '[]') : [];

  // Theme-specific style variables
  const styles = {
    container: {
      background: 'transparent',
      minHeight: '100vh',
      display: 'flex',
      fontFamily: 'var(--font-sans)',
      color: isDark ? '#e2e8f0' : 'var(--color-earth)',
      transition: 'all 0.3s ease',
    },
    // Sidebar Style (Like second pic, light grey/white and clean)
    sidebar: {
      width: '260px',
      backgroundColor: isDark ? 'var(--sidebar-bg)' : '#ffffff',
      borderRight: isDark ? '1px solid var(--color-clay-light)' : '1px solid var(--color-clay-light)',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1.25rem',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      backdropFilter: isDark ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
    },
    sidebarLogo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '2.5rem',
      padding: '0 0.5rem',
    },
    logoBox: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      backgroundColor: isDark ? '#20222e' : '#111827',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      fontSize: '1.25rem',
      fontWeight: '800',
      letterSpacing: '1px',
      color: isDark ? '#e2e8f0' : '#111827',
    },
    sidebarMenu: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      flex: 1,
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.8rem 1rem',
      border: 'none',
      background: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      color: isDark ? '#8f9cae' : '#6b7280',
      fontWeight: '600',
      fontSize: '0.9rem',
      textAlign: 'left',
      transition: 'all 0.2s ease',
      width: '100%',
    },
    menuItemActive: {
      backgroundColor: isDark ? '#20222e' : '#f3f4f6',
      color: isDark ? '#e2e8f0' : '#111827',
    },
    sidebarFooter: {
      borderTop: isDark ? '1px solid #20222e' : '1px solid var(--color-clay-light)',
      paddingTop: '1.25rem',
      marginTop: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    },
    adminBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem',
    },
    adminInfo: {
      display: 'flex',
      flexDirection: 'column',
    },
    adminName: {
      fontSize: '0.85rem',
      fontWeight: '700',
      color: isDark ? '#e2e8f0' : '#111827',
    },
    adminRole: {
      fontSize: '0.75rem',
      color: isDark ? '#8f9cae' : '#6b7280',
    },
    logoutBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      padding: '0.6rem',
      border: isDark ? '1px solid #2d2d2d' : '1px solid #e5e7eb',
      backgroundColor: isDark ? 'transparent' : '#f9fafb',
      borderRadius: '6px',
      color: isDark ? '#8f9cae' : '#4b5563',
      fontSize: '0.8rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    // Main Content Styling
    mainContent: {
      flex: 1,
      padding: '2rem 2.5rem',
      overflowY: 'auto',
      height: '100vh',
    },
    topHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: isDark ? '1px solid #20222e' : '1px solid var(--color-clay-light)',
      paddingBottom: '1.25rem',
      marginBottom: '2rem',
    },
    headerTitle: {
      fontSize: '1.5rem',
      fontWeight: '800',
      color: isDark ? '#e2e8f0' : '#111827',
      margin: 0,
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    themeBtn: {
      background: 'none',
      border: 'none',
      color: isDark ? '#8f9cae' : '#4b5563',
      cursor: 'pointer',
      padding: '0.5rem',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Banner Alert Bar
    flashBanner: {
      backgroundColor: isDark ? '#20222e' : 'var(--color-terracotta)',
      color: isDark ? '#e2e8f0' : 'var(--color-white)',
      padding: '0.75rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontWeight: '700',
      fontSize: '0.85rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      border: isDark ? '1px solid #ef4444' : 'none',
    },
    // Metric Cards Row (Like second pic: 1, 385, 48 layout)
    metricsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    metricCard: {
      backgroundColor: isDark ? 'var(--color-white)' : '#ffffff',
      border: isDark ? '1px solid var(--color-clay-light)' : '1px solid var(--color-clay-light)',
      borderRadius: '12px',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      backdropFilter: isDark ? 'blur(16px)' : 'none',
      WebkitBackdropFilter: isDark ? 'blur(16px)' : 'none',
    },
    metricIconWrapper: {
      width: '46px',
      height: '46px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricNumber: {
      fontSize: '2rem',
      fontWeight: '800',
      lineHeight: '1',
      color: isDark ? '#e2e8f0' : '#111827',
      marginBottom: '0.25rem',
    },
    metricLabel: {
      fontSize: '0.8rem',
      fontWeight: '700',
      color: isDark ? '#8f9cae' : '#6b7280',
    },
    metricSubtext: {
      fontSize: '0.7rem',
      color: isDark ? '#8f9cae' : '#9ca3af',
      marginTop: '0.1rem',
    },
    // Layout Grid (Line chart + Admin quick actions card)
    layoutGrid: {
      display: 'grid',
      gridTemplateColumns: '1.7fr 1fr',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    gridCard: {
      backgroundColor: isDark ? 'var(--color-white)' : '#ffffff',
      border: isDark ? '1px solid var(--color-clay-light)' : '1px solid var(--color-clay-light)',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      backdropFilter: isDark ? 'blur(16px)' : 'none',
      WebkitBackdropFilter: isDark ? 'blur(16px)' : 'none',
    },
    cardTitleRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.25rem',
    },
    cardTitle: {
      fontSize: '0.95rem',
      fontWeight: '800',
      color: isDark ? '#e2e8f0' : '#111827',
      margin: 0,
    },
    // Line Chart Badge
    chartBadge: {
      backgroundColor: isDark ? '#20222e' : '#111827',
      color: isDark ? '#e2e8f0' : '#ffffff',
      fontSize: '0.7rem',
      fontWeight: '700',
      padding: '0.25rem 0.6rem',
      borderRadius: '4px',
    },
    // Quick Actions Balance Card (Sleek Dark box on right of second pic)
    balanceCard: {
      backgroundColor: isDark ? 'var(--color-sand-light)' : '#111827',
      borderRadius: '12px',
      padding: '1.5rem',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'space-between',
      border: isDark ? '1px solid var(--color-clay-light)' : 'none',
      backdropFilter: isDark ? 'blur(16px)' : 'none',
      WebkitBackdropFilter: isDark ? 'blur(16px)' : 'none',
    },
    balanceTitle: {
      fontSize: '0.75rem',
      fontWeight: '700',
      color: isDark ? '#8f9cae' : '#9ca3af',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
    },
    balanceValue: {
      fontSize: '1.75rem',
      fontWeight: '800',
      margin: '0.5rem 0',
      fontFamily: 'monospace',
    },
    balanceDetails: {
      fontSize: '0.75rem',
      opacity: 0.8,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      margin: '1rem 0',
    },
    blackPillBtn: {
      backgroundColor: isDark ? '#ffffff' : '#ffffff',
      color: isDark ? '#111827' : '#111827',
      border: 'none',
      padding: '0.75rem',
      borderRadius: '30px',
      fontWeight: '700',
      fontSize: '0.8rem',
      cursor: 'pointer',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.4rem',
      width: '100%',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    // Activity Table section
    tableCard: {
      backgroundColor: isDark ? 'var(--color-white)' : '#ffffff',
      border: isDark ? '1px solid var(--color-clay-light)' : '1px solid var(--color-clay-light)',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      backdropFilter: isDark ? 'blur(16px)' : 'none',
      WebkitBackdropFilter: isDark ? 'blur(16px)' : 'none',
    },
    activityTable: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left',
      marginTop: '1rem',
    },
    th: {
      fontSize: '0.75rem',
      fontWeight: '700',
      color: isDark ? '#8f9cae' : '#6b7280',
      padding: '0.75rem 1rem',
      borderBottom: isDark ? '1px solid #20222e' : '1px solid #e5e7eb',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    td: {
      fontSize: '0.85rem',
      padding: '1rem',
      borderBottom: isDark ? '1px solid #20222e' : '1px solid #e5e7eb',
      color: isDark ? '#e2e8f0' : '#374151',
    },
    trHover: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
    },
    statusBadge: (isActive) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      fontSize: '0.7rem',
      fontWeight: '700',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      backgroundColor: isDark 
        ? (isActive ? '#2a2c3a' : '#1c1c1c') 
        : (isActive ? '#fee2e2' : '#dcfce7'),
      color: isDark 
        ? '#e2e8f0' 
        : (isActive ? '#ef4444' : '#15803d'),
      border: isDark ? '1px solid #2d2d2d' : 'none',
    }),
    tableActionBtn: {
      backgroundColor: isDark ? '#2a2c3a' : '#111827',
      color: '#ffffff',
      border: 'none',
      padding: '0.4rem 0.8rem',
      borderRadius: '6px',
      fontWeight: '600',
      fontSize: '0.75rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }
  };

  // Compile active + mock history signals
  const displaySignals = [
    ...activeAlerts.map(a => ({
      id: 'SOS-' + a.username.slice(0, 3).toUpperCase(),
      username: a.username,
      timestamp: a.timestamp,
      location: a.location,
      status: 'ACTIVE'
    })),
    ...resolvedLogs.map(log => ({
      id: log.id,
      username: log.username,
      timestamp: log.timestamp,
      location: log.location,
      status: 'Resolved'
    }))
  ];

  return (
    <div className="dashboard-shell" style={styles.container}>
      <DashboardBackground />
      
      {/* 2-Column Sidebar Layout */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <div style={styles.logoBox}>
            <Shield size={18} color="#ffffff" />
          </div>
          <span style={styles.logoText}>TRACE</span>
        </div>

        <nav style={styles.sidebarMenu}>
          <button
            onClick={() => setAdminActiveTab('dashboard')}
            style={{ ...styles.menuItem, ...(adminActiveTab === 'dashboard' ? styles.menuItemActive : {}) }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setAdminActiveTab('users')}
            style={{ ...styles.menuItem, ...(adminActiveTab === 'users' ? styles.menuItemActive : {}) }}
          >
            <Users size={18} />
            <span>Survivor Accounts</span>
          </button>

          <button
            onClick={() => setAdminActiveTab('logs')}
            style={{ ...styles.menuItem, ...(adminActiveTab === 'logs' ? styles.menuItemActive : {}) }}
          >
            <History size={18} />
            <span>Distress Logs</span>
          </button>

          <button
            onClick={() => setAdminActiveTab('settings')}
            style={{ ...styles.menuItem, ...(adminActiveTab === 'settings' ? styles.menuItemActive : {}) }}
          >
            <Settings size={18} />
            <span>Security Settings</span>
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.adminBadge}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isDark ? '#20222e' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color={isDark ? '#8f9cae' : '#6b7280'} />
            </div>
            <div style={styles.adminInfo}>
              <span style={styles.adminName}>Admin Portal</span>
              <span style={styles.adminRole}>{currentAdmin?.username || 'admin'}</span>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={14} />
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Console Content */}
      <main style={styles.mainContent}>
        
        {/* Header (Like top header in second pic) */}
        <header style={styles.topHeader}>
          <div>
            <h1 style={styles.headerTitle}>
              {adminActiveTab === 'dashboard' && 'Dashboard Overview'}
              {adminActiveTab === 'users' && 'Survivor Accounts Database'}
              {adminActiveTab === 'logs' && 'System Distress Logs'}
              {adminActiveTab === 'settings' && 'Decoy & Alarm Security Settings'}
            </h1>
            <p style={{ fontSize: '0.8rem', color: isDark ? '#8f9cae' : '#6b7280', margin: '0.25rem 0 0 0' }}>
              Logged in admin: {currentAdmin?.username} • Live database polling
            </p>
          </div>
          <div style={styles.headerActions}>
            <button onClick={toggleTheme} style={styles.themeBtn} title="Toggle Theme Mode">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '700', backgroundColor: isDark ? '#20222e' : '#f3f4f6', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: hasAlerts ? '#ef4444' : '#10b981', display: 'inline-block' }}></span>
              <span>{hasAlerts ? 'DISTRESS PROTOCOL ACTIVE' : 'SYSTEM ENCRYPTED'}</span>
            </div>
          </div>
        </header>

        {/* Flashing Banner for SOS */}
        {hasAlerts && (
          <div style={{ ...styles.flashBanner, flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} />
                <span>WARNING: {activeAlerts.length} LIVE DISTRESS SIGNAL(S) ACTIVE. COORDINATES RECORDED.</span>
              </div>
              <button onClick={toggleMute} style={{ border: 'none', background: isDark ? '#13141b' : '#ffffff', color: isDark ? '#e2e8f0' : 'var(--color-terracotta)', fontWeight: '700', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                {isMuted ? 'UNMUTE ALARM SIREN' : 'MUTE ALARM SIREN'}
              </button>
            </div>
            {audioSuspended && (
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fef08a', marginTop: '0.25rem' }}>
                🔊 Browser audio is muted/suspended. Click anywhere on the page to unmute and trigger the wailing alert.
              </div>
            )}
          </div>
        )}

        {/* DASHBOARD TAB VIEW */}
        {adminActiveTab === 'dashboard' && (
          <>
            {/* Metrics Row (Like 1, 385, 48 in second pic) */}
            <div style={styles.metricsRow}>
              {/* Metric 1 */}
              <div style={styles.metricCard}>
                <div style={{ ...styles.metricIconWrapper, backgroundColor: isDark ? '#20222e' : '#fee2e2' }}>
                  <ShieldAlert size={20} color={isDark ? '#e2e8f0' : '#ef4444'} />
                </div>
                <div>
                  <div style={styles.metricNumber}>{activeAlerts.length}</div>
                  <div style={styles.metricLabel}>Active Signals</div>
                  <div style={styles.metricSubtext}>Requires immediate response</div>
                </div>
              </div>

              {/* Metric 2 */}
              <div style={styles.metricCard}>
                <div style={{ ...styles.metricIconWrapper, backgroundColor: isDark ? '#20222e' : '#dbeafe' }}>
                  <Users size={20} color={isDark ? '#e2e8f0' : '#3b82f6'} />
                </div>
                <div>
                  <div style={styles.metricNumber}>{registeredUsers.length}</div>
                  <div style={styles.metricLabel}>Registered Survivors</div>
                  <div style={styles.metricSubtext}>Total secure portal nodes</div>
                </div>
              </div>

              {/* Metric 3 */}
              <div style={styles.metricCard}>
                <div style={{ ...styles.metricIconWrapper, backgroundColor: isDark ? '#20222e' : '#dcfce7' }}>
                  <CheckCircle size={20} color={isDark ? '#e2e8f0' : '#10b981'} />
                </div>
                <div>
                  <div style={styles.metricNumber}>{resolvedLogs.length}</div>
                  <div style={styles.metricLabel}>Resolved Alerts</div>
                  <div style={styles.metricSubtext}>Signals logged & addressed</div>
                </div>
              </div>
            </div>

            {/* Layout Grid (Line chart + Access PIN info) */}
            <div style={styles.layoutGrid}>
              
              {/* Trend Chart (Line chart exactly like second pic) */}
              <div style={styles.gridCard}>
                <div style={styles.cardTitleRow}>
                  <h3 style={styles.cardTitle}>Distress Signal Trends (Daily)</h3>
                  <span style={styles.chartBadge}>7 Days</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* SVG line graph */}
                  <svg viewBox="0 0 500 130" style={{ width: '100%', height: '130px' }}>
                    <line x1="0" y1="20" x2="500" y2="20" stroke={isDark ? '#222533' : '#f3f4f6'} strokeWidth="1" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke={isDark ? '#222533' : '#f3f4f6'} strokeWidth="1" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke={isDark ? '#222533' : '#f3f4f6'} strokeWidth="1" />
                    
                    {/* Graph line path */}
                    <path
                      d="M 20 110 Q 100 80, 180 100 T 340 50 T 480 30"
                      fill="none"
                      stroke={isDark ? '#e2e8f0' : '#111827'}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    
                    {/* Dots */}
                    <circle cx="20" cy="110" r="5.5" fill={isDark ? '#e2e8f0' : '#111827'} />
                    <circle cx="150" cy="92" r="5.5" fill={isDark ? '#e2e8f0' : '#111827'} />
                    <circle cx="270" cy="74" r="5.5" fill={isDark ? '#e2e8f0' : '#111827'} />
                    <circle cx="380" cy="45" r="5.5" fill={isDark ? '#e2e8f0' : '#111827'} />
                    <circle cx="480" cy="30" r="5.5" fill={isDark ? '#e2e8f0' : '#111827'} stroke={isDark ? '#13141b' : '#ffffff'} strokeWidth="2.5" />
                  </svg>
                  
                  {/* Days labels */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem', fontSize: '0.75rem', fontWeight: '700', color: isDark ? '#8f9cae' : '#6b7280' }}>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>

              {/* Right Panel (Sleek card like Card details on right of second pic) */}
              <div>
                <div style={styles.balanceCard}>
                  <div>
                    <div style={styles.balanceTitle}>System Decoy Configuration</div>
                    <div style={styles.balanceValue}>Gardening</div>
                    <div style={styles.balanceDetails}>
                      <div>🔒 <strong>Stealth Mode:</strong> Enabled</div>
                      <div>🛡️ <strong>Master Access PIN:</strong> Pre-set</div>
                      <div>🚨 <strong>Distress Routing:</strong> 911 Support</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAdminActiveTab('settings')} 
                    style={styles.blackPillBtn}
                  >
                    <span>Configure System</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Live activity table */}
            <div style={styles.tableCard}>
              <div style={styles.cardTitleRow}>
                <h3 style={styles.cardTitle}>Live Alerts & Logs</h3>
                <span style={{ fontSize: '0.75rem', color: isDark ? '#8f9cae' : '#6b7280' }}>
                  Polling interval: 1.5s
                </span>
              </div>

              {displaySignals.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: isDark ? '#8f9cae' : '#6b7280', fontSize: '0.9rem' }}>
                  <CheckCircle size={32} style={{ color: isDark ? '#8f9cae' : '#10b981', marginBottom: '0.5rem' }} />
                  <div>No distress signals or logs to display. System secure.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.activityTable}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Alert ID</th>
                        <th style={styles.th}>Survivor</th>
                        <th style={styles.th}>Triggered Time</th>
                        <th style={styles.th}>GPS Coordinates</th>
                        <th style={styles.th}>Alert Status</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displaySignals.map((sig, i) => (
                        <tr key={sig.username + sig.timestamp + i} style={styles.trHover}>
                          <td style={styles.td}><strong>{sig.id}</strong></td>
                          <td style={styles.td}>{sig.username}</td>
                          <td style={styles.td}>{new Date(sig.timestamp).toLocaleString()}</td>
                          <td style={styles.td}>
                            {sig.location ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin size={12} color={isDark ? '#8f9cae' : '#ef4444'} />
                                <span style={{ fontFamily: 'monospace' }}>{sig.location.latitude.toFixed(4)}, {sig.location.longitude.toFixed(4)}</span>
                              </div>
                            ) : (
                              <span style={{ color: isDark ? '#8f9cae' : '#9ca3af' }}>No GPS Data</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <span style={styles.statusBadge(sig.status === 'ACTIVE')}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: sig.status === 'ACTIVE' ? '#ef4444' : '#10b981', display: 'inline-block' }}></span>
                              {sig.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {sig.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleAcknowledge(sig.username)}
                                style={styles.tableActionBtn}
                              >
                                Resolve
                              </button>
                            ) : (
                              <span style={{ color: isDark ? '#8f9cae' : '#9ca3af', fontSize: '0.75rem', fontWeight: '600' }}>Closed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* SURVIVOR ACCOUNTS TAB VIEW */}
        {adminActiveTab === 'users' && (
          <div style={styles.tableCard}>
            <h3 style={{ ...styles.cardTitle, marginBottom: '1.5rem' }}>Survivors Registered Console</h3>
            {registeredUsers.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: isDark ? '#8f9cae' : '#6b7280' }}>
                No registered survivor nodes found in active database.
              </div>
            ) : (
              <table style={styles.activityTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>Node Number</th>
                    <th style={styles.th}>Username Alias</th>
                    <th style={styles.th}>Account Created</th>
                    <th style={styles.th}>System Health</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredUsers.map((user, idx) => (
                    <tr key={user.username + idx}>
                      <td style={styles.td}><strong>Node #{100 + idx}</strong></td>
                      <td style={styles.td}>{user.username}</td>
                      <td style={styles.td}>{user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(false)}>
                          <Check size={12} />
                          Active Safe Node
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* DISTRESS LOGS TAB VIEW */}
        {adminActiveTab === 'logs' && (
          <div style={styles.tableCard}>
            <h3 style={{ ...styles.cardTitle, marginBottom: '1.5rem' }}>Resolved Signals History Archive</h3>
            {resolvedLogs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: isDark ? '#8f9cae' : '#6b7280' }}>
                No distress signals archived in local history logs.
              </div>
            ) : (
              <table style={styles.activityTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>Log ID</th>
                    <th style={styles.th}>Survivor User</th>
                    <th style={styles.th}>Timestamp Resolved</th>
                    <th style={styles.th}>Location Data</th>
                    <th style={styles.th}>Final Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedLogs.map((log, idx) => (
                    <tr key={log.id + idx}>
                      <td style={styles.td}><strong>{log.id}</strong></td>
                      <td style={styles.td}>{log.username}</td>
                      <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={styles.td}>
                        {log.location ? (
                          <span style={{ fontFamily: 'monospace' }}>{log.location.latitude.toFixed(4)}, {log.location.longitude.toFixed(4)}</span>
                        ) : (
                          'None'
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(false)}>Resolved</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* SECURITY SETTINGS TAB VIEW */}
        {adminActiveTab === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={styles.gridCard}>
              <h3 style={{ ...styles.cardTitle, marginBottom: '1.25rem' }}>Camouflage Disguise Configuration</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                <label>
                  <strong>Active Decoy Route:</strong>
                  <select defaultValue="/decoy" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', backgroundColor: isDark ? '#20222e' : '#f9fafb', color: isDark ? '#e2e8f0' : '#111827', border: '1px solid var(--color-clay-light)', borderRadius: '4px' }}>
                    <option value="/decoy">Home Gardening Blog (GrowSpace)</option>
                    <option value="/decoy2">E-Commerce Furniture Store</option>
                    <option value="/decoy3">Weather Forecast Agency</option>
                  </select>
                </label>
                <label>
                  <strong>Decoy Document Title:</strong>
                  <input type="text" defaultValue="Home Gardening Tips & Organic Guides" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', backgroundColor: isDark ? '#20222e' : '#f9fafb', color: isDark ? '#e2e8f0' : '#111827', border: '1px solid var(--color-clay-light)', borderRadius: '4px' }} />
                </label>
                <div style={{ padding: '0.75rem', backgroundColor: isDark ? '#20222e' : '#f3f4f6', borderRadius: '6px', marginTop: '0.5rem' }}>
                  <Info size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                  <span>The camouflage title appears on browser tab states immediately upon clicking Escape key or header Hide buttons.</span>
                </div>
              </div>
            </div>

            <div style={styles.gridCard}>
              <h3 style={{ ...styles.cardTitle, marginBottom: '1.25rem' }}>Alarm Sound Synthesizer Controls</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                <label>
                  <strong>Siren Pitch Level (Hz):</strong>
                  <input type="number" defaultValue="580" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', backgroundColor: isDark ? '#20222e' : '#f9fafb', color: isDark ? '#e2e8f0' : '#111827', border: '1px solid var(--color-clay-light)', borderRadius: '4px' }} />
                </label>
                <label>
                  <strong>Modulation Speed (ms):</strong>
                  <input type="number" defaultValue="400" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', backgroundColor: isDark ? '#20222e' : '#f9fafb', color: isDark ? '#e2e8f0' : '#111827', border: '1px solid var(--color-clay-light)', borderRadius: '4px' }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input type="checkbox" defaultChecked />
                  <span>Synthesize Web Audio wailing alerts automatically for unresolved live distress</span>
                </label>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
