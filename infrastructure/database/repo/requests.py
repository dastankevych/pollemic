from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.setup import create_engine

from infrastructure.database.repo.users import UserRepo
from infrastructure.database.repo.user_profiles import StudentProfileRepo, MentorProfileRepo, AdminProfileRepo
from infrastructure.database.repo.groups import GroupRepo
from infrastructure.database.repo.questionnaires import QuestionnaireRepo
from infrastructure.database.repo.assignments import AssignmentRepo
from infrastructure.database.repo.responses import ResponseRepo


@dataclass
class RequestsRepo:
    """
    Repository for handling database operations. This class holds all the repositories for the database models.

    You can add more repositories as properties to this class, so they will be easily accessible.
    """

    session: AsyncSession

    @property
    def users(self) -> UserRepo:
        """The User repository sessions are required to manage user operations."""
        return UserRepo(self.session)

    @property
    def student_profiles(self) -> StudentProfileRepo:
        """Student profile repository for student profile operations."""
        return StudentProfileRepo(self.session)
    
    @property
    def mentor_profiles(self) -> MentorProfileRepo:
        """Mentor profile repository for mentor profile operations."""
        return MentorProfileRepo(self.session)
    
    @property
    def admin_profiles(self) -> AdminProfileRepo:
        """Admin profile repository for admin profile operations."""
        return AdminProfileRepo(self.session)
    
    @property
    def questionnaires(self) -> QuestionnaireRepo:
        """Questionnaire repository for questionnaire operations."""
        return QuestionnaireRepo(self.session)

    @property
    def groups(self) -> GroupRepo:
        """Group repository for group operations"""
        return GroupRepo(self.session)
    
    @property
    def assignments(self) -> AssignmentRepo:
        """Assignment repository for assignment operations."""
        return AssignmentRepo(self.session)
    
    @property
    def responses(self) -> ResponseRepo:
        """Response repository for response operations."""
        return ResponseRepo(self.session)
    


if __name__ == "__main__":
    from infrastructure.database.setup import create_session_pool
    from tgbot.config import Config

    async def example_usage(config: Config):
        """
        Example usage function for the RequestsRepo class.
        Use this function as a guide to understand how to utilize RequestsRepo for managing user data.
        Pass the config object to this function for initializing the database resources.
        :param config: The config object loaded from your configuration.
        """
        engine = create_engine(config.db)
        session_pool = create_session_pool(engine)

        async with session_pool() as session:
            repo = RequestsRepo(session)

            # Replace user details with the actual values
            user = await repo.users.get_or_create_user(
                user_id=12356,
                full_name="John Doe",
                username="johndoe",
            )
