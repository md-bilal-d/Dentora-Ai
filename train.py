"""
YOLO Dental Disease Detection — Fine-Tuning Script
Trains YOLOv8n on the dental panoramic X-ray dataset using GPU (RTX 4060).
"""
from ultralytics import YOLO
import os

def main():
    # Use the project root as a base
    project_dir = os.path.dirname(os.path.abspath(__file__))
    data_yaml = os.path.join(project_dir, "YOLO", "YOLO", "data.yaml")

    print("=" * 60)
    print("  DENTAL DISEASE DETECTION — YOLOv8 Fine-Tuning")
    print("=" * 60)
    print(f"  Data config : {data_yaml}")
    print(f"  Device      : CUDA (RTX 4060)")
    print(f"  Model       : YOLOv8n (nano)")
    print(f"  Epochs      : 50")
    print(f"  Image size  : 640")
    print(f"  Batch size  : 16")
    print("=" * 60)

    # Load pretrained YOLOv8 nano model
    model = YOLO("yolov8n.pt")

    # Fine-tune on the dental dataset
    results = model.train(
        data=data_yaml,
        epochs=50,
        imgsz=640,
        batch=16,
        device=0,          # GPU 0 (RTX 4060)
        project=os.path.join(project_dir, "runs", "detect"),
        name="dental_train",
        exist_ok=True,
        patience=10,       # Early stopping patience
        save=True,
        save_period=10,    # Save checkpoint every 10 epochs
        plots=True,        # Generate training plots
        verbose=True,
    )

    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE!")
    best_path = os.path.join(project_dir, "runs", "detect", "dental_train", "weights", "best.pt")
    print(f"  Best model saved to: {best_path}")
    print("=" * 60)

    # Run validation
    print("\nRunning validation on best model...")
    best_model = YOLO(best_path)
    val_results = best_model.val(data=data_yaml, device=0)
    print(f"  mAP50: {val_results.box.map50:.4f}")
    print(f"  mAP50-95: {val_results.box.map:.4f}")

if __name__ == "__main__":
    main()
