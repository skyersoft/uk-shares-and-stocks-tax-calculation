# UK Capital Gains Tax Calculator Web Application

This web application provides a user-friendly interface for the UK Capital Gains Tax Calculator. It allows users to upload QFX or CSV files from their trading platforms and calculate their capital gains tax liability according to HMRC rules.

## Features

- File upload for QFX and CSV transaction files
- Tax year selection
- Report generation in CSV or JSON formats
- Detailed breakdown of disposals and gains/losses
- Downloadable reports
- Responsive web interface

## Setup for Development

### Prerequisites

- Anaconda or Miniconda (for conda environment)
- Python 3.10 (installed via conda)

### Installation

1. Use the provided setup script to create a conda environment with Python 3.10:

```bash
chmod +x setup_conda_env.sh
./setup_conda_env.sh
```

2. Activate the conda environment:

```bash
conda activate ibkr-tax
```

3. Or install the required dependencies manually:

```bash
# Create and activate conda environment first
conda create -y -n ibkr-tax python=3.10
conda activate ibkr-tax

# Then install dependencies
pip install -r requirements.txt -r web_requirements.txt
```

4. Run the development server:

```bash
python run_webapp.py
```

5. Access the web application at http://localhost:5001 (Note: Default port changed from 5000 to 5001 to avoid conflicts with AirPlay Receiver on macOS)

## Deployment

### Using Docker

The application can be deployed using Docker:

```bash
docker-compose up -d
```

This will build and run the container, and the application will be available at http://localhost:8080

### Manual Deployment

For production deployment, it's recommended to use a WSGI server like Gunicorn behind a reverse proxy like Nginx:

```bash
gunicorn --bind 0.0.0.0:8080 --workers 2 --threads 8 web_app.app:app
```

## Environment Variables

- `SECRET_KEY`: Secret key for session encryption (required in production)
- `PORT`: Port to run the application on (default: 8080)

## Security Considerations

- Set a strong `SECRET_KEY` in production
- Configure HTTPS in production using a reverse proxy
- Temporary files are automatically cleaned up, but ensure the temp directory has appropriate permissions

## License

See the main project license for details.
