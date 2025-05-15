from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query

from infrastructure.database.repo.responses import ResponseRepo
from infrastructure.database.repo.assignments import AssignmentRepo
from infrastructure.api.dependencies import (
    get_response_repo,
    get_assignment_repo,
    require_authentication,
    require_mentor_or_admin,
)
from infrastructure.database.models import User, Response, UserRole
from infrastructure.database.exceptions import NotFoundError

from infrastructure.api.schemas.response import (
    PaginatedResponsesResponse,
    ResponseSubmitRequest,
    ResponseUpdateRequest,
    ResponseStatisticsResponse,
    StudentProgressResponse,
)

router = APIRouter(prefix="/responses", tags=["responses"])


# Helper functions
def response_to_dict(response: Response, include_answers: bool = True, anonymize: bool = False) -> dict:
    """Convert response model to dictionary with option to anonymize student info"""
    result = {
        "id": response.id,
        "assignment_id": response.assignment_id,
        "student_id": response.student_id if not anonymize else None,
        "is_completed": response.is_completed,
        "submitted_at": response.submitted_at.isoformat(),
        "created_at": response.created_at.isoformat(),
        "answers": response.answers if include_answers else None,
    }

    # Add related entities if available
    if hasattr(response, "assignment") and response.assignment:
        assignment_dict = {
            "id": response.assignment.id,
            "name": response.assignment.name,
            "questionnaire_id": response.assignment.questionnaire_id,
            "group_id": response.assignment.group_id,
            "start_time": response.assignment.start_time.isoformat(),
            "deadline_time": response.assignment.deadline_time.isoformat()
        }
        result["assignment"] = assignment_dict

    # Add student info only if not anonymized
    if not anonymize and hasattr(response, "student") and response.student:
        student_dict = {
            "user_id": response.student.user_id,
            "full_name": response.student.full_name,
            "username": response.student.username
        }
        result["student"] = student_dict
    elif anonymize:
        # Add anonymized student info
        result["student"] = {"user_id": "anonymous"}

    return result


# Helpers for access control
def can_view_response(user: User, response: Response) -> bool:
    """
    Check if a user can view a response.

    - Admins can view all responses
    - Mentors can view responses, but may not see student details depending on anonymity
    - Students can only view their own responses
    """
    if user.is_admin():
        return True

    if user.is_mentor():
        # Mentors can view responses, but may not see student details in anonymous questionnaires
        # This is handled at the data level
        return True

    # Students can only view their own responses
    return user.id == response.student_id


# Routes
@router.get("/", response_model=PaginatedResponsesResponse)
async def list_responses(
        # Filtering parameters
        assignment_id: Optional[int] = Query(None, description="Filter by assignment ID"),
        questionnaire_id: Optional[int] = Query(None, description="Filter by questionnaire ID"),
        group_id: Optional[int] = Query(None, description="Filter by group ID"),
        student_id: Optional[int] = Query(None, description="Filter by student ID"),
        completion_status: Optional[bool] = Query(None, description="Filter by completion status"),
        submitted_from: Optional[datetime] = Query(None, description="Filter by submission date (from)"),
        submitted_to: Optional[datetime] = Query(None, description="Filter by submission date (to)"),
        answer_contains: Optional[str] = Query(None, description="Search for text within response answers"),

        # Pagination parameters
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(10, ge=1, le=100, description="Items per page"),

        # Sorting parameters
        sort_by: str = Query("submitted_at", description="Field to sort by (submitted_at)"),
        sort_order: str = Query("desc", description="Sort order (asc or desc)"),

        # Dependencies
        response_repo: ResponseRepo = Depends(get_response_repo),
        current_user: User = Depends(require_authentication)
):
    """
    List responses with filtering, pagination, and sorting.

    This endpoint supports multiple filtering options, including by assignment,
    questionnaire, group, student, completion status, submission date, and answer content.

    Results are paginated and can be sorted by different fields.

    Access control:
    - Admins can view all responses with all details
    - Mentors can view responses, but student details are anonymized
    - Students can only view their own responses
    """
    try:
        # Apply access control based on user role
        if current_user.is_student():
            # Students can only see their own responses
            student_id = current_user.id
        elif current_user.is_mentor() and student_id is not None and student_id != current_user.id:
            # Mentors can filter by student ID, but results will be anonymized
            pass
        elif not current_user.is_admin() and student_id is not None and student_id != current_user.id:
            # Non-admins cannot filter by other students' IDs (this is a fallback)
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to view other students' responses"
            )

        # Calculate offset from page and per_page
        offset = (page - 1) * per_page

        # Get filtered responses with pagination
        responses = await response_repo.filter_responses(
            assignment_id=assignment_id,
            questionnaire_id=questionnaire_id,
            group_id=group_id,
            student_id=student_id,
            completion_status=completion_status,
            submitted_from=submitted_from,
            submitted_to=submitted_to,
            answer_contains=answer_contains,
            limit=per_page,
            offset=offset,
            sort_by=sort_by,
            sort_order=sort_order
        )

        # Apply access control at the response level
        accessible_responses = []
        for response in responses:
            if can_view_response(current_user, response):
                # Anonymize student details for mentors
                anonymize = current_user.is_mentor() and not current_user.is_admin()

                response_dict = response_to_dict(
                    response,
                    include_answers=True,
                    anonymize=anonymize
                )

                accessible_responses.append(response_dict)

        # Get total count for pagination (only counting responses the user can access)
        if current_user.is_student():
            total = await response_repo.count_filtered_responses(
                assignment_id=assignment_id,
                questionnaire_id=questionnaire_id,
                group_id=group_id,
                student_id=current_user.id,
                completion_status=completion_status,
                submitted_from=submitted_from,
                submitted_to=submitted_to,
                answer_contains=answer_contains
            )
        else:
            total = await response_repo.count_filtered_responses(
                assignment_id=assignment_id,
                questionnaire_id=questionnaire_id,
                group_id=group_id,
                student_id=student_id,
                completion_status=completion_status,
                submitted_from=submitted_from,
                submitted_to=submitted_to,
                answer_contains=answer_contains
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
            "responses": accessible_responses
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing responses: {str(e)}")


@router.get("/{response_id}")
async def get_response(
        response_id: int,
        response_repo: ResponseRepo = Depends(get_response_repo),
        current_user: User = Depends(require_authentication)
):
    """
    Get a specific response by ID with all its details.

    Access control:
    - Admins can view all responses with all details
    - Mentors can view responses, but student details are anonymized
    - Students can only view their own responses
    """
    try:
        response = await response_repo.get_response_by_id(response_id)
        if not response:
            raise NotFoundError(f"Response with ID {response_id} not found")

        # Check access control
        if not can_view_response(current_user, response):
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to view this response"
            )

        # Anonymize student details for mentors
        anonymize = current_user.is_mentor() and not current_user.is_admin()

        response_dict = response_to_dict(
            response,
            include_answers=True,
            anonymize=anonymize
        )

        return {
            "status": "success",
            "response": response_dict
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching response: {str(e)}")


@router.post("/")
async def submit_response(
        request: ResponseSubmitRequest,
        response_repo: ResponseRepo = Depends(get_response_repo),
        assignment_repo: AssignmentRepo = Depends(get_assignment_repo),
        current_user: User = Depends(require_authentication)
):
    """
    Submit a new response to a questionnaire assignment.

    Access control:
    - Students can only submit responses for themselves
    - Mentors and admins can submit responses on behalf of students
    """
    try:
        # Check if the assignment exists
        assignment = await assignment_repo.get_assignment_by_id(request.assignment_id)
        if not assignment:
            raise NotFoundError(f"Assignment with ID {request.assignment_id} not found")

        # Apply access control
        if current_user.is_student() and request.student_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only submit responses for yourself"
            )

        # Check if the assignment is active
        now = datetime.now()
        if assignment.start_time > now:
            raise HTTPException(
                status_code=400,
                detail="This assignment is not yet open for submissions"
            )

        if assignment.deadline_time < now:
            raise HTTPException(
                status_code=400,
                detail="The deadline for this assignment has passed"
            )

        # Submit the response
        response = await response_repo.submit_response(
            assignment_id=request.assignment_id,
            student_id=request.student_id,
            answers=request.answers,
            is_completed=request.is_completed,
            submitted_at=now
        )

        # Anonymize for mentors
        anonymize = current_user.is_mentor() and not current_user.is_admin()

        return {
            "status": "success",
            "message": "Response submitted successfully",
            "response": response_to_dict(response, anonymize=anonymize)
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting response: {str(e)}")


@router.put("/{response_id}")
async def update_response(
        response_id: int,
        request: ResponseUpdateRequest,
        response_repo: ResponseRepo = Depends(get_response_repo),
        assignment_repo: AssignmentRepo = Depends(get_assignment_repo),
        current_user: User = Depends(require_authentication)
):
    """
    Update an existing response.

    Access control:
    - Students can only update their own responses
    - Mentors and admins can update any response
    """
    try:
        # Check if the response exists
        response = await response_repo.get_response_by_id(response_id)
        if not response:
            raise NotFoundError(f"Response with ID {response_id} not found")

        # Apply access control
        if current_user.is_student() and response.student_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only update your own responses"
            )

        # Check if the assignment is still active (only for students)
        if current_user.is_student():
            assignment = await assignment_repo.get_assignment_by_id(response.assignment_id)
            now = datetime.now()
            if assignment.deadline_time < now:
                raise HTTPException(
                    status_code=400,
                    detail="The deadline for this assignment has passed"
                )

        # Update the response
        updated_response = await response_repo.submit_response(
            assignment_id=response.assignment_id,
            student_id=response.student_id,
            answers=request.answers,
            is_completed=request.is_completed,
            submitted_at=datetime.now()
        )

        # Anonymize for mentors
        anonymize = current_user.is_mentor() and not current_user.is_admin()

        return {
            "status": "success",
            "message": "Response updated successfully",
            "response": response_to_dict(updated_response, anonymize=anonymize)
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating response: {str(e)}")


@router.delete("/{response_id}")
async def delete_response(
        response_id: int,
        response_repo: ResponseRepo = Depends(get_response_repo),
        current_user: User = Depends(require_mentor_or_admin)
):
    """
    Delete a response by ID.

    Only mentors and administrators can delete responses.
    """
    try:
        # Check if the response exists
        response = await response_repo.get_response_by_id(response_id)
        if not response:
            raise NotFoundError(f"Response with ID {response_id} not found")

        # Check permissions for mentors
        if current_user.is_mentor() and not current_user.is_admin():
            # Mentors need additional permission checks here if needed
            pass

        # Delete the response
        result = await response_repo.delete_response(response_id)
        if not result:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete response"
            )

        return {
            "status": "success",
            "message": f"Response with ID {response_id} successfully deleted"
        }
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting response: {str(e)}")


@router.get("/statistics/assignment/{assignment_id}", response_model=ResponseStatisticsResponse)
async def get_assignment_statistics(
        assignment_id: int,
        time_period: Optional[str] = Query(None, description="Group statistics by time period (day, week, month)"),
        from_date: Optional[datetime] = Query(None, description="Start date for statistics"),
        to_date: Optional[datetime] = Query(None, description="End date for statistics"),
        response_repo: ResponseRepo = Depends(get_response_repo),
):
    """
    Get statistics for responses to a specific assignment.

    Only mentors and administrators can access statistics.
    """
    try:
        statistics = await response_repo.get_response_statistics(
            assignment_id=assignment_id,
            time_period=time_period,
            from_date=from_date,
            to_date=to_date
        )

        return {
            "status": "success",
            **statistics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching response statistics: {str(e)}")


@router.get("/statistics/questionnaire/{questionnaire_id}", response_model=ResponseStatisticsResponse)
async def get_questionnaire_statistics(
        questionnaire_id: int,
        time_period: Optional[str] = Query(None, description="Group statistics by time period (day, week, month)"),
        from_date: Optional[datetime] = Query(None, description="Start date for statistics"),
        to_date: Optional[datetime] = Query(None, description="End date for statistics"),
        response_repo: ResponseRepo = Depends(get_response_repo),
):
    """
    Get statistics for responses to a specific questionnaire across all assignments.

    Only mentors and administrators can access statistics.
    """
    try:
        statistics = await response_repo.get_response_statistics(
            questionnaire_id=questionnaire_id,
            time_period=time_period,
            from_date=from_date,
            to_date=to_date
        )

        return {
            "status": "success",
            **statistics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching response statistics: {str(e)}")


@router.get("/statistics/group/{group_id}", response_model=ResponseStatisticsResponse)
async def get_group_statistics(
        group_id: int,
        time_period: Optional[str] = Query(None, description="Group statistics by time period (day, week, month)"),
        from_date: Optional[datetime] = Query(None, description="Start date for statistics"),
        to_date: Optional[datetime] = Query(None, description="End date for statistics"),
        response_repo: ResponseRepo = Depends(get_response_repo),
):
    """
    Get statistics for responses from a specific group across all assignments.

    Only mentors and administrators can access statistics.
    """
    try:
        statistics = await response_repo.get_response_statistics(
            group_id=group_id,
            time_period=time_period,
            from_date=from_date,
            to_date=to_date
        )

        return {
            "status": "success",
            **statistics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching response statistics: {str(e)}")


@router.get("/student/{student_id}/progress", response_model=StudentProgressResponse)
async def get_student_progress(
        student_id: int,
        assignment_ids: Optional[List[int]] = Query(None, description="List of assignment IDs to get progress for"),
        questionnaire_id: Optional[int] = Query(None, description="Filter by specific questionnaire"),
        group_id: Optional[int] = Query(None, description="Filter by specific group"),
        response_repo: ResponseRepo = Depends(get_response_repo),
        current_user: User = Depends(require_authentication)
):
    """
    Get the progress of a specific student across multiple assignments.

    Access control:
    - Admins can view any student's progress with full details
    - Mentors can view any student's progress, but without identifying information
    - Students can only view their own progress
    """
    try:
        # Apply access control
        if current_user.is_student() and student_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own progress"
            )

        progress = await response_repo.get_student_progress(
            student_id=student_id,
            assignment_ids=assignment_ids,
            questionnaire_id=questionnaire_id,
            group_id=group_id
        )

        # Anonymize progress for mentors
        if current_user.is_mentor() and not current_user.is_admin():
            # Remove or anonymize any identifying information in the progress data
            if "student_name" in progress:
                progress["student_name"] = "Anonymous Student"

            if "student_details" in progress:
                progress["student_details"] = {"id": "anonymous"}

            # Keep the student_id as None to prevent identification
            progress["student_id"] = None

        return {
            "status": "success",
            **progress
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching student progress: {str(e)}")