from typing import Optional, List
from datetime import datetime

from sqlalchemy import select, desc

from infrastructure.database.models import (
    Questionnaire,
)
from .base import BaseRepo
from infrastructure.database.exceptions import NotFoundError


class QuestionnaireRepo(BaseRepo):
    async def create_questionnaire(
        self,
        title: str,
        description: str,
        questions: List[dict],
        is_anonymous: bool,
        created_by: int,
        due_date: Optional[datetime] = None,
    ) -> Questionnaire:
        """Create a new questionnaire"""
        questionnaire = Questionnaire(
            title=title,
            description=description,
            questions=questions,
            is_anonymous=is_anonymous,
            created_by=created_by,
            due_date=due_date,
        )
        self.session.add(questionnaire)
        await self.session.commit()
        return questionnaire

    async def get_questionnaire_by_id(self, questionnaire_id: int) -> Optional[Questionnaire]:
        """Get a specific questionnaire by ID"""
        return await self.session.get(Questionnaire, questionnaire_id)

    async def update_questionnaire(
        self,
        questionnaire_id: int,
        title: str,
        description: str,
        questions: List[dict],
        is_anonymous: bool,
    ) -> Questionnaire:
        """Update an existing questionnaire"""
        questionnaire = await self.session.get(Questionnaire, questionnaire_id)
        if not questionnaire:
            raise NotFoundError(f"Questionnaire with ID {questionnaire_id} not found")

        questionnaire.title = title
        questionnaire.description = description
        questionnaire.questions = questions
        questionnaire.is_anonymous = is_anonymous

        await self.session.commit()
        return questionnaire

    async def delete_questionnaire(self, questionnaire_id: int) -> bool:
        """Delete a questionnaire. Returns True if deleted, False if not found"""
        questionnaire = await self.get_questionnaire(questionnaire_id)
        if questionnaire:
            await self.session.delete(questionnaire)
            await self.session.commit()
            return True
        return False

    async def get_latest_questionnaires(self, limit: int = 10) -> List[Questionnaire]:
        """Get latest questionnaires with limit"""
        query = (
            select(Questionnaire)
            .order_by(desc(Questionnaire.updated_at))
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()