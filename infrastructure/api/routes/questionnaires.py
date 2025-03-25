from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import JSONResponse
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

router = APIRouter(prefix="/questionnaires", tags=["questionnaires"])


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
        options (List[str] | None): A list of possible answers for
        the question when applicable; defaults to None when not relevant.
    """
    text: str
    type: str
    options: List[str] | None = None


class CreateQuestionnaireRequest(BaseModel):
    title: str
    description: str
    questions: List[QuestionModel]
    is_anonymous: bool = False
    created_by: int
    due_date: datetime | None = None  # This is used only for assignment, not for creation


class UpdateQuestionnaireRequest(CreateQuestionnaireRequest):
    pass


class QuestionnaireAssign(BaseModel):
    """Schema for assigning questionnaire to group"""
    group_id: int
    due_date: datetime


# READ operations
@router.get("/")
async def list_questionnaires(
        limit: Optional[int] = None,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo)
):
    """
    List questionnaires
    - If limit is provided, returns only that many latest questionnaires
    - If limit is None, returns all questionnaires
    """
    try:
        questionnaires = await questionnaire_repo.get_questionnaires(limit=limit)

        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "count": len(questionnaires),
                "questionnaires": [
                    questionnaire_to_dict(q) for q in questionnaires
                ]
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing questionnaires: {str(e)}")


@router.get("/latest")
async def get_latest_questionnaires(
        limit: int = 10,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo)
):
    """
    Fetches the latest questionnaires from the repository.

    This asynchronous function retrieves a limited number of the latest questionnaires
    from a provided repository. It responds with a JSON-formatted response containing
    the questionnaires' data. The function handles potential exceptions and responds
    accordingly.

    Parameters:
        request (Request): The HTTP request object.
        limit (int, optional): The maximum number of questionnaires to fetch. Defaults to 10.
        questionnaire_repo (QuestionnaireRepo): The repository instance for accessing questionnaire data.

    Returns:
        JSONResponse: The response is a JSON object containing the questionnaires data.

    Raises:
        HTTPException: Handles generic exceptions during the function execution.
    """
    try:
        questionnaires = await questionnaire_repo.get_latest_questionnaires(limit=limit)

        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "count": len(questionnaires),
                "limit": limit,
                "questionnaires": [
                    questionnaire_to_dict(q) for q in questionnaires
                ]
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching latest questionnaires: {str(e)}")


@router.post("/{questionnaire_id}/assign")
async def assign_questionnaire(
    questionnaire_id: int,
    assignment: QuestionnaireAssign,
    questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo)
):
    """Assign questionnaire to a group"""
    try:
        # Check if questionnaire exists
        questionnaire = await questionnaire_repo.get_questionnaire(questionnaire_id)
        if not questionnaire:
            raise NotFoundError(f"Questionnaire {questionnaire_id} not found")

        # Check if group exists and is active
        group = await questionnaire_repo.get_group(assignment.group_id)
        if not group:
            raise NotFoundError(f"Group {assignment.group_id} not found")
        if not group.is_active:
            raise DatabaseError(f"Group {assignment.group_id} is not active")

        # Create assignment
        assignment = await questionnaire_repo.assign_questionnaire(
            questionnaire_id=questionnaire_id,
            group_id=assignment.group_id,
            due_date=assignment.due_date,
            bot=get_bot(),
            bot_username="cyprus_university_bot"
        )

        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": "Questionnaire assigned successfully",
                "questionnaire": questionnaire_to_dict(questionnaire)
            }
        )

    except NotFoundError as e:
        return JSONResponse(
            status_code=404,
            content={"status": "error", "message": str(e)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Error assigning questionnaire: {str(e)}"}
        )


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

        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "questionnaire": questionnaire_to_dict(questionnaire)
            }
        )
    except NotFoundError as e:
        return JSONResponse(
            status_code=404,
            content={"status": "error", "message": str(e)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Error fetching questionnaire: {str(e)}"}
        )


# CREATE operations
@router.get("/create")
async def create_questionnaire_form(
        request: Request
):
    """Show API schema for creating a questionnaire"""
    return JSONResponse(
        status_code=200,
        content={
            "message": "POST to this endpoint to create a questionnaire",
            "schema": CreateQuestionnaireRequest.schema()
        }
    )


@router.post("/")
async def create_questionnaire(
        request: Request,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        user_repo: UserRepo = Depends(get_user_repo)
):
    """Create a new questionnaire"""
    try:
        questionnaire_data = await parse_questionnaire_data(request)

        # First ensure user exists
        user = await user_repo.get_user(questionnaire_data["created_by"])
        if not user:
            raise NotFoundError(f"User with ID {questionnaire_data['created_by']} not found")

        questionnaire = await questionnaire_repo.create_questionnaire(**questionnaire_data)

        return JSONResponse(
            status_code=201,
            content={
                "status": "success",
                "questionnaire_id": questionnaire.id
            }
        )
    except NotFoundError as e:
        return JSONResponse(
            status_code=404,
            content={"status": "error", "message": str(e)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Error creating questionnaire: {str(e)}"}
        )


# UPDATE operations
@router.put("/{questionnaire_id}")
async def update_questionnaire(
    questionnaire_id: int,
    request: Request,
    questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo)
):
    """Update an existing questionnaire"""
    try:
        questionnaire_data = await parse_questionnaire_data(request)
        updated = await questionnaire_repo.update_questionnaire(
            questionnaire_id=questionnaire_id,
            **questionnaire_data
        )

        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "questionnaire": questionnaire_to_dict(updated)
            }
        )
    except NotFoundError as e:
        return JSONResponse(
            status_code=404,
            content={"status": "error", "message": str(e)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Error updating questionnaire: {str(e)}"}
        )


# DELETE operations
@router.delete("/{questionnaire_id}")
async def delete_questionnaire(
        questionnaire_id: int,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo)
):
    """Delete a questionnaire"""
    try:
        await questionnaire_repo.delete_questionnaire(questionnaire_id)

        return JSONResponse(
            status_code=200,
            content={"status": "success", "message": "Questionnaire deleted"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting questionnaire: {str(e)}")


# Helper functions
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


async def parse_questionnaire_data(request: Request) -> dict:
    """Parse questionnaire data from request"""
    data = await request.json()
    request_model = CreateQuestionnaireRequest(**data)
    questionnaire_data = request_model.dict()

    # Remove fields that shouldn't be updated
    if request.method == "PUT":
        questionnaire_data.pop('created_by', None)
        questionnaire_data.pop('due_date', None)
    return questionnaire_data