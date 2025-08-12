# config.py
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_DB_URL", "mongodb://localhost:27017/")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads"))
MAX_FILE_SIZE_MB = 50
ALLOWED_EXTENSIONS = {".pdf"}
