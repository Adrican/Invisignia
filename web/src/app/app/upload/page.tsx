'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { compressImage, formatFileSize } from '@/lib/imageUtils';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      
      setOriginalFile(file);
      setError('');
      
      if (file.size > 1200 * 1024) {
        setIsCompressing(true);
        try {
          const compressedFile = await compressImage(file, { 
            maxSizeKB: 1200, 
            minQuality: 0.7 
          });
          setSelectedFile(compressedFile);
        } catch (err) {
          setError('Error al comprimir la imagen');
          return;
        } finally {
          setIsCompressing(false);
        }
      } else {
        setSelectedFile(file);
      }
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
      
      const originalName = originalFile?.name || selectedFile.name;
      const nameParts = originalName.split('.');
      const extension = nameParts.pop();
      const baseName = nameParts.join('.');
      const markedFileName = `${baseName}_marked.${extension}`;
      
      downloadFile(blob, markedFileName);
      
      setSuccess(true);
      setSelectedFile(null);
      setOriginalFile(null);
      setPurpose('');
      
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
      
    } catch (err) {
      let errorMessage = 'Error al procesar el archivo';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        if (errorMessage.includes('La imagen no tiene suficiente calidad')) {
          errorMessage = 'La imagen no tiene suficiente calidad para agregar una marca de agua invisible. Intenta con una imagen de mayor resolución o menos comprimida.';
        }
      }
      
      if (errorMessage.includes('no tiene suficiente calidad')) {
        setError(`${errorMessage}\n\nSugerencias:\n• Usa una imagen de mayor resolución\n• Evita imágenes muy comprimidas\n• Prueba con formato PNG en lugar de JPG`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setOriginalFile(file);
        setError('');
        
        if (file.size > 1200 * 1024) {
          setIsCompressing(true);
          try {
            const compressedFile = await compressImage(file, { 
              maxSizeKB: 1200, 
              minQuality: 0.7 
            });
            setSelectedFile(compressedFile);
          } catch (err) {
            setError('Error al comprimir la imagen');
            return;
          } finally {
            setIsCompressing(false);
          }
        } else {
          setSelectedFile(file);
        }
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
              } ${isCompressing ? 'border-blue-300 bg-blue-50' : ''}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isCompressing ? (
                <div>
                  <div className="text-blue-600 text-4xl mb-2">⏳</div>
                  <p className="text-sm font-medium text-blue-700">
                    Comprimiendo imagen...
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Optimizando para mejor rendimiento
                  </p>
                </div>
              ) : selectedFile ? (
                <div>
                  <div className="text-green-600 text-4xl mb-2">✓</div>
                  <p className="text-sm font-medium text-green-700">
                    {originalFile?.name || selectedFile.name}
                  </p>
                  <div className="text-xs text-green-600 mt-1 space-y-1">
                    {originalFile && originalFile.size !== selectedFile.size && (
                      <>
                        <p>Original: {formatFileSize(originalFile.size)}</p>
                        <p>Optimizada: {formatFileSize(selectedFile.size)}</p>
                      </>
                    )}
                    {(!originalFile || originalFile.size === selectedFile.size) && (
                      <p>{formatFileSize(selectedFile.size)}</p>
                    )}
                  </div>
                  
                  {/* Botones para cambiar imagen */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center space-x-2"
                    >
                      <span>📷</span>
                      <span>Cambiar por foto</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex items-center space-x-2"
                    >
                      <span>🖼️</span>
                      <span>Cambiar por galería</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-gray-400 text-4xl mb-2">📤</div>
                  <p className="text-sm text-gray-600 mb-4">
                    Arrastra una imagen aquí o elige una opción:
                  </p>
                  
                  {/* Botones separados */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center space-x-2"
                    >
                      <span>📷</span>
                      <span>Hacer una foto</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex items-center space-x-2"
                    >
                      <span>🖼️</span>
                      <span>Galería</span>
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Input para cámara */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Input para galería */}
              <input
                ref={galleryInputRef}
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
                ¡Archivo procesado y descargado correctamente!
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !purpose.trim() || isUploading || isCompressing}
              className="w-full"
            >
              {isUploading ? 'Analizando imagen...' : 'Procesar y Descargar'}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              <p>Formatos soportados: JPG, PNG, BMP</p>
              <p>Las imágenes se optimizan automáticamente para mejor rendimiento</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}