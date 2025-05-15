from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timedelta
from sqlalchemy import select, update, delete, desc, func, and_, or_, case, cast, String, extract
from sqlalchemy.orm import joinedload, contains_eager
from sqlalchemy.sql import text

from infrastructure.database.models import Response, Assignment, User, Group, Questionnaire
from .base import BaseRepo
from infrastructure.database.exceptions import NotFoundError


class ResponseRepo(BaseRepo):
    async def submit_response(
            self,
            assignment_id: int,
            student_id: int,
            answers: dict,
            is_completed: bool = True,
            submitted_at: Optional[datetime] = None
    ) -> Response:
        """Submit response to questionnaire"""
        # Check if the assignment exists
        assignment = await self.session.get(Assignment, assignment_id)
        if not assignment:
            raise NotFoundError(f"Assignment with ID {assignment_id} not found")

        # Check if a response already exists for this student and assignment
        existing = await self.get_user_response(assignment_id, student_id)

        if existing:
            # Update existing response
            existing.answers = answers
            existing.is_completed = is_completed
            existing.submitted_at = submitted_at or datetime.now()
            await self.session.commit()
            await self.session.refresh(existing)
            return existing
        else:
            # Create new response
            response = Response(
                assignment_id=assignment_id,
                student_id=student_id,
                answers=answers,
                is_completed=is_completed,
                submitted_at=submitted_at or datetime.now()
            )
            self.session.add(response)
            await self.session.commit()
            await self.session.refresh(response)
            return response

    async def get_user_response(self, assignment_id: int, user_id: int) -> Optional[Response]:
        """Get user response for a specific assignment"""
        query = (
            select(Response)
            .where(
                Response.assignment_id == assignment_id,
                Response.student_id == user_id
            )
            .options(
                joinedload(Response.assignment),
                joinedload(Response.student)
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_response_by_id(self, response_id: int) -> Optional[Response]:
        """Get a response by its ID"""
        query = (
            select(Response)
            .where(Response.id == response_id)
            .options(
                joinedload(Response.assignment),
                joinedload(Response.student)
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_assignment_responses(self, assignment_id: int) -> List[Response]:
        """Get all responses for a specific assignment"""
        query = (
            select(Response)
            .where(Response.assignment_id == assignment_id)
            .options(
                joinedload(Response.assignment),
                joinedload(Response.student)
            )
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_questionnaire_responses(self, questionnaire_id: int) -> List[Response]:
        """
        Get all responses for a specific questionnaire across all assignments.
        """
        query = (
            select(Response)
            .join(Assignment)
            .where(Assignment.questionnaire_id == questionnaire_id)
            .options(
                joinedload(Response.assignment),
                joinedload(Response.student)
            )
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_group_responses(self, group_id: int) -> List[Response]:
        """
        Get all responses from a specific group across all assignments.
        """
        query = (
            select(Response)
            .join(Assignment)
            .where(Assignment.group_id == group_id)
            .options(
                joinedload(Response.assignment),
                joinedload(Response.student)
            )
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def delete_response(self, response_id: int) -> bool:
        """Delete a response. Returns True if deleted, False if not found"""
        response = await self.session.get(Response, response_id)
        if response:
            await self.session.delete(response)
            await self.session.commit()
            return True
        return False

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
            .options(
                joinedload(Response.assignment),
                joinedload(Response.student)
            )
        )
        result = await self.session.execute(query)
        responses = result.scalars().all()

        # Group responses by assignment_id
        grouped_responses = {}
        for response in responses:
            grouped_responses.setdefault(response.assignment_id, []).append(response)

        return grouped_responses

    async def filter_responses(
            self,
            assignment_id: Optional[int] = None,
            questionnaire_id: Optional[int] = None,
            group_id: Optional[int] = None,
            student_id: Optional[int] = None,
            completion_status: Optional[bool] = None,
            submitted_from: Optional[datetime] = None,
            submitted_to: Optional[datetime] = None,
            answer_contains: Optional[str] = None,
            limit: Optional[int] = None,
            offset: Optional[int] = None,
            sort_by: str = "submitted_at",
            sort_order: str = "desc"
    ) -> List[Response]:
        """
        Filter responses based on multiple criteria.

        Args:
            assignment_id: Filter by specific assignment
            questionnaire_id: Filter by specific questionnaire
            group_id: Filter by specific group
            student_id: Filter by specific student
            completion_status: Filter by completion status (True/False)
            submitted_from: Filter responses submitted after this date
            submitted_to: Filter responses submitted before this date
            answer_contains: Search for text within response answers
            limit: Maximum number of results to return
            offset: Number of results to skip
            sort_by: Field to sort by (submitted_at)
            sort_order: Sort order (asc or desc)

        Returns:
            List of responses matching the filter criteria
        """
        query = (
            select(Response)
            .options(
                joinedload(Response.assignment),
                joinedload(Response.student)
            )
        )

        # Build the where conditions
        conditions = []

        # Specific filters
        if assignment_id:
            conditions.append(Response.assignment_id == assignment_id)

        if student_id:
            conditions.append(Response.student_id == student_id)

        if completion_status is not None:
            conditions.append(Response.is_completed == completion_status)

        # Date range filters
        if submitted_from:
            conditions.append(Response.submitted_at >= submitted_from)

        if submitted_to:
            conditions.append(Response.submitted_at <= submitted_to)

        # Join with Assignment if we need to filter by questionnaire_id or group_id
        if questionnaire_id or group_id:
            query = query.join(Assignment)

            if questionnaire_id:
                conditions.append(Assignment.questionnaire_id == questionnaire_id)

            if group_id:
                conditions.append(Assignment.group_id == group_id)

        # Text search in answers
        if answer_contains:
            # This is a simplistic approach that searches for text in the JSON answers
            # PostgreSQL provides more sophisticated JSON search capabilities
            conditions.append(
                cast(Response.answers, String).ilike(f"%{answer_contains}%")
            )

        # Apply conditions to query
        if conditions:
            query = query.where(and_(*conditions))

        # Sorting
        if sort_by == "submitted_at":
            query = query.order_by(
                desc(Response.submitted_at) if sort_order == "desc"
                else Response.submitted_at
            )

        # Pagination
        if limit:
            query = query.limit(limit)
        if offset:
            query = query.offset(offset)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def count_filtered_responses(
            self,
            assignment_id: Optional[int] = None,
            questionnaire_id: Optional[int] = None,
            group_id: Optional[int] = None,
            student_id: Optional[int] = None,
            completion_status: Optional[bool] = None,
            submitted_from: Optional[datetime] = None,
            submitted_to: Optional[datetime] = None,
            answer_contains: Optional[str] = None,
    ) -> int:
        """Count responses matching the filter criteria"""
        query = select(func.count(Response.id))

        # Build the where conditions
        conditions = []

        # Specific filters
        if assignment_id:
            conditions.append(Response.assignment_id == assignment_id)

        if student_id:
            conditions.append(Response.student_id == student_id)

        if completion_status is not None:
            conditions.append(Response.is_completed == completion_status)

        # Date range filters
        if submitted_from:
            conditions.append(Response.submitted_at >= submitted_from)

        if submitted_to:
            conditions.append(Response.submitted_at <= submitted_to)

        # Join with Assignment if we need to filter by questionnaire_id or group_id
        if questionnaire_id or group_id:
            query = query.join(Assignment)

            if questionnaire_id:
                conditions.append(Assignment.questionnaire_id == questionnaire_id)

            if group_id:
                conditions.append(Assignment.group_id == group_id)

        # Text search in answers
        if answer_contains:
            conditions.append(
                cast(Response.answers, String).ilike(f"%{answer_contains}%")
            )

        # Apply conditions to query
        if conditions:
            query = query.where(and_(*conditions))

        result = await self.session.execute(query)
        return result.scalar_one()

    async def get_response_statistics(
            self,
            assignment_id: Optional[int] = None,
            questionnaire_id: Optional[int] = None,
            group_id: Optional[int] = None,
            time_period: Optional[str] = None,  # "day", "week", "month"
            from_date: Optional[datetime] = None,
            to_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get statistics for responses.

        Args:
            assignment_id: Filter by specific assignment
            questionnaire_id: Filter by specific questionnaire
            group_id: Filter by specific group
            time_period: Group statistics by time period
            from_date: Start date for statistics
            to_date: End date for statistics

        Returns:
            Dictionary with response statistics
        """
        # Base query to count responses
        count_query = select(func.count(Response.id))

        # Query to count completed responses
        completed_query = select(
            func.count(Response.id)
        ).where(Response.is_completed == True)

        # Add filters based on parameters
        if assignment_id:
            count_query = count_query.where(Response.assignment_id == assignment_id)
            completed_query = completed_query.where(Response.assignment_id == assignment_id)

        if from_date:
            count_query = count_query.where(Response.submitted_at >= from_date)
            completed_query = completed_query.where(Response.submitted_at >= from_date)

        if to_date:
            count_query = count_query.where(Response.submitted_at <= to_date)
            completed_query = completed_query.where(Response.submitted_at <= to_date)

        # If we need to filter by questionnaire_id or group_id, join with Assignment
        if questionnaire_id or group_id:
            count_query = count_query.join(Assignment)
            completed_query = completed_query.join(Assignment)

            if questionnaire_id:
                count_query = count_query.where(Assignment.questionnaire_id == questionnaire_id)
                completed_query = completed_query.where(Assignment.questionnaire_id == questionnaire_id)

            if group_id:
                count_query = count_query.where(Assignment.group_id == group_id)
                completed_query = completed_query.where(Assignment.group_id == group_id)

        # Execute queries
        total_count = await self.session.execute(count_query)
        completed_count = await self.session.execute(completed_query)

        total = total_count.scalar_one()
        completed = completed_count.scalar_one()

        # Calculate completion rate
        completion_rate = (completed / total * 100) if total > 0 else 0

        # Results dictionary
        results = {
            "total_responses": total,
            "completed_responses": completed,
            "completion_rate": completion_rate,
        }

        # Calculate time-based statistics if requested
        if time_period and (from_date or to_date):
            time_stats = await self._get_time_based_statistics(
                time_period=time_period,
                from_date=from_date or (datetime.now() - timedelta(days=30)),
                to_date=to_date or datetime.now(),
                assignment_id=assignment_id,
                questionnaire_id=questionnaire_id,
                group_id=group_id
            )
            results["time_based_stats"] = time_stats

        return results

    async def _get_time_based_statistics(
            self,
            time_period: str,
            from_date: datetime,
            to_date: datetime,
            assignment_id: Optional[int] = None,
            questionnaire_id: Optional[int] = None,
            group_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get time-based statistics for responses.

        Args:
            time_period: Group statistics by time period ("day", "week", "month")
            from_date: Start date for statistics
            to_date: End date for statistics
            assignment_id: Filter by specific assignment
            questionnaire_id: Filter by specific questionnaire
            group_id: Filter by specific group

        Returns:
            List of dictionaries with time-based statistics
        """
        # Base query
        base_query = select(
            # We'll group by day, week, or month
            func.date_trunc(time_period, Response.submitted_at).label("period"),
            func.count(Response.id).label("total"),
            func.count(case((Response.is_completed == True, 1))).label("completed")
        )

        # Apply filters
        if assignment_id:
            base_query = base_query.where(Response.assignment_id == assignment_id)

        if from_date:
            base_query = base_query.where(Response.submitted_at >= from_date)

        if to_date:
            base_query = base_query.where(Response.submitted_at <= to_date)

        # Join with Assignment if needed
        if questionnaire_id or group_id:
            base_query = base_query.join(Assignment)

            if questionnaire_id:
                base_query = base_query.where(Assignment.questionnaire_id == questionnaire_id)

            if group_id:
                base_query = base_query.where(Assignment.group_id == group_id)

        # Group by the time period and order by period
        base_query = base_query.group_by(text("period")).order_by(text("period"))

        # Execute query
        result = await self.session.execute(base_query)
        rows = result.fetchall()

        # Format results
        stats = []
        for row in rows:
            period, total, completed = row
            completion_rate = (completed / total * 100) if total > 0 else 0

            stats.append({
                "period": period.isoformat() if period else None,
                "total_responses": total,
                "completed_responses": completed,
                "completion_rate": completion_rate
            })

        return stats

    async def get_student_progress(
            self,
            student_id: int,
            assignment_ids: Optional[List[int]] = None,
            questionnaire_id: Optional[int] = None,
            group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get the progress of a specific student across multiple assignments.

        Args:
            student_id: ID of the student
            assignment_ids: List of assignment IDs to get progress for
            questionnaire_id: Filter by specific questionnaire
            group_id: Filter by specific group

        Returns:
            Dictionary with student progress information
        """
        # Base query
        query = (
            select(
                Response.assignment_id,
                Response.is_completed,
                Response.submitted_at
            )
            .where(Response.student_id == student_id)
        )

        # Apply filters
        if assignment_ids:
            query = query.where(Response.assignment_id.in_(assignment_ids))

        # Join with Assignment if needed
        if questionnaire_id or group_id:
            query = query.join(Assignment)

            if questionnaire_id:
                query = query.where(Assignment.questionnaire_id == questionnaire_id)

            if group_id:
                query = query.where(Assignment.group_id == group_id)

        # Execute query
        result = await self.session.execute(query)
        rows = result.fetchall()

        # Organize results by assignment
        assignments_data = {}
        for row in rows:
            assignment_id, is_completed, submitted_at = row
            assignments_data[assignment_id] = {
                "is_completed": is_completed,
                "submitted_at": submitted_at.isoformat() if submitted_at else None
            }

        # Get all assignments that the student should have completed
        all_assignments_query = select(Assignment.id)

        if questionnaire_id:
            all_assignments_query = all_assignments_query.where(
                Assignment.questionnaire_id == questionnaire_id
            )

        if group_id:
            all_assignments_query = all_assignments_query.where(
                Assignment.group_id == group_id
            )

        if assignment_ids:
            all_assignments_query = all_assignments_query.where(
                Assignment.id.in_(assignment_ids)
            )

        all_assignments_result = await self.session.execute(all_assignments_query)
        all_assignment_ids = [row[0] for row in all_assignments_result.fetchall()]

        # Calculate overall progress
        total_assignments = len(all_assignment_ids)
        completed_assignments = sum(
            1 for a_id in all_assignment_ids
            if a_id in assignments_data and assignments_data[a_id]["is_completed"]
        )

        completion_rate = (completed_assignments / total_assignments * 100) if total_assignments > 0 else 0

        # Prepare final result
        return {
            "student_id": student_id,
            "total_assignments": total_assignments,
            "completed_assignments": completed_assignments,
            "completion_rate": completion_rate,
            "assignments": assignments_data
        }