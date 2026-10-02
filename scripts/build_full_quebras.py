import json
import os

def load_and_merge():
    # Load current dataset
    target_path = "src/data/quebrasOfficialDataset.json"
    with open(target_path, "r", encoding="utf-8") as f:
        existing = json.load(f)
    
    print(f"Current records in {target_path}: {len(existing)}")
    return existing

if __name__ == "__main__":
    load_and_merge()
