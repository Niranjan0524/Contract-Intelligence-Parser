# background.py
from app.db import contracts_collection
from app.extractor import process_contract as extract_contract_data
from datetime import datetime
import os

def process_contract(contract_id: str, file_path: str):
    """Background task to process uploaded contract."""
    try:
        # Update status to processing
        contracts_collection.update_one(
            {"contract_id": contract_id}, 
            {"$set": {"status": "processing", "updated_at": datetime.utcnow()}}
        )
        
        print(f"[INFO] Started processing contract {contract_id}")
        
        # Extract comprehensive contract data using the main extractor
        contract_data = extract_contract_data(file_path)
        
        # Update the document with extracted data
        update_data = {
            "status": "completed",
            "updated_at": datetime.utcnow(),
            "party_identification": contract_data.get("party_identification", {}),
            "account_information": contract_data.get("account_information", {}),
            "financial_details": contract_data.get("financial_details", {}),
            "payment_structure": contract_data.get("payment_structure", {}),
            "revenue_classification": contract_data.get("revenue_classification", {}),
            "service_level_agreements": contract_data.get("service_level_agreements", {}),
            "score": contract_data.get("score", 0),
            # ✅ ADD THESE MISSING FIELDS:
            "raw_text": contract_data.get("raw_extracted_data", {}).get("full_text"),
            "raw_extracted_data": contract_data.get("raw_extracted_data", {})
        }
        
        contracts_collection.update_one(
            {"contract_id": contract_id},
            {"$set": update_data}
        )
        
        print(f"[INFO] Successfully processed contract {contract_id} with score: {contract_data.get('score', 0)}")
        print(f"[INFO] Raw data stored - Text length: {len(contract_data.get('raw_extracted_data', {}).get('full_text', ''))}")
        
    except Exception as e:
        print(f"[ERROR] Failed to process contract {contract_id}: {e}")
        
        # ✅ Try to store partial raw data even on failure
        error_update = {
            "status": "failed", 
            "updated_at": datetime.utcnow(), 
            "error": str(e)
        }
        
        # If we have partial contract_data, store what we can
        if 'contract_data' in locals() and contract_data.get("raw_extracted_data"):
            error_update["raw_text"] = contract_data["raw_extracted_data"].get("full_text")
            error_update["raw_extracted_data"] = contract_data["raw_extracted_data"]
            print(f"[INFO] Stored partial raw data despite processing failure")
        
        contracts_collection.update_one(
            {"contract_id": contract_id},
            {"$set": error_update}
        )
