from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query

from infrastructure.database.repo.questionnaires import QuestionnaireRepo
from infrastructure.database.repo.users import UserRepo
from infrastructure.api.dependencies import (
    get_questionnaire_repo,
    get_user_repo,
    require_authentication,
    require_mentor_or_admin
)
from infrastructure.database.models import User, Questionnaire
from infrastructure.database.exceptions import NotFoundError

from infrastructure.api.schemas.questionnaire import (
    CreateQuestionnaireRequest,
    UpdateQuestionnaireRequest,
    PaginatedQuestionnairesResponse,
)

router = APIRouter(prefix="/questionnaires", tags=["questionnaires"])

# Helper functions
def questionnaire_to_dict(questionnaire: Questionnaire, with_stats: bool = False) -> dict:
    """Convert questionnaire model to dictionary"""
    result = {
        "id": questionnaire.id,
        "title": questionnaire.title,
        "description": questionnaire.description,
        "questions": questionnaire.questions,
        "created_by": questionnaire.created_by,
        "created_at": questionnaire.created_at.isoformat(),
        "status": getattr(questionnaire, "status", "active"),
        "tags": getattr(questionnaire, "tags", []),
    }

    # Add creator information if available
    if hasattr(questionnaire, "creator") and questionnaire.creator:
        result["creator"] = {
            "user_id": questionnaire.creator.user_id,
            "full_name": questionnaire.creator.full_name,
            "role": questionnaire.creator.role
        }

    return result


# Routes
@router.get("/", response_model=PaginatedQuestionnairesResponse)
async def list_questionnaires(
        # Filtering parameters
        status: Optional[List[str]] = Query(None, description="Filter by status (active, completed, draft, scheduled)"),
        created_from: Optional[datetime] = Query(None, description="Filter by creation date (from)"),
        created_to: Optional[datetime] = Query(None, description="Filter by creation date (to)"),
        scheduled_from: Optional[datetime] = Query(None, description="Filter by scheduled date (from)"),
        scheduled_to: Optional[datetime] = Query(None, description="Filter by scheduled date (to)"),
        creator_id: Optional[int] = Query(None, description="Filter by creator ID"),
        title_search: Optional[str] = Query(None, description="Search in questionnaire title"),
        tags: Optional[List[str]] = Query(None, description="Filter by tags"),

        # Pagination parameters
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(10, ge=1, le=100, description="Items per page"),

        # Sorting parameters
        sort_by: str = Query("created_at", description="Field to sort by (created_at, title, response_count)"),
        sort_order: str = Query("desc", description="Sort order (asc or desc)"),

        # Dependencies
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        current_user: User = Depends(require_authentication)
):
    """
    List questionnaires with filtering, pagination, and sorting.

    This endpoint supports multiple filtering options, including by status, date ranges,
    creator, title search, tags, question types, response metrics, and more.

    Results are paginated and can be sorted by different fields.
    """
    try:
        # Calculate offset from page and per_page
        offset = (page - 1) * per_page

        # Apply access control based on user role
        if not current_user.is_admin() and creator_id is not None and creator_id != current_user.id:
            # Non-admins can only see their own questionnaires or all questionnaires
            raise HTTPException(
                status_code=403,
                detail="You can only filter by your own creator ID"
            )

        # If user is not an admin and not filtering by creator_id, only show their questionnaires
        if not current_user.is_admin() and creator_id is None:
            creator_id = current_user.id

        # Get filtered questionnaires with pagination
        questionnaires = await questionnaire_repo.filter_questionnaires(
            status=status,
            created_from=created_from,
            created_to=created_to,
            scheduled_from=scheduled_from,
            scheduled_to=scheduled_to,
            creator_id=creator_id,
            title_search=title_search,
            tags=tags,
            limit=per_page,
            offset=offset,
            sort_by=sort_by,
            sort_order=sort_order
        )

        # Get total count for pagination
        total = await questionnaire_repo.count_filtered_questionnaires(
            status=status,
            created_from=created_from,
            created_to=created_to,
            creator_id=creator_id,
            title_search=title_search,
            tags=tags,
        )

        # Calculate total pages
        total_pages = (total + per_page - 1) // per_page

        # Format response
        return {
            "status": "success",
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "questionnaires": [
                questionnaire_to_dict(q, with_stats=True) for q in questionnaires
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing questionnaires: {str(e)}")


@router.get("/latest")
async def get_latest_questionnaires(
        limit: int = Query(10, ge=1, le=100, description="Number of questionnaires to return"),
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        current_user: User = Depends(require_authentication)
):
    """
    Get latest questionnaires sorted by creation date.

    Returns the most recently created questionnaires, limited by the specified count.
    """
    try:
        # Apply access control based on user role
        creator_id = None if current_user.is_admin() else current_user.id

        questionnaires = await questionnaire_repo.filter_questionnaires(
            creator_id=creator_id,
            limit=limit,
            sort_by="created_at",
            sort_order="desc"
        )

        return {
            "status": "success",
            "count": len(questionnaires),
            "limit": limit,
            "questionnaires": [
                questionnaire_to_dict(q) for q in questionnaires
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching latest questionnaires: {str(e)}")


@router.get("/{questionnaire_id}")
async def get_questionnaire(
        questionnaire_id: int,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        current_user: User = Depends(require_authentication)
):
    """
    Get a specific questionnaire by ID with all its details.
    """
    try:
        questionnaire = await questionnaire_repo.get_questionnaire_by_id(questionnaire_id)
        if not questionnaire:
            raise NotFoundError(f"Questionnaire with ID {questionnaire_id} not found")

        # Check access control
        if not current_user.is_admin() and questionnaire.created_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to view this questionnaire"
            )

        return {
            "status": "success",
            "questionnaire": questionnaire_to_dict(questionnaire, with_stats=True)
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching questionnaire: {str(e)}")


@router.post("/")
async def create_questionnaire(
        request: CreateQuestionnaireRequest,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        user_repo: UserRepo = Depends(get_user_repo),
        current_user: User = Depends(require_mentor_or_admin)
):
    """
    Create a new questionnaire with the provided details.

    Only mentors and administrators can create questionnaires.
    """
    try:
        # Ensure the creator ID matches the current user or is an admin
        if not current_user.is_admin() and request.created_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only create questionnaires as yourself"
            )

        user = await user_repo.get_user_by_id(request.created_by)
        if not user:
            raise NotFoundError(f"User with ID {request.created_by} not found")

        # Process questions to ensure they are in the correct format
        for question in request.questions:
            if question.type in ["single_choice", "multiple_choice"] and (
                    not question.options or len(question.options) == 0):
                raise HTTPException(
                    status_code=400,
                    detail=f"Question '{question.text}' of type {question.type} must have options"
                )

        # Create the questionnaire
        created = await questionnaire_repo.create_questionnaire(
            title=request.title,
            description=request.description,
            questions=[q.model_dump() for q in request.questions],
            created_by=request.created_by,
            tags=request.tags,
            status=request.status
        )

        return {
            "status": "success",
            "message": "Questionnaire created successfully",
            "questionnaire_id": created.id,
            "questionnaire": questionnaire_to_dict(created)
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating questionnaire: {str(e)}")


@router.put("/{questionnaire_id}")
async def update_questionnaire(
        questionnaire_id: int,
        request: UpdateQuestionnaireRequest,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        current_user: User = Depends(require_mentor_or_admin)
):
    """
    Update an existing questionnaire with the provided details.

    Only the creator of the questionnaire or an administrator can update it.
    """
    try:
        # Check if the questionnaire exists
        questionnaire = await questionnaire_repo.get_questionnaire_by_id(questionnaire_id)
        if not questionnaire:
            raise NotFoundError(f"Questionnaire with ID {questionnaire_id} not found")

        # Check permissions
        if not current_user.is_admin() and questionnaire.created_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to update this questionnaire"
            )

        # Process questions to ensure they are in the correct format
        for question in request.questions:
            if question.type in ["single_choice", "multiple_choice"] and (
                    not question.options or len(question.options) == 0):
                raise HTTPException(
                    status_code=400,
                    detail=f"Question '{question.text}' of type {question.type} must have options"
                )

        # Update the questionnaire
        updated = await questionnaire_repo.update_questionnaire(
            questionnaire_id=questionnaire_id,
            title=request.title,
            description=request.description,
            questions=[q.model_dump() for q in request.questions],
            tags=request.tags,
            status=request.status
        )

        return {
            "status": "success",
            "message": "Questionnaire updated successfully",
            "questionnaire": questionnaire_to_dict(updated)
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating questionnaire: {str(e)}")


@router.delete("/{questionnaire_id}")
async def delete_questionnaire(
        questionnaire_id: int,
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        current_user: User = Depends(require_mentor_or_admin)
):
    """
    Delete a questionnaire by ID.

    Only the creator of the questionnaire or an administrator can delete it.
    """
    try:
        # Check if the questionnaire exists
        questionnaire = await questionnaire_repo.get_questionnaire_by_id(questionnaire_id)
        if not questionnaire:
            raise NotFoundError(f"Questionnaire with ID {questionnaire_id} not found")

        # Check permissions
        if not current_user.is_admin() and questionnaire.created_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to delete this questionnaire"
            )

        # Delete the questionnaire
        result = await questionnaire_repo.delete_questionnaire(questionnaire_id)
        if not result:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete questionnaire"
            )

        return {
            "status": "success",
            "message": f"Questionnaire with ID {questionnaire_id} successfully deleted"
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting questionnaire: {str(e)}")