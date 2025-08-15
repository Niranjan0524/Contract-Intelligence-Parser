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
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
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

@app.get("/contracts")
def get_contracts():
    """Get list of all contracts with metadata."""
    docs = list(contracts_collection.find({},{"_id": 0}))
    print("Retrieved contracts in backend:", docs)
    return {"contracts": docs}

@app.get("/contracts/{contract_id}")
def get_contract_details(contract_id: str):
    """Get detailed contract information including extracted data."""
    doc = contracts_collection.find_one({"contract_id": contract_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Contract not found.")
    
    print(f"[DEBUG] Retrieved contract {contract_id} with status: {doc.get('status')}")
    
    # Check if contract processing is complete
    if doc.get("status") == "processing":
        return {
            "contract_id": contract_id,
            "status": "processing",
            "message": "Contract is still being processed. Please check back later.",
            "created_at": doc.get("created_at"),
            "file_path": doc.get("file_path")
        }
    
    if doc.get("status") == "failed":
        return {
            "contract_id": contract_id,
            "status": "failed",
            "error": doc.get("error", "Unknown error occurred"),
            "message": "Contract processing failed.",
            "created_at": doc.get("created_at"),
            "file_path": doc.get("file_path")
        }
    
    # Return all extracted data if processing is complete
    result = {
        "contract_id": contract_id,
        "original_filename": doc.get("original_filename", "unknown.pdf"),
        "status": doc.get("status"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
        "file_path": doc.get("file_path"),
        
        # Extracted contract data
        "party_identification": doc.get("party_identification", {}),
        "account_information": doc.get("account_information", {}),
        "financial_details": doc.get("financial_details", {}),
        "payment_structure": doc.get("payment_structure", {}),
        "revenue_classification": doc.get("revenue_classification", {}),
        "service_level_agreements": doc.get("service_level_agreements", {}),
        "score": doc.get("score", 0),
        
        # Additional metadata
        "extraction_metadata": {
            "confidence_level": "high" if doc.get("score", 0) >= 80 else "medium" if doc.get("score", 0) >= 60 else "low",
            "data_completeness": f"{doc.get('score', 0)}%",
            "total_entities": (
                len(doc.get("party_identification", {}).get("persons", [])) + 
                len(doc.get("account_information", {}).get("emails", [])) +
                len(doc.get("financial_details", {}).get("amounts", []))
            )
        }
    }
    
    print(f"[DEBUG] Returning contract data with score: {result['score']}")
    return result

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
