# db.py
from pymongo import MongoClient
from app.config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client["contract_intelligence"]
contracts_collection = db["contracts"]
