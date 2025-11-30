# Dockerfile for Railway deployment
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (if needed in the future)
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Copy the entire project (to get both backend/ and src/)
COPY . .

# Install Python dependencies from backend/requirements.txt
WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt

# Create storage directory
RUN mkdir -p storage

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Set working directory to backend
WORKDIR /app/backend

# Run uvicorn (Railway will set $PORT)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

