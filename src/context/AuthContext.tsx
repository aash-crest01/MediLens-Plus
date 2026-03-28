import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  fullName: string;
  email: string;
  dob?: string;
  gender?: string;
  photo?: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  signup: (userData: User) => void;
  continueAsGuest: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Session persistence disabled to ensure login page appears every time the project starts
    // as per user request.
  }, []);

  const login = (email: string) => {
    // Simulated login
    const userData = { fullName: email.split('@')[0], email };
    setUser(userData);
    setIsAuthenticated(true);
    
    // Persistence disabled as per user request to show login page every time
  };

  const signup = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    // Persistence disabled as per user request to show login page every time
  };

  const continueAsGuest = () => {
    const guestUser = { fullName: 'Guest User', email: 'guest@medilens.ai', isGuest: true };
    setUser(guestUser);
    setIsAuthenticated(true);
    // Persistence disabled as per user request to show login page every time
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('medilens_user');
    sessionStorage.removeItem('medilens_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, continueAsGuest, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
