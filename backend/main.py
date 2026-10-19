import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from config import settings
from database.db import db_manager
from ai.inference import model_service
from routers import auth, toilets, inspections, complaints, tasks, analytics, notifications

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("clean_ai.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Clean AI Backend Server...")
    logger.info(f"Target Model Path: {settings.MODEL_PATH}")
    logger.info(f"Model Loaded: {model_service.is_loaded} (Classes: {len(model_service.classes_mapping)})")
    
    # Initialize DB connection (attempts MongoDB, falls back gracefully to persistent local store)
    await db_manager.connect_mongo()
    
    yield
    # Shutdown
    if db_manager.client:
        db_manager.client.close()
    logger.info("Clean AI Backend Server shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smarter Toilets. Cleaner Cities. — Municipal AI Sanitation Monitoring Platform",
    lifespan=lifespan
)

# CORS configuration - Allow all web origins (Vercel, Render, local dev, preview URLs)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*$",
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://cleanai-6pwl.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for photo previews
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(settings.UPLOADS_DIR)), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(toilets.router, prefix=settings.API_V1_STR)
app.include_router(inspections.router, prefix=settings.API_V1_STR)
app.include_router(complaints.router, prefix=settings.API_V1_STR)
app.include_router(tasks.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)

@app.get("/api/health", tags=["Health"])
async def health_check():
    """System and Model Health Check endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model": {
            "loaded": model_service.is_loaded,
            "path": str(model_service.model_path),
            "filename": model_service.model_name,
            "framework": model_service.framework,
            "classes_count": len(model_service.classes_mapping),
            "classes": model_service.classes_mapping,
            "load_error": model_service.load_error
        },
        "database": {
            "type": "MongoDB Atlas / Local" if db_manager.is_mongo_connected else "SQLite & JSON Persistent Store",
            "connected": db_manager.is_mongo_connected,
            "database_name": settings.MONGODB_DB_NAME,
            "sqlite_file": "backend/data/clean_ai.db",
            "json_store": "backend/data/db_store.json",
            "users_count": await db_manager.count_documents("users"),
            "toilets_count": await db_manager.count_documents("toilets")
        }
    }

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to Clean AI — Smarter Toilets. Cleaner Cities.",
        "api_docs": "/docs",
        "health_check": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
