FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements files
COPY requirements.txt web_requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt -r web_requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

# Expose the port the app will run on
EXPOSE ${PORT}

# Command to run the application with Gunicorn
CMD exec gunicorn --bind :${PORT} --workers 2 --threads 8 --timeout 0 'web_app.app:app'
