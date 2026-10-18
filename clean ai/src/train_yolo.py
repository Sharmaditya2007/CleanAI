
from pathlib import Path
from ultralytics import YOLO

# Find the main project folder
ROOT = Path(__file__).resolve().parent.parent

# Find the dataset configuration file
DATA = ROOT / "dataset" / "yolo" / "data.yaml"

# Check that the dataset configuration exists
if not DATA.exists():
    raise FileNotFoundError(f"Dataset configuration not found: {DATA}")

print("Loading pretrained YOLO model...")

# Load a small pretrained model
model = YOLO("yolo11n.pt")

print("Starting Clean AI model training...")

# Train the model using your dataset
model.train(
    data=str(DATA),
    epochs=10,
    imgsz=320,
    batch=4,
    device="cpu",
    workers=0,
    project=str(ROOT / "results"),
    name="clean_ai_yolo",
    exist_ok=True,
    patience=5
)

print("\nTraining completed!")
print("Check results/clean_ai_yolo/weights/best.pt")
