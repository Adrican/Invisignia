'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AllDocuments from '@/components/AllDocuments';
import Link from 'next/link';

export default function AppPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-teal-600 hover:text-teal-700">
                Invisignia
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-700 truncate">
                Bienvenido, {user.email}
              </span>
              <Button variant="outline" onClick={handleLogout} size="sm" className="self-end sm:self-auto">
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Panel de Control
          </h2>
          <p className="text-gray-600">
            Gestiona tus marcas de agua invisibles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📤</span>
                <span>Subir y Marcar</span>
              </CardTitle>
              <CardDescription>
                Sube una imagen y añade una marca de agua invisible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => router.push('/app/upload')}
              >
                Subir Archivo
              </Button>
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🔍</span>
                <span>Verificar Marca</span>
              </CardTitle>
              <CardDescription>
                Verifica si una imagen contiene una marca de agua
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/app/verify')}
              >
                Verificar Documento
              </Button>
            </CardContent>
          </Card>
        </div>


        <div className="mt-8">
          <AllDocuments />
        </div>
      </main>
    </div>
  );
}