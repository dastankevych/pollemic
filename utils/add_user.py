import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from infrastructure.database.repo.users import UserRepo
from infrastructure.database.models import UserRole
from infrastructure.database.setup import create_engine, create_session_pool
from tgbot.config import load_config
from infrastructure.api.security.password import get_password_hash


async def add_user(
        user_id: int,
        full_name: str,
        username: str,
        password: str,
        role: UserRole = UserRole.UNIVERSITY_ADMIN
):
    # Загрузка конфигурации и создание сессии базы данных
    config = load_config(".env")
    engine = create_engine(config.db)
    session_pool = create_session_pool(engine)

    async with session_pool() as session:
        # Создание репозитория пользователей
        user_repo = UserRepo(session=session)

        # Создание или обновление пользователя
        user = await user_repo.get_or_create_user(
            user_id=user_id,
            full_name=full_name,
            username=username,
            role=role,
            password=password
        )

        print(f"Пользователь создан: {user.user_id} ({user.username}) с ролью {user.role}")


# Пример использования
if __name__ == "__main__":
    # Создаем нового пользователя с уникальным ID
    USER_ID = 54321  # Новый уникальный ID
    FULL_NAME = "Test User"
    USERNAME = "testuser"  # Telegram username без @
    PASSWORD = "test1234"
    ROLE = UserRole.MENTOR  # Используем роль MENTOR для тестирования

    asyncio.run(add_user(USER_ID, FULL_NAME, USERNAME, PASSWORD, ROLE))
