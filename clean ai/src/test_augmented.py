
from pathlib import Path
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "results" / "clean_ai_augmented" / "weights" / "best.pt"

model = YOLO(str(MODEL_PATH))

image_path = input("Enter the full path of a new washroom image: ").strip().strip('"')

if not Path(image_path).is_file():
    raise FileNotFoundError(f"Image not found: {image_path}")

results = model.predict(
    source=image_path,
    imgsz=320,
    conf=0.60,
    device="cpu",
    save=True
)

for result in results:
    if result.boxes is None or len(result.boxes) == 0:
        print("No objects detected.")
        continue

    print("\nDetected objects:")
    for box in result.boxes:
        class_id = int(box.cls[0].item())
        confidence = float(box.conf[0].item())
        print(f"{model.names[class_id]}: {confidence:.1%} confidence")

print("\nAnnotated image saved in the YOLO runs/detect output folder.")
