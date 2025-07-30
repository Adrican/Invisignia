from fastapi import APIRouter, UploadFile, Form, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Watermark, User
from app.routes.auth import get_current_user  # cogemos usuario logueado
from app.utils.dct_watermark import embed_watermark, extract_watermark
import shutil
import os
import hashlib
import uuid

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/")
async def upload_file(
    file: UploadFile = File(...),
    purpose: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    temp_name = f"{uuid.uuid4().hex}_{file.filename}"
    temp_path = os.path.join(UPLOAD_DIR, temp_name)
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    output_name = temp_name.replace(".", "_marked.")
    output_path = os.path.join(UPLOAD_DIR, output_name)
    raw = purpose + uuid.uuid4().hex
    hash_id = hashlib.sha256(raw.encode()).hexdigest()
    embed_watermark(temp_path, output_path, hash_id)
    # usamos usuario logueado
    wm = Watermark(user_id=current_user.id, hash_id=hash_id, purpose=purpose)
    db.add(wm)
    db.commit()
    return FileResponse(output_path, media_type="application/octet-stream", filename=output_name)


@router.post("/verify/")
async def verify_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),  # usuario logueado solo
    db: Session = Depends(get_db)
):
    temp_name = f"verify_{uuid.uuid4().hex}_{file.filename}"
    temp_path = os.path.join(UPLOAD_DIR, temp_name)
    with open(temp_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    hash_extracted = extract_watermark(temp_path, 256)  # Cambiar a 256
    
    # Buscar solo las marcas del usuario logueado
    record = db.query(Watermark).filter(
        Watermark.hash_id == hash_extracted,
        Watermark.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Ese documento no contiene una marca de agua válida o no pertenece al usuario")
    
    return {
        "status": "found",
        "purpose": record.purpose,
        "created_at": record.created_at,
        "user_email": current_user.email  # opcional por ahora
    }

@router.get("/history/")
async def get_user_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Obtener historial de marcas de agua del usuario"""
    watermarks = db.query(Watermark).filter(
        Watermark.user_id == current_user.id
    ).order_by(Watermark.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": w.id,
            "purpose": w.purpose,
            "created_at": w.created_at.isoformat(),
            "hash_id": w.hash_id
        }
        for w in watermarks
    ]

@router.post("/debug/")
async def create_debug_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Endpoint para crear imagen de debug que muestra visualmente las marcas"""
    temp_name = f"debug_{uuid.uuid4().hex}_{file.filename}"
    temp_path = os.path.join(UPLOAD_DIR, temp_name)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    debug_name = temp_name.replace(".", "_debug.")
    debug_path = os.path.join(UPLOAD_DIR, debug_name)
    
    from app.utils.dct_watermark import create_debug_image
    create_debug_image(temp_path, debug_path)
    
    return FileResponse(debug_path, media_type="application/octet-stream", filename=debug_name)

@router.post("/test/")
async def test_watermark_algorithm(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Endpoint para probar la integridad del algoritmo de watermark"""
    temp_name = f"test_{uuid.uuid4().hex}_{file.filename}"
    temp_path = os.path.join(UPLOAD_DIR, temp_name)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    test_hash = hashlib.sha256(f"test_{uuid.uuid4().hex}".encode()).hexdigest()
    
    from app.utils.dct_watermark import test_watermark_integrity
    success = test_watermark_integrity(temp_path, test_hash)
    
    try:
        os.remove(temp_path)
        temp_marked = temp_path.replace('.', '_temp_marked.')
        if os.path.exists(temp_marked):
            os.remove(temp_marked)
    except:
        pass
    
    return {
        "test_passed": success,
        "hash_used": test_hash,
        "message": "✅ Algoritmo funcionando correctamente" if success else "❌ Error en el algoritmo"
    }