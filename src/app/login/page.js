'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiPost('/auth/login/', { username, password });
      if (res && (res.ok || res.status === 200)) {
        window.location.href = '/';
      } else {
        const errMsg = res?.data?.error || res?.data?.detail || 'Invalid username or password. Please try again.';
        setError(errMsg);
      }
    } catch (err) {
      setError('Connection error. Please ensure backend server is reachable.');
    } finally {
      setLoading(false);
    }
  };

  const isMobile = windowWidth < 900;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#070b14',
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.18) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(13, 148, 136, 0.18) 0px, transparent 50%),
        radial-gradient(at 50% 100%, rgba(124, 58, 237, 0.15) 0px, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.9) 0%, #070b14 100%)
      `,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '16px' : '32px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Background Decorative Grid Lines */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }}></div>

      {/* Main Container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: isMobile ? '440px' : '960px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '28px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(37, 99, 235, 0.15)',
        overflow: 'hidden',
      }}>
        
        {/* Left Side: Brand & Visual Showcase */}
        {!isMobile && (
          <div style={{
            padding: '48px',
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Ambient Background Glow in Left Panel */}
            <div style={{
              position: 'absolute',
              top: '-20%',
              left: '-20%',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(13, 148, 136, 0.25), transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}></div>

            <div>
              {/* Brand Tag */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '50px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                color: '#60a5fa',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '28px',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
                RADHU INDUSTRIES • ERP PORTAL
              </div>

              {/* Headline */}
              <h1 style={{
                fontSize: '2.1rem',
                fontWeight: 800,
                lineHeight: 1.2,
                color: '#ffffff',
                margin: '0 0 14px 0',
                letterSpacing: '-0.5px',
              }}>
                Industrial Manufacturing <br />
                <span style={{
                  background: 'linear-gradient(135deg, #38bdf8, #818cf8, #34d399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  & Stock Control System
                </span>
              </h1>

              <p style={{
                color: '#94a3b8',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                margin: '0 0 32px 0',
              }}>
                Complete enterprise suite for Auto Tyres, Cycle Tyres, Tubes, HRMS, and automated Tally Prime synchronization.
              </p>

              {/* Feature Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(37, 99, 235, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: '1px solid rgba(37, 99, 235, 0.3)' }}>
                    🏎️
                  </div>
                  <div>
                    <div style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 700 }}>Auto & Cycle Tyre Manufacturing</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>1st, 2nd, 3rd grade & isolated RFM stock</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(13, 148, 136, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: '1px solid rgba(13, 148, 136, 0.3)' }}>
                    ⚡
                  </div>
                  <div>
                    <div style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 700 }}>Real-Time Tally Prime Bridge</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Automatic sales, GST & ledger sync</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(124, 58, 237, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                    👥
                  </div>
                  <div>
                    <div style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 700 }}>Integrated HRMS & Payroll</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Piece-rate production, attendance & wages</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Version Tag */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              color: '#64748b',
              fontSize: '0.75rem',
            }}>
              <span>🔒 256-Bit SSL Encrypted</span>
              <span>v2.6 Enterprise Edition</span>
            </div>
          </div>
        )}

        {/* Right Side: Login Form */}
        <div style={{
          padding: isMobile ? '28px 20px' : '44px 38px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 14px auto',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0d9488, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
            }}>
              🏭
            </div>
            
            <h2 style={{
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 800,
              margin: '0 0 6px 0',
              letterSpacing: '-0.3px',
            }}>
              Sign In to Account
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              Enter your credentials to access Radhu ERP
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Username */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#cbd5e1',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}>
                👤 Username / User ID
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#cbd5e1',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}>
                🔑 Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '4px',
                  }}
                >
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: '#94a3b8',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  defaultChecked
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <span>Remember session</span>
              </label>
              <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600 }}>SSO Active</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                width: '100%',
                padding: '13px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #0d9488, #2563eb)',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <span>⏳ Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <span>➔</span>
                </>
              )}
            </button>
          </form>

          {/* Footer credentials note */}
          <div style={{
            marginTop: '24px',
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            textAlign: 'center',
            fontSize: '0.72rem',
            color: '#64748b',
          }}>
            Radhu Industries Cloud Infrastructure • Authorized Personnel Only
          </div>
        </div>

      </div>
    </div>
  );
}
