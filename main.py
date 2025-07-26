from fastapi import FastAPI
from app.database import engine, Base
import app.models
from app.routes.watermark import router as watermark_router
from app.routes.auth import router as auth_router

Base.metadata.create_all(bind=engine)
app = FastAPI()
app.include_router(auth_router)
app.include_router(watermark_router)