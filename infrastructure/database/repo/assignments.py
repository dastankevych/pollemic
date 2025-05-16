from datetime import datetime
from typing import Optional, List
from sqlalchemy import select, desc, func, and_, or_, case
from sqlalchemy.orm import joinedload

from infrastructure.database.models import (
    Assignment,
    Questionnaire,
    Response,
    Group,
    User
)
from .base import BaseRepo
from infrastructure.database.exceptions import NotFoundError


class AssignmentRepo(BaseRepo):
    async def assign_questionnaire(
            self,
            questionnaire_id: int,
            group_id: int,
            start_time: datetime,
            deadline_time: datetime,
            created_by: int,
            name: Optional[str] = None,
            bot=None,
            bot_username: Optional[str] = None
    ) -> Assignment:
        """
        Assign questionnaire to a group and optionally notify the group.

        Args:
            questionnaire_id: ID of the questionnaire to assign.
            group_id: ID of the group to assign the questionnaire to.
            start_time: The start time for the questionnaire.
            deadline_time: The deadline for the questionnaire responses.
            created_by: User ID who created the assignment.
            name: Optional name for the assignment.
            bot: Instance of `aiogram.Bot` to send messages.
            bot_username: Bot's username for deep link creation.

        Returns:
            The created Assignment object.
        """
        # Step 1: Check if the group exists
        group = await self.session.get(Group, group_id)
        if not group:
            raise NotFoundError(f"Group with ID {group_id} not found")
        if not group.is_active:
            raise ValueError(f"Group with ID {group_id} is inactive and cannot be assigned to")

        # Step 2: Check if the questionnaire exists
        questionnaire = await self.session.get(Questionnaire, questionnaire_id)
        if not questionnaire:
            raise NotFoundError(f"Questionnaire with ID {questionnaire_id} not found")

        # Step 3: Assign the questionnaire
        assignment = Assignment(
            questionnaire_id=questionnaire_id,
            group_id=group_id,
            name=name or questionnaire.title,
            start_time=start_time,
            deadline_time=deadline_time,
            created_by=created_by
        )
        self.session.add(assignment)
        await self.session.flush()  # Generate ID but don't commit yet

        # Step 4: Notify the group if bot is provided
        if bot and bot_username:
            from tgbot.keyboards.inline import get_questionnaire_button
            from tgbot.services.broadcaster import send_message

            text = f"📋 A new questionnaire has been assigned to your group!\n\n" \
                   f"Title: {questionnaire.title}\n" \
                   f"Start: {start_time.strftime('%Y-%m-%d %H:%M')}\n" \
                   f"Due Date: {deadline_time.strftime('%Y-%m-%d %H:%M')}"

            button = get_questionnaire_button(assignment_id=assignment.id, bot_username=bot_username)
            await send_message(bot=bot, user_id=group_id, text=text, reply_markup=button)

        await self.session.commit()
        await self.session.refresh(assignment)

        return assignment

    async def get_assignment_by_id(self, assignment_id: int) -> Optional[Assignment]:
        """Get questionnaire assignment by ID with related entities loaded"""
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

    async def delete_assignment(self, assignment_id: int) -> bool:
        """Delete an assignment. Returns True if deleted, False if not found"""
        assignment = await self.get_assignment_by_id(assignment_id)
        if assignment:
            await self.session.delete(assignment)
            await self.session.commit()
            return True
        return False

    async def update_assignment(
            self,
            assignment_id: int,
            name: Optional[str] = None,
            start_time: Optional[datetime] = None,
            deadline_time: Optional[datetime] = None,
    ) -> Optional[Assignment]:
        """Update an existing assignment"""
        assignment = await self.get_assignment_by_id(assignment_id)
        if not assignment:
            return None

        if name is not None:
            assignment.name = name
        if start_time is not None:
            assignment.start_time = start_time
        if deadline_time is not None:
            assignment.deadline_time = deadline_time

        await self.session.commit()
        await self.session.refresh(assignment)
        return assignment

    async def get_active_assignments(self) -> List[Assignment]:
        """Get all active assignments (deadline in the future)"""
        now = datetime.now()
        query = (
            select(Assignment)
            .where(Assignment.deadline_time > now)
            .options(
                joinedload(Assignment.questionnaire),
                joinedload(Assignment.target_group),
                joinedload(Assignment.creator)
            )
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def list_latest_updated_assignments(self, limit: int = 10) -> List[Assignment]:
        """List the most recent assignments, sorted by updated_at in descending order."""
        query = (
            select(Assignment)
            .options(
                joinedload(Assignment.questionnaire),
                joinedload(Assignment.target_group),
                joinedload(Assignment.creator)
            )
            .order_by(desc(Assignment.updated_at))
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def filter_assignments(
            self,
            status: Optional[List[str]] = None,  # active, completed, upcoming
            questionnaire_id: Optional[int] = None,
            group_id: Optional[int] = None,
            creator_id: Optional[int] = None,
            start_date_from: Optional[datetime] = None,
            start_date_to: Optional[datetime] = None,
            end_date_from: Optional[datetime] = None,
            end_date_to: Optional[datetime] = None,
            name_search: Optional[str] = None,
            response_count_min: Optional[int] = None,
            response_count_max: Optional[int] = None,
            completion_rate_min: Optional[float] = None,
            completion_rate_max: Optional[float] = None,
            limit: Optional[int] = None,
            offset: Optional[int] = None,
            sort_by: str = "deadline_time",
            sort_order: str = "desc"
    ) -> List[Assignment]:
        """
        Filter assignments based on multiple criteria

        Args:
            status: List of status values (active, completed, upcoming)
            questionnaire_id: Filter by specific questionnaire
            group_id: Filter by specific group
            creator_id: Filter by creator user ID
            start_date_from: Filter assignments starting after this date
            start_date_to: Filter assignments starting before this date
            end_date_from: Filter assignments ending after this date
            end_date_to: Filter assignments ending before this date
            name_search: Search term for assignment name
            limit: Maximum number of results to return
            offset: Number of results to skip
            sort_by: Field to sort by (deadline_time, start_time, name, response_count)
            sort_order: Sort order (asc or desc)

        Returns:
            List of assignments matching the filter criteria
        """
        query = (
            select(Assignment)
            .options(
                joinedload(Assignment.questionnaire),
                joinedload(Assignment.target_group),
                joinedload(Assignment.creator)
            )
        )

        # Build the where conditions
        conditions = []
        now = datetime.now()

        # Status filter
        if status:
            status_conditions = []
            for status_value in status:
                if status_value == "active":
                    # Active: current time is between start_time and deadline_time
                    status_conditions.append(
                        and_(
                            Assignment.start_time <= now,
                            Assignment.deadline_time > now
                        )
                    )
                elif status_value == "completed":
                    # Completed: deadline has passed
                    status_conditions.append(Assignment.deadline_time <= now)
                elif status_value == "upcoming":
                    # Upcoming: start time is in the future
                    status_conditions.append(Assignment.start_time > now)
            if status_conditions:
                conditions.append(or_(*status_conditions))

        # Specific filters
        if questionnaire_id:
            conditions.append(Assignment.questionnaire_id == questionnaire_id)

        if group_id:
            conditions.append(Assignment.group_id == group_id)

        if creator_id:
            conditions.append(Assignment.created_by == creator_id)

        # Date range filters
        if start_date_from:
            conditions.append(Assignment.start_time >= start_date_from)

        if start_date_to:
            conditions.append(Assignment.start_time <= start_date_to)

        if end_date_from:
            conditions.append(Assignment.deadline_time >= end_date_from)

        if end_date_to:
            conditions.append(Assignment.deadline_time <= end_date_to)

        # Name search
        if name_search:
            conditions.append(Assignment.name.ilike(f"%{name_search}%"))

        # Apply conditions to query
        if conditions:
            query = query.where(and_(*conditions))

        # Handle response count and completion rate filters
        if response_count_min or response_count_max or completion_rate_min or completion_rate_max or sort_by == "response_count":
            response_stats = (
                select(
                    Response.assignment_id,
                    func.count(Response.id).label("response_count"),
                    func.avg(
                        case(
                            (Response.is_completed, 100),
                            else_=0
                        )
                    ).label("completion_rate")
                )
                .group_by(Response.assignment_id)
                .subquery()
            )

            # Join with the subquery
            query = query.outerjoin(
                response_stats,
                Assignment.id == response_stats.c.assignment_id
            )

            # Apply response count and completion rate filters
            if response_count_min is not None:
                query = query.where(
                    func.coalesce(response_stats.c.response_count, 0) >= response_count_min
                )

            if response_count_max is not None:
                query = query.where(
                    func.coalesce(response_stats.c.response_count, 0) <= response_count_max
                )

            if completion_rate_min is not None:
                query = query.where(
                    func.coalesce(response_stats.c.completion_rate, 0) >= completion_rate_min
                )

            if completion_rate_max is not None:
                query = query.where(
                    func.coalesce(response_stats.c.completion_rate, 0) <= completion_rate_max
                )

            # Sorting by response count
            if sort_by == "response_count":
                query = query.order_by(
                    desc(response_stats.c.response_count) if sort_order == "desc"
                    else response_stats.c.response_count
                )

        # Sorting
        if sort_by == "deadline_time":
            query = query.order_by(
                desc(Assignment.deadline_time) if sort_order == "desc"
                else Assignment.deadline_time
            )
        elif sort_by == "start_time":
            query = query.order_by(
                desc(Assignment.start_time) if sort_order == "desc"
                else Assignment.start_time
            )
        elif sort_by == "name":
            query = query.order_by(
                desc(Assignment.name) if sort_order == "desc"
                else Assignment.name
            )

        # Pagination
        if limit:
            query = query.limit(limit)
        if offset:
            query = query.offset(offset)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def count_filtered_assignments(
            self,
            status: Optional[List[str]] = None,
            # questionnaire_id: Optional[int] = None,
            # group_id: Optional[int] = None,
            # creator_id: Optional[int] = None,
            start_date_from: Optional[datetime] = None,
            start_date_to: Optional[datetime] = None,
            end_date_from: Optional[datetime] = None,
            end_date_to: Optional[datetime] = None,
            name_search: Optional[str] = None,
    ) -> int:
        """Count assignments matching the filter criteria"""
        query = select(func.count(Assignment.id))

        conditions = []
        now = datetime.now()

        # Status filter
        if status:
            status_conditions = []
            for status_value in status:
                if status_value == "active":
                    # Active: current time is between start_time and deadline_time
                    status_conditions.append(
                        and_(
                            Assignment.start_time <= now,
                            Assignment.deadline_time > now
                        )
                    )
                elif status_value == "completed":
                    # Completed: deadline has passed
                    status_conditions.append(Assignment.deadline_time <= now)
                elif status_value == "upcoming":
                    # Upcoming: start time is in the future
                    status_conditions.append(Assignment.start_time > now)
            if status_conditions:
                conditions.append(or_(*status_conditions))

        # Specific filters
        # !!!!!!!!!!!! que name
        # if questionnaire_id:
        #     conditions.append(Assignment.questionnaire_id == questionnaire_id)
        #
        # # !!!!!!!!!!!! group name and tag
        # if group_id:
        #     conditions.append(Assignment.group_id == group_id)
        #
        # # !!!!!!!!!!!! nick
        # if creator_id:
        #     conditions.append(Assignment.created_by == creator_id)

        # Date range filters
        if start_date_from:
            conditions.append(Assignment.start_time >= start_date_from)

        if start_date_to:
            conditions.append(Assignment.start_time <= start_date_to)

        if end_date_from:
            conditions.append(Assignment.deadline_time >= end_date_from)

        if end_date_to:
            conditions.append(Assignment.deadline_time <= end_date_to)

        # Name search
        if name_search:
            conditions.append(Assignment.name.ilike(f"%{name_search}%"))

        # Apply conditions to query
        if conditions:
            query = query.where(and_(*conditions))

        result = await self.session.execute(query)
        return result.scalar_one()