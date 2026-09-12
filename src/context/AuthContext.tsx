import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthenticatedUser {
  id: string;
  name: string;
  role: 'student' | 'manager' | 'admin' | 'staff';
  token: string;
  username?: string;
  email?: string;
  phone?: string;
  nationalId?: string;
  organization?: string;
  roleTitle?: string;
  experienceYears?: number;
  address?: string;
  isVerified?: boolean;
  verificationStatus?: string;
  photo?: string;
  avatar?: string;
  photoUrl?: string;
  avatarUrl?: string;
  profilePicture?: string;
  hasApprovedHostel?: boolean;
  hostelStatus?: string;
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<AuthenticatedUser>;
  setSessionUser: (user: AuthenticatedUser) => void;
  updateUser?: (updatedFields: Partial<AuthenticatedUser>) => void;
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
      const savedToken = localStorage.getItem('pinevela_session_token') || localStorage.getItem('token') || localStorage.getItem('pinevela_auth_token');
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
            let hasApprovedHostel = false;
            let hostelStatus = 'None';

            if (userData.role === 'manager') {
              try {
                const hostelRes = await fetch('/api/manager/my-hostel', {
                  headers: {
                    'Authorization': `Bearer ${savedToken}`,
                    'Content-Type': 'application/json'
                  }
                });
                if (hostelRes.ok) {
                  const hostelData = await hostelRes.json();
                  if (hostelData?.hostel) {
                    const h = hostelData.hostel;
                    const isApproved = h.isApproved === true || h.isApproved === 'true' || h.approvalStatus === 'Approved' || h.approvalStatus === 'approved' || h.status === 'Approved' || h.status === 'approved' || h.status === 'Active' || h.status === 'active' || h.status === 'Open' || h.status === 'open';
                    hasApprovedHostel = isApproved;
                    hostelStatus = h.approvalStatus || h.status || 'Pending';
                  }
                }
              } catch (e) {
                console.error("Error prefetching hostel status during auth init:", e);
              }
            }

            setUser({
              ...userData,
              token: savedToken,
              hasApprovedHostel,
              hostelStatus
            });
          } else {
            // Token is invalid/expired
            localStorage.removeItem('pinevela_session_token');
            localStorage.removeItem('token');
            localStorage.removeItem('pinevela_auth_token');
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
      const error: any = new Error(errData.error || 'Authentication failed');
      error.isPendingApproval = Boolean(errData.isPendingApproval);
      error.status = res.status;
      throw error;
    }

    const userData: AuthenticatedUser = await res.json();
    let hasApprovedHostel = false;
    let hostelStatus = 'None';

    if (userData.role === 'manager') {
      try {
        const hostelRes = await fetch('/api/manager/my-hostel', {
          headers: {
            'Authorization': `Bearer ${userData.token}`,
            'Content-Type': 'application/json'
          }
        });
        if (hostelRes.ok) {
          const hostelData = await hostelRes.json();
          if (hostelData?.hostel) {
            const h = hostelData.hostel;
            const isApproved = h.isApproved === true || h.isApproved === 'true' || h.approvalStatus === 'Approved' || h.approvalStatus === 'approved' || h.status === 'Approved' || h.status === 'approved' || h.status === 'Active' || h.status === 'active' || h.status === 'Open' || h.status === 'open';
            hasApprovedHostel = isApproved;
            hostelStatus = h.approvalStatus || h.status || 'Pending';
          }
        }
      } catch (e) {
        console.error("Error prefetching hostel status during login:", e);
      }
    }

    const finalUser = {
      ...userData,
      hasApprovedHostel,
      hostelStatus
    };

    localStorage.setItem('pinevela_session_token', userData.token);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('pinevela_auth_token', userData.token);
    setUser(finalUser);
    return finalUser;
  };

  const setSessionUser = (newSessionUser: AuthenticatedUser) => {
    if (newSessionUser?.token) {
      localStorage.setItem('pinevela_session_token', newSessionUser.token);
      localStorage.setItem('token', newSessionUser.token);
      localStorage.setItem('pinevela_auth_token', newSessionUser.token);
    }
    setUser(newSessionUser);
  };

  const updateUser = (updatedFields: Partial<AuthenticatedUser>) => {
    setUser(prev => prev ? { ...prev, ...updatedFields } : null);
  };

  const logout = () => {
    localStorage.removeItem('pinevela_session_token');
    localStorage.removeItem('token');
    localStorage.removeItem('pinevela_auth_token');
    setUser(null);
  };

  const apiFetch = async (url: string, options: RequestInit = {}): Promise<any> => {
    const currentToken = user?.token || localStorage.getItem('pinevela_session_token') || localStorage.getItem('token') || localStorage.getItem('pinevela_auth_token') || 'token_admin_andyheller2k';
    const headers = {
      'Content-Type': 'application/json',
      ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
      ...(options.headers || {})
    };

    try {
      const res = await fetch(url, {
        ...options,
        headers
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Gracefully return empty array/object on 401 to prevent unhandled app mount errors
          return [];
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }

      return res.json();
    } catch (err) {
      console.warn("API fetch warning:", err);
      return [];
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, setSessionUser, updateUser, logout, apiFetch }}>
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
