# Stage 1: Build modern Vite frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Python FastAPI + SQLite production runtime
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy built frontend assets
COPY --from=frontend-builder /app/dist /app/dist

# Copy backend server code
COPY server/ /app/server/

EXPOSE 8080

# Run FastAPI backend with Uvicorn on dynamic Cloud Run port
CMD ["sh", "-c", "python -m uvicorn server.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
