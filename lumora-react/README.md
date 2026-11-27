# Lumora

## Requirements

- Node.js 20.19+ (or 22.12+) and npm
- A reachable MongoDB instance

## Configure the backend

Set `MONGO_URI` and `JWT_SECRET` in `server/.env`. `PORT` is optional and
defaults to `5000`.

From the repository root, install the backend dependencies and start the API:

```powershell
cd server
npm install
npm start
```

The API listens on `/api`; `/api/health` is available as a health check.

## Run the frontend

In a second terminal, from the repository root:

```powershell
cd lumora-react
npm install
npm run dev
```

The frontend uses `http://localhost:5000/api` by default. To use another API
base URL, set `VITE_API_URL` in `lumora-react/.env`.

## Validate

```powershell
cd lumora-react
npm run lint
npm run build
```
