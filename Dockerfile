# Dockerfile (in root directory: Contract-Intelligence-Parser/Dockerfile)
FROM python:3.10-slim
WORKDIR /app
# Copy backend requirements
COPY Backend/requirements.txt ./
# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
# Download spaCy English model
RUN python -m spacy download en_core_web_sm
# Copy backend application code
COPY Backend/ ./
# Create uploads directory
RUN mkdir -p uploads
# Expose port
EXPOSE $PORT
# Run the application
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT