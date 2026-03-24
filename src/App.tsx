import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PatientDetailPage from './pages/PatientDetailPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { usePatientStore } from './store/usePatientStore';
import { useAuthStore } from './store/useAuthStore';

function LoginRoute({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const hasToken = !!localStorage.getItem('dentora_auth_token');
  
  if (isAuthenticated || hasToken) return <Navigate to="/dashboard" replace />;
  return <>{children || <LoginPage />}</>;
}

export default function App() {
  const fetchPatients = usePatientStore((state) => state.fetchPatients);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Initial check for session
    checkAuth();
    // Only fetch patients if we are likely authenticated
    if (localStorage.getItem('dentora_auth_token')) {
      fetchPatients();
    }
  }, [fetchPatients, checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/register" element={<LoginRoute><RegisterPage /></LoginRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/patient/:id" element={<ProtectedRoute><PatientDetailPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
