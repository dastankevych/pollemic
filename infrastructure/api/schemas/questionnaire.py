from typing import List, Optional, Any, Dict
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/questionnaires", tags=["questionnaires"])

# Models
class QuestionOption(BaseModel):
    text: str


class QuestionModel(BaseModel):
    """
    Encapsulates the structure of a question in a model.

    This class defines a question model that includes the textual information,
    its type, and optional answer selections when applicable. It can be used
    to structure questions for surveys, quizzes, or other systems requiring
    a standardized question format.

    Attributes:
        text (str): The main content or body of the question.
        type (str): The category or classification of the question (e.g.,
        multiple-choice, open-ended).
        options (List[str] | None): A list of possible answers for the
        question when applicable; defaults to None when not relevant.
    """
    text: str
    type: str
    options: List[str] | None = None


class CreateQuestionnaireRequest(BaseModel):
    title: str
    description: str
    questions: List[QuestionModel]
    created_by: int
    tags: List[str] = Field(default_factory=list)
    status: str = "draft"  # draft, active, completed


class UpdateQuestionnaireRequest(BaseModel):
    title: str
    description: str
    questions: List[QuestionModel]
    tags: List[str] = Field(default_factory=list)
    status: Optional[str] = None


class QuestionnaireResponse(BaseModel):
    id: int
    title: str
    description: str
    questions: List[Dict[str, Any]]
    created_by: int
    creator: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: Optional[str] = None
    status: str
    tags: List[str]
    response_count: Optional[int] = None
    completion_rate: Optional[float] = None


class PaginatedQuestionnairesResponse(BaseModel):
    status: str = "success"
    total: int
    page: int
    per_page: int
    total_pages: int
    questionnaires: List[QuestionnaireResponse]
