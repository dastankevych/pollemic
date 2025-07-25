from typing import Optional, List
from sqlalchemy import select, update
from infrastructure.database.models import Schedule, ScheduleGroup
from .base import BaseRepo

class ScheduleRepo(BaseRepo):
    """
    Repository for managing Schedule entities
    """
    
    async def create_or_update_schedule(
        self,
        schedule: Schedule,
    ) -> Schedule:
        """Create new schedule or update existing one"""
        await self.session.merge(schedule)
        await self.session.commit()
        return schedule
    
    async def get_schedule_by_id(self, schedule_id: int) -> Optional[Schedule]:
        """Get schedule by ID"""
        stmt = select(Schedule).where(Schedule.id == schedule_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()
    
    async def list_schedules(self) -> List[Schedule]:
        """List all schedules"""
        stmt = select(Schedule)
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def list_active_schedules(self) -> List[Schedule]:
        """List all active schedules"""
        stmt = select(Schedule).where(Schedule.is_active == True)
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def delete_schedule(self, schedule_id: int) -> None:
        """Delete schedule by ID"""
        stmt = select(Schedule).where(Schedule.id == schedule_id)
        result = await self.session.execute(stmt)
        schedule = result.scalars().first()
        if schedule:
            await self.session.delete(schedule)
            await self.session.commit()
    
    async def add_group_to_schedule(self, schedule_id: int, group_id: int) -> ScheduleGroup:
        """Add a group to a schedule"""
        schedule_group = ScheduleGroup(schedule_id=schedule_id, group_id=group_id)
        self.session.add(schedule_group)
        await self.session.commit()
        return schedule_group
    
    async def remove_group_from_schedule(self, schedule_id: int, group_id: int) -> None:
        """Remove a group from a schedule"""
        stmt = select(ScheduleGroup).where(
            ScheduleGroup.schedule_id == schedule_id,
            ScheduleGroup.group_id == group_id
        )
        result = await self.session.execute(stmt)
        schedule_group = result.scalars().first()
        if schedule_group:
            await self.session.delete(schedule_group)
            await self.session.commit()
    
    async def get_schedule_groups(self, schedule_id: int) -> List[ScheduleGroup]:
        """Get all groups associated with a schedule"""
        stmt = select(ScheduleGroup).where(ScheduleGroup.schedule_id == schedule_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()