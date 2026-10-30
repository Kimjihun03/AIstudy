import os
import pickle
import sys
import tkinter as tk

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from sklearn.datasets import fetch_openml
from sklearn.neural_network import MLPClassifier

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "mnist_mlp_model.pkl")
DATA_DIR = os.path.join(BASE_DIR, "mnist_cache")

CANVAS_SIZE = 280
BRUSH_RADIUS = 10


def train_model():
    """Train an MLP classifier on the full MNIST dataset and save it."""
    print("Downloading/loading MNIST (70,000 images)...")
    X, y = fetch_openml(
        "mnist_784", version=1, as_frame=False, return_X_y=True,
        data_home=DATA_DIR, parser="liac-arff",
    )
    X = X.astype("float32") / 255.0
    y = y.astype(int)

    # Standard MNIST split: first 60,000 for training, last 10,000 for testing
    X_train, y_train = X[:60000], y[:60000]
    X_test, y_test = X[60000:], y[60000:]

    print("Training neural network (about 1-3 minutes)...")
    model = MLPClassifier(
        hidden_layer_sizes=(512, 256),
        activation="relu",
        solver="adam",
        alpha=1e-4,
        batch_size=256,
        max_iter=30,
        early_stopping=True,
        n_iter_no_change=4,
        random_state=42,
        verbose=True,
    )
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"Test accuracy on MNIST: {accuracy:.2%}")

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    return model


def load_model():
    """Load the saved model, or train a new one if none exists."""
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    return train_model()


def preprocess(gray_image):
    """Convert a drawn image (dark ink on white) into a 784-vector in MNIST style.

    MNIST digits are white on black, scaled to fit a 20x20 box (aspect ratio
    preserved) and centered by center of mass inside a 28x28 image.
    Returns None if the canvas is empty.
    """
    ink = 255 - np.array(gray_image, dtype=np.uint8)

    rows = np.where(ink.max(axis=1) > 30)[0]
    cols = np.where(ink.max(axis=0) > 30)[0]
    if len(rows) == 0 or len(cols) == 0:
        return None

    cropped = ink[rows[0]:rows[-1] + 1, cols[0]:cols[-1] + 1]
    h, w = cropped.shape
    scale = 20.0 / max(h, w)
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    small = Image.fromarray(cropped).resize((new_w, new_h), Image.LANCZOS)

    canvas = np.zeros((28, 28), dtype=np.float32)
    top = (28 - new_h) // 2
    left = (28 - new_w) // 2
    canvas[top:top + new_h, left:left + new_w] = np.array(small, dtype=np.float32)

    # Shift so the center of mass sits at the image center (like MNIST)
    cy, cx = ndimage.center_of_mass(canvas)
    shift = (int(round(13.5 - cy)), int(round(13.5 - cx)))
    canvas = ndimage.shift(canvas, shift, order=1, mode="constant", cval=0.0)

    return (canvas / 255.0).reshape(1, 784)


class DigitApp:
    """Tkinter window where the user draws a digit and the model predicts it."""

    def __init__(self, root, model):
        self.root = root
        self.model = model
        root.title("Handwritten Digit Recognition (MNIST)")
        root.resizable(False, False)

        tk.Label(root, text="Draw a digit (0-9)", font=("Arial", 16, "bold")).pack(pady=10)

        self.canvas = tk.Canvas(
            root, width=CANVAS_SIZE, height=CANVAS_SIZE, bg="white",
            cursor="cross", highlightthickness=2, highlightbackground="black",
        )
        self.canvas.pack(padx=20, pady=10)
        self.canvas.bind("<Button-1>", self.start_stroke)
        self.canvas.bind("<B1-Motion>", self.draw_stroke)
        self.canvas.bind("<ButtonRelease-1>", lambda e: self.recognize())

        buttons = tk.Frame(root)
        buttons.pack(pady=10)
        tk.Button(buttons, text="Recognize", width=12, command=self.recognize).grid(row=0, column=0, padx=5)
        tk.Button(buttons, text="Clear", width=12, command=self.clear).grid(row=0, column=1, padx=5)

        self.result = tk.Label(root, text="Prediction: -", font=("Arial", 20, "bold"))
        self.result.pack(pady=(10, 2))
        self.detail = tk.Label(root, text="", font=("Arial", 11), fg="gray")
        self.detail.pack(pady=(0, 15))

        self.reset_image()

    def reset_image(self):
        self.image = Image.new("L", (CANVAS_SIZE, CANVAS_SIZE), 255)
        self.pen = ImageDraw.Draw(self.image)
        self.last = None

    def start_stroke(self, event):
        self.last = (event.x, event.y)
        self.dot(event.x, event.y)

    def dot(self, x, y):
        r = BRUSH_RADIUS
        self.canvas.create_oval(x - r, y - r, x + r, y + r, fill="black", outline="black")
        self.pen.ellipse([x - r, y - r, x + r, y + r], fill=0)

    def draw_stroke(self, event):
        # Interpolate between mouse events so fast strokes have no gaps
        if self.last is not None:
            x0, y0 = self.last
            steps = max(abs(event.x - x0), abs(event.y - y0), 1)
            for i in range(1, steps + 1):
                self.dot(x0 + (event.x - x0) * i / steps, y0 + (event.y - y0) * i / steps)
        self.last = (event.x, event.y)

    def clear(self):
        self.canvas.delete("all")
        self.reset_image()
        self.result.config(text="Prediction: -")
        self.detail.config(text="")

    def recognize(self):
        x = preprocess(self.image)
        if x is None:
            self.result.config(text="Prediction: -")
            self.detail.config(text="Canvas is empty")
            return
        probs = self.model.predict_proba(x)[0]
        order = np.argsort(probs)[::-1][:3]
        self.result.config(text=f"Prediction: {order[0]}  ({probs[order[0]]:.1%})")
        self.detail.config(text="Top 3: " + "   ".join(f"{d}: {probs[d]:.1%}" for d in order))


def main():
    if "--train" in sys.argv:
        train_model()
        return
    model = load_model()
    root = tk.Tk()
    DigitApp(root, model)
    root.mainloop()


if __name__ == "__main__":
    main()
