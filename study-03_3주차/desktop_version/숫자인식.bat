@echo off
REM Handwritten Digit Recognition Application
REM This batch file launches the digit recognition program

chcp 65001 > nul
cd /d "%~dp0"

echo Starting Handwritten Digit Recognition...
python digit_recognition.py

if errorlevel 1 (
    echo.
    echo Error: Failed to run the program.
    echo Please make sure Python and required libraries are installed.
    pause
)
