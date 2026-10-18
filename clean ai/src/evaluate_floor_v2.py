
from pathlib import Path
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    ROOT / "results" / "clean_ai_floor_v2" / "weights" / "best.pt"
)

# Use the original untouched dataset and test split.
DATA_PATH = ROOT / "dataset" / "yolo" / "data.yaml"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

if not DATA_PATH.exists():
    raise FileNotFoundError(f"Dataset config not found: {DATA_PATH}")

model = YOLO(str(MODEL_PATH))

print("Evaluating clean_ai_floor_v2 on the original test set...")
print("Focus: dirty_floor, dirty_indian, and dirty_western")

metrics = model.val(
    data=str(DATA_PATH),
    split="test",
    imgsz=320,
    batch=4,
    device="cpu",
    workers=0,
    plots=True,
    project=str(ROOT / "results"),
    name="clean_ai_floor_v2_evaluation",
    exist_ok=True,
)

print("\n--- New Model Test Results ---")
print(f"Precision: {metrics.box.mp:.4f}")
print(f"Recall:    {metrics.box.mr:.4f}")
print(f"mAP50:     {metrics.box.map50:.4f}")
print(f"mAP50-95:  {metrics.box.map:.4f}")

print("\n--- Target Class Results ---")
class_names = model.names

for class_id, class_name in class_names.items():
    if class_name in (
        "dirty_floor",
        "dirty_indian",
        "dirty_western",
    ):
        print(
            f"{class_name}: "
            f"mAP50={metrics.box.ap50[class_id]:.4f}, "
            f"mAP50-95={metrics.box.maps[class_id]:.4f}"
        )

print("\nEvaluation complete!")
print(f"Results folder: {ROOT / 'results' / 'clean_ai_floor_v2_evaluation'}")
