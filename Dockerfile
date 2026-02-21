FROM node:20-bookworm AS frontend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM python:3.11-slim AS runtime
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=7860 \
    PLANT_MODEL_DIR=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install -r /app/backend/requirements.txt

COPY backend /app/backend
COPY class_names.json /app/class_names.json
COPY plant_disease_model2.keras /app/plant_disease_model2.keras
COPY plant_disease_model.keras /app/plant_disease_model.keras

COPY --from=frontend-builder /app/dist /app/frontend_dist

EXPOSE 7860

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
