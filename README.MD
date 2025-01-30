### To get started 
copy `.env.dist` to `.env` and fill in the required data.



### How to create and register handlers:
Create a module `your_file_name.py` in the `handlers` folder.

Create a router in `your_file_name.py`.
```python
from aiogram import Router
user_router = Router()
```
You can create multiple routers in one module and attach handlers to each of them.
You can register handlers using decorators:
```python
@user_router.message(commands=["start"])
async def user_start(message):
    await message.reply("Hello, regular user!")
```

Go to the `handlers/__init__.py` file and add all routers to it:
```python
from .admin import admin_router
from .echo import echo_router
from .user import user_router

...


routers_list = [
    admin_router,
    user_router,
    echo_router,  # echo_router must be last
]

```
### How to add handlers to our bot:
Go to the `bot.py` file and unpack our handlers:
```python
from tgbot.handlers import routers_list

...

async def main():
   
    ...

   dp.include_routers(*routers_list)

    ...


```

### How to start the Database and make your first migration:
1. Go to the `.env` file and fill in the database details if you haven't done so already.

2. Go to the `docker-compose.yml` file and uncomment the sections: `api`, `pg_database` and `volumes` to get started.

3. Now we can restart Docker with new containers using the command:

    `docker-compose exec api alembic upgrade head`

4. Everything is ready! Now we can perform the migration!
Open terminal and enter the following command:

    `docker-compose exec api alembic upgrade head`

### How to test the API
The project includes a pre-configured API test file `questionnaires.http` that you can use to test the questionnaire endpoints. You can use this file with tools like VS Code's REST Client extension or JetBrains IDEs.

The following API endpoints are already implemented and ready for testing:

#### Available Endpoints:
- `GET /questionnaires` - List all questionnaires
- `GET /questionnaires?limit=5` - Get limited number of questionnaires
- `GET /questionnaires/latest` - Get latest questionnaires (default limit 10)
- `GET /questionnaires/{id}` - Get specific questionnaire by ID
- `POST /questionnaires` - Create new questionnaire
- `PUT /questionnaires/{id}` - Update existing questionnaire
- `DELETE /questionnaires/{id}` - Delete questionnaire
- `POST /questionnaires/{id}/assign` - Assign questionnaire to a group

### What's Already Implemented
1. **Basic Infrastructure:**
   - Docker setup with PostgreSQL database
   - Alembic migrations system
   - Base router configuration
   - Environment configuration system

2. **Database Models:**
   - Questionnaire model with all necessary fields
   - Group assignment functionality
   - Anonymous survey support

3. **API Features:**
   - CRUD operations for questionnaires
   - Pagination support for listing questionnaires
   - Latest questionnaires retrieval
   - Group assignment system

4. **Testing:**
   - HTTP test file with example requests
   - Test data samples
   - Environment configuration for testing

To test the API endpoints:
1. Make sure your Docker containers are running
2. Open `questionnaires.http` in your IDE
3. Use the REST Client to send requests to the endpoints
4. Check the responses to verify functionality

The test file includes examples of request bodies and different query parameters you can use to test various scenarios.