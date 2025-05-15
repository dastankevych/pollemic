from typing import Optional, List
from sqlalchemy import select, update
from infrastructure.database.models import Response
from .base import BaseRepo

class ResponseRepo(BaseRepo):
    async def submit_response(
            self,
            assignment_id: int,
            student_id: int,
            answers: dict,
    ) -> Response:
        """Submit response to questionnaire"""
        response = Response(
            assignment_id=assignment_id,
            student_id=student_id,
            answers=answers,
            is_completed=True,
        )
        self.session.add(response)
        await self.session.commit()
        return response

    async def get_user_responses(self, assignment_id: int, user_id: int) -> Optional[Response]:
        """Get user responses for a specific assignment"""
        query = (
            select(Response)
            .where(
                Response.assignment_id == assignment_id,
                Response.student_id == user_id
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_assignment_responses_by_id(self, assignment_id: int) -> List[Response]:
        """Get all responses for a specific assignment"""
        query = (
            select(Response)
            .where(Response.assignment_id == assignment_id)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_responses_for_questionnaire(self, questionnaire_id: int) -> List[Response]:
        """
        Get all responses for a specific questionnaire across all assignments.
        """
        query = (
            select(Response)
            .join(Assignment)
            .where(Assignment.questionnaire_id == questionnaire_id)
            .options(joinedload(Response.assignment))
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def compare_assignments(self, assignment_ids: List[int]) -> Dict[int, List[Response]]:
        """
        Compare responses across multiple assignments.

        Args:
            assignment_ids: List of assignment IDs to compare.

        Returns:
            A dictionary where keys are assignment IDs and values are lists of responses.
        """
        query = (
            select(Response)
            .where(Response.assignment_id.in_(assignment_ids))
            .options(joinedload(Response.assignment))
        )
        result = await self.session.execute(query)
        responses = result.scalars().all()

        # Group responses by assignment_id
        grouped_responses = {}
        for response in responses:
            grouped_responses.setdefault(response.assignment_id, []).append(response)
        return grouped_responses
