import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('clean_ai_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (e) {
          console.warn('Session expired or invalid token', e);
          localStorage.removeItem('clean_ai_token');
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem('clean_ai_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem('clean_ai_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('clean_ai_token');
    setToken(null);
    setUser(null);
  };

  // Deprecated helper kept for backwards type compatibility
  const quickSwitchRole = async (_role: UserRole) => {
    // No-op in real production
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, quickSwitchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

const fallbackAuth: AuthContextType = {
  user: null,
  token: null,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  quickSwitchRole: async () => {},
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || fallbackAuth;
};
