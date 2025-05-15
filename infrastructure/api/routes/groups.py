from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from infrastructure.api.dependencies import get_group_repo
from infrastructure.database.repo.groups import GroupRepo

router = APIRouter(prefix="/group", tags=["group"])

@router.get("/")
async def list_groups(
    group_repo: GroupRepo = Depends(get_group_repo)
):
    """List all groups"""
    try:
        groups = await group_repo.get_active_groups()
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "count": len(groups),
                "groups": [
                    {
                        "group_id": group.group_id,
                        "title": group.title,
                        "is_active": group.is_active
                    } for group in groups
                ]
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing groups: {str(e)}")

@router.get("/active")
async def list_active_groups(
    group_repo: GroupRepo = Depends(get_group_repo)
):
    """List all active groups"""
    try:
        groups = await group_repo.get_active_groups()
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "count": len(groups),
                "groups": [
                    {
                        "group_id": group.group_id,
                        "title": group.title,
                        "is_active": group.is_active
                    } for group in groups
                ]
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing active groups: {str(e)}")

@router.get("/{group_id}")
async def get_group(
    group_id: int,
    group_repo: GroupRepo = Depends(get_group_repo)
):
    """Get a specific group by ID"""
    try:
        group = await group_repo.get_group(group_id)
        if not group:
            raise HTTPException(
                status_code=404,
                detail=f"Group with ID {group_id} not found"
            )

        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "group": {
                    "group_id": group.group_id,
                    "title": group.title,
                    "is_active": group.is_active
                }
            }
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching group: {str(e)}")
