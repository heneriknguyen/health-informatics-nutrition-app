# health-informatics-nutrition-app
Health Informatics group project

/server is the backend directory
/client is the frontend directory


Database:
- To start the database, run: docker-compose up -d (in the server directory)
- Verify it's working by running: docker exec -it nutrition_db psql -U postgres -d nutrition_app
- You can check the tables by running: \dt

pgAdmin:
- check your pgAdmin 4/runtime/pgAdmin4.exe (to run pgAdmin4 if it doesn't show up in the search)