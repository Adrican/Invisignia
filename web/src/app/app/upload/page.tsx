'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [purpose, setPurpose] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleUpload = async () => {
    if (!selectedFile || !purpose.trim() || !user) {
      setError('Por favor selecciona un archivo y especifica el propósito');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const blob = await apiClient.uploadWatermark(selectedFile, purpose, user.token);
      
      // Generar nombre del archivo marcado
      const originalName = selectedFile.name;
      const nameParts = originalName.split('.');
      const extension = nameParts.pop();
      const baseName = nameParts.join('.');
      const markedFileName = `${baseName}_marked.${extension}`;
      
      // Descargar automáticamente
      downloadFile(blob, markedFileName);
      
      setSuccess(true);
      setSelectedFile(null);
      setPurpose('');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsUploading(false);
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
      } else {
        setError('Solo se permiten archivos de imagen');
      }
    }
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
              <h1 className="text-xl font-semibold text-gray-900">Subir y Marcar</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Subir Imagen</CardTitle>
            <CardDescription>
              Selecciona una imagen para añadir una marca de agua invisible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                selectedFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div>
                  <div className="text-green-600 text-4xl mb-2">✓</div>
                  <p className="text-sm font-medium text-green-700">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-gray-400 text-4xl mb-2">📤</div>
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

            {/* Purpose Input */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Propósito de la marca de agua</Label>
              <Input
                id="purpose"
                placeholder="Ej: Propiedad de Juan Pérez, Documento confidencial, etc."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className={error && !purpose ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-500">
                Este texto se incrustará de forma invisible en la imagen
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 text-sm text-green-500 bg-green-50 border border-green-200 rounded">
                ¡Archivo procesado y descargado exitosamente!
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !purpose.trim() || isUploading}
              className="w-full"
            >
              {isUploading ? 'Procesando...' : 'Procesar y Descargar'}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              <p>Formatos soportados: JPG, PNG, BMP</p>
              <p>El archivo marcado se descargará automáticamente</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}