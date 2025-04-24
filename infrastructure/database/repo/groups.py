from typing import Optional, List
from sqlalchemy import select, update
from infrastructure.database.models import Group
from .base import BaseRepo

class GroupRepo(BaseRepo):
    async def get_group(self, group_id: int) -> Optional[Group]:
        """Get group by ID"""
        return await self.session.get(Group, group_id)

    async def create_or_update_group(
            self,
            group: Group,
    ) -> Group:
        """Create new group or update existing one"""
        await self.session.merge(group)
        await self.session.commit()
        return group

    async def get_active_groups(self) -> List[Group]:
        """Get all active groups"""
        query = select(Group).where(Group.is_active == True)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def deactivate_group(self, group_id: int) -> None:
        """Mark group as inactive"""
        query = (
            update(Group)
            .where(Group.group_id == group_id)
            .values(is_active=False)
        )
        await self.session.execute(query)
        await self.session.commit()
