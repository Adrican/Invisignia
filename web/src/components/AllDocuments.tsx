'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';

interface HistoryItem {
  id: number;
  purpose: string;
  created_at: string;
  hash_id: string;
}

export default function AllDocuments() {
  const { user, clearInvalidSession } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const data = await apiClient.getUserHistory(user.token);
        setHistory(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar el historial';
        
        // si hay error de credenciales, limpio sesión
        if (errorMessage.includes('credenciales') || 
            errorMessage.includes('Unauthorized') || 
            errorMessage.includes('401')) {
          clearInvalidSession();
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user, clearInvalidSession]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hoy';
    } else if (diffDays === 2) {
      return 'Ayer';
    } else if (diffDays <= 7) {
      return `Hace ${diffDays - 1} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tus documentos</CardTitle>
          <CardDescription>
            Historial de los documentos con marca de agua invisible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto"></div>
            <p className="mt-2">Cargando historial...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tus documentos</CardTitle>
          <CardDescription>
            Historial de los documentos con marca de agua invisible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>❌ {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tus documentos</CardTitle>
          <CardDescription>
            Historial de los documentos con marca de agua invisible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No hay documentos recientes</p>
            <p className="text-sm mt-2">
              Comienza subiendo una imagen para ver tu historial aquí
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tus documentos</CardTitle>
        <CardDescription>
          Historial de tus últimos {history.length} documentos marcados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors min-w-0"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="text-green-600 text-lg flex-shrink-0">✓</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate" title={item.purpose}>
                    {truncateText(item.purpose, 40)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    ID: {item.hash_id.substring(0, 8)}...
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 text-right flex-shrink-0 ml-2">
                {formatDate(item.created_at)}
              </div>
            </div>
          ))}
        </div>
        
        {history.length >= 10 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Mostrando los últimos 10 elementos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}