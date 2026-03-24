import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [specialty, setSpecialty] = useState('General Dentist');
  const [showPassword, setShowPassword] = useState(false);
  
  const { signup, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    
    const res = await signup({ 
      name, 
      email, 
      password, 
      clinicName, 
      specialty 
    });
    
    if (res.success) navigate('/dashboard');
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
      <style>{`
        @keyframes regFadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes regSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .reg-input {
          width: 100%;
          background: #0D1117;
          border: 1px solid #30363D;
          border-radius: 10px;
          padding: 12px 14px;
          color: #E6EDF3;
          font-size: 14px;
          font-family: var(--font-sans);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .reg-input::placeholder { color: #484F58; }
        .reg-input:focus {
          border-color: #2F81F7;
          box-shadow: 0 0 0 3px rgba(47, 129, 247, 0.15);
        }
        .reg-submit-btn {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #2F81F7, #1D6FE8);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          font-family: var(--font-sans);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 12px;
        }
        .reg-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .loading-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: regSpin 0.8s linear infinite;
          margin-right: 10px;
        }
      `}</style>

      {/* Grid dot pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          animation: 'regFadeInUp 0.5s ease-out both',
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => navigate('/login')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#8B949E',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '24px',
            padding: '8px',
            borderRadius: '8px',
            transition: 'color 0.2s, background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#8B949E';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ArrowLeft size={16} />
          Back to Login
        </button>

        <div
          style={{
            background: 'rgba(22, 27, 34, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(47, 129, 247, 0.2)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div style={{ marginBottom: '32px' }}>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '28px',
                fontWeight: 700,
                color: '#FFFFFF',
                margin: 0,
              }}
            >
              Join Dentora
            </h2>
            <p style={{ fontSize: '14px', color: '#8B949E', marginTop: '8px' }}>
              Create your clinical practitioner account
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8B949E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Dr. Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="reg-input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8B949E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  Clinic Name
                </label>
                <input
                  type="text"
                  placeholder="Practice Name"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="reg-input"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#8B949E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Medical Specialty
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="reg-input"
                style={{ cursor: 'pointer' }}
              >
                <option>General Dentist</option>
                <option>Orthodontist</option>
                <option>Periodontist</option>
                <option>Oral Surgeon</option>
                <option>Pedodontist</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#8B949E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="reg-input"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8B949E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="reg-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#484F58', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8B949E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  Confirm
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="reg-input"
                  required
                />
              </div>
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <span style={{ color: '#FF6B6B', fontSize: '12px' }}>Passwords do not match</span>
            )}

            {error && (
              <div
                style={{
                  color: '#FF6B6B',
                  fontSize: '13px',
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  border: '1px solid rgba(255, 107, 107, 0.2)',
                  padding: '12px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="reg-submit-btn"
              disabled={isLoading || (password !== confirmPassword)}
            >
              {isLoading && <div className="loading-spinner" />}
              {isLoading ? 'Creating Account...' : 'Create Clinical Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#8B949E', marginTop: '24px' }}>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: '#2F81F7', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
