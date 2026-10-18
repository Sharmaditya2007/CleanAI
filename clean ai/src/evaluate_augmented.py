
from pathlib import Path
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    ROOT / "results" / "clean_ai_augmented" / "weights" / "best.pt"
)
DATA_PATH = ROOT / "dataset" / "combined_v1" / "data.yaml"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))

print("Evaluating the updated Clean AI model on the test set...")

metrics = model.val(
    data=str(DATA_PATH),
    split="test",
    imgsz=320,
    batch=4,
    device="cpu",
    workers=0,
    plots=True,
    project=str(ROOT / "results"),
    name="clean_ai_augmented_evaluation",
    exist_ok=True
)

print("\n--- Updated Model Test Results ---")
print(f"Precision: {metrics.box.mp:.4f}")
print(f"Recall:    {metrics.box.mr:.4f}")
print(f"mAP50:     {metrics.box.map50:.4f}")
print(f"mAP50-95:  {metrics.box.map:.4f}")

print("\nEvaluation complete!")
