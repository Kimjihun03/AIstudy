# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Handwritten digit recognizer split into two independently developed versions, each with its own CLAUDE.md:

- `desktop_version/`: Tkinter canvas + scikit-learn MLP trained on the full MNIST dataset (working).
- `web_version/`: browser version (not started; tech stack undecided).

All code and comments must be in English (user requirement); the user converses in Korean.

## Updating this file

To add a rule or note to CLAUDE.md quickly, start a prompt with `#` in the Claude Code prompt. It is a shortcut for updating project memory, and the text after it is appended to this file instead of being treated as a normal chat message.

When a new rule or setting is needed during the project, edit this file at any time. The most convenient way is to ask Claude Code directly in the conversation, and it will update the file.

## Coding rules

- Always use descriptive variable names.
- Every newly created file must include its creation date and time as a comment (e.g., `# Created: 2026-10-29 20:50`).

## Commands (desktop version, run from `desktop_version/`)

- Run the app: `python digit_recognition.py` (or double-click `숫자인식.bat`, which `cd`s to its own folder and runs the same command)
- Retrain only (no GUI): `python digit_recognition.py --train`
- Force retraining on next launch: delete `mnist_mlp_model.pkl`

Dependencies: `numpy`, `scipy`, `Pillow`, `scikit-learn`, `tkinter` (stdlib). There are no tests, linter, or build step.

## Environment constraints

- Python 3.15 on Windows: TensorFlow/PyTorch have no wheels, so the model is scikit-learn only. Do not reintroduce TensorFlow or OpenCV.
- `pandas` is not installed, so `fetch_openml` must keep `parser="liac-arff"`.
- Use `python -m pip`, not bare `pip` (not on PATH in the Bash tool).

## Architecture (desktop version)

`desktop_version/digit_recognition.py` has three parts that must stay consistent with each other:

1. **Training** (`train_model` / `load_model`): downloads MNIST via OpenML into `mnist_cache/`, scales pixels to 0-1 (no `StandardScaler`, which hurt accuracy on MNIST), trains an `MLPClassifier`, pickles it to `mnist_mlp_model.pkl` next to the script. ~98.3% test accuracy.
2. **`preprocess`**: converts the 280x280 drawn image (dark ink on white) into the 784-vector the model expects, mimicking MNIST's format: invert to white-on-black, crop to the ink bounding box, scale to fit 20x20 preserving aspect ratio, paste into 28x28, then shift so the center of mass is at the image center. Recognition accuracy depends heavily on this step; earlier versions that simply resized the canvas to 8x8 or 28x28 predicted almost everything as the same digit.
3. **`DigitApp`** (Tkinter): draws simultaneously on the Tk canvas and a PIL image (the PIL image is what gets preprocessed), interpolates between mouse events to avoid gaps, and auto-recognizes on mouse release.

If you change the training data format, the model architecture, or `preprocess`, delete the pickle so the model is retrained to match.
