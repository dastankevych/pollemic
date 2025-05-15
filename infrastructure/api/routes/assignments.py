from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from environs import Env

from infrastructure.database.repo.assignments import AssignmentRepo
from infrastructure.database.repo.questionnaires import QuestionnaireRepo
from infrastructure.database.repo.groups import GroupRepo
from infrastructure.api.dependencies import (
    get_assignment_repo,
    get_questionnaire_repo,
    get_group_repo,
    get_bot,
    require_authentication,
    require_mentor_or_admin
)
from infrastructure.database.models import User, Assignment
from infrastructure.database.exceptions import NotFoundError, DatabaseError

from infrastructure.api.schemas.assignment import (
    PaginatedAssignmentsResponse,
    AssignmentCreateRequest,
    AssignmentUpdateRequest,
)

router = APIRouter(prefix="/assignments", tags=["assignments"])

# Helper functions
def assignment_to_dict(assignment: Assignment) -> dict:
    """Convert assignment model to dictionary"""
    from typing import Dict, Any

    # Determine status based on dates
    now = datetime.now()
    if assignment.start_time > now:
        status = "upcoming"
    elif assignment.deadline_time <= now:
        status = "completed"
    else:
        status = "active"

    # Создаем базовый словарь
    result: Dict[str, Any] = {
        "id": assignment.id,
        "questionnaire_id": assignment.questionnaire_id,
        "group_id": assignment.group_id,
        "name": assignment.name,
        "start_time": assignment.start_time.isoformat(),
        "deadline_time": assignment.deadline_time.isoformat(),
        "created_by": assignment.created_by,
        "created_at": assignment.created_at.isoformat(),
        "status": status
    }

    # Добавляем updated_at, если оно существует
    if hasattr(assignment, "updated_at") and assignment.updated_at:
        result["updated_at"] = assignment.updated_at.isoformat()
    else:
        result["updated_at"] = None

    # Добавляем связанные сущности как отдельные словари
    if hasattr(assignment, "questionnaire") and assignment.questionnaire:
        result["questionnaire"] = {
            "id": assignment.questionnaire.id,
            "title": assignment.questionnaire.title,
            "description": assignment.questionnaire.description,
        }

    if hasattr(assignment, "target_group") and assignment.target_group:
        result["group"] = {
            "id": assignment.target_group.id,
            "title": assignment.target_group.title,
            "is_active": assignment.target_group.is_active
        }

    if hasattr(assignment, "creator") and assignment.creator:
        result["creator"] = {
            "user_id": assignment.creator.user_id,
            "full_name": assignment.creator.full_name,
            "role": assignment.creator.role
        }

    return result


# Routes
@router.get("/", response_model=PaginatedAssignmentsResponse)
async def list_assignments(
        # Filtering parameters
        status: Optional[List[str]] = Query(None, description="Filter by status (active, completed, upcoming)"),
        questionnaire_id: Optional[int] = Query(None, description="Filter by questionnaire ID"),
        group_id: Optional[int] = Query(None, description="Filter by group ID"),
        creator_id: Optional[int] = Query(None, description="Filter by creator ID"),
        start_date_from: Optional[datetime] = Query(None, description="Filter by start date (from)"),
        start_date_to: Optional[datetime] = Query(None, description="Filter by start date (to)"),
        end_date_from: Optional[datetime] = Query(None, description="Filter by end date (from)"),
        end_date_to: Optional[datetime] = Query(None, description="Filter by end date (to)"),
        name_search: Optional[str] = Query(None, description="Search in assignment name"),

        # Pagination parameters
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(10, ge=1, le=100, description="Items per page"),

        # Sorting parameters
        sort_by: str = Query("deadline_time",
                             description="Field to sort by (deadline_time, start_time, name, response_count)"),
        sort_order: str = Query("desc", description="Sort order (asc or desc)"),

        # Dependencies
        assignment_repo: AssignmentRepo = Depends(get_assignment_repo),
        current_user: User = Depends(require_authentication)
):
    """
    List assignments with filtering, pagination, and sorting.

    This endpoint supports multiple filtering options, including by status, date ranges,
    questionnaire, group, creator, response metrics, and more.

    Results are paginated and can be sorted by different fields.
    """
    try:
        # Calculate offset from page and per_page
        offset = (page - 1) * per_page

        # Apply access control based on user role
        if not current_user.is_admin() and creator_id is not None and creator_id != current_user.id:
            # Non-admins can only see their own assignments or all assignments
            raise HTTPException(
                status_code=403,
                detail="You can only filter by your own creator ID"
            )

        # If user is not an admin and not filtering by creator_id, only show their assignments
        if not current_user.is_admin() and creator_id is None:
            creator_id = current_user.id

        # Get filtered assignments with pagination
        assignments = await assignment_repo.filter_assignments(
            status=status,
            questionnaire_id=questionnaire_id,
            group_id=group_id,
            creator_id=creator_id,
            start_date_from=start_date_from,
            start_date_to=start_date_to,
            end_date_from=end_date_from,
            end_date_to=end_date_to,
            name_search=name_search,
            limit=per_page,
            offset=offset,
            sort_by=sort_by,
            sort_order=sort_order
        )

        # Get total count for pagination
        total = await assignment_repo.count_filtered_assignments(
            status=status,
            questionnaire_id=questionnaire_id,
            group_id=group_id,
            creator_id=creator_id,
            start_date_from=start_date_from,
            start_date_to=start_date_to,
            end_date_from=end_date_from,
            end_date_to=end_date_to,
            name_search=name_search,
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
            "assignments": [
                assignment_to_dict(a) for a in assignments
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing assignments: {str(e)}")


@router.get("/latest")
async def get_latest_assignments(
        limit: int = Query(10, ge=1, le=100, description="Number of assignments to return"),
        assignment_repo: AssignmentRepo = Depends(get_assignment_repo),
        current_user: User = Depends(require_authentication)
):
    """
    Get latest assignments sorted by creation date.

    Returns the most recently created assignments, limited by the specified count.
    """
    try:
        # Apply access control based on user role
        creator_id = None if current_user.is_admin() else current_user.id

        assignments = await assignment_repo.list_latest_updated_assignments(limit=limit)

        # Filter by creator_id if needed
        if creator_id is not None:
            assignments = [a for a in assignments if a.created_by == creator_id]

        return {
            "status": "success",
            "count": len(assignments),
            "limit": limit,
            "assignments": [
                assignment_to_dict(a) for a in assignments
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching latest assignments: {str(e)}")


@router.get("/{assignment_id}")
async def get_assignment(
        assignment_id: int,
        assignment_repo: AssignmentRepo = Depends(get_assignment_repo),
        current_user: User = Depends(require_authentication)
):
    """
    Get a specific assignment by ID with all its details.
    """
    try:
        assignment = await assignment_repo.get_assignment_by_id(assignment_id)
        if not assignment:
            raise NotFoundError(f"Assignment with ID {assignment_id} not found")

        # Check access control for non-admins
        if not current_user.is_admin() and assignment.created_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to view this assignment"
            )

        return {
            "status": "success",
            "assignment": assignment_to_dict(assignment)
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching assignment: {str(e)}")


@router.post("/")
async def create_assignment(
        request: AssignmentCreateRequest,
        assignment_repo: AssignmentRepo = Depends(get_assignment_repo),
        questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo),
        group_repo: GroupRepo = Depends(get_group_repo),
        current_user: User = Depends(require_mentor_or_admin),
        bot=Depends(get_bot)
):
    """
    Create a new assignment by assigning a questionnaire to a group.

    Only mentors and administrators can create assignments.
    """
    try:
        # Validate questionnaire
        questionnaire = await questionnaire_repo.get_questionnaire_by_id(request.questionnaire_id)
        if not questionnaire:
            raise NotFoundError(f"Questionnaire with ID {request.questionnaire_id} not found")

        # Check if the user has access to this questionnaire
        if not current_user.is_admin() and questionnaire.created_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to assign this questionnaire"
            )

        # Validate group
        group = await group_repo.get_group_by_id(request.group_id)
        if not group:
            raise NotFoundError(f"Group with ID {request.group_id} not found")

        if not group.is_active:
            raise HTTPException(
                status_code=400,
                detail=f"Group with ID {request.group_id} is inactive and cannot be assigned"
            )

        # Validate dates
        now = datetime.now()
        if request.deadline_time <= request.start_time:
            raise HTTPException(
                status_code=400,
                detail="Deadline time must be after start time"
            )

        # Create assignment
        assignment = await assignment_repo.assign_questionnaire(
            questionnaire_id=request.questionnaire_id,
            group_id=request.group_id,
            name=request.name or questionnaire.title,
            start_time=request.start_time,
            deadline_time=request.deadline_time,
            created_by=current_user.id,
            bot=bot,
            bot_username=Env.str("BOT_NAME")  # Replace with your actual bot username
        )

        return {
            "status": "success",
            "message": "Assignment created successfully",
            "assignment": assignment_to_dict(assignment)
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating assignment: {str(e)}")


@router.put("/{assignment_id}")
async def update_assignment(
        assignment_id: int,
        request: AssignmentUpdateRequest,
        assignment_repo: AssignmentRepo = Depends(get_assignment_repo),
        current_user: User = Depends(require_mentor_or_admin)
):
    """
    Update an existing assignment's details.

    Only the creator of the assignment or an administrator can update it.
    """
    try:
        # Check if the assignment exists
        assignment = await assignment_repo.get_assignment_by_id(assignment_id)
        if not assignment:
            raise NotFoundError(f"Assignment with ID {assignment_id} not found")

        # Check permissions
        if not current_user.is_admin() and assignment.created_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to update this assignment"
            )

        # Validate date changes if provided
        if request.start_time and request.deadline_time and request.deadline_time <= request.start_time:
            raise HTTPException(
                status_code=400,
                detail="Deadline time must be after start time"
            )
        elif request.start_time and not request.deadline_time and request.start_time >= assignment.deadline_time:
            raise HTTPException(
                status_code=400,
                detail="Start time must be before the existing deadline time"
            )
        elif request.deadline_time and not request.start_time and request.deadline_time <= assignment.start_time:
            raise HTTPException(
                status_code=400,
                detail="Deadline time must be after the existing start time"
            )

        # Update the assignment
        updated = await assignment_repo.update_assignment(
            assignment_id=assignment_id,
            name=request.name,
            start_time=request.start_time,
            deadline_time=request.deadline_time
        )

        if not updated:
            raise HTTPException(
                status_code=500,
                detail="Failed to update assignment"
            )

        return {
            "status": "success",
            "message": "Assignment updated successfully",
            "assignment": assignment_to_dict(updated)
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating assignment: {str(e)}")


@router.delete("/{assignment_id}")
async def delete_assignment(
        assignment_id: int,
        assignment_repo: AssignmentRepo = Depends(get_assignment_repo),
        current_user: User = Depends(require_mentor_or_admin)
):
    """
    Delete an assignment by ID.

    Only the creator of the assignment or an administrator can delete it.
    Note: This will also delete all associated responses.
    """
    try:
        # Check if the assignment exists
        assignment = await assignment_repo.get_assignment_by_id(assignment_id)
        if not assignment:
            raise NotFoundError(f"Assignment with ID {assignment_id} not found")

        # Check permissions
        if not current_user.is_admin() and assignment.created_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to delete this assignment"
            )

        # Delete the assignment
        result = await assignment_repo.delete_assignment(assignment_id)
        if not result:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete assignment"
            )

        return {
            "status": "success",
            "message": f"Assignment with ID {assignment_id} successfully deleted"
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting assignment: {str(e)}")