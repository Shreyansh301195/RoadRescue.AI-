FROM python:3.12-slim

WORKDIR /app

# Install dependencies first for Docker caching layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application files
COPY . .

# Expose the Cloud Run provided PORT, defaulting to 8080 if not set
ENV PORT=8080

# Run uvicorn server directly ensuring we bind to 0.0.0.0 and dynamically grab the ENV PORT
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
