'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; 
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
  

  const [verifyProgress, setVerifyProgress] = useState(0);
  const [verifyStage, setVerifyStage] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }
    /*
    if (file.size > 10 * 1024 * 1024) {
    setError('La imagen no puede superar los 10MB');
    return;
    
  }*/

    setSelectedFile(file);
    setError('');
    setResult(null);
    
  };


  const handleVerify = async () => {
    if (!selectedFile || !user) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setIsVerifying(true);
    setError('');
    setResult(null);
    setVerifyProgress(0);

    try {
      // Etapa 1: Analizando imagen
      setVerifyStage('Analizando imagen...');
      setVerifyProgress(25);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Etapa 2: Extrayendo marca de agua
      setVerifyStage('Extrayendo marca de agua...');
      setVerifyProgress(50);
      await new Promise(resolve => setTimeout(resolve, 600));

      // Etapa 3: Verificando en base de datos
      setVerifyStage('Verificando autenticidad...');
      setVerifyProgress(75);

      setVerifyProgress(100);
      setVerifyStage('¡Verificación completada!');
      

      const response = await apiClient.verifyWatermark(selectedFile, user.token);
      setResult(response);
      
    } catch (err) {
      setVerifyProgress(0);
      setVerifyStage('');
      setError(err instanceof Error ? err.message : 'Error al verificar el archivo');
    } finally {
      setIsVerifying(false);
      setTimeout(() => {
        setVerifyProgress(0);
        setVerifyStage('');
      }, 2000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }

    setSelectedFile(file);
    setError('');
    setResult(null);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const truncateFileName = (fileName: string, maxLength: number = 30) => {
    if (fileName.length <= maxLength) return fileName;
    
    const parts = fileName.split('.');
    const extension = parts.pop();
    const baseName = parts.join('.');
    
    if (baseName.length <= maxLength - extension!.length - 1) {
      return fileName;
    }
    
    const truncatedBase = baseName.substring(0, maxLength - extension!.length - 4);
    return `${truncatedBase}...${extension}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/app')}>
                ← Volver
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Verificar Marca de Agua</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Verificar Imagen</CardTitle>
            <CardDescription>
              Sube una imagen para verificar si contiene una marca de agua invisible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  <p className="text-sm font-medium text-blue-700 truncate break-all" title={selectedFile.name}>
                    {truncateFileName(selectedFile.name)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4"
                  >
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="text-gray-400 text-4xl mb-2">🔍</div>
                  <p className="text-sm text-gray-600 mb-2">
                    Arrastra una imagen aquí o haz clic para seleccionar
                  </p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
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

            {/* Progress Section*/}
            {isVerifying && (
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium text-blue-800">{verifyStage}</span>
                </div>
                <Progress value={verifyProgress} className="w-full" />
                <div className="flex justify-between text-xs text-blue-600">
                  <span>Verificando...</span>
                  <span>{verifyProgress}%</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">❌</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-green-600 text-xl">✅</span>
                    <span className="font-medium text-green-800">Marca de agua encontrada</span>
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
                      <p className="text-gray-600 mt-1">{formatDate(result.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleVerify}
              disabled={!selectedFile || isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verificando...</span>
                </div>
              ) : (
                'Verificar Marca de Agua'
              )}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              <p>Solo se pueden verificar imágenes que hayan sido marcadas con este sistema</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
