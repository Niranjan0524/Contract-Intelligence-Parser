FROM python:3.10-slim
WORKDIR /app
# Copy requirements first for better Docker layer caching
COPY requirements.txt ./
# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
# Download spaCy English model
RUN python -m spacy download en_core_web_sm
# Copy .env file and application code
# COPY .env ./
COPY . .
# Create uploads directorys
RUN mkdir -p uploads
# Expose port
EXPOSE $PORT
# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT", "--reload"]