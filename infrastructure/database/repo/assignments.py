from datetime import datetime
from typing import Optional, List
from sqlalchemy import select, update
from infrastructure.database.models import Assignment
from .base import BaseRepo

class AssignmentsRepo(BaseRepo):
    async def create_or_update_assignment(
        self,
        assignment: Assignment,
    ) -> Assignment:
        """Create new assignment or update existing one"""
        await self.session.merge(assignment)
        await self.session.commit()
        return assignment
    
    async def get_assignment_by_id(self, assignment_id: int) -> Optional[Assignment]:
        stmt = select(Assignment).where(Assignment.id == assignment_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_assignments(self) -> List[Assignment]:
        stmt = select(Assignment)
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def delete_assignment(self, assignment_id: int) -> None:
        stmt = select(Assignment).where(Assignment.id == assignment_id)
        result = await self.session.execute(stmt)
        assignment = result.scalars().first()
        if assignment:
            await self.session.delete(assignment)
            await self.session.commit()