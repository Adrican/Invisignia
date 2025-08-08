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
  clearInvalidSession: (reason?: string) => void;
  isLoading: boolean;
  sessionExpiredMessage: string | null;
  clearSessionMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
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
    setSessionExpiredMessage(null); // Limpiar mensaje al hacer login

    Cookies.set('invisignia_token', token, { expires: 7 });
    Cookies.set('invisignia_email', email, { expires: 7 });
  };

  const logout = () => {
    setUser(null);
    setSessionExpiredMessage(null);
    Cookies.remove('invisignia_token');
    Cookies.remove('invisignia_email');
    router.push('/');
  };

  const clearInvalidSession = (reason?: string) => {
    console.log('Sesión inválida detectada:', reason);
    
    // mensaje expira la sesio
    const message = reason || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    setSessionExpiredMessage(message);
    
    // Limpiar datos de usuario
    setUser(null);
    Cookies.remove('invisignia_token');
    Cookies.remove('invisignia_email');
    
    // redirigir con delay para mostrar el mensaje
    setTimeout(() => {
      router.push('/login');
    }, 100);
  };

  const clearSessionMessage = () => {
    setSessionExpiredMessage(null);
  };

  const contextValue = {
    user,
    login,
    logout,
    clearInvalidSession,
    isLoading,
    sessionExpiredMessage,
    clearSessionMessage,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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