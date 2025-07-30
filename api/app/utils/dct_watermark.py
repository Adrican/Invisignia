import cv2
import numpy as np
import hashlib

def text_to_bits(hexstr, length=256):
    binary = bin(int(hexstr, 16))[2:].zfill(256)
    return [int(b) for b in binary[:length]]

def embed_watermark(input_path, output_path, hash_hex):
    img = cv2.imread(input_path)
    if img is None:
        raise ValueError("No se pudo cargar la imagen")
    
    # convertir rgb a YCrCb
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    Y = ycrcb[:,:,0].astype(np.float32)
    
    bits = text_to_bits(hash_hex, 256)
    rows, cols = Y.shape
    

    if rows < 128 or cols < 128:
        raise ValueError("La imagen es demasiado pequeña")
    
    # meter marca en centro de la imagen
    start_row = rows // 4
    end_row = rows - rows // 4
    start_col = cols // 4
    end_col = cols - cols // 4
    
    bit_idx = 0
    positions = []
    
    # espaciar marcas
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
    cv2.imwrite(output_path, marked_img)
    
    return positions

def extract_watermark(input_path, length=256):
    img = cv2.imread(input_path)
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


def create_debug_image(input_path, output_path):
    """Crear imagen para ver donde estan las marcas"""
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

# funcion para testear la marca de agua en las imagenes antes de hacer el proceso.
def test_watermark_integrity(input_path, hash_hex):
    """Función para probar que el watermark funciona correctamente"""
    print("Testeando integridad del watermark...")
    
    # crear imagen temporal con marca
    temp_marked = input_path.replace('.', '_temp_marked.')
    embed_watermark(input_path, temp_marked, hash_hex)
    
    # extraer inmediatamente
    extracted = extract_watermark(temp_marked)
    
    print(f"Hash original: {hash_hex}")
    print(f"Hash extraído: {extracted}")
    print(f"¿Coinciden?: {'SÍ' if hash_hex == extracted else 'NO'}")
    
    return hash_hex == extracted


# Función para comparar imágenes visualmente
def compare_images(original_path, marked_path, output_path):
    """Genera una imagen de diferencias para ver qué tanto cambió"""
    original = cv2.imread(original_path)
    marked = cv2.imread(marked_path)
    
    if original is None or marked is None:
        print("Error al cargar las imágenes")
        return
    
    # Calcular diferencia absoluta
    diff = cv2.absdiff(original, marked)
    
    # Amplificar las diferencias para hacerlas más visibles
    diff_enhanced = cv2.multiply(diff, 10)
    
    cv2.imwrite(output_path, diff_enhanced)
    print(f"Imagen de diferencias guardada en: {output_path}")