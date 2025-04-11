# infrastructure/api/routes/groups.py
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

from infrastructure.database.repo.requests import RequestsRepo
from infrastructure.api.dependencies import (
    get_group_repo,
    is_api_request
)
from infrastructure.database.exceptions import NotFoundError
from infrastructure.database.repo.groups import GroupRepo

router = APIRouter(prefix="/groups", tags=["groups"])
templates = Jinja2Templates(directory="infrastructure/api/static/templates")

@router.get("/")
async def list_groups(
        request: Request,
        group_repo: GroupRepo = Depends(get_group_repo),
        is_api: bool = Depends(is_api_request)
):
    """
    List all groups
    """
    try:
        groups = await group_repo.get_active_groups()

        if is_api:
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

        return templates.TemplateResponse(
            "list_groups.html",
            {
                "request": request,
                "groups": groups
            }
        )
    except Exception as e:
        if is_api:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": f"Error listing groups: {str(e)}"}
            )
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": f"Error listing groups: {str(e)}"}
        )

@router.get("/active")
async def list_active_groups(
        request: Request,
        group_repo: GroupRepo = Depends(get_group_repo),
        is_api: bool = Depends(is_api_request)
):
    """
    List all active groups
    """
    try:
        groups = await group_repo.get_active_groups()

        if is_api:
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

        return templates.TemplateResponse(
            "list_active_groups.html",
            {
                "request": request,
                "groups": groups
            }
        )
    except Exception as e:
        if is_api:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": f"Error listing active groups: {str(e)}"}
            )
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": f"Error listing active groups: {str(e)}"}
        )

@router.get("/{group_id}")
async def get_group(
        group_id: int,
        request: Request,
        group_repo: GroupRepo = Depends(get_group_repo),
        is_api: bool = Depends(is_api_request)
):
    """Get a specific group by ID"""
    try:
        group = await group_repo.get_group(group_id)
        if not group:
            raise NotFoundError(f"Group with ID {group_id} not found")

        if is_api:
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

        return templates.TemplateResponse(
            "view_group.html",
            {"request": request, "group": group}
        )
    except NotFoundError as e:
        if is_api:
            return JSONResponse(
                status_code=404,
                content={"status": "error", "message": str(e)}
            )
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": str(e)}
        )
    except Exception as e:
        if is_api:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": f"Error fetching group: {str(e)}"}
            )
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error": f"Error fetching group: {str(e)}"}
        )
