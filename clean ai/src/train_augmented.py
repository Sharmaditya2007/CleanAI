
from pathlib import Path
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent.parent

DATA = ROOT / "dataset" / "combined_v2" / "data.yaml"
PROJECT = ROOT / "results"
MODEL = "yolo11n.pt"

if not DATA.exists():
    raise FileNotFoundError(f"Dataset configuration not found: {DATA}")

print("Loading pretrained YOLO model...")
model = YOLO(MODEL)

print("Training the updated Clean AI model...")

model.train(
    data=str(DATA),
    epochs=20,
    imgsz=320,
    batch=4,
    device="cpu",
    workers=0,
    project=str(PROJECT),
    name="clean_ai_floor_v2",
    exist_ok=False,
    patience=7
)

print("\nTraining finished!")
print("Check:")
print(PROJECT / "clean_ai_augmented" / "weights" / "best.pt")
