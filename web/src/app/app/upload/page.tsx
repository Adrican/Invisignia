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

  // Aplica las reglas de compresión según el tamaño
  const processFile = async (file: File) => {
    const kb = file.size / 1024;
    // Más de 5 MB (5120 KB) hasta 10 MB → comprime al 40%
    if (kb > 5120) {
      const targetKB = kb * 0.40;
      return await compressImage(file, { maxSizeKB: targetKB, minQuality: 0.85 });
    }
    // Entre 2 MB y 5 MB → comprime al 50%
    if (kb > 2048) {
      const targetKB = kb * 0.50;
      return await compressImage(file, { maxSizeKB: targetKB, minQuality: 0.85 });
    }
    // Menos de 2 MB → quita 800 KB si pesa más de 800 KB
    if (kb > 800) {
      const targetKB = kb - 800;
      return await compressImage(file, { maxSizeKB: targetKB, minQuality: 0.85 });
    }
    // Si ya pesa ≤ 800 KB, no tocar
    return file;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }
    /*if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no puede superar los 10MB');
      return;
    }*/
    setOriginalFile(file);
    setError('');
    setSuccess(false);

    if (file.size > 800 * 1024) {
      setIsCompressing(true);
      try {
        const compressed = await processFile(file);
        setSelectedFile(compressed);
      } catch {
        setError('Error al comprimir la imagen');
      } finally {
        setIsCompressing(false);
      }
    } else {
      setSelectedFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no puede superar los 10MB');
      return;
    }
    setOriginalFile(file);
    setError('');
    setSuccess(false);

    if (file.size > 800 * 1024) {
      setIsCompressing(true);
      try {
        const compressed = await processFile(file);
        setSelectedFile(compressed);
      } catch {
        setError('Error al comprimir la imagen');
      } finally {
        setIsCompressing(false);
      }
    } else {
      setSelectedFile(file);
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
      const parts = originalName.split('.');
      const ext = parts.pop();
      const base = parts.join('.');
      const markedName = `${base}_marked.${ext}`;
      downloadFile(blob, markedName);

      setSuccess(true);
      setSelectedFile(null);
      setOriginalFile(null);
      setPurpose('');
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } catch (err) {
      let msg = 'Error al procesar el archivo';
      if (err instanceof Error) msg = err.message;
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" onClick={() => router.push('/app')}>
              ← Volver
            </Button>
            <h1 className="text-xl font-semibold">Subir y Marcar</h1>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Subir Imagen</CardTitle>
            <CardDescription>
              Hasta 10 MB. Se comprime solo si supera 800 KB según tus reglas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                selectedFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
              } ${isCompressing ? 'border-blue-300 bg-blue-50' : ''}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isCompressing ? (
                <div>
                  <div className="text-blue-600 text-4xl mb-2">⏳</div>
                  <p className="text-sm font-medium text-blue-700">Comprimiendo imagen...</p>
                </div>
              ) : selectedFile ? (
                <div>
                  <div className="text-green-600 text-4xl mb-2">✓</div>
                  <p className="font-medium text-green-700">{originalFile?.name}</p>
                  <p className="text-xs text-green-600">
                    {formatFileSize(originalFile!.size)} → {formatFileSize(selectedFile.size)}
                  </p>
                  <div className="mt-4 flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      📷 Cambiar foto
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      🖼️ Cambiar galería
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-gray-400 text-4xl mb-2">📤</div>
                  <p className="text-sm text-gray-600 mb-4">Arrastra o elige desde:</p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      📷 Foto
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      🖼️ Galería
                    </Button>
                  </div>
                </div>
              )}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Propósito de la marca</Label>
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Ej: Préstamo de coche Renault"
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-500 bg-green-50 border border-green-200 rounded">
                ¡Archivo procesado y descargado!
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !purpose.trim() || isUploading || isCompressing}
              className="w-full"
            >
              {isUploading ? 'Analizando imagen...' : 'Procesar y Descargar'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
