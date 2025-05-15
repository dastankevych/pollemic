from typing import List, Optional, Any, Dict
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/responses", tags=["responses"])


# Models
class ResponseSubmitRequest(BaseModel):
    assignment_id: int
    student_id: int
    answers: Dict[str, Any]
    is_completed: bool = True


class ResponseUpdateRequest(BaseModel):
    answers: Dict[str, Any]
    is_completed: bool = True


class ResponseModel(BaseModel):
    id: int
    assignment_id: int
    assignment: Optional[Dict[str, Any]] = None
    student_id: int
    student: Optional[Dict[str, Any]] = None
    answers: Dict[str, Any]
    is_completed: bool
    submitted_at: str
    created_at: str
    updated_at: Optional[str] = None


class PaginatedResponsesResponse(BaseModel):
    status: str = "success"
    total: int
    page: int
    per_page: int
    total_pages: int
    responses: List[ResponseModel]


class ResponseStatisticsResponse(BaseModel):
    status: str = "success"
    total_responses: int
    completed_responses: int
    completion_rate: float
    time_based_stats: Optional[List[Dict[str, Any]]] = None


class StudentProgressResponse(BaseModel):
    status: str = "success"
    student_id: int
    total_assignments: int
    completed_assignments: int
    completion_rate: float
    assignments: Dict[str, Dict[str, Any]]
