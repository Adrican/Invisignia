import cv2
import numpy as np
import hashlib

def text_to_bits(hexstr, length=256):
    binary = bin(int(hexstr, 16))[2:].zfill(256)
    return [int(b) for b in binary[:length]]

def embed_watermark(input_path, output_path, hash_hex):
    img = cv2.imread(input_path)
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    Y, Cr, Cb = cv2.split(ycrcb)
    bits = text_to_bits(hash_hex)
    idx = 0
    rows, cols = Y.shape
    for i in range(0, rows - 8, 8):
        for j in range(0, cols - 8, 8):
            if idx >= len(bits):
                break
            block = Y[i:i+8, j:j+8].astype(float)
            dct_block = cv2.dct(block)
            dct_block[4,4] += 20 if bits[idx] else -20
            idct_block = cv2.idct(dct_block)
            Y[i:i+8, j:j+8] = np.clip(idct_block, 0, 255)
            idx += 1
        if idx >= len(bits):
            break
    marked = cv2.cvtColor(cv2.merge([Y, Cr, Cb]), cv2.COLOR_YCrCb2BGR)
    cv2.imwrite(output_path, marked)

def extract_watermark(input_path, length=256):
    img = cv2.imread(input_path)
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    Y = ycrcb[:,:,0]
    bits = []
    rows, cols = Y.shape
    for i in range(0, rows - 8, 8):
        for j in range(0, cols - 8, 8):
            if len(bits) >= length:
                break
            block = Y[i:i+8, j:j+8].astype(float)
            dct_block = cv2.dct(block)
            bits.append(1 if dct_block[4,4] > 0 else 0)
        if len(bits) >= length:
            break
    bitstring = "".join(str(b) for b in bits)
    intval = int(bitstring, 2)
    hexstr = hex(intval)[2:].rjust(64, '0')
    return hexstr
