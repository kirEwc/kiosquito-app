import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/auth';
import { Usuario } from '../services/database';

interface AuthContextType {
  user: Usuario | null;
  isLoading: boolean;
  login: (username: string, password: string, recordar?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      // Silently handle auth check errors
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string, recordar: boolean = false): Promise<boolean> => {
    try {
      const loggedUser = await AuthService.login(username, password, recordar);
      if (loggedUser) {
        setUser(loggedUser);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      // Silently handle logout errors
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}