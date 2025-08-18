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
        "raw_extracted_data": {},  # ✅ NEW: Field for comprehensive raw data
        "score": 0
    }

# ✅ NEW: Updated contract schema for reference
contract_schema_dict = {
    "contract_id": str,
    "filename": str,
    "original_filename": str,
    "file_size": int,
    "status": str,  # processing, completed, failed
    "created_at": str,
    "updated_at": str,
    
    # ✅ NEW: Raw extracted data field
    "raw_extracted_data": {
        "full_text": str,
        "text_length": int,
        "extracted_entities": dict,
        "regex_matches": dict,
        "processing_metadata": dict
    },
    
    # Structured extraction results
    "party_identification": dict,
    "account_information": dict,
    "financial_details": dict,
    "payment_structure": dict,
    "revenue_classification": dict,
    "service_level_agreements": dict,
    
    "score": int,
    "file_path": str,
    "processing_status": str
}
