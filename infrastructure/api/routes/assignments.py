from fastapi import APIRouter, Depends, HTTPException

from infrastructure.api.dependencies import (
    get_questionnaire_repo,
    get_assignment_repo,
    get_bot
)
from infrastructure.database.exceptions import NotFoundError, DatabaseError
from infrastructure.database.repo.questionnaires import QuestionnaireRepo
from infrastructure.database.repo.assignments import AssignmentRepo

from .questionnaires import questionnaire_to_dict

router = APIRouter(prefix="/assignment", tags=["assignment"])


@router.post("/{assignment_id}/assign")
async def assign_questionnaire(
    questionnaire_id: int,
    assignment: AssignmentRepo,
    questionnaire_repo: QuestionnaireRepo = Depends(get_questionnaire_repo)
):
    """Assign questionnaire to a group"""
    try:
        questionnaire = await questionnaire_repo.get_questionnaire_by_id(questionnaire_id)
        if not questionnaire:
            raise NotFoundError(f"Questionnaire {questionnaire_id} not found")

        group = await questionnaire_repo.get_group(assignment.group_id)
        if not group:
            raise NotFoundError(f"Group {assignment.group_id} not found")
        if not group.is_active:
            raise DatabaseError(f"Group {assignment.group_id} is not active")

        assignment_result = await questionnaire_repo.assign_questionnaire(
            questionnaire_id=questionnaire_id,
            group_id=assignment.group_id,
            due_date=assignment.due_date,
            bot=get_bot(),
            bot_username="vinylonbot"
        )

        return {
            "status": "success",
            "message": "Questionnaire assigned successfully",
            "questionnaire": questionnaire_to_dict(questionnaire)
        }

    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error assigning questionnaire: {str(e)}")


@router.get("/list")
async def list_assignments(
        assignment_repo: AssignmentRepo = Depends(get_assignment_repo),
):
    """List all questionnaire assignments"""
    try:
        assignments = await assignment_repo.get_active_assignments()
        return {
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
                    "recurrence": "Once"
                } for assignment in assignments
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing assignments: {str(e)}")
