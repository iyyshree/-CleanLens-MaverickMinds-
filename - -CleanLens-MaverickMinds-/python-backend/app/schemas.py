from pydantic import BaseModel, Field, HttpUrl, field_validator
from typing import Optional, Literal, Union
from datetime import datetime


StatusLiteral = Literal["Pending", "In Progress", "Resolved"]
UrgencyLiteral = Literal["Low", "Medium", "High"]


class ReportCreate(BaseModel):
    userId: str
    description: Optional[str] = ""
    imageUrl: HttpUrl | str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    address: Optional[str] = ""
    ward: Optional[Union[str, int]] = None
    urgency: UrgencyLiteral = "Low"
    timestamp: Optional[str] = None

    @field_validator("imageUrl")
    @classmethod
    def validate_image_url(cls, v: str):
        # allow data URLs for quick demos
        if isinstance(v, str) and v.startswith("data:"):
            return v
        return v


class Report(BaseModel):
    id: str
    status: StatusLiteral
    createdAt: datetime
    updatedAt: datetime
    userId: str
    description: Optional[str] = ""
    imageUrl: str
    latitude: float
    longitude: float
    address: Optional[str] = ""
    ward: Optional[Union[str, int]] = None
    urgency: UrgencyLiteral = "Low"
    timestamp: Optional[str] = None


class StatusUpdate(BaseModel):
    status: StatusLiteral


class Stats(BaseModel):
    total: int
    byStatus: dict

