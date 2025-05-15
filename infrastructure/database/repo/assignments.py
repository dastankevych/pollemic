from datetime import datetime
from typing import Optional, List, Dict
from sqlalchemy import select, update, desc
from .base import BaseRepo

from sqlalchemy.orm import joinedload

from infrastructure.database.models import (
    Assignment,
    Response,
    Group
)
from tgbot.keyboards.inline import get_questionnaire_button
from tgbot.services.broadcaster import send_message
from .base import BaseRepo
from infrastructure.database.exceptions import NotFoundError

class AssignmentRepo(BaseRepo):
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

    async def get_assignment_by_id(self, assignment_id: int) -> Optional[Assignment]:
        """Get questionnaire assignment by ID"""
        query = (
            select(Assignment)
            .where(Assignment.id == assignment_id)
            .options(
                joinedload(Assignment.questionnaire),
                joinedload(Assignment.target_group),
                joinedload(Assignment.creator),
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def delete_assignment(self, assignment_id: int) -> None:
        stmt = select(Assignment).where(Assignment.id == assignment_id)
        result = await self.session.execute(stmt)
        assignment = result.scalars().first()
        if assignment:
            await self.session.delete(assignment)
            await self.session.commit()

    async def close_assignment(self, assignment_id: int) -> None:
        """Close a questionnaire assignment"""
        query = (
            update(Assignment)
            .where(Assignment.id == assignment_id)
            .values(is_active=False)
        )
        await self.session.execute(query)
        await self.session.commit()

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

    async def list_latest_updated_assignments(self) -> List[Assignment]:
        """
        List the most recent assignments, sorted by updated_at in descending order.

        Args:
            limit: The maximum number of assignments to return (default is 10).

        Returns:
            A list of Assignment objects.
        """
        stmt = (
            select(Assignment)
            .order_by(desc(Assignment.updated_at))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()