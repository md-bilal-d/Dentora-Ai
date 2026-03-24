import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, i) => {
    const path = '/' + pathSegments.slice(0, i + 1).join('/');
    const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
    return { label, path };
  });

  // STEP 8 - Dynamic Document Title
  useEffect(() => {
    const context = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Dashboard';
    document.title = `Dentora - ${context}`;
  }, [breadcrumbs]);

  return (
    <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-6 py-3 max-w-[1600px] mx-auto">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#0D1117',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(47, 129, 247, 0.2)',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 100 100"
              fill="none"
              style={{ filter: 'drop-shadow(0 0 8px rgba(47, 129, 247, 0.6))' }}
            >
              <defs>
                <linearGradient id="toothGradientNav" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00B4D8" />
                  <stop offset="50%" stopColor="#2F81F7" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
              <path
                d="M50,18 C46,18 42,15 30,15 C18,15 15,25 15,40 C15,55 18,70 20,85 C21,90 24,92 30,92 C36,92 38,85 40,70 C42,60 50,60 50,60 C50,60 58,60 60,70 C62,85 64,92 70,92 C76,92 79,90 80,85 C82,70 85,55 85,40 C85,25 82,15 70,15 C58,15 54,18 50,18 Z"
                fill="url(#toothGradientNav)"
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
          <span className="text-[20px] font-bold text-white tracking-tight">
            Dent<span className="text-[#2F81F7]">ora</span>
          </span>
        </div>

        {/* Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 text-sm text-text-muted">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={14} className="text-border" />}
                <button
                  onClick={() => navigate(crumb.path)}
                  className={`hover:text-primary transition-colors ${i === breadcrumbs.length - 1 ? 'text-text-secondary font-medium' : ''}`}
                >
                  {crumb.label}
                </button>
              </span>
            ))}
          </div>
        )}

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-text-muted">{user.clinicName}</span>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-sm font-bold text-primary">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="hidden sm:block text-sm font-medium text-text">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-all"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
