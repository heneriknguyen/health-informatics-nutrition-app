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
- Steps to use pgAdmin:
    - Once you open pgAdmin, click on the Object tab (in the top left corner) and Create -> Server Group, with any Name (I named it NutritionDB)
    - Then right click the NutritionDB that you created and click Register -> Server. In the "General tab" name it whatever you like (I named it nutrition_app_db). Then in the "Connection" tab:
        - Host name/address = localhost
        - Port = 5432
        - Maintenance database = nutrition_app
        - Username = postgres
        - Password = password (Click the Save password)
     
Need to go to Render for deployment stuff. I sent an invite link.
- To test backend server is good, go to: https://nutrition-app-backend-zgil.onrender.com/api/health
