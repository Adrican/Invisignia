export interface CompressionOptions {
  maxSizeKB: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  minQuality?: number;
}

export async function compressImage(
  file: File, 
  options: CompressionOptions = { maxSizeKB: 750, minQuality: 0.7 }
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      const maxWidth = options.maxWidth || 1920;
      const maxHeight = options.maxHeight || 1080;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      let quality = options.quality || 0.9;
      const minQuality = options.minQuality || 0.7;
      const targetSizeBytes = options.maxSizeKB * 1024;
      
      const compress = () => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Error al comprimir la imagen'));
            return;
          }
          
          if (blob.size <= targetSizeBytes || quality <= minQuality) {
            const compressedFile = new File([blob], file.name, {
              type: quality > 0.8 ? 'image/png' : 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            quality -= 0.05;
            compress();
          }
        }, quality > 0.8 ? 'image/png' : 'image/jpeg', quality);
      };
      
      compress();
    };
    
    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = URL.createObjectURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}