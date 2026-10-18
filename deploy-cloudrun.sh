#!/bin/bash
set -e

echo "========================================================"
echo "Deploying Urban Pitstop to Google Cloud Run"
echo "========================================================"

if ! command -v gcloud &> /dev/null; then
    echo "[ERROR] Google Cloud SDK ('gcloud') is not found in your PATH."
    echo "Please install Google Cloud SDK from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "Deploying container from source..."
gcloud run deploy urban-pitstop \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080

echo "[SUCCESS] Urban Pitstop successfully deployed to Google Cloud Run!"
