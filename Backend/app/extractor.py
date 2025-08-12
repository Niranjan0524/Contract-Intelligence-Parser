
import pdfplumber
import spacy
import re
from pymongo import MongoClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()




# MongoDB config
MONGO_URI = os.getenv("MONGO_DB_URL", "mongodb://localhost:27017/")
DB_NAME = "contractParser"  # <-- match your Atlas URI
COLLECTION_NAME = "contracts"

nlp = spacy.load("en_core_web_sm")


# Regex patterns for field extraction
EMAIL_REGEX = r"[\w\.-]+@[\w\.-]+"
ACCOUNT_REGEX = r"Account\s*Number[:\s]*([\w-]+)"
DATE_REGEX = r"\b(?:\d{1,2}[/-])?\d{1,2}[/-]\d{2,4}\b"
MONEY_REGEX = r"\$\s?\d+[\d,]*(?:\.\d{2})?"

# Helper: extract text from PDF
def extract_text(pdf_path):
    """Extract all text from a PDF file."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception as e:
        print(f"[ERROR] PDF extraction failed: {e}")
        return ""

# Helper: extract NER entities
def extract_entities(text):
    """Extract PERSON, DATE, MONEY using spaCy NER."""
    doc = nlp(text)
    people = list(set(ent.text for ent in doc.ents if ent.label_ == "PERSON"))
    dates = list(set(ent.text for ent in doc.ents if ent.label_ == "DATE"))
    money = list(set(ent.text for ent in doc.ents if ent.label_ == "MONEY"))
    return {"persons": people, "dates": dates, "money": money}

# Helper: regex/keyword extraction
def extract_fields(text):
    """Extract contract fields using regex and keyword search."""
    fields = {
        "party_identification": {},
        "account_information": {},
        "financial_details": {},
        "payment_structure": {},
        "revenue_classification": {},
        "service_level_agreements": {},
    }
    # Party Identification
    parties = re.findall(r"between\s+(.*?)\s+and\s+(.*?)\b", text, re.IGNORECASE)
    if parties:
        fields["party_identification"]["parties"] = parties[0]
    reg_details = re.findall(r"Registration\s*No\.?[:\s]*([\w-]+)", text, re.IGNORECASE)
    if reg_details:
        fields["party_identification"]["registration_details"] = reg_details
    signatories = re.findall(r"Signed\s+by\s+(.*?)\s+as", text, re.IGNORECASE)
    if signatories:
        fields["party_identification"]["signatories"] = signatories
    # Account Information
    emails = re.findall(EMAIL_REGEX, text)
    if emails:
        fields["account_information"]["emails"] = emails
    accounts = re.findall(ACCOUNT_REGEX, text)
    if accounts:
        fields["account_information"]["account_numbers"] = accounts
    # Financial Details
    money = re.findall(MONEY_REGEX, text)
    if money:
        fields["financial_details"]["amounts"] = money
    # Payment Structure
    payment_terms = re.findall(r"Net\s*\d+", text)
    if payment_terms:
        fields["payment_structure"]["terms"] = payment_terms
    # Revenue Classification
    recurring = re.findall(r"recurring|subscription", text, re.IGNORECASE)
    if recurring:
        fields["revenue_classification"]["recurring"] = True
    # SLA
    sla = re.findall(r"service level agreement|SLA|uptime|penalty", text, re.IGNORECASE)
    if sla:
        fields["service_level_agreements"]["sla_terms"] = sla
    return fields

# Helper: scoring
def score_fields(fields):
    """Weighted scoring based on completeness."""
    score = 0
    if fields["financial_details"]: score += 30
    if fields["party_identification"]: score += 25
    if fields["payment_structure"]: score += 20
    if fields["service_level_agreements"]: score += 15
    if fields["account_information"]: score += 10
    return score

# Main processing function
def process_contract(pdf_path):
    """Extract, analyze, score, and store contract info from PDF."""
    result = {
        "party_identification": {},
        "account_information": {},
        "financial_details": {},
        "payment_structure": {},
        "revenue_classification": {},
        "service_level_agreements": {},
        "score": 0,
        "created_at": datetime.now(timezone.utc),
        "file_path": pdf_path
    }
    try:
        text = extract_text(pdf_path)
        if not text:
            raise Exception("No text extracted from PDF.")
        entities = extract_entities(text)
        fields = extract_fields(text)
        # Merge NER into fields
        fields["party_identification"]["persons"] = entities["persons"]
        fields["financial_details"]["money_entities"] = entities["money"]
        fields["financial_details"]["dates"] = entities["dates"]
        result.update(fields)
        result["score"] = score_fields(fields)
        # Save to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        collection.insert_one(result)
        client.close()
        print(f"[INFO] Contract processed and saved. Score: {result['score']}")
    except Exception as e:
        print(f"[ERROR] Contract processing failed: {e}")
    return result

if __name__ == "__main__":
    import sys
    pdf = sys.argv[1] if len(sys.argv) > 1 else "sample_contract.pdf"
    process_contract(pdf)
