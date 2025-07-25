### How to start get started:
1. Create the `.env` file and fill according to the given template below.
```
BOT_TOKEN=123456:Your-TokEn_ExaMple
ADMINS=123456,654321
USE_REDIS=False

POSTGRES_USER=someusername
POSTGRES_PASSWORD=postgres_pass12345
POSTGRES_DB=bot
DB_HOST=pg_database

SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

REDIS_HOST=redis_cache
REDIS_PORT=6388
REDIS_DB=1
REDIS_PASSWORD=someredispass

WEBHOOK_EXPOSE=8001
WEBHOOK_APP_NAME=webhook
```

2. Go to the `docker-compose.yml` file and uncomment the sections: `api`, `pg_database` and `volumes` to get started.

3. If you don't have any migrations generate it by command:

    `docker-compose exec api alembic revision --autogenerate -m "Initial migration"`

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

### What's Already Implemented (deprecated since 2025-04-18)
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