from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional, Dict
from uuid import uuid4

from .schemas import ReportCreate, Report


STATUSES = ["Pending", "In Progress", "Resolved"]


def now_iso() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class MemoryStore:
    reports: List[Report] = field(default_factory=list)

    def create_report(self, data: ReportCreate) -> Report:
        created_at = now_iso()
        report = Report(
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
        self.reports.insert(0, report)
        return report

    def list_reports(self, status: Optional[str] = None, q: Optional[str] = None) -> List[Report]:
        items = self.reports
        if status and status in STATUSES:
            items = [r for r in items if r.status == status]
        if q:
            qq = q.lower()
            items = [
                r
                for r in items
                if (
                    (r.description or "").lower().find(qq) >= 0
                    or (str(r.ward) if r.ward is not None else "").lower().find(qq) >= 0
                    or (r.address or "").lower().find(qq) >= 0
                    or r.id.lower().find(qq) >= 0
                )
            ]
        return items

    def get_report(self, report_id: str) -> Optional[Report]:
        return next((r for r in self.reports if r.id == report_id), None)

    def update_status(self, report_id: str, status: str) -> Optional[Report]:
        if status not in STATUSES:
            raise ValueError("Invalid status")
        r = self.get_report(report_id)
        if r is None:
            return None
        r.status = status
        r.updatedAt = now_iso()
        return r

    def stats(self) -> Dict:
        by = {s: 0 for s in STATUSES}
        for r in self.reports:
            by[r.status] = by.get(r.status, 0) + 1
        return {"total": len(self.reports), "byStatus": by}


def create_memory_store() -> MemoryStore:
    return MemoryStore()


