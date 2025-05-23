"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  role: 'admin-user' | 'privileged-user' | 'viewer-user';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Hilfsfunktion zum sicheren Dekodieren von Base64-Token
const decodeToken = (token: string) => {
  try {
    const decoded = atob(token);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Hilfsfunktion zum Validieren von Token
const isTokenValid = (token: string): boolean => {
  try {
    const tokenData = decodeToken(token);
    if (!tokenData || !tokenData.exp) {
      return false;
    }
    
    // Check if token is expired (with 1 minute buffer)
    return tokenData.exp > (Date.now() / 1000) + 60;
  } catch (error) {
    return false;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Check if token is valid
        if (isTokenValid(storedToken)) {
          setUser(parsedUser);
          setToken(storedToken);
        } else {
          // Token expired or invalid, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        }
      } catch (error) {
        console.error('Invalid stored auth data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  // Auto logout before token expires
  useEffect(() => {
    if (token && isTokenValid(token)) {
      try {
        const tokenData = decodeToken(token);
        if (tokenData && tokenData.exp) {
          const timeUntilExpiry = (tokenData.exp * 1000) - Date.now();
          
          // Logout 1 minute before expiry
          const timeout = setTimeout(() => {
            console.log('Token expired, logging out...');
            logout();
          }, Math.max(timeUntilExpiry - 60000, 0));
          
          return () => clearTimeout(timeout);
        }
      } catch (error) {
        console.error('Error setting up token expiry timeout:', error);
        logout();
      }
    }
  }, [token]);

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.data.token) {
        // Validate the received token
        if (!isTokenValid(data.data.token)) {
          throw new Error('Received invalid token from server');
        }

        setUser(data.data.user);
        setToken(data.data.token);
        
        // Store in localStorage
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('authUser', JSON.stringify(data.data.user));
        
        return true;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    sessionStorage.clear();
  };

  const hasRole = (requiredRole: string): boolean => {
    if (!user) return false;
    
    const roleHierarchy = {
      'viewer-user': 1,
      'privileged-user': 2,
      'admin-user': 3
    };
    
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    
    return userLevel >= requiredLevel;
  };

  const isAuthenticated = !!user && !!token && (token ? isTokenValid(token) : false);

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    hasRole,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: string
) => {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, hasRole, loading } = useAuth();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Nicht authentifiziert</h2>
            <p className="text-gray-600">Bitte melden Sie sich an, um fortzufahren.</p>
          </div>
        </div>
      );
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h2>
            <p className="text-gray-600">Sie haben nicht die erforderlichen Berechtigungen.</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};