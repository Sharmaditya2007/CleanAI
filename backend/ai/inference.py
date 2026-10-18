import os
import io
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

from config import settings, CLASSES, DIRTY_CLASSES, CLEAN_CLASSES
from models.schemas import AIInferenceResult, Detection, BoundingBox

logger = logging.getLogger("clean_ai.ai")

class ModelService:
    def __init__(self):
        self.model = None
        self.model_path = Path(settings.MODEL_PATH)
        self.model_name = self.model_path.name
        self.is_loaded = False
        self.framework = "Ultralytics YOLO (Object Detection)"
        self.classes_mapping = {i: name for i, name in enumerate(CLASSES)}
        self.load_error = None
        
        self.load_model()
        
    def load_model(self):
        """Loads the trained model once during startup with weight preservation."""
        if not self.model_path.exists():
            error_msg = f"Model file not found at {self.model_path}. Checked candidate paths."
            logger.error(error_msg)
            self.load_error = error_msg
            self.is_loaded = False
            return
            
        try:
            from ultralytics import YOLO
            logger.info(f"Loading trained Clean AI model from: {self.model_path}")
            # Load model once using original weights
            self.model = YOLO(str(self.model_path))
            
            # Read real class mapping from model if present
            if hasattr(self.model, "names") and self.model.names:
                self.classes_mapping = {int(k): str(v) for k, v in self.model.names.items()}
                logger.info(f"Loaded {len(self.classes_mapping)} model classes: {list(self.classes_mapping.values())}")
            
            self.is_loaded = True
            self.load_error = None
            logger.info("Clean AI model initialized successfully. Ready for inference.")
        except Exception as e:
            logger.exception(f"Failed to load YOLO model: {e}")
            self.load_error = str(e)
            self.is_loaded = False

    def validate_image(self, file_bytes: bytes) -> Image.Image:
        """Validates image data and checks for corrupt files."""
        if not file_bytes:
            raise ValueError("Uploaded file is empty.")
        if len(file_bytes) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise ValueError(f"Image exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB.")
            
        try:
            image = Image.open(io.BytesIO(file_bytes))
            image.verify()  # Verify file integrity
            # Reopen because verify() consumes file
            image = Image.open(io.BytesIO(file_bytes))
            # Convert to RGB if needed
            if image.mode != "RGB":
                image = image.convert("RGB")
            return image
        except Exception as err:
            raise ValueError(f"Corrupt or invalid image file: {err}")

    def run_inference(
        self,
        image_input: Any, # Can be PIL Image, Path, or bytes
        conf_threshold: Optional[float] = None
    ) -> AIInferenceResult:
        """
        Runs real YOLO inference on the input image.
        Never mocks or fabricates predictions.
        """
        if not self.is_loaded:
            # Try reloading once in case dependencies just became ready
            self.load_model()
            if not self.is_loaded:
                raise RuntimeError(f"Model service is not loaded: {self.load_error or 'Unknown error'}")

        # Prepare PIL Image
        pil_image: Image.Image
        if isinstance(image_input, bytes):
            pil_image = self.validate_image(image_input)
        elif isinstance(image_input, (str, Path)):
            with open(image_input, "rb") as f:
                pil_image = self.validate_image(f.read())
        elif isinstance(image_input, Image.Image):
            pil_image = image_input.convert("RGB")
        else:
            raise ValueError("Unsupported image input type.")

        img_w, img_h = pil_image.size
        threshold = conf_threshold or settings.CONFIDENCE_THRESHOLD

        # Run genuine YOLO model prediction
        try:
            results = self.model.predict(
                source=pil_image,
                imgsz=settings.IMAGE_SIZE,
                conf=threshold,
                device="cpu",
                verbose=False
            )
        except Exception as e:
            logger.exception("Model prediction failed during execution")
            raise RuntimeError(f"Inference execution failed: {e}")

        detections: List[Detection] = []
        dirty_detected: List[str] = []
        clean_detected: List[str] = []
        conf_summary: Dict[str, float] = {}

        # Parse detections from YOLO result
        if results and len(results) > 0:
            res = results[0]
            if res.boxes is not None and len(res.boxes) > 0:
                for box in res.boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    cls_name = self.classes_mapping.get(cls_id, f"class_{cls_id}")
                    
                    xyxy = box.xyxy[0].tolist()
                    x1, y1, x2, y2 = float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])
                    
                    is_dirty = cls_name in DIRTY_CLASSES
                    if is_dirty:
                        dirty_detected.append(cls_name)
                    elif cls_name in CLEAN_CLASSES:
                        clean_detected.append(cls_name)

                    if cls_name not in conf_summary or conf > conf_summary[cls_name]:
                        conf_summary[cls_name] = round(conf, 4)

                    detections.append(
                        Detection(
                            class_id=cls_id,
                            class_name=cls_name,
                            confidence=round(conf, 4),
                            bbox=BoundingBox(
                                x1=round(x1, 1),
                                y1=round(y1, 1),
                                x2=round(x2, 1),
                                y2=round(y2, 1),
                                width=round(x2 - x1, 1),
                                height=round(y2 - y1, 1)
                            ),
                            is_dirty_indicator=is_dirty
                        )
                    )

        # Cautious Recommendation Logic
        # Rule: Do not automatically label an image clean merely because no dirty objects were detected.
        if dirty_detected:
            if "damage" in dirty_detected:
                ai_rec = "Under Maintenance"
                msg = f"Alert: Damage detected ({', '.join(set(dirty_detected))}). Facility maintenance required."
            else:
                ai_rec = "Needs Cleaning"
                msg = f"Sanitation issue detected: {', '.join(set(dirty_detected))}. Scheduled cleaning recommended."
        elif clean_detected:
            ai_rec = "Clean"
            msg = f"Sanitary conditions verified: clean fixtures detected ({', '.join(set(clean_detected))})."
        else:
            # No clean AND no dirty objects detected -> INCONCLUSIVE
            ai_rec = "Inconclusive - Officer Inspection Required"
            msg = "No identifiable toilet sanitation features detected. Manual verification by municipal officer required."

        # Generate annotated preview image with bounding boxes
        annotated_filename = None
        try:
            annotated_filename = self._save_annotated_image(pil_image, detections)
        except Exception as e:
            logger.warning(f"Could not save annotated image: {e}")

        return AIInferenceResult(
            success=True,
            model_identifier=f"YOLO11n-CleanAI ({self.model_path.name})",
            framework=self.framework,
            total_detections=len(detections),
            detections=detections,
            clean_indicators_detected=list(set(clean_detected)),
            dirty_indicators_detected=list(set(dirty_detected)),
            ai_recommendation=ai_rec,
            confidence_summary=conf_summary,
            message=msg,
            processed_at=datetime.utcnow(),
            annotated_image_url=f"/api/uploads/{annotated_filename}" if annotated_filename else None
        )

    def _save_annotated_image(self, image: Image.Image, detections: List[Detection]) -> str:
        """Draws bounding boxes and labels onto the image for municipal officer inspection preview."""
        annotated = image.copy()
        draw = ImageDraw.Draw(annotated)
        
        for det in detections:
            box = det.bbox
            color = "#ef4444" if det.is_dirty_indicator else "#10b981" # red for dirty, green for clean
            
            # Draw box outline
            for i in range(3):
                draw.rectangle(
                    [box.x1 - i, box.y1 - i, box.x2 + i, box.y2 + i],
                    outline=color
                )
            
            # Draw label banner
            label = f"{det.class_name} {det.confidence:.0%}"
            draw.rectangle(
                [box.x1, max(0, box.y1 - 18), box.x1 + len(label) * 8 + 8, box.y1],
                fill=color
            )
            draw.text(
                (box.x1 + 4, max(0, box.y1 - 16)),
                label,
                fill="#ffffff"
            )

        filename = f"annotated_{uuid.uuid4().hex[:12]}.jpg"
        save_path = settings.UPLOADS_DIR / filename
        annotated.save(save_path, "JPEG", quality=90)
        return filename

# Singleton model service instance
model_service = ModelService()
