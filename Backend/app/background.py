# background.py
from app.db import contracts_collection
from app.utils import extract_text_from_pdf
from datetime import datetime

def process_contract(contract_id: str, file_path: str):
    try:
        contracts_collection.update_one({"contract_id": contract_id}, {"$set": {"status": "processing", "updated_at": datetime.utcnow()}})
        raw_text = extract_text_from_pdf(file_path)
        contracts_collection.update_one(
            {"contract_id": contract_id},
            {"$set": {"raw_text": raw_text, "status": "completed", "updated_at": datetime.utcnow()}}
        )
    except Exception as e:
        contracts_collection.update_one(
            {"contract_id": contract_id},
            {"$set": {"status": "failed", "updated_at": datetime.utcnow(), "error": str(e)}}
        )
