import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setAuthErrorHandler } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organization_id: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, organization_name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  // Set up global auth error handler
  useEffect(() => {
    setAuthErrorHandler(() => {
      console.log('Authentication error detected, logging out...');
      logout();
      // Navigate to login with a message using window.location
      // This works even if we're not in a Router context
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    });
  }, []);

  useEffect(() => {
    // Load auth state from localStorage on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        console.log('Auth state loaded from localStorage');
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear invalid data
        logout();
      }
    } else {
      console.log('No stored auth state found');
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, organization_name: string) => {
    try {
      const response = await api.register(email, password, name, organization_name);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

