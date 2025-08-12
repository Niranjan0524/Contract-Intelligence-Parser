# Contract Intelligence Parser Backend

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start MongoDB (local or via Docker).
3. Run the FastAPI app:
   ```bash
   uvicorn app.main:app --reload
   ```

## Endpoints
- `POST /contracts/upload` — Upload a PDF contract (max 50MB)
- `GET /contracts/{contract_id}/status` — Get processing status
- `GET /contracts/{contract_id}/download` — Download original PDF

## Folder Structure
- `app/` — Source code
- `uploads/` — Uploaded PDF files

## Environment Variables
- `MONGO_URI` (default: mongodb://localhost:27017/)
- `UPLOAD_DIR` (default: uploads/)
