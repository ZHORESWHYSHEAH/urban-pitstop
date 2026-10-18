@echo off
echo ========================================================
echo Deploying Urban Pitstop to Google Cloud Run
echo ========================================================

where gcloud >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Google Cloud SDK ('gcloud') is not found in your PATH.
    echo Please install Google Cloud SDK from: https://cloud.google.com/sdk/docs/install
    exit /b 1
)

echo.
echo Running: gcloud run deploy urban-pitstop --source . --region us-central1 --allow-unauthenticated --port 8080
echo.
gcloud run deploy urban-pitstop --source . --region us-central1 --allow-unauthenticated --port 8080

if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] Urban Pitstop successfully deployed to Google Cloud Run!
) else (
    echo.
    echo [FAILED] Cloud Run deployment failed. Check the error log above.
)
