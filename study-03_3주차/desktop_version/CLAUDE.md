# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- Created: 2026-10-29 21:02 -->

## Scope

Desktop version of the handwritten digit recognizer: a Tkinter canvas plus a scikit-learn MLP trained on MNIST. The web version lives separately in `../web_version`; do not edit it from here.

Contents: `digit_recognition.py` (the whole app), `mnist_mlp_model.pkl` (trained model), `mnist_cache/` (downloaded MNIST), and `숫자인식.bat` (double-click launcher). Run commands from this folder; paths in the script are relative to the script itself. Architecture and commands are documented in `../CLAUDE.md`.

## Rules

Project-wide rules in `../CLAUDE.md` also apply: English code and comments, descriptive variable names, and a creation date/time comment in every new file.

Python 3.15 on Windows has no TensorFlow/PyTorch wheels, so keep the model scikit-learn only.
