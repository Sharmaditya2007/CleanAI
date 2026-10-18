
from pathlib import Path
import random
import shutil

# Original dataset
SOURCE = Path(
    r"C:\Users\anupr\Downloads\saafaiimg.v1i.yolov9"
)

# Destination inside Clean AI project
DEST = Path(__file__).resolve().parent.parent / "dataset" / "yolo"

random.seed(42)

image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

source_images = SOURCE / "train" / "images"
source_labels = SOURCE / "train" / "labels"

if not source_images.exists() or not source_labels.exists():
    raise FileNotFoundError("Training images or labels folder not found.")

images = [
    p for p in source_images.iterdir()
    if p.is_file() and p.suffix.lower() in image_extensions
]

if not images:
    raise ValueError("No images found.")

# Match each image with its label
pairs = []
missing_labels = []

for image_path in images:
    label_path = source_labels / f"{image_path.stem}.txt"

    if label_path.exists():
        pairs.append((image_path, label_path))
    else:
        missing_labels.append(image_path.name)

if missing_labels:
    print("Images missing labels:", len(missing_labels))
    print("Examples:", missing_labels[:10])

if len(pairs) < 10:
    raise ValueError("Not enough labeled images to split.")

random.shuffle(pairs)

total = len(pairs)
train_end = int(total * 0.8)
val_end = int(total * 0.9)

splits = {
    "train": pairs[:train_end],
    "valid": pairs[train_end:val_end],
    "test": pairs[val_end:],
}

# Refuse to overwrite an existing prepared dataset
if DEST.exists() and any(DEST.iterdir()):
    raise FileExistsError(
        f"{DEST} already contains files. "
        "Rename or inspect that folder before running again."
    )

for split_name, split_pairs in splits.items():
    image_dir = DEST / split_name / "images"
    label_dir = DEST / split_name / "labels"

    image_dir.mkdir(parents=True, exist_ok=True)
    label_dir.mkdir(parents=True, exist_ok=True)

    for image_path, label_path in split_pairs:
        shutil.copy2(image_path, image_dir / image_path.name)
        shutil.copy2(label_path, label_dir / label_path.name)

    print(f"{split_name}: {len(split_pairs)} image-label pairs")

print("\nDataset preparation completed.")
print("Prepared dataset:", DEST)
print("Original files were not modified.")
