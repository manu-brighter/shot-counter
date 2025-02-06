# Shot-Counter

Shot-Counter fürs Wamserfest.

## Starting the frontend
In the root directory:
`npm run dev`

## Starting the backend
In the **root/server** directory:
`node server.js`

## Starting the local database
- go to services/Dienste as administrator.
- stop everything that could block the ports. (MariaDB:3306, Node Server:5000, Website:3000)
- find the service **MariaDB** and start it.
- check if the DB is running