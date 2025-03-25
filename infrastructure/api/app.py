from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from .routes import questionnaires

app = FastAPI()
app.mount("/static", StaticFiles(directory="infrastructure/api/static"), name="static")

# Include routers
app.include_router(questionnaires.router)
