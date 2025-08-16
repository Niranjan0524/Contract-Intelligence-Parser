# models.py
from datetime import datetime
from uuid import uuid4

def contract_metadata_dict(file_path: str, original_filename: str = None):
    now = datetime.utcnow()
    return {
        "contract_id": str(uuid4()),
        "status": "pending",
        "file_path": file_path,
        "original_filename": original_filename or "unknown.pdf",
        "created_at": now,
        "updated_at": now,
        "raw_text": None,
        "score": 0
    }
