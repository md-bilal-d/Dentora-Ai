import kagglehub
import os

print("Downloading dataset...")
path = kagglehub.dataset_download("lokisilvres/dental-disease-panoramic-detection-dataset")

print("Path to dataset files:", path)

# List the contents to understand structure
for root, dirs, files in os.walk(path):
    print(f"\nDirectory: {root}")
    for file in files[:5]:
        print(f"  - {file}")
    if len(files) > 5:
        print(f"  - ... ({len(files) - 5} more files)")
