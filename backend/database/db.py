import json
import logging
import asyncio
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import bcrypt

from config import settings

logger = logging.getLogger("clean_ai.db")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
FALLBACK_STORE_FILE = DATA_DIR / "db_store.json"
SQLITE_DB_FILE = DATA_DIR / "clean_ai.db"

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if not hashed_password or not plain_password:
            return False
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

class DatabaseManager:
    """
    Unified MongoDB, SQLite, and JSON Storage Manager.
    Ensures zero downtime:
    1. Connects to MongoDB Atlas / Local MongoDB when available.
    2. Maintains a native SQLite database (clean_ai.db) for direct SQL inspection.
    3. Synchronizes fallback JSON store (db_store.json) for human-readable audit.
    4. Auto-syncs all offline/local data to MongoDB the moment MongoDB is online.
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
        self._init_sqlite()
        self._load_fallback_store()
        self._seed_and_sync_users()
        self._save_all_local()

    def _init_sqlite(self):
        """Initializes tables in the local SQLite database file."""
        conn = None
        try:
            conn = sqlite3.connect(SQLITE_DB_FILE)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE,
                    full_name TEXT,
                    role TEXT,
                    hashed_password TEXT,
                    phone TEXT,
                    organization TEXT,
                    is_active INTEGER,
                    created_at TEXT,
                    raw_data TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS toilets (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    address TEXT,
                    city TEXT,
                    locality TEXT,
                    latitude REAL,
                    longitude REAL,
                    registration_status TEXT,
                    verified_status TEXT,
                    created_at TEXT,
                    raw_data TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS complaints (
                    id TEXT PRIMARY KEY,
                    reference_number TEXT UNIQUE,
                    toilet_id TEXT,
                    issue_type TEXT,
                    status TEXT,
                    created_at TEXT,
                    raw_data TEXT
                )
            """)
            for col in ["inspections", "cleaning_tasks", "notifications", "audit_logs"]:
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS {col} (
                        id TEXT PRIMARY KEY,
                        created_at TEXT,
                        raw_data TEXT
                    )
                """)
            conn.commit()
        except Exception as e:
            logger.warning(f"Could not initialize SQLite tables: {e}")
        finally:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass

    def _load_fallback_store(self):
        if FALLBACK_STORE_FILE.exists():
            try:
                with open(FALLBACK_STORE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for k in self._memory_store.keys():
                        if k in data:
                            self._memory_store[k] = data[k]
                logger.info(f"Loaded persistent store from {FALLBACK_STORE_FILE}")
            except Exception as e:
                logger.warning(f"Could not load fallback store: {e}")

    def _save_all_local(self):
        """Persists memory store to both db_store.json and clean_ai.db SQLite."""
        # 1. Save JSON
        try:
            with open(FALLBACK_STORE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._memory_store, f, default=str, indent=2)
        except Exception as e:
            logger.error(f"Failed to persist fallback JSON store: {e}")

        # 2. Sync to SQLite
        conn = None
        try:
            conn = sqlite3.connect(SQLITE_DB_FILE)
            cursor = conn.cursor()
            
            # Users
            for u in self._memory_store.get("users", []):
                cursor.execute("""
                    INSERT INTO users (id, email, full_name, role, hashed_password, phone, organization, is_active, created_at, raw_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        email=excluded.email,
                        full_name=excluded.full_name,
                        role=excluded.role,
                        hashed_password=excluded.hashed_password,
                        phone=excluded.phone,
                        organization=excluded.organization,
                        is_active=excluded.is_active,
                        raw_data=excluded.raw_data
                """, (
                    u.get("id"),
                    u.get("email"),
                    u.get("full_name"),
                    u.get("role"),
                    u.get("hashed_password"),
                    u.get("phone"),
                    u.get("organization"),
                    1 if u.get("is_active", True) else 0,
                    u.get("created_at"),
                    json.dumps(u, default=str)
                ))

            # Toilets
            for t in self._memory_store.get("toilets", []):
                cursor.execute("""
                    INSERT INTO toilets (id, name, address, city, locality, latitude, longitude, registration_status, verified_status, created_at, raw_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        name=excluded.name,
                        address=excluded.address,
                        city=excluded.city,
                        locality=excluded.locality,
                        latitude=excluded.latitude,
                        longitude=excluded.longitude,
                        registration_status=excluded.registration_status,
                        verified_status=excluded.verified_status,
                        raw_data=excluded.raw_data
                """, (
                    t.get("id"),
                    t.get("name"),
                    t.get("address"),
                    t.get("city"),
                    t.get("locality"),
                    t.get("latitude", 0.0),
                    t.get("longitude", 0.0),
                    t.get("registration_status"),
                    t.get("verified_status"),
                    t.get("created_at"),
                    json.dumps(t, default=str)
                ))

            # Complaints
            for c in self._memory_store.get("complaints", []):
                cursor.execute("""
                    INSERT INTO complaints (id, reference_number, toilet_id, issue_type, status, created_at, raw_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        reference_number=excluded.reference_number,
                        toilet_id=excluded.toilet_id,
                        issue_type=excluded.issue_type,
                        status=excluded.status,
                        raw_data=excluded.raw_data
                """, (
                    c.get("id"),
                    c.get("reference_number"),
                    c.get("toilet_id"),
                    c.get("issue_type"),
                    c.get("status"),
                    c.get("created_at"),
                    json.dumps(c, default=str)
                ))

            # Other generic collections
            for col in ["inspections", "cleaning_tasks", "notifications", "audit_logs"]:
                for item in self._memory_store.get(col, []):
                    cursor.execute(f"""
                        INSERT INTO {col} (id, created_at, raw_data)
                        VALUES (?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            raw_data=excluded.raw_data
                    """, (
                        item.get("id"),
                        item.get("created_at"),
                        json.dumps(item, default=str)
                    ))

            conn.commit()
        except Exception as e:
            logger.warning(f"Failed to sync SQLite store: {e}")
        finally:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass

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
            await self._sync_local_to_mongo()
        except Exception as e:
            self.is_mongo_connected = False
            logger.warning(f"MongoDB not reachable at {settings.MONGODB_URI}. Operating seamlessly in SQLite & JSON store mode. Reason: {e}")

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

    async def _sync_local_to_mongo(self):
        """Sync local memory store data to MongoDB if not present in MongoDB."""
        if not self.is_mongo_connected or self.db is None:
            return
        try:
            for collection, docs in self._memory_store.items():
                for doc in docs:
                    doc_id = doc.get("id")
                    if doc_id:
                        exists = await self.db[collection].find_one({"id": doc_id})
                        if not exists:
                            doc_to_insert = doc.copy()
                            if "_id" in doc_to_insert:
                                del doc_to_insert["_id"]
                            await self.db[collection].insert_one(doc_to_insert)
            logger.info("Synchronized local records to MongoDB successfully.")
        except Exception as e:
            logger.warning(f"Failed to sync local data to MongoDB: {e}")

    def _seed_and_sync_users(self):
        """Ensures default demo accounts and Aditya Sharma's officer accounts exist and have valid password hashes."""
        users = self._memory_store.setdefault("users", [])
        user_by_email = {u.get("email", "").lower(): u for u in users}

        # Valid bcrypt hashes
        h_shukla30 = "$2b$12$G4L7GfkBFgfpkjyAV6xP8.UP9G.M2A2BT6BWje1OsNECtZSXOg/1e" # Shukla@30
        h_officer = "$2b$12$EsWLgZ5LOADakrhlQsJ4zeHXS7Hos3TD9h.a2MXtNRK8oW04x1HBO"  # Officer@123
        h_owner = "$2b$12$/7XG7V4HeUClmP57rDFjfemE26naM0JUCLXYwz/ReLh.SNCbA7Gx6"    # Owner@123
        h_citizen = "$2b$12$Vop7AXQc9dvsRmjhGlX6juRJ38aZMTEBAZz3NqwmJZl5ltF.C19Ca"  # Citizen@123

        target_seed = [
            {
                "id": "usr_aditya_sharma_01",
                "email": "adityashuka0913@gmail.com",
                "full_name": "Aditya Sharma",
                "role": "officer",
                "hashed_password": h_shukla30,
                "phone": "+91-9876543210",
                "organization": "Municipal Health & Sanitation Department",
                "is_active": True,
                "created_at": "2026-10-18T21:30:00.000000"
            },
            {
                "id": "usr_aditya_sharma_02",
                "email": "adityashukla0913@gmail.com",
                "full_name": "Aditya Sharma",
                "role": "officer",
                "hashed_password": h_shukla30,
                "phone": "+91-9876543210",
                "organization": "Municipal Health & Sanitation Department",
                "is_active": True,
                "created_at": "2026-10-18T21:31:15.622517"
            },
            {
                "id": "usr_officer_01",
                "email": "officer@cleanai.gov",
                "full_name": "Rajesh Kumar (Municipal Officer)",
                "role": "officer",
                "hashed_password": h_officer,
                "phone": "+91-9876543210",
                "organization": "Municipal Health & Sanitation Department",
                "is_active": True,
                "created_at": "2026-10-18T09:35:54.054876"
            },
            {
                "id": "usr_owner_01",
                "email": "owner@cleanai.com",
                "full_name": "Suresh Patel (Facility Contractor)",
                "role": "owner",
                "hashed_password": h_owner,
                "phone": "+91-9812345678",
                "organization": "Urban Sanitation Facilities Ltd.",
                "is_active": True,
                "created_at": "2026-10-18T09:35:54.390119"
            },
            {
                "id": "usr_citizen_01",
                "email": "citizen@cleanai.org",
                "full_name": "Priya Sharma (Citizen)",
                "role": "citizen",
                "hashed_password": h_citizen,
                "phone": "+91-9988776655",
                "organization": None,
                "is_active": True,
                "created_at": "2026-10-18T09:35:54.725000"
            }
        ]

        for seed in target_seed:
            email_lower = seed["email"].lower()
            if email_lower in user_by_email:
                # Update existing user to ensure valid password hash and officer role
                existing = user_by_email[email_lower]
                existing["hashed_password"] = seed["hashed_password"]
                existing["role"] = seed["role"]
                existing["full_name"] = seed["full_name"]
                if not existing.get("organization"):
                    existing["organization"] = seed.get("organization")
                existing["is_active"] = True
            else:
                users.append(seed)
                user_by_email[email_lower] = seed

    # --- Generic Document Access API (Compatible with MongoDB, SQLite, and JSON Store) ---

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
        self._save_all_local()
        return doc_copy["id"]

    async def update_one(self, collection: str, query: Dict[str, Any], update: Dict[str, Any]) -> bool:
        doc_updates = update.get("$set", update)

        if self.is_mongo_connected and self.db is not None:
            await self.db[collection].update_one(query, {"$set": doc_updates})
        
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
            self._save_all_local()
        return updated

    async def count_documents(self, collection: str, query: Optional[Dict[str, Any]] = None) -> int:
        if self.is_mongo_connected and self.db is not None:
            return await self.db[collection].count_documents(query or {})
        
        items = await self.find(collection, query or {})
        return len(items)

    async def delete_one(self, collection: str, query: Dict[str, Any]) -> bool:
        if self.is_mongo_connected and self.db is not None:
            await self.db[collection].delete_one(query)

        items = self._memory_store.get(collection, [])
        for i, item in enumerate(items):
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                items.pop(i)
                self._save_all_local()
                return True
        return False

    async def delete_many(self, collection: str, query: Dict[str, Any]) -> int:
        deleted_count = 0
        if self.is_mongo_connected and self.db is not None:
            res = await self.db[collection].delete_many(query)
            deleted_count = res.deleted_count

        items = self._memory_store.get(collection, [])
        retained = []
        local_deleted = 0
        for item in items:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if not match:
                retained.append(item)
            else:
                local_deleted += 1

        self._memory_store[collection] = retained
        if local_deleted > 0:
            self._save_all_local()
        return deleted_count or local_deleted

db_manager = DatabaseManager()
