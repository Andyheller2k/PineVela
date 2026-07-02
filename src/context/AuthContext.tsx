import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthenticatedUser {
  id: string;
  name: string;
  role: 'student' | 'manager' | 'admin';
  token: string;
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<AuthenticatedUser>;
  logout: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize with local storage and verify with backend on startup
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('pinevela_session_token');
      if (savedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser({
              ...userData,
              token: savedToken
            });
          } else {
            // Token is invalid/expired
            localStorage.removeItem('pinevela_session_token');
          }
        } catch (err) {
          console.error("Auth sync error:", err);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<AuthenticatedUser> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usernameOrEmail, password })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Authentication failed');
    }

    const userData: AuthenticatedUser = await res.json();
    localStorage.setItem('pinevela_session_token', userData.token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('pinevela_session_token');
    setUser(null);
  };

  const apiFetch = async (url: string, options: RequestInit = {}): Promise<any> => {
    const currentToken = user?.token || localStorage.getItem('pinevela_session_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
      ...(options.headers || {})
    };

    const res = await fetch(url, {
      ...options,
      headers
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Automatically logout on unauthorized API response
        logout();
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    return res.json();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
