# QueryFlow API

MongoDB-backed Express API for the AI-powered customer query assistant.

For the full project guide—including stack overview, local setup, API contracts and examples, frontend integration, AI behavior, and deployment guidance—see the [project README](../README.md).

## Setup

1. Install MongoDB and start the database.
2. Copy `.env.example` to `.env`.
3. Set a private `JWT_SECRET` (not the example placeholder), `MONGO_URI`, and
   the admin login credentials in `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and
   `ADMIN_NAME`.
4. Install and start the API:

   ```powershell
   npm install
   npm run dev
   ```

The API exits with an explicit startup error if MongoDB or `JWT_SECRET` is unavailable;
it never falls back to volatile in-memory data. The first successful startup creates
the configured admin and its password, and idempotently adds demo customers,
products, sample orders, and starter policies. The configured admin credentials
are synchronized from the environment whenever the backend starts. Public
registration creates customer accounts only; sign in to the administrator account
using `ADMIN_EMAIL` and `ADMIN_PASSWORD`. The API allows multiple administrators.

If `ADMIN_EMAIL`/`ADMIN_PASSWORD` are not set, the local demo admin is
`admin@luma.com` / `demo123`. Demo customers are `maya@luma.com`,
`daniel@luma.com`, and `priya@luma.com`, each with password `demo123`. Replace these
credentials before deployment. Set `ADMIN_PASSWORD` in the actual `backend/.env`
file; `.env.example` is only a template and is not loaded by the server.

## API

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`,
  `GET /api/auth/me`
- `GET /api/products?search=<name-or-SKU>` and `GET /api/products/:id`
- Admin-only `POST /api/products`, `PATCH /api/products/:id`,
  `DELETE /api/products/:id` (soft deactivate)
- Admin-only `POST /api/products/images` (JPEG, PNG, or WebP; maximum 5 MB)
- `GET /api/orders`, `GET /api/orders/:id`
- Admin-only `PATCH /api/orders/:id/status`
- `GET /api/policies`
- Admin-only `POST /api/policies`, `PATCH /api/policies/:id`,
  `DELETE /api/policies/:id` (unpublish)
- `POST /api/chat`
- Authenticated `GET /api/conversations?page=1&limit=20`,
  `POST /api/conversations`, `GET /api/conversations/:id/messages`,
  `DELETE /api/conversations/:id`
- Admin-only `GET /api/admin/dashboard`

JWT sessions expire after seven days and are revoked when the user signs out. Authenticated
requests resolve the current user and role from MongoDB. Customer order and conversation
queries are scoped to the authenticated user; an order ID alone does not grant access.

## Product images and AI

Product image bytes are stored in `uploads/`, served from `/uploads/<generated-filename>`,
and ignored by Git. Use persistent disk or object storage in deployment so uploaded photos
survive restarts and are shared across server instances.

Set `GEMINI_API_KEY` in `backend/.env` to enable Gemini. The assistant uses
`GEMINI_MODEL` (default `gemini-3.8-flash`) to answer general questions and customer
support questions. Store-specific answers use only relevant verified product, order, or
policy records, with order data authorized before it is included in AI context. Without
an API key, database-grounded questions use deterministic answers and general questions
return a configuration error. Keep the key on the backend; do not put it in frontend
environment variables or commit it. Gemini free-tier quota and rate limits depend on your
account; when they are reached, chat reports that condition so you can check Google AI
Studio usage or retry when quota is available.

The React chat sends `POST /api/chat` to the backend. Set `VITE_API_URL` to the backend
API base URL, including `/api` (for example, `http://localhost:5000/api`).

The frontend API origin can be configured with `VITE_API_URL` in
`my-react-app/.env.local`.
