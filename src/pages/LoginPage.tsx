import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Eye, EyeOff, Zap, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, demoLogin, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    const res = await login(email, password);
    if (res.success) navigate('/dashboard');
  };

  const handleDemo = async () => {
    await demoLogin();
    navigate('/dashboard');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #0D1117 0%, #161B22 100%)',
        padding: '16px',
      }}
    >
      {/* ── Login-specific keyframes ── */}
      <style>{`
        @keyframes loginRotateRing {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes loginFadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginShimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes loginSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .login-input {
          width: 100%;
          background: #0D1117;
          border: 1px solid #30363D;
          border-radius: 10px;
          padding: 14px 16px;
          color: #E6EDF3;
          font-size: 14px;
          font-family: var(--font-sans);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .login-input::placeholder { color: #484F58; }
        .login-input:focus {
          border-color: #2F81F7;
          box-shadow: 0 0 0 3px rgba(47, 129, 247, 0.15);
        }
        .login-signin-btn {
          width: 100%;
          height: 52px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #2F81F7, #1D6FE8);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          font-family: var(--font-sans);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(47, 129, 247, 0.4);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-signin-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .login-signin-btn:hover:not(:disabled) .signin-shimmer {
          animation: loginShimmerSweep 0.8s ease;
        }
        .login-signin-btn:active:not(:disabled) { transform: scale(0.97); }
        
        .loading-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: loginSpin 0.8s linear infinite;
          margin-right: 10px;
        }
        
        .login-demo-btn {
          width: 100%;
          height: 52px;
          border: 1px solid #30363D;
          border-radius: 10px;
          background: #21262D;
          color: #E6EDF3;
          font-size: 14px;
          font-family: var(--font-sans);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: border-color 0.2s, background-color 0.2s;
        }
        .login-demo-btn:hover {
          border-color: #2F81F7;
          background: #262C36;
        }
        .login-demo-btn:active { transform: scale(0.97); }
      `}</style>

      {/* ── Radial blue glow above card ── */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '700px',
          background: 'radial-gradient(circle, rgba(47, 129, 247, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Grid dot pattern ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }}
      />

      {/* ── Card wrapper with fade-in animation ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          animation: 'loginFadeInUp 0.5s ease-out both',
        }}
      >
        {/* ── Logo + Branding ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* Logo icon container with rotating ring */}
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              width: '72px',
              height: '72px',
              marginBottom: '16px',
            }}
          >
            {/* Rotating ring */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: 'rgba(47, 129, 247, 0.6)',
                borderRightColor: 'rgba(124, 58, 237, 0.3)',
                animation: 'loginRotateRing 4s linear infinite',
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)',
              }}
            />
            {/* Main Logo */}
            <div
              className="login-logo-container"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: '#0D1117',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 2,
                boxShadow: '0 0 20px rgba(47, 129, 247, 0.2)',
              }}
            >
              <svg
                width="50"
                height="50"
                viewBox="0 0 100 100"
                fill="none"
                style={{ filter: 'drop-shadow(0 0 12px rgba(47, 129, 247, 0.7))' }}
              >
                <defs>
                  <linearGradient id="toothGradientLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00B4D8" />
                    <stop offset="50%" stopColor="#2F81F7" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                </defs>
                <path
                  d="M50,18 C46,18 42,15 30,15 C18,15 15,25 15,40 C15,55 18,70 20,85 C21,90 24,92 30,92 C36,92 38,85 40,70 C42,60 50,60 50,60 C50,60 56,60 58,75 C60,88 62,95 68,95 C74,95 77,92 78,88 C80,80 80,68 81,55 C82,42 84,30 78,22 C72,14 60,12 50,12 Z"
                  fill="url(#toothGradientLogin)"
                />
                <g stroke="white" strokeWidth="0.8" opacity="0.4">
                  <line x1="30" y1="25" x2="50" y2="22" />
                  <line x1="30" y1="25" x2="25" y2="45" />
                  <line x1="50" y1="22" x2="70" y2="25" />
                  <line x1="50" y1="22" x2="50" y2="40" />
                  <line x1="70" y1="25" x2="75" y2="45" />
                  <line x1="25" y1="45" x2="50" y2="40" />
                  <line x1="25" y1="45" x2="35" y2="60" />
                  <line x1="50" y1="40" x2="75" y2="45" />
                  <line x1="50" y1="40" x2="50" y2="55" />
                  <line x1="75" y1="45" x2="65" y2="60" />
                  <line x1="35" y1="60" x2="50" y2="55" />
                  <line x1="35" y1="60" x2="45" y2="75" />
                  <line x1="65" y1="60" x2="50" y2="55" />
                  <line x1="65" y1="60" x2="55" y2="75" />
                  <line x1="45" y1="75" x2="55" y2="75" />
                  <line x1="45" y1="75" x2="28" y2="85" />
                  <line x1="55" y1="75" x2="72" y2="85" />
                </g>
                <g fill="white">
                  <circle cx="30" cy="25" r="2" />
                  <circle cx="50" cy="22" r="2" />
                  <circle cx="70" cy="25" r="2" />
                  <circle cx="25" cy="45" r="2" />
                  <circle cx="50" cy="40" r="2.5" />
                  <circle cx="75" cy="45" r="2" />
                  <circle cx="35" cy="60" r="2" />
                  <circle cx="65" cy="60" r="2" />
                  <circle cx="50" cy="55" r="2" />
                  <circle cx="45" cy="75" r="2" />
                  <circle cx="55" cy="75" r="2" />
                  <circle cx="28" cy="85" r="1.5" />
                  <circle cx="72" cy="85" r="1.5" />
                </g>
              </svg>
            </div>
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '40px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0' }}>
              <span style={{ color: '#FFFFFF' }}>Dent</span>
              <span style={{ color: '#2F81F7' }}>ora</span>
            </div>
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#8B949E',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginTop: '8px',
            }}
          >
            AI Powered Dental Intelligence
          </p>
        </div>

        {/* ── Login Card ── */}
        <div
          style={{
            background: 'rgba(22, 27, 34, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(47, 129, 247, 0.2)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top shimmer line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background:
                'linear-gradient(90deg, transparent, #2F81F7, transparent)',
            }}
          />

          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '24px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            Welcome to Dentora
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: '#8B949E',
              marginTop: '6px',
              marginBottom: '0',
            }}
          >
            Sign in to access your dental practice dashboard
          </p>

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginTop: '24px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#8B949E',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '6px',
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                required
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#8B949E',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  style={{ paddingRight: '42px' }}
                  required
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
                    color: '#484F58',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.2s',
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  color: '#FF6B6B',
                  fontSize: '13px',
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  border: '1px solid rgba(255, 107, 107, 0.2)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span style={{ fontWeight: 500 }}>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="login-signin-btn"
              disabled={isLoading}
            >
              <span
                className="signin-shimmer"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                  transform: 'translateX(-100%)',
                }}
              />
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                {isLoading && <div className="loading-spinner" />}
                {isLoading ? 'Signing in...' : 'Sign In'}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '20px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#30363D' }} />
            <span style={{ fontSize: '12px', color: '#484F58' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#30363D' }} />
          </div>

          {/* Demo Login */}
          <button
            onClick={handleDemo}
            className="login-demo-btn"
            style={{ marginTop: '20px' }}
          >
            <Zap size={16} />
            Demo Login (Quick Start)
          </button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '13px',
              color: '#8B949E',
              marginTop: '32px',
              margin: '32px 0 0 0',
            }}
          >
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              style={{
                background: 'none',
                border: 'none',
                color: '#2F81F7',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Sign Up
            </button>
          </p>
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#484F58',
            marginTop: '24px',
          }}
        >
          Dentora 2026. All rights reserved.
        </p>
      </div>
    </div>
  );
}
