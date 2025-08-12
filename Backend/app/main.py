# main.py
"""
FastAPI entry point for Contract Intelligence Parser backend.
"""
import os
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
from datetime import datetime
from app.config import UPLOAD_DIR, MAX_FILE_SIZE_MB, ALLOWED_EXTENSIONS
from app.db import contracts_collection
from app.models import contract_metadata_dict
from app.background import process_contract

app = FastAPI(title="Contract Intelligence Parser API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def homePage():    
    return {"message":"hello"}

@app.post("/contracts/upload")
def upload_contract(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF allowed.")
    contents = file.file.read()
    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 50MB allowed.")
    contract_id = str(uuid4())
    filename = f"{contract_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(contents)
    meta = contract_metadata_dict(file_path)
    meta["contract_id"] = contract_id
    contracts_collection.insert_one(meta)
    background_tasks.add_task(process_contract, contract_id, file_path)
    return {"contract_id": contract_id, "message": "File uploaded and processing started."}

@app.get("/contracts/{contract_id}/status")
def get_contract_status(contract_id: str):
    doc = contracts_collection.find_one({"contract_id": contract_id})
    if not doc:
        raise HTTPException(status_code=404, detail="contract_id not found.")
    return {
        "contract_id": contract_id,
        "status": doc["status"],
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
        "error": doc.get("error")
    }

@app.get("/contracts/{contract_id}/download")
def download_contract(contract_id: str):
    doc = contracts_collection.find_one({"contract_id": contract_id})
    if not doc:
        raise HTTPException(status_code=404, detail="contract_id not found.")
    file_path = doc["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server.")
    return FileResponse(file_path, media_type="application/pdf", filename=os.path.basename(file_path))
