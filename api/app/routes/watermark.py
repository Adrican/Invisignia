from fastapi import APIRouter, UploadFile, Form, File, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Watermark, User
from app.routes.auth import get_current_user
from app.utils.dct_watermark import embed_watermark_memory, extract_watermark_memory, test_watermark_integrity_memory
import hashlib
import uuid
from typing import List

router = APIRouter()

@router.post("/upload/")
async def upload_file(
    file: UploadFile = File(...),
    purpose: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validar tipo de archivo
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")
    
    # Leer archivo en memoria
    image_data = await file.read()
    
    if len(image_data) == 0:
        raise HTTPException(status_code=400, detail="El archivo está vacío")
    
    # Generar hash único
    raw = purpose + uuid.uuid4().hex
    hash_id = hashlib.sha256(raw.encode()).hexdigest()
    
    print(f"TEST: Probando calidad de imagen antes de procesar...")
    
    # Probar integridad del algoritmo en memoria
    test_success = test_watermark_integrity_memory(image_data, hash_id)
    
    if not test_success:
        raise HTTPException(
            status_code=400, 
            detail="La imagen no tiene suficiente calidad para agregar una marca de agua invisible. "
                   "Intenta con una imagen de mayor resolución o menos comprimida."
        )
    
    print(f"OK: Test exitoso, procesando imagen en memoria...")
    
    try:
        # Procesar imagen en memoria
        marked_image_data = embed_watermark_memory(image_data, hash_id)
        
        # Guardar registro en base de datos
        wm = Watermark(user_id=current_user.id, hash_id=hash_id, purpose=purpose)
        db.add(wm)
        db.commit()
        
        # Determinar el tipo de contenido apropiado
        content_type = "image/png"  # Siempre devolvemos PNG para preservar calidad
        
        # Generar nombre de archivo sugerido
        original_name = file.filename or "image"
        name_parts = original_name.rsplit('.', 1)
        if len(name_parts) > 1:
            base_name = name_parts[0]
            suggested_filename = f"{base_name}_marked.png"
        else:
            suggested_filename = f"{original_name}_marked.png"
        
        # Retornar imagen directamente desde memoria
        return Response(
            content=marked_image_data,
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={suggested_filename}"
            }
        )
        
    except Exception as e:
        print(f"Error procesando imagen: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al procesar la imagen")

@router.post("/verify/")
async def verify_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validar tipo de archivo
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")
    
    # Leer archivo en memoria
    image_data = await file.read()
    
    if len(image_data) == 0:
        raise HTTPException(status_code=400, detail="El archivo está vacío")
    
    try:
        # Extraer marca de agua desde memoria
        hash_extracted = extract_watermark_memory(image_data, 256)
        
        # Buscar solo las marcas del usuario logueado
        record = db.query(Watermark).filter(
            Watermark.hash_id == hash_extracted,
            Watermark.user_id == current_user.id
        ).first()
        
        if not record:
            raise HTTPException(
                status_code=404, 
                detail="Ese documento no contiene una marca de agua válida o no pertenece al usuario"
            )
        
        return {
            "status": "found",
            "purpose": record.purpose,
            "created_at": record.created_at,
            "user_email": current_user.email
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"Error verificando imagen: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al verificar la imagen")

@router.get("/history/")
async def get_user_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener historial de marcas de agua del usuario"""
    watermarks = db.query(Watermark).filter(
        Watermark.user_id == current_user.id
    ).order_by(Watermark.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": wm.id,
            "purpose": wm.purpose,
            "created_at": wm.created_at,
            "hash_id": wm.hash_id[:16] + "..."  # Solo mostrar parte del hash por seguridad
        }
        for wm in watermarks
    ]

@router.post("/test/")
async def test_watermark_algorithm(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Endpoint para probar la integridad del algoritmo de watermark - SOLO EN MEMORIA"""
    
    # Validar tipo de archivo
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")
    
    # Leer archivo en memoria
    image_data = await file.read()
    
    if len(image_data) == 0:
        raise HTTPException(status_code=400, detail="El archivo está vacío")
    
    # Generar hash de prueba
    test_hash = hashlib.sha256(f"test_{uuid.uuid4().hex}".encode()).hexdigest()
    
    # Probar el algoritmo en memoria
    success = test_watermark_integrity_memory(image_data, test_hash)
    
    message = "OK: La imagen es compatible con el algoritmo" if success else "ERROR: La imagen no tiene suficiente calidad para marcas de agua invisibles" 
    
    return {
        "test_passed": success,
        "hash_used": test_hash,
        "message": message,
        "recommendation": "Prueba con una imagen de mayor resolución o menos comprimida" if not success else "Esta imagen funcionará perfectamente"
    }