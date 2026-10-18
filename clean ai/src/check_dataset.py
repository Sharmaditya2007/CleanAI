
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
LABEL_DIR = ROOT / "dataset" / "yolo" / "train" / "labels"

class_names = [
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

counts = Counter()
empty_labels = 0
bad_lines = 0

for label_file in LABEL_DIR.glob("*.txt"):
    lines = label_file.read_text(encoding="utf-8").splitlines()

    if not lines:
        empty_labels += 1

    for line in lines:
        parts = line.split()

        if len(parts) < 5:
            bad_lines += 1
            continue

        try:
            class_id = int(parts[0])
        except ValueError:
            bad_lines += 1
            continue

        if 0 <= class_id < len(class_names):
            counts[class_id] += 1
        else:
            bad_lines += 1

print("\n--- Training Dataset Class Counts ---")

for class_id, name in enumerate(class_names):
    print(f"{name:25s}: {counts[class_id]} objects")

print("\nEmpty label files:", empty_labels)
print("Malformed or invalid label lines:", bad_lines)
