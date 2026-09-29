import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any;
  login: (data: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('azcloth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (data: any) => {
    setUser(data.user);
    localStorage.setItem('azcloth_user', JSON.stringify(data.user));
    localStorage.setItem('azcloth_token', data.access);
  };

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout/`, {
        method: 'POST',
      });
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    localStorage.removeItem('azcloth_user');
    localStorage.removeItem('azcloth_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
