# health-informatics-nutrition-app
Health Informatics group project

/server is the backend directory
/client is the frontend directory


Database:
- To start the database, run: docker-compose up -d (in the server directory)
- Verify it's working by running: docker exec -it nutrition_db psql -U postgres -d nutrition_app (this is how to access the database via terminal)
- You can check the tables by running: \dt

PostgreSQL & pgAdmin4: 
- Download PostgreSQL here (comes with pgAdmin): https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
- check your pgAdmin 4/runtime/pgAdmin4.exe (to run pgAdmin4 if it doesn't show up in the search)