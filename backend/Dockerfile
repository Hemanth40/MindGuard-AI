FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download HuggingFace models during build
RUN python -c " \
from transformers import pipeline \n\
print('Downloading Model 1: Sentiment...') \n\
pipeline('text-classification', model='distilbert-base-uncased-finetuned-sst-2-english') \n\
print('Downloading Model 2: Emotion-6...') \n\
pipeline('text-classification', model='bhadresh-savani/distilbert-base-uncased-emotion') \n\
print('Downloading Model 3: Emotion-7...') \n\
pipeline('text-classification', model='j-hartmann/emotion-english-distilroberta-base', return_all_scores=True) \n\
print('Downloading Model 4: Zero-Shot DeBERTa...') \n\
pipeline('zero-shot-classification', model='cross-encoder/nli-deberta-v3-small') \n\
print('All models downloaded!') \n\
"

# Copy app source
COPY . .

# Create data directory
RUN mkdir -p data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
