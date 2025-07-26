'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

interface User {
  email: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay token guardado al cargar la página
    const token = Cookies.get('invisignia_token');
    const email = Cookies.get('invisignia_email');
    
    if (token && email) {
      setUser({ email, token });
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, token: string) => {
    const userData = { email, token };
    setUser(userData);
    
    // Guardar en cookies (expira en 7 días)
    Cookies.set('invisignia_token', token, { expires: 7 });
    Cookies.set('invisignia_email', email, { expires: 7 });
  };

  const logout = () => {
    setUser(null);
    Cookies.remove('invisignia_token');
    Cookies.remove('invisignia_email');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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