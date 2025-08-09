'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  
  // ← Nuevos estados para progreso detallado
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');

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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
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

    if (purpose.length > 255) {
      setError('El propósito no puede superar los 255 caracteres');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Etapa 1: Validando imagen
      setUploadStage('Validando imagen...');
      setUploadProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500)); // simulamos delay

      // Etapa 2: Analizando calidad
      setUploadStage('Analizando calidad de imagen...');
      setUploadProgress(40);
      await new Promise(resolve => setTimeout(resolve, 700));

      // Etapa 3: Procesando marca de agua
      setUploadStage('Incrustando marca de agua invisible...');
      setUploadProgress(60);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUploadStage('Preparando descarga...');
      setUploadProgress(90);

      const blob = await apiClient.uploadWatermark(selectedFile, purpose, user.token);
      
      // Etapa 4: Finalizando

      
      const originalName = originalFile?.name || selectedFile.name;
      const parts = originalName.split('.');
      const ext = parts.pop();
      const base = parts.join('.');
      const markedName = `${base}_ivsgn.${ext}`;
      
      downloadFile(blob, markedName);
      
      setUploadProgress(100);
      setUploadStage('¡Completado!');
      setSuccess(true);
      
      // Reset form
      setSelectedFile(null);
      setOriginalFile(null);
      setPurpose('');
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      
    } catch (err) {
      setUploadProgress(0);
      setUploadStage('');
      
      let errorMessage = 'Error al procesar el archivo';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        if (errorMessage.includes('La imagen no tiene suficiente calidad')) {
          errorMessage = 'La imagen no tiene suficiente calidad para agregar una marca de agua invisible. Intenta con una imagen de mayor resolución o menos comprimida.';
        }
      }
      
      if (errorMessage.includes('no tiene suficiente calidad')) {
        setError(`❌ ${errorMessage}\n\n💡 Sugerencias:\n• Usa una imagen de mayor resolución\n• Evita imágenes muy comprimidas\n• Prueba con formato PNG en lugar de JPG`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStage('');
      }, 2000); // Mantener progreso visible 2 segundos después de completar
    }
  };
  

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

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
              <h1 className="text-xl font-semibold">Proteger Archivo</h1>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Marcar Archivo</span>
          </CardTitle>
          <CardDescription className="space-y-2">
            <p className="text-base">
              Añade una marca de agua <strong>invisible</strong>
            </p>
            <div className="flex items-start space-x-2 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div>
                <p className="font-medium text-blue-800">Procesamiento 100% local</p>
                <p className="text-blue-700">
                  Tu imagen se procesa pero no se almacena. 
                  Solo guardamos un identificador único para verificación posterior.
                </p>
              </div>
            </div>
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
                <p className="font-medium text-green-700 truncate break-all" title={originalFile?.name}>
                  {truncateFileName(originalFile?.name || '')}
                </p>
                <p className="text-xs text-green-600">
                  {formatFileSize(originalFile!.size)} → {formatFileSize(selectedFile.size)}
                </p>
                <div className="mt-4 flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                    className="lg:hidden"
                  >
                    📷 Cambiar foto
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    🖼️ Cambiar archivo
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-gray-400 text-4xl mb-2">📤</div>
                <p className="text-sm text-gray-600 mb-4">
                  <span className="hidden lg:inline">Arrastra o elige desde:</span>
                  <span className="lg:hidden">Elige una imagen:</span>
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    className="lg:hidden"
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
                <p className="text-xs text-gray-500 mt-3 lg:hidden">
                  Toca "Foto" para usar la cámara
                </p>
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

          {/* Purpose Input */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Propósito de la marca de agua</Label>
            <Input
              id="purpose"
              placeholder="Ej: Propiedad de Juan Pérez, Documento confidencial, etc."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className={error && !purpose ? 'border-red-500' : ''}
              disabled={isUploading}
              maxLength={255}
            />
            <div className="flex justify-between">
              <p className="text-xs text-gray-500">
                Este texto se incrustará de forma invisible en la imagen
              </p>
              <span className="text-xs text-gray-400">
                {purpose.length}/255
              </span>
            </div>
          </div>

          {/* Progress Section*/}
          {isUploading && (
            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium text-blue-800">{uploadStage}</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <div className="flex justify-between text-xs text-blue-600">
                <span>Procesando...</span>
                <span>{uploadProgress}%</span>
              </div>
            </div>
          )}

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
            disabled={!selectedFile || !purpose.trim() || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Procesando...</span>
              </div>
            ) : (
              'Procesar y Descargar'
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            <p>Formatos soportados: JPG, PNG, BMP</p>
            <p>El sistema verificará automáticamente la calidad de la imagen</p>
          </div>
        </CardContent>
      </Card>
      </main>
    </div>
  );
}
