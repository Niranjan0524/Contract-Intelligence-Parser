# models.py
from datetime import datetime
from uuid import uuid4

def contract_metadata_dict(file_path: str):
    now = datetime.utcnow()
    return {
        "contract_id": str(uuid4()),
        "status": "pending",
        "file_path": file_path,
        "created_at": now,
        "updated_at": now,
        "raw_text": None
    }
