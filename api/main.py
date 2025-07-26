from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models
from app.routes.watermark import router as watermark_router
from app.routes.auth import router as auth_router

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Invisignia API", version="1.0.0")

# configuramos CORS para solicitudes desde web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # direccion de la web
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(watermark_router)

@app.get("/")
def read_root():
    return {"message": "Invisignia API is running"}