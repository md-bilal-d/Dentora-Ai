import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    // Only check if we are not authenticated and not currently loading
    if (!isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, checkAuth]);

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0D1117',
        color: '#2F81F7'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid rgba(47, 129, 247, 0.1)',
          borderTopColor: '#2F81F7',
          borderRadius: '50%',
          animation: 'protected-spin 0.8s linear infinite'
        }} />
        <style>{`
          @keyframes protected-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated && !localStorage.getItem('dentora_auth_token')) {
    return <Navigate to="/login" replace />;
  }

  return isAuthenticated ? <>{children}</> : null;
}
