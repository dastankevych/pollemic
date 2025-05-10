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

    async def get_assignment_responses(self, assignment_id: int) -> List[Response]:
        """Get all responses for a specific assignment"""
        query = (
            select(Response)
            .where(Response.assignment_id == assignment_id)
        )
        result = await self.session.execute(query)
        return result.scalars().all()
