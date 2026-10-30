# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- Created: 2026-10-29 21:02 -->

## Scope

Web version of the handwritten digit recognizer: the user draws a digit in a browser canvas and gets a prediction. The desktop (Tkinter) version lives separately in `../desktop_version`; do not edit it from here.

## Commands

- Export the model (needed after retraining the desktop model): `python export_model.py` (writes `model.json`, ~10 MB)
- Run: `python -m http.server 8000 --bind 127.0.0.1` from this folder, then open `http://127.0.0.1:8000/index.html`. Opening `index.html` via `file://` fails because `fetch("model.json")` is blocked.

## Architecture

No build step or dependencies: a single static `index.html` (canvas, preprocessing, and inference in plain JavaScript) plus `model.json`. Inference runs entirely in the browser: `export_model.py` dumps the weights of the scikit-learn MLP trained in `../desktop_version`, and `predictProbabilities` in `index.html` re-implements its forward pass (ReLU hidden layers, softmax output). It matches scikit-learn to ~1e-7. If the desktop model architecture or activation changes, update that function too.

## Rules

Project-wide rules in `../CLAUDE.md` also apply: English code and comments, descriptive variable names, and a creation date/time comment in every new file.

`preprocessDrawing` in `index.html` mirrors `preprocess` in the desktop version (invert to white-on-black, crop to the ink bounding box, fit into 20x20, center by center of mass in 28x28). Resizing the raw canvas directly gives poor accuracy. Keep the two implementations in sync.
