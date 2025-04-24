from typing import Optional, List
from sqlalchemy import select, update
from infrastructure.database.models import StudentProfile, MentorProfile, AdminProfile
from .base import BaseRepo

class StudentProfileRepo(BaseRepo):
    pass

class MentorProfileRepo(BaseRepo):
    pass

class AdminProfileRepo(BaseRepo):
    pass