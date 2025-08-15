
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
    
    # Party Identification - Enhanced
    parties_patterns = [
        r"between\s+(.*?)\s+and\s+(.*?)(?:\s|,)",
        r"Party\s*[1A]:\s*(.*?)(?:\n|Party)",
        r"Customer:\s*(.*?)(?:\n|Vendor)",
        r"Client:\s*(.*?)(?:\n|Provider)"
    ]
    for pattern in parties_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
        if matches:
            if isinstance(matches[0], tuple):
                fields["party_identification"]["parties"] = list(matches[0])
            else:
                fields["party_identification"]["parties"] = matches
            break
    
    # Legal entity registration details
    reg_patterns = [
        r"Registration\s*(?:No\.?|Number)[:\s]*([\w-]+)",
        r"Incorporation\s*(?:No\.?|Number)[:\s]*([\w-]+)",
        r"Company\s*(?:No\.?|Number)[:\s]*([\w-]+)"
    ]
    reg_details = []
    for pattern in reg_patterns:
        reg_details.extend(re.findall(pattern, text, re.IGNORECASE))
    if reg_details:
        fields["party_identification"]["registration_details"] = reg_details
    
    # Authorized signatories
    sig_patterns = [
        r"Signed\s+by[:\s]+(.*?)(?:\n|as|on)",
        r"Authorized\s+(?:by|signatory)[:\s]+(.*?)(?:\n|,)",
        r"(?:CEO|President|Director|Manager)[:\s]+(.*?)(?:\n|,)"
    ]
    signatories = []
    for pattern in sig_patterns:
        signatories.extend(re.findall(pattern, text, re.IGNORECASE))
    if signatories:
        fields["party_identification"]["signatories"] = signatories[:5]  # Limit to 5
    
    # Account Information - Enhanced
    emails = re.findall(EMAIL_REGEX, text)
    if emails:
        fields["account_information"]["emails"] = list(set(emails))[:10]  # Unique emails, max 10
    
    # Account numbers - multiple patterns
    account_patterns = [
        r"Account\s*(?:No\.?|Number)[:\s]*([\w-]+)",
        r"Customer\s*(?:ID|Number)[:\s]*([\w-]+)",
        r"Reference\s*(?:No\.?|Number)[:\s]*([\w-]+)"
    ]
    accounts = []
    for pattern in account_patterns:
        accounts.extend(re.findall(pattern, text, re.IGNORECASE))
    if accounts:
        fields["account_information"]["account_numbers"] = list(set(accounts))
    
    # Financial Details - Enhanced
    money_patterns = [
        r"\$\s?\d+[\d,]*(?:\.\d{2})?",
        r"USD\s?\d+[\d,]*(?:\.\d{2})?",
        r"\d+[\d,]*(?:\.\d{2})?\s?(?:dollars?|USD|\$)",
    ]
    amounts = []
    for pattern in money_patterns:
        amounts.extend(re.findall(pattern, text, re.IGNORECASE))
    if amounts:
        fields["financial_details"]["amounts"] = list(set(amounts))[:20]  # Max 20 amounts
    
    # Line items and descriptions
    line_item_patterns = [
        r"(?:Item|Service|Product)[:\s]+(.*?)(?:\n|Price|Cost)",
        r"Description[:\s]+(.*?)(?:\n|Quantity|Price)"
    ]
    line_items = []
    for pattern in line_item_patterns:
        line_items.extend(re.findall(pattern, text, re.IGNORECASE | re.DOTALL))
    if line_items:
        fields["financial_details"]["line_items"] = [item.strip()[:100] for item in line_items[:10]]
    
    # Payment Structure - Enhanced
    payment_terms = re.findall(r"Net\s*\d+", text, re.IGNORECASE)
    if payment_terms:
        fields["payment_structure"]["terms"] = list(set(payment_terms))
    
    # Payment schedules
    schedule_patterns = [
        r"(?:due|payable)\s+(?:on|within)\s+(.*?)(?:\n|,|\.|;)",
        r"payment\s+schedule[:\s]+(.*?)(?:\n|\.)",
        r"(?:monthly|quarterly|annually|yearly)",
    ]
    schedules = []
    for pattern in schedule_patterns:
        schedules.extend(re.findall(pattern, text, re.IGNORECASE))
    if schedules:
        fields["payment_structure"]["schedules"] = [s.strip() for s in schedules[:5]]
    
    # Revenue Classification - Enhanced
    recurring_indicators = re.findall(
        r"recurring|subscription|monthly|quarterly|annual|yearly|renewal|auto-renew", 
        text, re.IGNORECASE
    )
    if recurring_indicators:
        fields["revenue_classification"]["recurring"] = True
        fields["revenue_classification"]["indicators"] = list(set(recurring_indicators))
    else:
        fields["revenue_classification"]["recurring"] = False
    
    # Billing cycles
    cycle_patterns = [
        r"(?:billed|billing)\s+(?:monthly|quarterly|annually|yearly)",
        r"(?:every|each)\s+(?:month|quarter|year)",
    ]
    cycles = []
    for pattern in cycle_patterns:
        cycles.extend(re.findall(pattern, text, re.IGNORECASE))
    if cycles:
        fields["revenue_classification"]["billing_cycles"] = list(set(cycles))
    
    # Service Level Agreements - Enhanced
    sla_patterns = [
        r"service level agreement|SLA",
        r"uptime[:\s]+(\d+(?:\.\d+)?%?)",
        r"availability[:\s]+(\d+(?:\.\d+)?%?)",
        r"penalty|liquidated damages",
        r"performance metrics?",
        r"support.*(?:24/7|business hours)",
        r"response time[:\s]+(.*?)(?:\n|\.)"
    ]
    sla_terms = []
    for pattern in sla_patterns:
        sla_terms.extend(re.findall(pattern, text, re.IGNORECASE))
    if sla_terms:
        fields["service_level_agreements"]["sla_terms"] = list(set(sla_terms))[:10]
    
    return fields

# Helper: scoring - Enhanced
def score_fields(fields):
    """Weighted scoring based on completeness (0-100 points)."""
    score = 0
    
    # Financial completeness: 30 points
    financial = fields.get("financial_details", {})
    if financial.get("amounts"): score += 15
    if financial.get("line_items"): score += 10
    if financial.get("money_entities"): score += 5
    
    # Party identification: 25 points
    parties = fields.get("party_identification", {})
    if parties.get("persons"): score += 10
    if parties.get("parties"): score += 8
    if parties.get("registration_details"): score += 4
    if parties.get("signatories"): score += 3
    
    # Payment terms clarity: 20 points
    payment = fields.get("payment_structure", {})
    if payment.get("terms"): score += 12
    if payment.get("schedules"): score += 8
    
    # SLA definition: 15 points
    sla = fields.get("service_level_agreements", {})
    if sla.get("sla_terms"): score += 15
    
    # Contact information: 10 points
    contact = fields.get("account_information", {})
    if contact.get("emails"): score += 6
    if contact.get("account_numbers"): score += 4
    
    return min(score, 100)  # Cap at 100

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
        "file_path": pdf_path,
        "processing_status": "processing"
    }
    
    try:
        print(f"[INFO] Starting contract extraction for: {pdf_path}")
        
        # Extract text from PDF
        text = extract_text(pdf_path)
        if not text or len(text.strip()) < 50:
            raise Exception("Insufficient text extracted from PDF.")
        
        print(f"[INFO] Extracted {len(text)} characters of text")
        
        # Extract entities using spaCy NER
        entities = extract_entities(text)
        print(f"[INFO] Found {len(entities['persons'])} persons, {len(entities['money'])} money entities")
        
        # Extract structured fields
        fields = extract_fields(text)
        
        # Merge NER results into structured fields
        if entities["persons"]:
            fields["party_identification"]["persons"] = entities["persons"]
        if entities["money"]:
            fields["financial_details"]["money_entities"] = entities["money"]
        if entities["dates"]:
            fields["financial_details"]["dates"] = entities["dates"]
        
        # Update result with extracted data
        result.update(fields)
        
        # Calculate weighted score
        result["score"] = score_fields(fields)
        result["processing_status"] = "completed"
        
        print(f"[INFO] Contract processed successfully. Score: {result['score']}/100")
        
        # Log extracted data summary
        summary = {
            "persons": len(entities["persons"]),
            "emails": len(fields.get("account_information", {}).get("emails", [])),
            "amounts": len(fields.get("financial_details", {}).get("amounts", [])),
            "payment_terms": len(fields.get("payment_structure", {}).get("terms", [])),
            "sla_terms": len(fields.get("service_level_agreements", {}).get("sla_terms", [])),
        }
        print(f"[INFO] Extraction summary: {summary}")
        
    except Exception as e:
        print(f"[ERROR] Contract processing failed: {e}")
        result["processing_status"] = "failed"
        result["error"] = str(e)
        result["score"] = 0
    
    return result

if __name__ == "__main__":
    import sys
    pdf = sys.argv[1] if len(sys.argv) > 1 else "sample_contract.pdf"
    process_contract(pdf)
