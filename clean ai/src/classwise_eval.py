from pathlib import Path
from ultralytics import YOLO

root = Path(__file__).resolve().parent.parent
model = YOLO(str(root / "results/clean_ai_augmented/weights/best.pt"))

metrics = model.val(
    data=str(root / "dataset/combined_v1/data.yaml"),
    split="val",
    imgsz=320,
    batch=4,
    device="cpu",
    workers=0,
    plots=False,
    verbose=False,
)

print("\nCLASS-WISE VALIDATION RESULTS")
print("-" * 60)

for i, name in metrics.names.items():
    if i >= len(metrics.box.p):
        print(f"{name:28} Metrics unavailable")
        continue

    print(
        f"{name:28} "
        f"Precision={metrics.box.p[i]:.3f}  "
        f"Recall={metrics.box.r[i]:.3f}  "
        f"mAP50={metrics.box.maps[i]:.3f}"
    )
