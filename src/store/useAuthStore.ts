import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  clinicName: string;
  specialty: string;
  role: string;
  token?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { email: string; password: string; name: string; clinicName: string; specialty: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  demoLogin: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const API_BASE = '/api/auth';

const DEMO_USER: User = {
  id: 'DEMO-001',
  email: 'demo@dentora.ai',
  name: 'Dr. Demo',
  clinicName: 'Dentora Clinic',
  specialty: 'Clinical AI',
  role: 'doctor',
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  checkAuth: async () => {
    const token = localStorage.getItem('dentora_auth_token');
    const userData = localStorage.getItem('dentora_user');
    
    if (!token || !userData) {
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const user = await res.json();
        set({ 
          token, 
          user, 
          isAuthenticated: true 
        });
      } else {
        localStorage.removeItem('dentora_auth_token');
        localStorage.removeItem('dentora_user');
        set({ isAuthenticated: false, user: null, token: null });
      }
    } catch (err) {
      // In case of network error, trust local storage for now but set error
      set({ 
        token, 
        user: JSON.parse(userData), 
        isAuthenticated: true 
      });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false, error: data.error });
        return { success: false, error: data.error };
      }
      
      localStorage.setItem('dentora_auth_token', data.token);
      localStorage.setItem('dentora_user', JSON.stringify(data.user));
      
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err: any) {
      const errorMsg = 'Service unreachable. Please check your connection.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  signup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const resData = await res.json();
      if (!res.ok) {
        set({ isLoading: false, error: resData.error });
        return { success: false, error: resData.error };
      }
      
      localStorage.setItem('dentora_auth_token', resData.token);
      localStorage.setItem('dentora_user', JSON.stringify(resData.user));
      
      set({ user: resData.user, token: resData.token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const errorMsg = 'Registration failed. Please try again.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  logout: () => {
    localStorage.removeItem('dentora_auth_token');
    localStorage.removeItem('dentora_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  demoLogin: async () => {
    localStorage.setItem('dentora_auth_token', 'demo_token_bypass');
    localStorage.setItem('dentora_user', JSON.stringify(DEMO_USER));
    set({ user: DEMO_USER, token: 'demo_token_bypass', isAuthenticated: true });
  },
}));
