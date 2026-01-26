from pymongo import MongoClient
from config import MONGO_URL, DB_NAME

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

problem_collection = db["problems"]   # CONNECTS directly to collection called "problem"
