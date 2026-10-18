
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent

NEW_DATASET = Path(
    r"C:\Users\anupr\Downloads\unwashed Washroom.v2i.yolov9"
)

OUTPUT = ROOT / "dataset" / "augmented"

# New class ID -> existing Clean AI class ID
CLASS_MAP = {
    
    2: 7,  # Uncleaned Floor -> dirty_floor
}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def merge_split(split):
    source_images = NEW_DATASET / split / "images"
    source_labels = NEW_DATASET / split / "labels"

    if not source_images.exists() or not source_labels.exists():
        print(f"Skipping {split}: images or labels folder missing.")
        return

    # Never use the new validation/test images in training.
    if split != "train":
        print(f"Keeping new {split} split separate.")
        return

    output_images = OUTPUT / "train" / "images"
    output_labels = OUTPUT / "train" / "labels"
    output_images.mkdir(parents=True, exist_ok=True)
    output_labels.mkdir(parents=True, exist_ok=True)

    copied = 0
    skipped = 0

    for image in source_images.iterdir():
        if image.suffix.lower() not in IMAGE_EXTENSIONS:
            continue

        label = source_labels / f"{image.stem}.txt"

        if not label.exists():
            skipped += 1
            continue

        converted_lines = []
        valid = True

        for line in label.read_text(encoding="utf-8").splitlines():
            parts = line.split()

            if not parts:
                continue

            if len(parts) != 5:
                valid = False
                break

            try:
                old_id = int(parts[0])
                coords = [float(value) for value in parts[1:]]
            except ValueError:
                valid = False
                break

            if old_id not in CLASS_MAP:
               continue

            # Validate YOLO bounding-box coordinates.
            if not all(0 <= value <= 1 for value in coords):
                valid = False
                break

            new_id = CLASS_MAP[old_id]
            converted_lines.append(
                f"{new_id} " + " ".join(parts[1:])
            )

        if not valid or not converted_lines:
            skipped += 1
            continue

        destination_image = output_images / image.name
        destination_label = output_labels / label.name

        if destination_image.exists() or destination_label.exists():
            skipped += 1
            continue

        shutil.copy2(image, destination_image)
        destination_label.write_text(
            "\n".join(converted_lines) + "\n",
            encoding="utf-8"
        )
        copied += 1

    print(f"{split}: copied {copied}, skipped {skipped}")


if __name__ == "__main__":
    print("Creating a separate augmented dataset...")
    print(f"Output: {OUTPUT}")

    merge_split("train")

    print("\nDone. Original dataset and model were not modified.")
    print("Review the provisional class mapping before training.")
