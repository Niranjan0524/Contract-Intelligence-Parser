# main.py
"""
FastAPI entry point for Contract Intelligence Parser backend.
"""
import os
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
from datetime import datetime
from typing import Optional
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
    """Upload a PDF contract file for processing."""
    
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files are allowed.")
    
    # Read and validate file size
    contents = file.file.read()
    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum {MAX_FILE_SIZE_MB}MB allowed.")
    
    # Generate unique contract ID and filename
    contract_id = str(uuid4())
    filename = f"{contract_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Save file to disk
    try:
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create metadata and insert into database
    meta = contract_metadata_dict(file_path, file.filename)
    meta["contract_id"] = contract_id
    
    try:
        contracts_collection.insert_one(meta)
    except Exception as e:
        # Clean up file if database insert fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to save metadata: {str(e)}")
    
    # Start background processing
    background_tasks.add_task(process_contract, contract_id, file_path)
    
    print(f"[INFO] Contract {contract_id} uploaded successfully: {file.filename}")
    
    return {
        "contract_id": contract_id,
        "original_filename": file.filename,
        "message": "File uploaded successfully and processing started.",
        "status": "pending"
    }

@app.get("/contracts")
def get_contracts(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(10, ge=1, le=100, description="Number of contracts per page"),
    status: Optional[str] = Query(None, description="Filter by status: pending, processing, completed, failed"),
    min_score: Optional[int] = Query(None, ge=0, le=100, description="Minimum confidence score"),
    max_score: Optional[int] = Query(None, ge=0, le=100, description="Maximum confidence score"),
    sort_by: str = Query("created_at", description="Sort field: created_at, updated_at, score, original_filename"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    search: Optional[str] = Query(None, description="Search in filename")
):
    """Get paginated list of contracts with filtering and sorting capabilities."""
    
    # Build MongoDB filter query
    filter_query = {}
    
    if status:
        filter_query["status"] = status
    
    if min_score is not None or max_score is not None:
        score_filter = {}
        if min_score is not None:
            score_filter["$gte"] = min_score
        if max_score is not None:
            score_filter["$lte"] = max_score
        filter_query["score"] = score_filter
    
    if search:
        filter_query["original_filename"] = {"$regex": search, "$options": "i"}
    
    # Calculate pagination
    skip = (page - 1) * limit
    
    # Build sort query
    sort_direction = 1 if sort_order == "asc" else -1
    sort_query = [(sort_by, sort_direction)]
    
    try:
        # Get total count for pagination
        total_count = contracts_collection.count_documents(filter_query)
        
        # Get paginated results
        docs = list(
            contracts_collection.find(filter_query, {"_id": 0})
            .sort(sort_query)
            .skip(skip)
            .limit(limit)
        )
        
        # Calculate pagination metadata
        total_pages = (total_count + limit - 1) // limit
        has_next = page < total_pages
        has_prev = page > 1
        
        print(f"[DEBUG] Retrieved {len(docs)} contracts (page {page}/{total_pages})")
        
        return {
            "contracts": docs,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_count": total_count,
                "limit": limit,
                "has_next": has_next,
                "has_prev": has_prev
            },
            "filters": {
                "status": status,
                "min_score": min_score,
                "max_score": max_score,
                "search": search,
                "sort_by": sort_by,
                "sort_order": sort_order
            }
        }
        
    except Exception as e:
        print(f"[ERROR] Failed to retrieve contracts: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve contracts")

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
    """Get contract processing status with progress information."""
    doc = contracts_collection.find_one({"contract_id": contract_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Contract not found.")
    
    status = doc["status"]
    
    # Calculate progress percentage based on status
    progress_map = {
        "pending": 0,
        "processing": 50,
        "completed": 100,
        "failed": 0
    }
    
    progress_percentage = progress_map.get(status, 0)
    
    result = {
        "contract_id": contract_id,
        "status": status,
        "progress_percentage": progress_percentage,
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"]
    }
    
    # Add error details if failed
    if status == "failed" and doc.get("error"):
        result["error_details"] = doc["error"]
    
    # Add score if completed
    if status == "completed" and doc.get("score") is not None:
        result["confidence_score"] = doc["score"]
    
    print(f"[DEBUG] Status check for contract {contract_id}: {status} ({progress_percentage}%)")
    return result

@app.get("/contracts/{contract_id}/download")
def download_contract(contract_id: str):
    """Download the original contract file."""
    doc = contracts_collection.find_one({"contract_id": contract_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Contract not found.")
    
    file_path = doc["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Contract file not found on server.")
    
    # Get original filename, fallback to generated filename
    original_filename = doc.get("original_filename", f"{contract_id}.pdf")
    
    print(f"[INFO] Downloading contract {contract_id}: {original_filename}")
    
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=original_filename,
        headers={
            "Content-Disposition": f'attachment; filename="{original_filename}"',
            "Cache-Control": "no-cache"
        }
    )


# Add this to the end of your app/main.py file
if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)