# db.py
from pymongo import MongoClient
from app.config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client["contractParser"]
contracts_collection = db["contracts"]
