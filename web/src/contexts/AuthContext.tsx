'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
  email: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, token: string) => void;
  logout: () => void;
  clearInvalidSession: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // comprobar token
    const token = Cookies.get('invisignia_token');
    const email = Cookies.get('invisignia_email');
    
    if (token && email) {
      setUser({ email, token });
      
      if (pathname === '/login' || pathname === '/register') {
        router.push('/app');
      }
    }
    setIsLoading(false);
  }, [pathname, router]);

  const login = (email: string, token: string) => {
    const userData = { email, token };
    setUser(userData);

    // guardar 7 dias en las cookies
    Cookies.set('invisignia_token', token, { expires: 7 });
    Cookies.set('invisignia_email', email, { expires: 7 });
  };

  const logout = () => {
    setUser(null);
    Cookies.remove('invisignia_token');
    Cookies.remove('invisignia_email');
    router.push('/');
  };

    const clearInvalidSession = () => {
    console.log('Token inválido detectado, limpiando sesión...');
    setUser(null);
    Cookies.remove('invisignia_token');
    Cookies.remove('invisignia_email');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, clearInvalidSession, isLoading }}>
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