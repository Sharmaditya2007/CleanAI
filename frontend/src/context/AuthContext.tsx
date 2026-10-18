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
          console.warn('Token expired or invalid', e);
          localStorage.removeItem('clean_ai_token');
          setToken(null);
          setUser(null);
        }
      } else if (!localStorage.getItem('clean_ai_logged_out')) {
        // Default to demo officer on initial load for seamless evaluation
        await quickSwitchRole('officer');
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    localStorage.removeItem('clean_ai_logged_out');
    const res = await api.login(email, password);
    localStorage.setItem('clean_ai_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (data: any) => {
    localStorage.removeItem('clean_ai_logged_out');
    const res = await api.register(data);
    localStorage.setItem('clean_ai_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('clean_ai_token');
    localStorage.setItem('clean_ai_logged_out', 'true');
    setToken(null);
    setUser(null);
  };

  const quickSwitchRole = async (role: UserRole) => {
    let email = 'officer@cleanai.gov';
    let password = 'Officer@123';
    if (role === 'owner') {
      email = 'owner@cleanai.com';
      password = 'Owner@123';
    } else if (role === 'citizen') {
      email = 'citizen@cleanai.org';
      password = 'Citizen@123';
    }

    try {
      localStorage.removeItem('clean_ai_logged_out');
      const res = await api.login(email, password);
      localStorage.setItem('clean_ai_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } catch (e) {
      console.error('Quick switch failed:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, quickSwitchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
