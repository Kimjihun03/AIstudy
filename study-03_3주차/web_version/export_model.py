# Created: 2026-10-29 21:10
import json
import os
import pickle
import sys

import numpy as np

WEB_DIR = os.path.dirname(os.path.abspath(__file__))
TRAINED_MODEL_PATH = os.path.join(WEB_DIR, "..", "desktop_version", "mnist_mlp_model.pkl")
OUTPUT_PATH = os.path.join(WEB_DIR, "model.json")


def export_model():
    """Export the trained scikit-learn MLP weights to JSON for in-browser inference."""
    if not os.path.exists(TRAINED_MODEL_PATH):
        sys.exit("Trained model not found. Run desktop_version/digit_recognition.py --train first.")

    with open(TRAINED_MODEL_PATH, "rb") as model_file:
        model = pickle.load(model_file)

    layers = []
    for weight_matrix, bias_vector in zip(model.coefs_, model.intercepts_):
        layers.append({
            "weights": np.round(weight_matrix, 5).tolist(),  # shape: (inputs, outputs)
            "biases": np.round(bias_vector, 5).tolist(),
        })

    with open(OUTPUT_PATH, "w") as output_file:
        json.dump({"layers": layers}, output_file, separators=(",", ":"))

    size_megabytes = os.path.getsize(OUTPUT_PATH) / 1e6
    print(f"Exported {len(layers)} layers to {OUTPUT_PATH} ({size_megabytes:.1f} MB)")


if __name__ == "__main__":
    export_model()
