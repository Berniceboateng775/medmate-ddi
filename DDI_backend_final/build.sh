#!/usr/bin/env bash
# Build script for Render deployment

set -e

echo "Starting build process..."

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate --noinput

# Create default superuser if none exists
python manage.py create_default_superuser

# Collect static files
python manage.py collectstatic --noinput

echo "Build completed successfully!"