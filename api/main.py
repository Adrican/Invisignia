from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models
from app.routes.watermark import router as watermark_router
from app.routes.auth import router as auth_router
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Invisignia API", version="1.0.0")

environment = os.getenv("ENVIRONMENT", "development")

if environment == "production":
    allowed_origins = [
        "https://invisignia.com",
        "https://www.invisignia.com",
        "https://app.invisignia.com",
        "https://invisignia.vercel.app",
    ]
else:
    # Desarrollo
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"  # Solo en desarrollo
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(watermark_router)

@app.get("/")
def read_root():
    return {
        "message": "Invisignia API is running",
        "environment": environment,
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}