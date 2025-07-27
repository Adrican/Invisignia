'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';

interface VerifyResult {
  status: string;
  purpose: string;
  created_at: string;
}

export default function VerifyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      setSelectedFile(file);
      setError('');
      setResult(null);
    }
  };

  const handleVerify = async () => {
    if (!selectedFile || !user) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setIsVerifying(true);
    setError('');
    setResult(null);

    try {
      const response = await apiClient.verifyWatermark(selectedFile, user.token);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar el archivo');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setError('');
        setResult(null);
      } else {
        setError('Solo se permiten archivos de imagen');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/app')}
              >
                ← Volver
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Verificar Marca de Agua</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Verificar Imagen</CardTitle>
            <CardDescription>
              Sube una imagen para verificar si contiene una marca de agua invisible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                selectedFile ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div>
                  <div className="text-blue-600 text-4xl mb-2">📄</div>
                  <p className="text-sm font-medium text-blue-700">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-gray-400 text-4xl mb-2">🔍</div>
                  <p className="text-sm text-gray-600 mb-2">
                    Arrastra una imagen aquí o haz clic para seleccionar
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Seleccionar Archivo
                  </Button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={!selectedFile || isVerifying}
              className="w-full"
            >
              {isVerifying ? 'Verificando...' : 'Verificar Marca de Agua'}
            </Button>

            {/* Error Message */}
            {error && (
              <div className="p-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">❌</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-green-600 text-xl">✅</span>
                    <span className="font-medium text-green-800">
                      Marca de agua encontrada
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Propósito:</span>
                      <p className="text-gray-900 bg-white p-2 rounded border mt-1">
                        {result.purpose}
                      </p>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Fecha de creación:</span>
                      <p className="text-gray-600 mt-1">
                        {formatDate(result.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 text-center">
              <p>Solo se pueden verificar imágenes que hayan sido marcadas con este sistema</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}