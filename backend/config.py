import os
from pathlib import Path
try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

try:
    from pydantic_settings import BaseSettings
except ImportError:
    class BaseSettings:
        pass

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
CLEAN_AI_DIR = PROJECT_ROOT / "clean ai"

# Load environment configuration from .env if available
if load_dotenv:
    if (BACKEND_DIR / ".env").exists():
        load_dotenv(BACKEND_DIR / ".env")
    elif (PROJECT_ROOT / ".env").exists():
        load_dotenv(PROJECT_ROOT / ".env")

# Auto-discover model path, prioritizing clean_ai_floor_v2, then clean_ai_augmented, then clean_ai_yolo
CANDIDATE_MODEL_PATHS = [
    CLEAN_AI_DIR / "results" / "clean_ai_floor_v2" / "weights" / "best.pt",
    PROJECT_ROOT / "results" / "clean_ai_floor_v2" / "weights" / "best.pt",
    BACKEND_DIR / "models" / "best.pt",
    Path("clean ai/results/clean_ai_floor_v2/weights/best.pt").resolve(),
    Path("../clean ai/results/clean_ai_floor_v2/weights/best.pt").resolve(),
    CLEAN_AI_DIR / "results" / "clean_ai_augmented" / "weights" / "best.pt",
    CLEAN_AI_DIR / "results" / "clean_ai_yolo" / "weights" / "best.pt",
    CLEAN_AI_DIR / "yolo11n.pt",
]

DEFAULT_MODEL_PATH = None
for p in CANDIDATE_MODEL_PATHS:
    if p.exists():
        DEFAULT_MODEL_PATH = str(p)
        break

if not DEFAULT_MODEL_PATH:
    DEFAULT_MODEL_PATH = str(CANDIDATE_MODEL_PATHS[0])

# Class names discovered from dataset configuration and training runs
CLASSES = [
    "clean_basin",
    "clean_floor",
    "clean_indian",
    "clean_urinal",
    "clean_western",
    "damage",
    "dirty_basin",
    "dirty_floor",
    "dirty_indian",
    "dirty_urinal",
    "dirty_western",
    "garbage",
    "partial_dirty_floor",
    "partial_dirty_indian",
    "partial_dirty_urinal",
    "partial_dirty_western"
]

DIRTY_CLASSES = {
    "damage",
    "dirty_basin",
    "dirty_floor",
    "dirty_indian",
    "dirty_urinal",
    "dirty_western",
    "garbage",
    "partial_dirty_floor",
    "partial_dirty_indian",
    "partial_dirty_urinal",
    "partial_dirty_western",
}

CLEAN_CLASSES = {
    "clean_basin",
    "clean_floor",
    "clean_indian",
    "clean_urinal",
    "clean_western",
}

class Settings:
    PROJECT_NAME: str = "Clean AI — Public Toilet Cleanliness Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment variables
    CLEAN_AI_DIR: Path = CLEAN_AI_DIR
    MODEL_PATH: str = os.getenv("CLEAN_AI_MODEL_PATH", "").strip() or DEFAULT_MODEL_PATH
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "clean_ai_database")
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "clean-ai-production-super-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Uploads & Storage
    STORAGE_DIR: Path = BACKEND_DIR / "storage"
    UPLOADS_DIR: Path = BACKEND_DIR / "storage" / "uploads"
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "15"))
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".webp"}
    
    # Model inference settings
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.25"))
    IMAGE_SIZE: int = int(os.getenv("MODEL_IMAGE_SIZE", "320"))
    
    # Verification and staleness
    STALE_DAYS_THRESHOLD: int = int(os.getenv("STALE_DAYS_THRESHOLD", "3"))

settings = Settings()

# Ensure storage directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
