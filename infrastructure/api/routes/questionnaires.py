from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from infrastructure.database.repo.users import UserRepo
from infrastructure.database.models import Questionnaire
from infrastructure.api.dependencies import (
    get_questionnaire_repo,
    get_user_repo,
    get_bot
)
from infrastructure.database.exceptions import NotFoundError, DatabaseError
from infrastructure.database.repo.questionnaires import QuestionnaireRepo

router = APIRouter(prefix="/questionnaire", tags=["questionnaires"])


class QuestionModel(BaseModel):
    text: str
    type: str
    options: List[str] | None = None


class CreateQuestionnaireRequest(BaseModel):
    title: str
    description: str
    questions: List[QuestionModel]
    is_anonymous: bool = False
    created_by: int
    due_date: datetime | None = None


class UpdateQuestionnaireRequest(BaseModel):
    title: str
    description: str
    questions: List[QuestionModel]
    is_anonymous: bool = False


class QuestionnaireAssign(BaseModel):
    group_id: int
    due_date: datetime


@router.get("/")
async def list_questionnaires(
        limit: Optional[int] = None,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo)
):
    """List questionnaires"""
    try:
        questionnaires = await questionnaire_repo.get_questionnaires(limit=limit)
        return {
            "status": "success",
            "count": len(questionnaires),
            "questionnaires": [questionnaire_to_dict(q) for q in questionnaires]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing questionnaires: {str(e)}")


@router.get("/latest")
async def get_latest_questionnaires(
        limit: int = 10,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo)
):
    """Get latest questionnaires"""
    try:
        questionnaires = await questionnaire_repo.get_latest_questionnaires(limit=limit)
        return {
            "status": "success",
            "count": len(questionnaires),
            "limit": limit,
            "questionnaires": [questionnaire_to_dict(q) for q in questionnaires]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching latest questionnaires: {str(e)}")


@router.get("/{questionnaire_id}")
async def get_questionnaire(
        questionnaire_id: int,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo)
):
    """Get a specific questionnaire by ID"""
    try:
        questionnaire = await questionnaire_repo.get_questionnaire(questionnaire_id)
        if not questionnaire:
            raise NotFoundError(f"Questionnaire with ID {questionnaire_id} not found")

        return {
            "status": "success",
            "questionnaire": questionnaire_to_dict(questionnaire)
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching questionnaire: {str(e)}")


@router.post("/")
async def create_questionnaire(
        questionnaire: CreateQuestionnaireRequest,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        user_repo: UserRepo = Depends(get_user_repo)
):
    """Create a new questionnaire"""
    try:
        user = await user_repo.get_user(questionnaire.created_by)
        if not user:
            raise NotFoundError(f"User with ID {questionnaire.created_by} not found")

        created = await questionnaire_repo.create_questionnaire(**questionnaire.dict())
        return {
            "status": "success",
            "questionnaire_id": created.id
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating questionnaire: {str(e)}")


@router.put("/{questionnaire_id}")
async def update_questionnaire(
    questionnaire_id: int,
    questionnaire: UpdateQuestionnaireRequest,
    questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo)
):
    """Update an existing questionnaire"""
    try:
        updated = await questionnaire_repo.update_questionnaire(
            questionnaire_id=questionnaire_id,
            **questionnaire.dict()
        )
        return {
            "status": "success",
            "questionnaire": questionnaire_to_dict(updated)
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating questionnaire: {str(e)}")


@router.delete("/{questionnaire_id}")
async def delete_questionnaire(
        questionnaire_id: int,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo)
):
    """Delete a questionnaire"""
    try:
        await questionnaire_repo.delete_questionnaire(questionnaire_id)
        return {
            "status": "success",
            "message": "Questionnaire deleted"
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting questionnaire: {str(e)}")
    

def questionnaire_to_dict(questionnaire: Questionnaire) -> dict:
    """Convert questionnaire model to dictionary"""
    return {
        "id": questionnaire.id,
        "title": questionnaire.title,
        "description": questionnaire.description,
        "questions": questionnaire.questions,
        "created_by": questionnaire.created_by,
        "is_anonymous": questionnaire.is_anonymous,
        "created_at": questionnaire.created_at.isoformat()
    }
