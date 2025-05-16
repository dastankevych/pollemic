from typing import Optional, List, Dict, Any, Union
from datetime import datetime

from sqlalchemy import select, delete, update, desc, func, and_, or_, cast, String
from sqlalchemy.sql import text
from sqlalchemy.orm import joinedload

from infrastructure.database.models import (
    Questionnaire,
    User,
    UserRole,
    Assignment,
    Response
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
            tags: Optional[List[str]] = None,
            status: str = "draft"
    ) -> Questionnaire:
        """Create a new questionnaire"""
        questionnaire = Questionnaire(
            title=title,
            description=description,
            questions=questions,
            is_anonymous=is_anonymous,
            created_by=created_by,
            due_date=due_date,
            tags=tags or [],
            status=status
        )
        self.session.add(questionnaire)
        await self.session.commit()
        await self.session.refresh(questionnaire)
        return questionnaire

    async def get_questionnaire_by_id(self, questionnaire_id: int) -> Optional[Questionnaire]:
        """Get a specific questionnaire by ID"""
        query = (
            select(Questionnaire)
            .where(Questionnaire.id == questionnaire_id)
            .options(joinedload(Questionnaire.creator))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def update_questionnaire(
            self,
            questionnaire_id: int,
            title: str,
            description: str,
            questions: List[dict],
            is_anonymous: bool,
            tags: Optional[List[str]] = None,
            status: Optional[str] = None
    ) -> Questionnaire:
        """Update an existing questionnaire"""
        questionnaire = await self.get_questionnaire_by_id(questionnaire_id)
        if not questionnaire:
            raise NotFoundError(f"Questionnaire with ID {questionnaire_id} not found")

        questionnaire.title = title
        questionnaire.description = description
        questionnaire.questions = questions
        questionnaire.is_anonymous = is_anonymous

        if tags is not None:
            questionnaire.tags = tags

        if status is not None:
            questionnaire.status = status

        await self.session.commit()
        await self.session.refresh(questionnaire)
        return questionnaire

    async def delete_questionnaire(self, questionnaire_id: int) -> bool:
        """Delete a questionnaire. Returns True if deleted, False if not found"""
        questionnaire = await self.get_questionnaire_by_id(questionnaire_id)
        if questionnaire:
            await self.session.delete(questionnaire)
            await self.session.commit()
            return True
        return False

    async def get_latest_questionnaires(self, limit: int = 10) -> List[Questionnaire]:
        """Get latest questionnaires with limit"""
        query = (
            select(Questionnaire)
            .options(joinedload(Questionnaire.creator))
            .order_by(desc(Questionnaire.created_at))
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def filter_questionnaires(
            self,
            status: Optional[List[str]] = None,
            created_from: Optional[datetime] = None,
            created_to: Optional[datetime] = None,
            scheduled_from: Optional[datetime] = None,
            scheduled_to: Optional[datetime] = None,
            creator_id: Optional[int] = None,
            title_search: Optional[str] = None,
            tags: Optional[List[str]] = None,
            question_type: Optional[str] = None,
            response_count_min: Optional[int] = None,
            response_count_max: Optional[int] = None,
            completion_rate_min: Optional[float] = None,
            completion_rate_max: Optional[float] = None,
            limit: Optional[int] = None,
            offset: Optional[int] = None,
            sort_by: str = "created_at",
            sort_order: str = "desc"
    ) -> List[Questionnaire]:
        """
        Filter questionnaires based on multiple criteria

        Args:
            status: List of status values to filter by (active, completed, draft, scheduled)
            created_from: Filter questionnaires created after this date
            created_to: Filter questionnaires created before this date
            scheduled_from: Filter questionnaires scheduled after this date
            scheduled_to: Filter questionnaires scheduled before this date
            creator_id: Filter by creator user ID
            title_search: Search term for questionnaire title
            tags: List of tags to filter by
            question_type: Filter by question type (text, single_choice, multiple_choice, mixed)
            limit: Maximum number of results to return
            offset: Number of results to skip
            sort_by: Field to sort by (created_at, title, response_count)
            sort_order: Sort order (asc or desc)

        Returns:
            List of questionnaires matching the filter criteria
        """
        query = select(Questionnaire).options(joinedload(Questionnaire.creator))

        # Build the where conditions
        conditions = []

        # Status filter
        if status:
            conditions.append(Questionnaire.status.in_(status))

        # Date range filters
        if created_from:
            conditions.append(Questionnaire.created_at >= created_from)
        if created_to:
            conditions.append(Questionnaire.created_at <= created_to)

        # Creator filter
        if creator_id:
            conditions.append(Questionnaire.created_by == creator_id)

        # Title search
        if title_search:
            conditions.append(Questionnaire.title.ilike(f"%{title_search}%"))

        # Tags filter
        if tags:
            # For each tag, check if it exists in the tags array
            for tag in tags:
                conditions.append(Questionnaire.tags.any(tag))

        # Question type filter
        if question_type:
            if question_type == "text":
                # Filter for questionnaires that only have text questions
                conditions.append(Questionnaire.questions.contains(
                    [{"type": "text"}]
                ))
            elif question_type == "single_choice":
                # Filter for questionnaires that only have single_choice questions
                conditions.append(Questionnaire.questions.contains(
                    [{"type": "single_choice"}]
                ))
            elif question_type == "multiple_choice":
                # Filter for questionnaires that only have multiple_choice questions
                conditions.append(Questionnaire.questions.contains(
                    [{"type": "multiple_choice"}]
                ))
            elif question_type == "mixed":
                # Filter for questionnaires that have different types of questions
                # This is more complex and might require a different approach
                pass

        # Apply conditions to query
        if conditions:
            query = query.where(and_(*conditions))

        # Handle response count and completion rate filters
        if response_count_min or response_count_max or completion_rate_min or completion_rate_max or sort_by == "response_count":
            # We need to join with assignments and responses
            response_subq = (
                select(
                    Response.assignment_id,
                    func.count(Response.id).label("response_count"),
                    func.avg(func.case((Response.is_completed, 1), else_=0)).label("completion_rate")
                )
                .group_by(Response.assignment_id)
                .subquery()
            )

            assignment_subq = (
                select(
                    Assignment.questionnaire_id,
                    func.sum(response_subq.c.response_count).label("total_responses"),
                    func.avg(response_subq.c.completion_rate * 100).label("avg_completion_rate")
                )
                .join(response_subq, Assignment.id == response_subq.c.assignment_id, isouter=True)
                .group_by(Assignment.questionnaire_id)
                .subquery()
            )

            query = query.join(
                assignment_subq,
                Questionnaire.id == assignment_subq.c.questionnaire_id,
                isouter=True
            )

            if response_count_min is not None:
                query = query.where(
                    func.coalesce(assignment_subq.c.total_responses, 0) >= response_count_min
                )

            if response_count_max is not None:
                query = query.where(
                    func.coalesce(assignment_subq.c.total_responses, 0) <= response_count_max
                )

            if completion_rate_min is not None:
                query = query.where(
                    func.coalesce(assignment_subq.c.avg_completion_rate, 0) >= completion_rate_min
                )

            if completion_rate_max is not None:
                query = query.where(
                    func.coalesce(assignment_subq.c.avg_completion_rate, 0) <= completion_rate_max
                )

        # Sorting
        if sort_by == "created_at":
            query = query.order_by(
                desc(Questionnaire.created_at) if sort_order == "desc" else Questionnaire.created_at
            )
        elif sort_by == "title":
            query = query.order_by(
                desc(Questionnaire.title) if sort_order == "desc" else Questionnaire.title
            )
        elif sort_by == "response_count":
            query = query.order_by(
                desc(assignment_subq.c.total_responses) if sort_order == "desc" else assignment_subq.c.total_responses
            )

        # Pagination
        if limit:
            query = query.limit(limit)
        if offset:
            query = query.offset(offset)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def count_filtered_questionnaires(
            self,
            status: Optional[List[str]] = None,
            created_from: Optional[datetime] = None,
            created_to: Optional[datetime] = None,
            creator_id: Optional[int] = None,
            title_search: Optional[str] = None,
            tags: Optional[List[str]] = None,
            question_type: Optional[str] = None,
            response_count_min: Optional[int] = None,
            response_count_max: Optional[int] = None,
            completion_rate_min: Optional[float] = None,
            completion_rate_max: Optional[float] = None,
    ) -> int:
        """Count questionnaires matching the filter criteria"""
        query = select(func.count(Questionnaire.id))

        # Build the where conditions
        conditions = []

        # Status filter
        if status:
            conditions.append(Questionnaire.status.in_(status))

        # Date range filters
        if created_from:
            conditions.append(Questionnaire.created_at >= created_from)
        if created_to:
            conditions.append(Questionnaire.created_at <= created_to)

        # Creator filter
        if creator_id:
            conditions.append(Questionnaire.created_by == creator_id)

        # Title search
        if title_search:
            conditions.append(Questionnaire.title.ilike(f"%{title_search}%"))

        # Tags filter
        if tags:
            # For each tag, check if it exists in the tags array
            for tag in tags:
                conditions.append(Questionnaire.tags.any(tag))

        # Question type filter
        if question_type:
            if question_type == "text":
                # Filter for questionnaires that only have text questions
                conditions.append(Questionnaire.questions.contains(
                    [{"type": "text"}]
                ))
            elif question_type == "single_choice":
                # Filter for questionnaires that only have single_choice questions
                conditions.append(Questionnaire.questions.contains(
                    [{"type": "single_choice"}]
                ))
            elif question_type == "multiple_choice":
                # Filter for questionnaires that only have multiple_choice questions
                conditions.append(Questionnaire.questions.contains(
                    [{"type": "multiple_choice"}]
                ))

        # Apply conditions to query
        if conditions:
            query = query.where(and_(*conditions))

        # Handle response count and completion rate filters
        if response_count_min or response_count_max or completion_rate_min or completion_rate_max:
            # We need to join with assignments and responses
            response_subq = (
                select(
                    Response.assignment_id,
                    func.count(Response.id).label("response_count"),
                    func.avg(func.case((Response.is_completed, 1), else_=0)).label("completion_rate")
                )
                .group_by(Response.assignment_id)
                .subquery()
            )

            assignment_subq = (
                select(
                    Assignment.questionnaire_id,
                    func.sum(response_subq.c.response_count).label("total_responses"),
                    func.avg(response_subq.c.completion_rate * 100).label("avg_completion_rate")
                )
                .join(response_subq, Assignment.id == response_subq.c.assignment_id, isouter=True)
                .group_by(Assignment.questionnaire_id)
                .subquery()
            )

            query = query.join(
                assignment_subq,
                Questionnaire.id == assignment_subq.c.questionnaire_id,
                isouter=True
            )

            if response_count_min is not None:
                query = query.where(
                    func.coalesce(assignment_subq.c.total_responses, 0) >= response_count_min
                )

            if response_count_max is not None:
                query = query.where(
                    func.coalesce(assignment_subq.c.total_responses, 0) <= response_count_max
                )

            if completion_rate_min is not None:
                query = query.where(
                    func.coalesce(assignment_subq.c.avg_completion_rate, 0) >= completion_rate_min
                )

            if completion_rate_max is not None:
                query = query.where(
                    func.coalesce(assignment_subq.c.avg_completion_rate, 0) <= completion_rate_max
                )

        result = await self.session.execute(query)
        return result.scalar_one()