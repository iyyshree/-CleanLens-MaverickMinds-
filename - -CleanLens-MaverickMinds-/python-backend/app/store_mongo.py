from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Optional, Dict, List
from uuid import uuid4

from pymongo import MongoClient, ASCENDING
from pymongo.collection import Collection

from .schemas import ReportCreate, Report


STATUSES = ["Pending", "In Progress", "Resolved"]


def now_iso() -> datetime:
    return datetime.now(timezone.utc)


class MongoStore:
    def __init__(self, collection: Collection):
        self.col = collection
        # Indexes
        self.col.create_index([("id", ASCENDING)], unique=True)
        self.col.create_index([("status", ASCENDING)])
        self.col.create_index([("createdAt", ASCENDING)])

    def _doc_to_report(self, doc: dict) -> Report:
        return Report(**{k: doc[k] for k in Report.model_fields.keys() if k in doc})

    def create_report(self, data: ReportCreate) -> Report:
        created_at = now_iso()
        report: Report = Report(
            id=str(uuid4()),
            status="Pending",
            createdAt=created_at,
            updatedAt=created_at,
            userId=data.userId,
            description=data.description or "",
            imageUrl=str(data.imageUrl),
            latitude=data.latitude,
            longitude=data.longitude,
            address=data.address or "",
            ward=data.ward,
            urgency=data.urgency,
            timestamp=data.timestamp,
        )
        self.col.insert_one(report.model_dump())
        return report

    def list_reports(self, status: Optional[str] = None, q: Optional[str] = None) -> List[Report]:
        query: Dict = {}
        if status and status in STATUSES:
            query["status"] = status
        cur = self.col.find(query).sort("createdAt", -1)
        items = [self._doc_to_report(d) for d in cur]
        if q:
            qq = q.lower()
            items = [
                r for r in items
                if (
                    (r.description or "").lower().find(qq) >= 0
                    or (str(r.ward) if r.ward is not None else "").lower().find(qq) >= 0
                    or (r.address or "").lower().find(qq) >= 0
                    or r.id.lower().find(qq) >= 0
                )
            ]
        return items

    def get_report(self, report_id: str) -> Optional[Report]:
        d = self.col.find_one({"id": report_id})
        return self._doc_to_report(d) if d else None

    def update_status(self, report_id: str, status: str) -> Optional[Report]:
        if status not in STATUSES:
            raise ValueError("Invalid status")
        res = self.col.find_one_and_update(
            {"id": report_id},
            {"$set": {"status": status, "updatedAt": now_iso()}},
            return_document=True,
        )
        return self._doc_to_report(res) if res else None

    def stats(self) -> Dict:
        by = {s: 0 for s in STATUSES}
        for d in self.col.find({}, {"status": 1, "_id": 0}):
            st = d.get("status")
            if st in by:
                by[st] += 1
        total = sum(by.values())
        return {"total": total, "byStatus": by}


def create_mongo_store() -> MongoStore:
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DB", "clean_lens")
    coll_name = os.getenv("MONGODB_COLLECTION", "reports")
    if not uri:
        raise RuntimeError("MONGODB_URI not set")
    client = MongoClient(uri)
    col = client[db_name][coll_name]
    return MongoStore(col)


