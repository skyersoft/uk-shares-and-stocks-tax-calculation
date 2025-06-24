#!/bin/bash
# Script to set up a conda environment with Python 3.10 for development

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "Error: conda is not installed or not in PATH"
    echo "Please install Anaconda or Miniconda first"
    exit 1
fi

# Create conda environment with Python 3.10
echo "Creating conda environment 'ibkr-tax' with Python 3.10..."
conda create -y -n ibkr-tax python=3.10

# Activate the conda environment
echo "Activating conda environment..."
eval "$(conda shell.bash hook)"
conda activate ibkr-tax

# Install dependencies
echo "Installing project dependencies..."
python -m pip install -r requirements.txt -r web_requirements.txt

echo ""
echo "Setup complete! The conda environment 'ibkr-tax' has been created with Python 3.10."
echo "To activate the environment, run: conda activate ibkr-tax"
