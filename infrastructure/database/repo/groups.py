from typing import Optional, List
from sqlalchemy import select, update
from infrastructure.database.models import Group
from .base import BaseRepo
from infrastructure.database.exceptions import NotFoundError

class GroupRepo(BaseRepo):
    async def create_or_update_group(
            self,
            group_id: int,
            title: str,
            is_active: bool = True,
    ) -> Group:
        """Create new group or update existing one"""
        group = Group(
            id=group_id,
            title=title,
            is_active=is_active,
        )
        await self.session.merge(group)
        await self.session.commit()
        return group

    async def get_group_by_id(self, group_id) -> Group:
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

    async def get_active_groups(self) -> List[Group]:
        """Get all active groups"""
        query = select(Group).where(Group.is_active == True)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def deactivate_group(self, group_id: int) -> None:
        """Mark group as inactive"""
        query = (
            update(Group)
            .where(Group.id == group_id)
            .values(is_active=False)
        )
        await self.session.execute(query)
        await self.session.commit()