from fastapi import FastAPI
from app.database import engine, Base
import app.models
from app.routes.watermark import router as watermark_router

Base.metadata.create_all(bind=engine)
app = FastAPI()
app.include_router(watermark_router)