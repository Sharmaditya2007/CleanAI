
from pathlib import Path
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent.parent

MODEL_PATH = ROOT / "results" / "clean_ai_yolo" / "weights" / "best.pt"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

# Load your trained Clean AI model
model = YOLO(str(MODEL_PATH))

# Display the 16 classes learned by the model
print("Clean AI model loaded successfully!")
print("\nClasses:")
for class_id, class_name in model.names.items():
    print(f"{class_id}: {class_name}")

# Ask for the image to test
image_path = input("\nEnter the full path of a toilet image: ").strip().strip('"')

if not Path(image_path).is_file():
    raise FileNotFoundError(f"Image not found: {image_path}")

# Predict objects and save the result image
results = model.predict(
    source=image_path,
    imgsz=320,
    conf=0.25,
    device="cpu",
    save=True
)

# Print detected objects
for result in results:
    if result.boxes is None or len(result.boxes) == 0:
        print("\nNo objects detected.")
    else:
        print("\nDetected objects:")
        for box in result.boxes:
            class_id = int(box.cls[0].item())
            confidence = float(box.conf[0].item())
            print(
                f"{model.names[class_id]} "
                f"({confidence:.1%} confidence)"
            )

print("\nPrediction image saved by YOLO in the runs/detect folder.")
