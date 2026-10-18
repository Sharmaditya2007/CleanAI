from pathlib import Path
from collections import Counter

root = Path("dataset/combined_v1")
names = [
    "clean_basin", "clean_floor", "clean_indian", "clean_urinal",
    "clean_western", "damage", "dirty_basin", "dirty_floor",
    "dirty_indian", "dirty_urinal", "dirty_western", "garbage",
    "partial_dirty_floor", "partial_dirty_indian",
    "partial_dirty_urinal", "partial_dirty_western"
]

for split in ["train", "valid", "test"]:
    folder = root / split / "labels"
    counts = Counter()
    image_counts = Counter()
    files = list(folder.glob("*.txt"))

    for file in files:
        seen = set()
        for line in file.read_text(encoding="utf-8").splitlines():
            parts = line.split()
            if not parts:
                continue
            try:
                class_id = int(parts[0])
                counts[class_id] += 1
                seen.add(class_id)
            except ValueError:
                pass
        image_counts.update(seen)

    print(f"\n--- {split.upper()} ---")
    print(f"Label files: {len(files)}")
    for i, name in enumerate(names):
        print(f"{name:25} objects={counts[i]:5} images={image_counts[i]:4}")
