
from pathlib import Path
import shutil
import yaml

ROOT = Path(__file__).resolve().parent.parent

ORIGINAL = ROOT / "dataset" / "yolo"
EXTRA = ROOT / "dataset" / "augmented" / "train"
OUTPUT = ROOT / "dataset" / "combined_v2"

CLASS_NAMES = [
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
    "partial_dirty_western",
]

if OUTPUT.exists():
    raise FileExistsError(
        f"{OUTPUT} already exists. Do not overwrite it."
    )

if not EXTRA.is_dir():
    raise FileNotFoundError(f"Missing folder: {EXTRA}")

# Copy original train, validation, and test data unchanged.
for split in ("train", "valid", "test"):
    for kind in ("images", "labels"):
        source = ORIGINAL / split / kind
        destination = OUTPUT / split / kind

        if not source.is_dir():
            raise FileNotFoundError(f"Missing folder: {source}")

        destination.mkdir(parents=True, exist_ok=True)

        for file in source.iterdir():
            if file.is_file():
                shutil.copy2(file, destination / file.name)

# Add only the correctly converted extra floor images.
extra_images = EXTRA / "images"
extra_labels = EXTRA / "labels"
added = 0

for image in extra_images.iterdir():
    if not image.is_file():
        continue

    label = extra_labels / f"{image.stem}.txt"

    if not label.is_file():
        print(f"Skipping missing label: {image.name}")
        continue

    lines = [
        line.strip()
        for line in label.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]

    # Every added annotation must be class 7: dirty_floor.
    if not lines or any(
        line.split()[0] != "7" for line in lines
    ):
        print(f"Skipping unexpected labels: {image.name}")
        continue

    target_image = OUTPUT / "train" / "images" / image.name
    target_label = OUTPUT / "train" / "labels" / label.name

    if target_image.exists() or target_label.exists():
        print(f"Skipping filename conflict: {image.name}")
        continue

    shutil.copy2(image, target_image)
    shutil.copy2(label, target_label)
    added += 1

config = {
    "path": str(OUTPUT).replace("\\", "/"),
    "train": "train/images",
    "val": "valid/images",
    "test": "test/images",
    "nc": len(CLASS_NAMES),
    "names": {i: name for i, name in enumerate(CLASS_NAMES)},
}

with (OUTPUT / "data.yaml").open("w", encoding="utf-8") as file:
    yaml.safe_dump(config, file, sort_keys=False)

print("\nFresh dataset prepared!")
print(f"New dirty-floor images added: {added}")
print(f"Dataset: {OUTPUT}")

for split in ("train", "valid", "test"):
    image_count = sum(
        1 for p in (OUTPUT / split / "images").iterdir()
        if p.is_file()
    )
    label_count = sum(
        1 for p in (OUTPUT / split / "labels").glob("*.txt")
        if p.is_file()
    )
    print(f"{split}: {image_count} images, {label_count} label files")

print("Original dataset and existing models were not modified.")
