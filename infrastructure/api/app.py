import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import auth, questionnaires, groups, user_profiles, assignments

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(groups.router, prefix="/api")
app.include_router(questionnaires.router, prefix="/api")
app.include_router(user_profiles.router, prefix="/api")
app.include_router(assignments.router, prefix="/api")
