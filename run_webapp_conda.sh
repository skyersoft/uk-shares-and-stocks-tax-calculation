#!/bin/bash
# Script to run the web application using the conda environment

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "Error: conda is not installed or not in PATH"
    echo "Please install Anaconda or Miniconda first"
    exit 1
fi

# Activate the conda environment
echo "Activating conda environment 'ibkr-tax'..."
eval "$(conda shell.bash hook)"
conda activate ibkr-tax || { echo "Failed to activate conda environment. Please run ./setup_conda_env.sh first"; exit 1; }

# Run the web application
echo "Starting web application..."
python run_webapp.py
