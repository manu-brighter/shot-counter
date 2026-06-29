# Shot-Counter

Shot-Counter fürs Wamserfest.

## Setup

### Installation

1. Install root dependencies:
   ```bash
   npm install
   ```

2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

3. Configure environment variables:

   **Server** (required):
   ```bash
   cd server
   cp .env.example .env
   ```
   Edit `.env` and update database credentials if needed (defaults: `root`/`root` on `localhost:3306`).

   **Root** (optional):
   ```bash
   cp .env.example .env
   ```
   Contains `VITE_API_BASE_URL` (defaults to `http://localhost:5000`). Only needed if your backend runs on a different port.

## Database Setup

1. Start MariaDB:
   - Go to Services (Administrator mode)
   - Stop any services that could block port **3306** (MariaDB)
   - Start the **MariaDB** service
   - Verify the connection:
     ```bash
     mysql -u root -p -e "SHOW DATABASES;"
     ```

2. Initialize the database schema:
   ```bash
   mysql -u root -p < server/schema.sql
   ```
   This creates the `shot_counter` database and the `teams` table.

## Starting the Application

### Frontend (dev server)
In the root directory:
```bash
npm run dev
```
The frontend runs on `http://localhost:3000` (Vite).

### Backend (API server)
In the **server** directory:
```bash
node server.js
```
Or with auto-reload on changes:
```bash
npm run dev
```
The backend runs on `http://localhost:5000` by default.

## API Reference

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | — | Health check (returns `{ status, db }`) |
| GET | `/api/teams` | — | Fetch all teams and their counters |
| POST | `/api/teams` | `{ name: string, counter?: number }` | Add a new team |
| PUT | `/api/teams/:id` | `{ name: string, counter: number }` | Update team name and counter |
| DELETE | `/api/teams/:id` | — | Delete a team |
| POST | `/api/teams/:id/increment` | — | Atomically increment counter by 1 |
| POST | `/api/teams/:id/decrement` | — | Atomically decrement counter by 1 (floor 0) |

All responses are JSON. Errors return appropriate HTTP status codes (400 for validation, 500 for server errors).