from typing import Optional, List
from datetime import datetime

from sqlalchemy import select, update, desc
from sqlalchemy.orm import joinedload

from infrastructure.database.models import (
    Questionnaire,
    Assignment,
    Response,
    User,
    Group
)
from tgbot.keyboards.inline import get_questionnaire_button
from tgbot.services.broadcaster import send_message
from .base import BaseRepo
from infrastructure.database.exceptions import NotFoundError


class QuestionnaireRepo(BaseRepo):
    async def create_questionnaire(
            self,
            title: str,
            description: str,
            questions: dict,
            created_by: int,
            is_anonymous: bool = False,
    ) -> Questionnaire:
        """
        Create a new questionnaire
        
        Args:
            title: Title of the questionnaire
            description: Description of the questionnaire
            questions: Dictionary containing questions structure
            created_by: ID of the user creating the questionnaire
            is_anonymous: Whether responses should be anonymous
            due_date: Optional deadline for the questionnaire
        
        Raises:
            NotFoundError: If user with created_by ID doesn't exist
        """
        # Check if user exists
        user = await self.session.get(User, created_by)
        if not user:
            raise NotFoundError(f"User with ID {created_by} not found")

        questionnaire = Questionnaire(
            title=title,
            description=description,
            questions=questions,
            created_by=created_by,
            is_anonymous=is_anonymous,
        )
        self.session.add(questionnaire)
        await self.session.commit()
        return questionnaire

    async def assign_questionnaire(
            self,
            questionnaire_id: int,
            group_id: int,
            due_date: datetime,
            bot: str = None,
            bot_username: str = None
    ) -> Assignment:
        """
        Assign questionnaire to a group and notify the group.

        Args:
            questionnaire_id: ID of the questionnaire to assign.
            group_id: ID of the group to assign the questionnaire to.
            due_date: The deadline for the questionnaire responses.
            bot: Instance of `aiogram.Bot` to send messages.
            bot_username: Bot's username for deep link creation.

        Returns:
            The created Assignment object.
        """
        # Step 1: Check if the group is active
        group = await self.session.get(Group, group_id)
        if not group:
            raise NotFoundError(f"Group with ID {group_id} not found")
        if not group.is_active:
            raise ValueError(f"Group with ID {group_id} is inactive and cannot be assigned to")

        # Step 2: Assign the questionnaire
        assignment = Assignment(
            questionnaire_id=questionnaire_id,
            group_id=group_id,
            due_date=due_date,
        )
        self.session.add(assignment)
        await self.session.commit()

        # Step 3: Notify the group
        text = f"📋 A new questionnaire has been assigned to your group!\n\n" \
               f"Title: {assignment.questionnaire.title}\n" \
               f"Due Date: {due_date.strftime('%Y-%m-%d %H:%M')}"  # Format as needed

        button = get_questionnaire_button(assignment_id=assignment.id, bot_username=bot_username)
        await send_message(bot=bot, user_id=group_id, text=text, reply_markup=button)

        return assignment

    async def get_active_assignments_for_group(
            self,
            group_id: int,
    ) -> List[Assignment]:
        """Get active assignments for specific group"""
        query = (
            select(Assignment)
            .where(
                Assignment.group_id == group_id,
                Assignment.is_active == True,
            )
            .options(joinedload(Assignment.questionnaire))
        )
        result = await self.session.execute(query)
        return result.scalars().all()

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

    async def get_active_assignments(self) -> List[Assignment]:
        """Get all active questionnaire assignments"""
        query = (
            select(Assignment)
            .where(Assignment.is_active == True)
            .options(
                joinedload(Assignment.questionnaire),
                joinedload(Assignment.group)
            )
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_assignment(self, assignment_id: int) -> Optional[Assignment]:
        """Get questionnaire assignment by ID"""
        query = (
            select(Assignment)
            .where(Assignment.id == assignment_id)
            .options(
                joinedload(Assignment.questionnaire),
                joinedload(Assignment.group)
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def close_assignment(self, assignment_id: int) -> None:
        """Close a questionnaire assignment"""
        query = (
            update(Assignment)
            .where(Assignment.id == assignment_id)
            .values(is_active=False)
        )
        await self.session.execute(query)
        await self.session.commit()

    async def get_questionnaire(self, questionnaire_id: int) -> Optional[Questionnaire]:
        """Get a specific questionnaire by ID"""
        return await self.session.get(Questionnaire, questionnaire_id)

    async def update_questionnaire(
            self,
            questionnaire_id: int,
            title: str,
            description: str,
            questions: dict,
            is_anonymous: bool = False
    ) -> Optional[Questionnaire]:
        """
        Update an existing questionnaire
        
        Args:
            questionnaire_id: ID of questionnaire to update
            title: New title
            description: New description
            questions: New questions structure
            is_anonymous: Whether responses should be anonymous
            
        Returns:
            Updated questionnaire or None if not found
            
        Raises:
            NotFoundError: If questionnaire doesn't exist
        """
        questionnaire = await self.get_questionnaire(questionnaire_id)
        if not questionnaire:
            raise NotFoundError(f"Questionnaire with ID {questionnaire_id} not found")

        questionnaire.title = title
        questionnaire.description = description
        questionnaire.questions = questions
        questionnaire.is_anonymous = is_anonymous

        await self.session.commit()
        await self.session.refresh(questionnaire)
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
            .order_by(desc(Questionnaire.created_at))
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_questionnaires(self, limit: Optional[int] = None) -> List[Questionnaire]:
        """Get all questionnaires with optional limit"""
        query = select(Questionnaire).order_by(desc(Questionnaire.created_at))
        if limit is not None:
            query = query.limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_group(self, group_id) -> Group:
        """
            Get a group by its ID.

            Args:
                group_id: ID of the group to retrieve.

            Returns:
                The Group object.

            Raises:
                NotFoundError: If no group with the specified ID is found.
            """
        group = await self.session.get(Group, group_id)
        if not group:
            raise NotFoundError(f"Group with ID {group_id} not found")
        return group
