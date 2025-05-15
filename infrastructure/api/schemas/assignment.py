from typing import List, Optional, Any, Dict
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/assignments", tags=["assignments"])

class AssignmentCreateRequest(BaseModel):
    questionnaire_id: int
    group_id: int
    name: Optional[str] = None
    start_time: datetime
    deadline_time: datetime


class AssignmentUpdateRequest(BaseModel):
    name: Optional[str] = None
    start_time: Optional[datetime] = None
    deadline_time: Optional[datetime] = None


class AssignmentResponse(BaseModel):
    id: int
    questionnaire_id: int
    questionnaire: Dict[str, Any]
    group_id: int
    group: Dict[str, Any]
    name: str
    start_time: str
    deadline_time: str
    created_by: int
    created_at: str
    updated_at: Optional[str] = None
    status: str  # active, completed, upcoming
    response_count: Optional[int] = None
    completion_rate: Optional[float] = None


class PaginatedAssignmentsResponse(BaseModel):
    status: str = "success"
    total: int
    page: int
    per_page: int
    total_pages: int
    assignments: List[AssignmentResponse]
