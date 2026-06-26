'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, User, Key, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user' or 'admin'
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickHide = () => {
    window.history.replaceState(null, '', '/');
    window.history.pushState(null, '', '/decoy');
    document.title = 'Home Gardening Tips';
    window.location.replace('/decoy');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          role,
          adminCode: role === 'admin' ? adminCode : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Successful registration, redirect to login
      router.push('/login?registered=true');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* Quick Hide Button */}
      <button onClick={handleQuickHide} style={styles.quickHideBtn}>
        🌿 Quick Exit
      </button>

      <div style={styles.formCard}>
        <div style={styles.logoContainer}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <img src="/shield-logo.png" alt="TRACE Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            <span style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--color-forest)', letterSpacing: '1px' }}>TRACE</span>
          </div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Report abuse, crisis, and safely plan escape</p>
        </div>

        {/* Autofill Demo Credentials */}
        {role === 'admin' && (
          <div style={{
            backgroundColor: 'var(--color-sand-light)',
            border: '1px solid var(--color-clay-light)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '0.8rem',
          }}>
            <span style={{ fontWeight: 'bold', color: 'var(--color-earth-muted)' }}>🔑 Admin Demo Autofill:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setUsername('admin_demo');
                  setPassword('adminpassword');
                  setAdminCode('TRACE-ADMIN-2026-SECURE');
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: '0.35rem',
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-clay)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: 'var(--color-forest)',
                }}
              >
                Autofill admin_demo
              </button>
            </div>
          </div>
        )}

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Role Toggle */}
          <div style={styles.roleToggleContainer}>
            <button
              type="button"
              onClick={() => { setRole('user'); setError(''); }}
              style={{
                ...styles.roleTab,
                ...(role === 'user' ? styles.roleTabActive : {}),
              }}
            >
              <User size={16} />
              Survivor Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setError(''); }}
              style={{
                ...styles.roleTab,
                ...(role === 'admin' ? styles.roleTabActive : {}),
              }}
            >
              <Shield size={16} />
              Admin Sign Up
            </button>
          </div>

          {/* Username Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                id="username"
                type="text"
                placeholder="Choose a safe, anonymous username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                style={styles.inputField}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={styles.inputField}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Admin Secret Code */}
          {role === 'admin' && (
            <div className="form-group">
              <label className="form-label" htmlFor="adminCode">Admin Passcode</label>
              <div style={styles.inputWrapper}>
                <Key size={18} style={styles.inputIcon} />
                <input
                  id="adminCode"
                  type="password"
                  placeholder="Enter administrative security key"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="form-input"
                  style={styles.inputField}
                  required={role === 'admin'}
                />
              </div>
              <span style={styles.helpText}>Enter your agency verification token.</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={styles.footerLink}>
          Already have an account?{' '}
          <Link href="/login" style={styles.link}>
            Log In safely
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--color-sand)',
    padding: '2rem',
    position: 'relative',
    fontFamily: 'var(--font-sans)',
  },
  quickHideBtn: {
    position: 'absolute',
    top: '1.5rem',
    right: '1.5rem',
    backgroundColor: 'var(--color-terracotta)',
    color: 'var(--color-white)',
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    boxShadow: 'var(--shadow-sm)',
    transition: 'var(--transition)',
  },
  formCard: {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-clay-light)',
    boxShadow: 'var(--shadow-lg)',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '460px',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logoBadge: {
    display: 'inline-block',
    backgroundColor: 'var(--color-sand)',
    color: 'var(--color-forest)',
    fontWeight: '700',
    fontSize: '0.85rem',
    padding: '0.3rem 0.8rem',
    borderRadius: '20px',
    letterSpacing: '1px',
    marginBottom: '0.75rem',
    border: '1px solid var(--color-clay)',
  },
  title: {
    fontSize: '1.75rem',
    color: 'var(--color-forest)',
    marginBottom: '0.25rem',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--color-earth-muted)',
    margin: 0,
  },
  errorAlert: {
    backgroundColor: 'var(--color-alert-bg)',
    color: 'var(--color-terracotta)',
    border: '1px solid rgba(200, 122, 83, 0.2)',
    borderRadius: 'var(--radius-md)',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  roleToggleContainer: {
    display: 'flex',
    backgroundColor: 'var(--color-sand-light)',
    border: '1px solid var(--color-clay)',
    borderRadius: 'var(--radius-md)',
    padding: '3px',
    marginBottom: '1.5rem',
  },
  roleTab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    border: 'none',
    backgroundColor: 'transparent',
    padding: '0.6rem 0.5rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--color-earth-muted)',
    borderRadius: 'calc(var(--radius-md) - 2px)',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  roleTabActive: {
    backgroundColor: 'var(--color-white)',
    color: 'var(--color-forest)',
    boxShadow: 'var(--shadow-sm)',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    color: 'var(--color-earth-muted)',
    pointerEvents: 'none',
  },
  inputField: {
    width: '100%',
    paddingLeft: '2.75rem',
    paddingRight: '2.75rem',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    color: 'var(--color-earth-muted)',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    fontSize: '0.75rem',
    color: 'var(--color-earth-muted)',
    marginTop: '0.25rem',
  },
  submitBtn: {
    width: '100%',
    marginTop: '1rem',
    padding: '0.85rem',
  },
  footerLink: {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.9rem',
    color: 'var(--color-earth-muted)',
  },
  link: {
    fontWeight: '600',
    color: 'var(--color-forest)',
  },
};
