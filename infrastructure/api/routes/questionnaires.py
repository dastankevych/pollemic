from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from infrastructure.database.repo.users import UserRepo
from infrastructure.database.models import Questionnaire
from infrastructure.api.dependencies import (
    get_questionnaire_repo,
    get_user_repo,
    is_api_request, get_bot
)
from infrastructure.database.exceptions import NotFoundError, DatabaseError
from infrastructure.database.repo.questionnaires import QuestionnaireRepo
router = APIRouter(prefix="/questionnaires", tags=["questionnaires"])
templates = Jinja2Templates(directory="infrastructure/api/static/templates")


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
        request: Request,
        limit: Optional[int] = None,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        is_api: bool = Depends(is_api_request)
):
    """
    List questionnaires
    - If limit is provided, returns only that many latest questionnaires
    - If limit is None, returns all questionnaires
    """
    try:
        questionnaires = await questionnaire_repo.get_questionnaires(limit=limit)

        if is_api:
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

        return templates.TemplateResponse(
            "list_questionnaires.html",
            {
                "request": request,
                "questionnaires": questionnaires,
                "limit": limit
            }
        )
    except Exception as e:
        handle_error(e, is_api, request, "Error listing questionnaires")


@router.get("/latest")
async def get_latest_questionnaires(
        request: Request,
        limit: int = 10,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        is_api: bool = Depends(is_api_request)
):
    """
    Fetches the latest questionnaires from the repository.

    This asynchronous function retrieves a limited number of the latest questionnaires
    from a provided repository. If the request originates from an API, it responds with
    a JSON-formatted response containing the questionnaires' data. Otherwise, it renders
    an HTML template using the data. The function handles potential exceptions and responds
    accordingly based on the request type.

    Parameters:
        request (Request): The HTTP request object.
        limit (int, optional): The maximum number of questionnaires to fetch. Defaults to 10.
        repo (UserRepo): The repository instance for accessing user data.
        is_api (bool): A boolean indicating whether the request originates from an API call.

    Returns:
        JSONResponse or TemplateResponse: The response is either a JSON object for API requests
        or a rendered HTML page for non-API requests.

    Raises:
        Exception: Handles generic exceptions during the function execution, providing
        adequate responses based on the request type.
    """
    try:
        questionnaires = await questionnaire_repo.get_latest_questionnaires(limit=limit)

        if is_api:
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

        return templates.TemplateResponse(
            "latest_questionnaires.html",
            {
                "request": request,
                "questionnaires": questionnaires,
                "limit": limit
            }
        )
    except Exception as e:
        handle_error(e, is_api, request, "Error fetching latest questionnaires")


@router.post("/{questionnaire_id}/assign")
async def assign_questionnaire(
    questionnaire_id: int,
    assignment: QuestionnaireAssign,
    request: Request,
    questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
    is_api: bool = Depends(is_api_request)
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
            bot_username="vinylonbot"
        )

        if is_api:
            return JSONResponse(
                status_code=200,
                content={
                    "status": "success",
                    "message": "Questionnaire assigned successfully",
                    "questionnaire": questionnaire_to_dict(questionnaire)
                }
            )

        return templates.TemplateResponse(
            "assignment_success.html",
            {
                "request": request,
                "questionnaire": questionnaire,
                "group": group
            }
        )

    except NotFoundError as e:
        if is_api:
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": str(e)}
            )
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": str(e)}
        )
    except Exception as e:
        if is_api:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": f"Error assigning questionnaire: {str(e)}"}
            )
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": f"Error assigning questionnaire: {str(e)}"}
        )


@router.get("/{questionnaire_id}")
async def get_questionnaire(
        questionnaire_id: int,
        request: Request,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        is_api: bool = Depends(is_api_request)
):
    """Get a specific questionnaire by ID"""
    try:
        questionnaire = await questionnaire_repo.get_questionnaire(questionnaire_id)
        if not questionnaire:
            raise NotFoundError(f"Questionnaire with ID {questionnaire_id} not found")

        if is_api:
            return JSONResponse(
                status_code=200,
                content={
                    "status": "success",
                    "questionnaire": questionnaire_to_dict(questionnaire)
                }
            )

        return templates.TemplateResponse(
            "view_questionnaire.html",
            {"request": request, "questionnaire": questionnaire}
        )
    except NotFoundError as e:
        if is_api:
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": str(e)}
            )
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": str(e)}
        )
    except Exception as e:
        if is_api:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": f"Error fetching questionnaire: {str(e)}"}
            )
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": f"Error fetching questionnaire: {str(e)}"}
        )

# CREATE operations
@router.get("/create")
async def create_questionnaire_form(
        request: Request,
        is_api: bool = Depends(is_api_request)
):
    """Show questionnaire creation form or API schema"""
    if is_api:
        return JSONResponse(
            status_code=200,
            content={
                "message": "POST to this endpoint to create a questionnaire",
                "schema": CreateQuestionnaireRequest.schema()
            }
        )

    return templates.TemplateResponse(
        "create_questionnaire.html",
        {"request": request}
    )


@router.get("/assignments")
async def list_assignments(
        request: Request,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        is_api: bool = Depends(is_api_request)
):
    """
    List all questionnaire assignments
    """
    try:
        assignments = await questionnaire_repo.get_active_assignments()

        if is_api:
            return JSONResponse(
                status_code=200,
                content={
                    "status": "success",
                    "count": len(assignments),
                    "assignments": [
                        {
                            "id": assignment.id,
                            "questionnaire_id": assignment.questionnaire_id,
                            "questionnaire": questionnaire_to_dict(assignment.questionnaire),
                            "group_id": assignment.group_id,
                            "group": {
                                "group_id": assignment.group.group_id,
                                "title": assignment.group.title,
                                "is_active": assignment.group.is_active
                            },
                            "due_date": assignment.due_date.isoformat(),
                            "is_active": assignment.is_active,
                            "recurrence": "Once"  # Default to Once since recurrence isn't in the current model
                        } for assignment in assignments
                    ]
                }
            )

        return templates.TemplateResponse(
            "list_assignments.html",
            {
                "request": request,
                "assignments": assignments
            }
        )
    except Exception as e:
        if is_api:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": f"Error listing assignments: {str(e)}"}
            )
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": f"Error listing assignments: {str(e)}"}
        )


@router.post("/")
async def create_questionnaire(
        request: Request,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        user_repo: UserRepo = Depends(get_user_repo),
        is_api: bool = Depends(is_api_request)
):
    """Create a new questionnaire"""
    try:
        questionnaire_data = await parse_questionnaire_data(request, is_api)

        # First ensure user exists
        user = await user_repo.get_user(questionnaire_data["created_by"])
        if not user:
            raise NotFoundError(f"User with ID {questionnaire_data['created_by']} not found")

        questionnaire = await questionnaire_repo.create_questionnaire(**questionnaire_data)

        if is_api:
            return JSONResponse(
                status_code=201,
                content={
                    "status": "success",
                    "questionnaire_id": questionnaire.id
                }
            )

        return templates.TemplateResponse(
            "success.html",
            {"request": request, "questionnaire_id": questionnaire.id}
        )
    except NotFoundError as e:
        if is_api:
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": str(e)}
            )
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": str(e)}
        )
    except Exception as e:
        if is_api:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": f"Error creating questionnaire: {str(e)}"}
            )
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": f"Error creating questionnaire: {str(e)}"}
        )


# UPDATE operations
@router.put("/{questionnaire_id}")
async def update_questionnaire(
    questionnaire_id: int,
    request: Request,
    questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
    is_api: bool = Depends(is_api_request)
):
    """Update an existing questionnaire"""
    try:
        questionnaire_data = await parse_questionnaire_data(request, is_api)
        updated = await questionnaire_repo.update_questionnaire(
            questionnaire_id=questionnaire_id,
            **questionnaire_data
        )

        if is_api:
            return JSONResponse(
                status_code=200,
                content={
                    "status": "success",
                    "questionnaire": questionnaire_to_dict(updated)
                }
            )

        return templates.TemplateResponse(
            "success.html",
            {"request": request, "message": "Questionnaire updated successfully"}
        )
    except NotFoundError as e:
        if is_api:
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": str(e)}
            )
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": str(e)}
        )
    except Exception as e:
        if is_api:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": f"Error updating questionnaire: {str(e)}"}
            )
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": f"Error updating questionnaire: {str(e)}"}
        )


# DELETE operations
@router.delete("/{questionnaire_id}")
async def delete_questionnaire(
        questionnaire_id: int,
        request: Request,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        is_api: bool = Depends(is_api_request)
):
    """Delete a questionnaire"""
    try:
        await questionnaire_repo.delete_questionnaire(questionnaire_id)

        if is_api:
            return JSONResponse(
                status_code=200,
                content={"status": "success", "message": "Questionnaire deleted"}
            )

        return templates.TemplateResponse(
            "success.html",
            {"request": request, "message": "Questionnaire deleted successfully"}
        )
    except Exception as e:
        handle_error(e, is_api, request, "Error deleting questionnaire")


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


async def parse_questionnaire_data(request: Request, is_api: bool) -> dict:
    """Parse questionnaire data from request"""
    if is_api:
        data = await request.json()
        request_model = CreateQuestionnaireRequest(**data)
        questionnaire_data = request_model.dict()
        # Remove fields that shouldn't be updated
        if request.method == "PUT":
            questionnaire_data.pop('created_by', None)
            questionnaire_data.pop('due_date', None)
        return questionnaire_data

    form_data = await request.form()
    questions_dict = {}
    i = 1
    while f"question_{i}" in form_data:
        questions_dict[str(i)] = {
            "text": form_data[f"question_{i}"],
            "type": form_data[f"type_{i}"],
            "options": (
                form_data[f"options_{i}"].split('\n')
                if form_data[f"type_{i}"] in ["single_choice", "multiple_choice"]
                else None
            )
        }
        i += 1

    result = {
        "title": form_data["title"],
        "description": form_data["description"],
        "questions": questions_dict,
        "is_anonymous": bool(form_data.get("is_anonymous"))
    }
    
    # Add created_by only for POST requests
    if request.method == "POST":
        result["created_by"] = int(form_data["created_by"])
    
    return result


def handle_error(error: Exception, is_api: bool, request: Request, message: str):
    """Handle errors consistently"""
    error_msg = f"{message}: {str(error)}"
    if is_api:
        raise HTTPException(status_code=500, detail=error_msg)
    return templates.TemplateResponse(
        "error.html",
        {"request": request, "error": error_msg}
    )
