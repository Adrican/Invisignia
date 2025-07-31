import cv2
import numpy as np
import hashlib
import io
from PIL import Image

def text_to_bits(hexstr, length=256):
    binary = bin(int(hexstr, 16))[2:].zfill(256)
    return [int(b) for b in binary[:length]]

def embed_watermark_memory(image_data: bytes, hash_hex: str) -> bytes:
    """Procesar imagen directamente en memoria sin guardar archivos"""
    # Convertir bytes a imagen OpenCV
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("No se pudo cargar la imagen")
    
    # Convertir RGB a YCrCb
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    Y = ycrcb[:,:,0].astype(np.float32)
    
    bits = text_to_bits(hash_hex, 256)
    rows, cols = Y.shape
    
    if rows < 128 or cols < 128:
        raise ValueError("La imagen es demasiado pequeña")
    
    # Meter marca en centro de la imagen
    start_row = rows // 4
    end_row = rows - rows // 4
    start_col = cols // 4
    end_col = cols - cols // 4
    
    bit_idx = 0
    positions = []
    
    # Espaciar marcas
    for i in range(start_row, end_row - 8, 20):  
        for j in range(start_col, end_col - 8, 20):
            if bit_idx >= len(bits):
                break
                
            block = Y[i:i+8, j:j+8]
            dct_block = cv2.dct(block)
            
            coeff_pos = (4, 4) 
            
            original_value = dct_block[coeff_pos]
            
            if bits[bit_idx]:
                if original_value >= 0:
                    dct_block[coeff_pos] = original_value + 50
                else:
                    dct_block[coeff_pos] = abs(original_value) + 50
            else:
                if original_value <= 0:
                    dct_block[coeff_pos] = original_value - 50
                else:
                    dct_block[coeff_pos] = -abs(original_value) - 50
            
            idct_block = cv2.idct(dct_block)
            Y[i:i+8, j:j+8] = np.clip(idct_block, 0, 255)
            
            positions.append((i, j))
            bit_idx += 1
            
        if bit_idx >= len(bits):
            break
    
    print(f"Bits embebidos: {bit_idx}/{len(bits)}")
    
    ycrcb[:,:,0] = Y.astype(np.uint8)
    marked_img = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
    
    # Convertir imagen procesada de vuelta a bytes
    success, encoded_img = cv2.imencode('.png', marked_img)
    if not success:
        raise ValueError("Error al codificar la imagen procesada")
    
    return encoded_img.tobytes()

def extract_watermark_memory(image_data: bytes, length=256) -> str:
    """Extraer marca de agua directamente de datos en memoria"""
    # Convertir bytes a imagen OpenCV
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("No se pudo cargar la imagen")
    
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    Y = ycrcb[:,:,0].astype(np.float32)
    
    rows, cols = Y.shape
    
    start_row = rows // 4
    end_row = rows - rows // 4
    start_col = cols // 4
    end_col = cols - cols // 4
    
    bits = []
    
    for i in range(start_row, end_row - 8, 20):  
        for j in range(start_col, end_col - 8, 20):
            if len(bits) >= length:
                break
                
            block = Y[i:i+8, j:j+8]
            dct_block = cv2.dct(block)
            
            coeff_pos = (4, 4)
            coeff_value = dct_block[coeff_pos]
            
            bit_value = 1 if coeff_value > 25 else 0
            bits.append(bit_value)
            
        if len(bits) >= length:
            break
    
    print(f"Bits extraídos: {len(bits)}/{length}")
    
    while len(bits) < length:
        bits.append(0)
    
    bitstring = "".join(str(b) for b in bits[:length])
    try:
        intval = int(bitstring, 2)
        hexstr = hex(intval)[2:].zfill(64)
        return hexstr
    except ValueError:
        return "0" * 64

def test_watermark_integrity_memory(image_data: bytes, hash_hex: str) -> bool:
    """Función para probar que el watermark funciona correctamente - solo en memoria"""
    print("TEST: Testeando integridad del watermark en memoria...")
    
    try:
        # Verificar que la imagen se puede cargar
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            print("ERROR: No se pudo cargar la imagen")
            return False
        
        # Verificar tamaño mínimo
        height, width = img.shape[:2]
        if height < 128 or width < 128:
            print(f"ERROR: Imagen demasiado pequeña: {width}x{height} (mínimo 128x128)")
            return False
        
        # Procesar imagen con marca en memoria
        marked_data = embed_watermark_memory(image_data, hash_hex)
        
        # Extraer inmediatamente
        extracted = extract_watermark_memory(marked_data)
        
        success = hash_hex == extracted
        
        print(f"Hash original: {hash_hex[:16]}...")
        print(f"Hash extraído: {extracted[:16]}...")
        print(f"¿Coinciden?: {'OK: SI' if success else 'ERROR: NO'}")
        
        return success
        
    except Exception as e:
        print(f"ERROR: Error en test: {str(e)}")
        return False


def create_debug_image(input_path, output_path):
    """Crear imagen para ver donde están las marcas - SOLO PARA DEBUG"""
    print("WARNING: Función de debug que crea archivos")
    img = cv2.imread(input_path)
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    Y = ycrcb[:,:,0].astype(np.float32)
    
    rows, cols = Y.shape
    start_row = rows // 4
    end_row = rows - rows // 4
    start_col = cols // 4
    end_col = cols - cols // 4
    
    debug_img = img.copy()
    
    for i in range(start_row, end_row - 8, 20):
        for j in range(start_col, end_col - 8, 20):
            cv2.rectangle(debug_img, (j, i), (j+8, i+8), (0, 255, 0), 1)
    
    cv2.imwrite(output_path, debug_img)


# Función para comparar imágenes
def compare_images(original_path, marked_path, output_path):
    """Genera una imagen de diferencias para ver qué tanto cambió"""
    original = cv2.imread(original_path)
    marked = cv2.imread(marked_path)
    
    if original is None or marked is None:
        print("Error al cargar las imágenes")
        return
    
    diff = cv2.absdiff(original, marked)
    
    diff_enhanced = cv2.multiply(diff, 10)
    
    cv2.imwrite(output_path, diff_enhanced)
    print(f"Imagen de diferencias guardada en: {output_path}")