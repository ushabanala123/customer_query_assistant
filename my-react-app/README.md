# Frontend

This is the React, TypeScript, and Vite frontend for QueryFlow. The main project guide covers the complete stack, local setup, API integration, authentication, and deployment:

- [Project README](../README.md)

## Run the frontend

From the repository root, copy the frontend environment template and start Vite:

```powershell
Copy-Item my-react-app\.env.example my-react-app\.env.local
Set-Location my-react-app
npm install
npm run dev
```

Set `VITE_API_URL` in `my-react-app/.env.local` to the backend API base URL, including `/api` (default: `http://localhost:5000/api`). The backend and MongoDB must be running for API-backed features.

## Frontend commands

- `npm run dev` — start the development server.
- `npm run build` — type-check and create the production build.
- `npm run lint` — run Oxlint.
- `npm run preview` — preview a production build locally.

The frontend API functions and shared response types are in `src/api.ts`.
