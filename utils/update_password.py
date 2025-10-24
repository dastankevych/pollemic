import asyncio
from infrastructure.database.repo.users import UserRepo
from infrastructure.database.setup import create_engine, create_session_pool
from tgbot.config import load_config

async def update_password(user_id: int, new_password: str):
    # Load configuration and create database session
    config = load_config(".env")
    engine = create_engine(config.db)
    session_pool = create_session_pool(engine)

    async with session_pool() as session:
        # Create user repository
        user_repo = UserRepo(session=session)

        # Update user's password
        user = await user_repo.set_password(user_id, new_password)
        
        if user:
            print(f"Password updated for user: {user.username}")
            print(f"New password hash: {user.password_hash}")
        else:
            print(f"User with ID {user_id} not found")

# Example usage
if __name__ == "__main__":
    # Update password for admin user (ID: 12345)
    USER_ID = 12345
    NEW_PASSWORD = "1234"
    
    asyncio.run(update_password(USER_ID, NEW_PASSWORD))