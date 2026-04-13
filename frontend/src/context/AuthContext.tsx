import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import { extractError } from '../api/client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, token: null, isAuthenticated: false,
  login: async () => {}, register: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, token, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    const handler = () => clearAuth();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [clearAuth]);

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password);
    setAuth(res.data.user, res.data.token);
  }

  async function register(name: string, email: string, password: string) {
    const res = await authApi.register(name, email, password);
    setAuth(res.data.user, res.data.token);
  }

  function logout() {
    clearAuth();
  }

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!token,
      login, register, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { extractError };
