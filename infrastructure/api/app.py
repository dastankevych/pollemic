import logging

from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from .routes import questionnaires
from .routes import groups
from .routes import auth

app = FastAPI()
app.mount("/static", StaticFiles(directory="infrastructure/api/static"), name="static")
templates = Jinja2Templates(directory="infrastructure/api/templates")


# Include routers
app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(questionnaires.router)
