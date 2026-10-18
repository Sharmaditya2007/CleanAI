
from pathlib import Path
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent.parent

model_path = (
    ROOT / "results" / "clean_ai_yolo" / "weights" / "best.pt"
)
data_path = ROOT / "dataset" / "yolo" / "data.yaml"

model = YOLO(str(model_path))

print("Evaluating Clean AI on unseen test images...")

metrics = model.val(
    data=str(data_path),
    split="test",
    imgsz=320,
    batch=4,
    device="cpu",
    workers=0,
    plots=True
)

print("\n--- Test Results ---")
print("mAP50:", metrics.box.map50)
print("mAP50-95:", metrics.box.map)
print("Precision:", metrics.box.mp)
print("Recall:", metrics.box.mr)

print("\nEvaluation completed.")
