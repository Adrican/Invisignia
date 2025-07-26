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
    hash_extracted = extract_watermark(temp_path)
    
    # Buscar solo las marcas del usuario logueado
    record = db.query(Watermark).filter(
        Watermark.hash_id == hash_extracted,
        Watermark.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Documento no encontrado en tus registros")
    
    return {
        "status": "found",
        "purpose": record.purpose,
        "created_at": record.created_at,
        "user_email": current_user.email  # opcional por ahora
    }
