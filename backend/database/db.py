import json
import logging
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import bcrypt

from config import settings

logger = logging.getLogger("clean_ai.db")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
FALLBACK_STORE_FILE = DATA_DIR / "db_store.json"

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

class DatabaseManager:
    """
    Unified MongoDB and Persistent Fallback Storage Manager.
    Ensures zero downtime whether MongoDB is running locally, connected to Atlas,
    or in standalone offline mode.
    """
    def __init__(self):
        self.client = None
        self.db = None
        self.is_mongo_connected = False
        self._memory_store: Dict[str, List[Dict[str, Any]]] = {
            "users": [],
            "toilets": [],
            "inspections": [],
            "complaints": [],
            "cleaning_tasks": [],
            "notifications": [],
            "audit_logs": []
        }
        self._load_fallback_store()
        self._seed_initial_data_if_empty()

    def _load_fallback_store(self):
        if FALLBACK_STORE_FILE.exists():
            try:
                with open(FALLBACK_STORE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for k in self._memory_store.keys():
                        if k in data:
                            self._memory_store[k] = data[k]
                logger.info(f"Loaded persistent fallback database from {FALLBACK_STORE_FILE}")
            except Exception as e:
                logger.warning(f"Could not load fallback store: {e}")

    def _save_fallback_store(self):
        try:
            with open(FALLBACK_STORE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._memory_store, f, default=str, indent=2)
        except Exception as e:
            logger.error(f"Failed to persist fallback store: {e}")

    async def connect_mongo(self):
        """Attempts to connect to MongoDB Atlas or local MongoDB."""
        try:
            import motor.motor_asyncio
            self.client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000
            )
            # Test connection
            await self.client.admin.command('ping')
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.is_mongo_connected = True
            logger.info(f"Connected to MongoDB successfully: {settings.MONGODB_DB_NAME}")
            await self._create_indexes()
        except Exception as e:
            self.is_mongo_connected = False
            logger.warning(f"MongoDB not reachable at {settings.MONGODB_URI}. Operating seamlessly in persistent local store mode. Reason: {e}")

    async def _create_indexes(self):
        if not self.is_mongo_connected or self.db is None:
            return
        try:
            await self.db.users.create_index("email", unique=True)
            await self.db.toilets.create_index([("latitude", 1), ("longitude", 1)])
            await self.db.toilets.create_index("registration_status")
            await self.db.toilets.create_index("verified_status")
            await self.db.inspections.create_index("toilet_id")
            await self.db.complaints.create_index("reference_number", unique=True)
            await self.db.cleaning_tasks.create_index("toilet_id")
            await self.db.notifications.create_index("user_id")
        except Exception as e:
            logger.warning(f"Index creation warning: {e}")

    def _seed_initial_data_if_empty(self):
        # 1. Seed initial users if none exist
        if not self._memory_store["users"]:
            officer_user = {
                "id": "usr_officer_01",
                "email": "officer@cleanai.gov",
                "full_name": "Rajesh Kumar (Municipal Officer)",
                "role": "officer",
                "hashed_password": hash_password("Officer@123"),
                "phone": "+91-9876543210",
                "organization": "Delhi Municipal Corporation",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
            owner_user = {
                "id": "usr_owner_01",
                "email": "owner@cleanai.com",
                "full_name": "Suresh Patel (Facility Contractor)",
                "role": "owner",
                "hashed_password": hash_password("Owner@123"),
                "phone": "+91-9812345678",
                "organization": "Urban Sanitation Facilities Ltd.",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
            citizen_user = {
                "id": "usr_citizen_01",
                "email": "citizen@cleanai.org",
                "full_name": "Priya Sharma (Citizen)",
                "role": "citizen",
                "hashed_password": hash_password("Citizen@123"),
                "phone": "+91-9988776655",
                "organization": None,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
            self._memory_store["users"].extend([officer_user, owner_user, citizen_user])

        # 2. Seed initial realistic public toilets if none exist
        if not self._memory_store["toilets"]:
            now = datetime.utcnow()
            toilets = [
                {
                    "id": "tlt_001",
                    "name": "Connaught Place Block B Public Convenience",
                    "address": "Inner Circle, Block B, Connaught Place",
                    "city": "New Delhi",
                    "locality": "Connaught Place",
                    "latitude": 28.6315,
                    "longitude": 77.2167,
                    "description": "Modern public smart toilet facility with automatic sensor taps and handicap ramp.",
                    "facilities": ["Running Water", "Washbasin", "Western WC", "Indian Squat", "Soap Dispenser", "Accessible Ramp"],
                    "opening_hours": "06:00 - 23:00",
                    "accessibility": True,
                    "access_type": "public",
                    "contact_number": "+91-11-23344556",
                    "owner_id": "usr_owner_01",
                    "owner_name": "Suresh Patel",
                    "registration_status": "Approved",
                    "rejection_reason": None,
                    "verified_status": "Clean",
                    "last_inspected_at": (now - timedelta(hours=3)).isoformat(),
                    "last_cleaned_at": (now - timedelta(hours=4)).isoformat(),
                    "is_stale": False,
                    "rating": 4.6,
                    "total_complaints": 0,
                    "created_at": (now - timedelta(days=20)).isoformat(),
                    "updated_at": (now - timedelta(hours=3)).isoformat()
                },
                {
                    "id": "tlt_002",
                    "name": "Rajiv Chowk Metro Station Gate 2 Toilet",
                    "address": "Gate No. 2, Rajiv Chowk Concourse",
                    "city": "New Delhi",
                    "locality": "Rajiv Chowk",
                    "latitude": 28.6328,
                    "longitude": 77.2195,
                    "description": "High-footfall transit sanitation complex. Equipped with sanitary napkin vending machine.",
                    "facilities": ["Running Water", "Washbasin", "Urinals", "Western WC", "Sanitary Vending", "Accessible Ramp"],
                    "opening_hours": "05:30 - 23:30",
                    "accessibility": True,
                    "access_type": "public",
                    "contact_number": "+91-11-23348899",
                    "owner_id": "usr_owner_01",
                    "owner_name": "Suresh Patel",
                    "registration_status": "Approved",
                    "rejection_reason": None,
                    "verified_status": "Needs Cleaning",
                    "last_inspected_at": (now - timedelta(hours=1)).isoformat(),
                    "last_cleaned_at": (now - timedelta(hours=7)).isoformat(),
                    "is_stale": False,
                    "rating": 3.4,
                    "total_complaints": 2,
                    "created_at": (now - timedelta(days=15)).isoformat(),
                    "updated_at": (now - timedelta(hours=1)).isoformat()
                },
                {
                    "id": "tlt_003",
                    "name": "Janpath Central Market Public Facility",
                    "address": "Opposite Janpath Tibetan Market, Janpath Road",
                    "city": "New Delhi",
                    "locality": "Janpath",
                    "latitude": 28.6258,
                    "longitude": 77.2185,
                    "description": "Public toilet facility serving shoppers and tourists. Continuous water supply.",
                    "facilities": ["Running Water", "Indian Squat", "Urinals", "Washbasin"],
                    "opening_hours": "07:00 - 22:00",
                    "accessibility": False,
                    "access_type": "public",
                    "contact_number": "+91-11-23311223",
                    "owner_id": "usr_owner_01",
                    "owner_name": "Suresh Patel",
                    "registration_status": "Approved",
                    "rejection_reason": None,
                    "verified_status": "Clean",
                    "last_inspected_at": (now - timedelta(hours=5)).isoformat(),
                    "last_cleaned_at": (now - timedelta(hours=6)).isoformat(),
                    "is_stale": False,
                    "rating": 4.1,
                    "total_complaints": 0,
                    "created_at": (now - timedelta(days=10)).isoformat(),
                    "updated_at": (now - timedelta(hours=5)).isoformat()
                },
                {
                    "id": "tlt_004",
                    "name": "Barakhamba Road Transit Restroom",
                    "address": "Near Barakhamba Metro Exit Gate 4",
                    "city": "New Delhi",
                    "locality": "Barakhamba",
                    "latitude": 28.6300,
                    "longitude": 77.2274,
                    "description": "Civic toilet block undergoing pipe replacement and fixture re-tiling.",
                    "facilities": ["Running Water", "Western WC", "Urinals"],
                    "opening_hours": "06:00 - 22:00",
                    "accessibility": False,
                    "access_type": "public",
                    "contact_number": "+91-11-23399000",
                    "owner_id": "usr_owner_01",
                    "owner_name": "Suresh Patel",
                    "registration_status": "Approved",
                    "rejection_reason": None,
                    "verified_status": "Under Maintenance",
                    "last_inspected_at": (now - timedelta(hours=8)).isoformat(),
                    "last_cleaned_at": (now - timedelta(days=1)).isoformat(),
                    "is_stale": False,
                    "rating": 2.8,
                    "total_complaints": 1,
                    "created_at": (now - timedelta(days=8)).isoformat(),
                    "updated_at": (now - timedelta(hours=8)).isoformat()
                },
                {
                    "id": "tlt_005",
                    "name": "India Gate Children's Park Restroom",
                    "address": "Rajpath lawns, near Children's Park",
                    "city": "New Delhi",
                    "locality": "India Gate",
                    "latitude": 28.6129,
                    "longitude": 77.2295,
                    "description": "High visibility civic facility with dedicated female and male complexes and baby care station.",
                    "facilities": ["Running Water", "Washbasin", "Western WC", "Indian Squat", "Baby Changing", "Accessible Ramp"],
                    "opening_hours": "06:00 - 23:00",
                    "accessibility": True,
                    "access_type": "public",
                    "contact_number": "+91-11-23377112",
                    "owner_id": "usr_owner_01",
                    "owner_name": "Suresh Patel",
                    "registration_status": "Approved",
                    "rejection_reason": None,
                    "verified_status": "Clean",
                    "last_inspected_at": (now - timedelta(hours=2)).isoformat(),
                    "last_cleaned_at": (now - timedelta(hours=3)).isoformat(),
                    "is_stale": False,
                    "rating": 4.8,
                    "total_complaints": 0,
                    "created_at": (now - timedelta(days=30)).isoformat(),
                    "updated_at": (now - timedelta(hours=2)).isoformat()
                },
                {
                    "id": "tlt_006",
                    "name": "Paharganj Main Bazaar New Community Toilet",
                    "address": "Main Bazaar Road, Near Imperial Cinema",
                    "city": "New Delhi",
                    "locality": "Paharganj",
                    "latitude": 28.6412,
                    "longitude": 77.2140,
                    "description": "Newly constructed municipal facility submitted for official verification.",
                    "facilities": ["Running Water", "Washbasin", "Urinals", "Indian Squat"],
                    "opening_hours": "24x7",
                    "accessibility": True,
                    "access_type": "public",
                    "contact_number": "+91-11-23588990",
                    "owner_id": "usr_owner_01",
                    "owner_name": "Suresh Patel",
                    "registration_status": "Pending Approval",
                    "rejection_reason": None,
                    "verified_status": "Verification Pending",
                    "last_inspected_at": None,
                    "last_cleaned_at": None,
                    "is_stale": True,
                    "rating": 4.0,
                    "total_complaints": 0,
                    "created_at": (now - timedelta(hours=12)).isoformat(),
                    "updated_at": (now - timedelta(hours=12)).isoformat()
                }
            ]
            self._memory_store["toilets"].extend(toilets)

        # 3. Seed complaints
        if not self._memory_store["complaints"]:
            self._memory_store["complaints"].append({
                "id": "cmp_001",
                "reference_number": "CMP-2026-9042",
                "toilet_id": "tlt_002",
                "toilet_name": "Rajiv Chowk Metro Station Gate 2 Toilet",
                "user_id": "usr_citizen_01",
                "reporter_email": "citizen@cleanai.org",
                "category": "dirty_floor",
                "description": "Floor is wet and dirty near urinal row. Needs immediate mop.",
                "photo_url": None,
                "status": "Received",
                "resolution_notes": None,
                "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                "updated_at": (datetime.utcnow() - timedelta(hours=2)).isoformat()
            })

        # 4. Seed cleaning tasks
        if not self._memory_store["cleaning_tasks"]:
            self._memory_store["cleaning_tasks"].append({
                "id": "tsk_001",
                "toilet_id": "tlt_002",
                "toilet_name": "Rajiv Chowk Metro Station Gate 2 Toilet",
                "assigned_to_owner_id": "usr_owner_01",
                "assigned_to_owner_name": "Suresh Patel",
                "assigned_by_id": "usr_officer_01",
                "assigned_by_name": "Rajesh Kumar (Municipal Officer)",
                "status": "Pending",
                "priority": "High",
                "notes": "Urgent sanitation request following citizen complaint and inspection alert.",
                "completion_notes": None,
                "after_photo_url": None,
                "claimed_at": None,
                "verified_at": None,
                "created_at": (datetime.utcnow() - timedelta(hours=1)).isoformat()
            })

        self._save_fallback_store()

    # --- Generic Document Access API (Compatible with both MongoDB and Local Store) ---

    async def find_one(self, collection: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if self.is_mongo_connected and self.db is not None:
            doc = await self.db[collection].find_one(query)
            if doc and "_id" in doc:
                doc["_id"] = str(doc["_id"])
            return doc

        items = self._memory_store.get(collection, [])
        for item in items:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return item.copy()
        return None

    async def find(
        self,
        collection: str,
        query: Optional[Dict[str, Any]] = None,
        sort: Optional[List[tuple]] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        if self.is_mongo_connected and self.db is not None:
            cursor = self.db[collection].find(query or {})
            if sort:
                cursor = cursor.sort(sort)
            cursor = cursor.limit(limit)
            results = []
            async for doc in cursor:
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                results.append(doc)
            return results

        items = self._memory_store.get(collection, [])
        matched = []
        q = query or {}
        for item in items:
            match = True
            for k, v in q.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                matched.append(item.copy())

        # Simple memory sorting
        if sort:
            for field, direction in reversed(sort):
                matched.sort(key=lambda x: str(x.get(field, "")), reverse=(direction < 0))

        return matched[:limit]

    async def insert_one(self, collection: str, doc: Dict[str, Any]) -> str:
        doc_copy = doc.copy()
        if "id" not in doc_copy:
            import uuid
            doc_copy["id"] = f"{collection[:3]}_{uuid.uuid4().hex[:10]}"

        if self.is_mongo_connected and self.db is not None:
            res = await self.db[collection].insert_one(doc_copy)
            doc_copy["_id"] = str(res.inserted_id)

        if collection not in self._memory_store:
            self._memory_store[collection] = []
        self._memory_store[collection].append(doc_copy)
        self._save_fallback_store()
        return doc_copy["id"]

    async def update_one(self, collection: str, query: Dict[str, Any], update: Dict[str, Any]) -> bool:
        doc_updates = update.get("$set", update)

        if self.is_mongo_connected and self.db is not None:
            res = await self.db[collection].update_one(query, {"$set": doc_updates})
            # Also update local mirror
        
        items = self._memory_store.get(collection, [])
        updated = False
        for item in items:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                item.update(doc_updates)
                item["updated_at"] = datetime.utcnow().isoformat()
                updated = True
                break

        if updated:
            self._save_fallback_store()
        return updated

    async def count_documents(self, collection: str, query: Optional[Dict[str, Any]] = None) -> int:
        if self.is_mongo_connected and self.db is not None:
            return await self.db[collection].count_documents(query or {})
        
        items = await self.find(collection, query or {})
        return len(items)

db_manager = DatabaseManager()
