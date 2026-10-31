# AI-Powered Customer Query Assistant

QueryFlow is a full-stack customer-support application. Customers can browse a product catalog, check their own orders, read store policies, and ask questions in a chat interface. Administrators can manage catalog items, policies, order statuses, and view dashboard metrics.

This guide explains the technology stack, how the frontend and backend are connected, how to run the project, and how to integrate another system with the API.

## Contents

- [What the project does](#what-the-project-does)
- [Technology stack](#technology-stack)
- [Architecture and integration](#architecture-and-integration)
- [Requirements](#requirements)
- [Run locally](#run-locally)
- [Configuration](#configuration)
- [API integration guide](#api-integration-guide)
- [API reference](#api-reference)
- [AI assistant behavior](#ai-assistant-behavior)
- [Data and permissions](#data-and-permissions)
- [Deployment checklist](#deployment-checklist)
- [Useful commands](#useful-commands)

## What the project does

- Provides a React web interface for customers and administrators.
- Stores accounts, products, orders, policies, conversations, and messages in MongoDB.
- Authenticates users with signed JWTs and revocable server-side sessions.
- Limits customers to their own orders and saved conversations.
- Grounds store-specific chat responses in product, order, and policy records.
- Optionally uses Google Gemini to phrase answers and answer general questions.
- Supports administrator product image uploads, with files served from `/uploads`.

## Technology stack

| Area | Technology | How it is used |
|---|---|---|
| Frontend | React 19, TypeScript, Vite | Single-page customer and admin application; Vite serves the development app and builds production assets. |
| Styling and icons | Tailwind CSS 4, Lucide React | Utility-class styling and interface icons. |
| Backend | Node.js, Express 4 | REST API, authentication middleware, validation, uploads, and static image serving. |
| Database | MongoDB, Mongoose 8 | Persistent application records and schema/index management. |
| Authentication | JSON Web Token, bcryptjs | Signed, seven-day bearer tokens; passwords are hashed before storage; session records allow logout revocation. |
| Input validation | Zod | Validates request payloads on the server. |
| AI integration | Google Gen AI SDK (`@google/genai`) | Optional Gemini responses based on server-selected business records. |
| File upload | Multer | Receives and validates admin product images (JPEG, PNG, or WebP, up to 5 MB). |

The repository is split into two independently installed applications. The root `package.json` does not define project-wide scripts.

## Architecture and integration

```text
Browser
  React + TypeScript + Vite
  my-react-app/src/api.ts
       | HTTP/JSON; optional Authorization: Bearer <token>
       v
  Express REST API
  backend/src/app.js
       | Mongoose
       +--------------------> MongoDB
       |
       +--------------------> Google Gemini (optional; backend only)
       |
       +--------------------> backend/uploads (product images)
```

### Request flow

1. The frontend calls API functions defined in `my-react-app/src/api.ts`.
2. The API base URL is read from `VITE_API_URL`; the local default is `http://localhost:5000/api`.
3. Express mounts feature routes under `/api` and parses JSON request bodies.
4. Protected routes validate the bearer token, reload the account and session from MongoDB, and check the role or record ownership.
5. Mongoose reads or updates records. For chat, the backend selects permitted business data before sending it to the AI provider.
6. The API returns JSON. Errors use an HTTP error status and a `{ "message": "..." }` response.

The API is usable independently of the React app: another website, mobile app, or backend service can call the same HTTP endpoints. Use the API URL of the deployed backend and follow the authentication requirements below.

### Main code locations

| Location | Responsibility |
|---|---|
| `my-react-app/src/` | React screens and UI components. |
| `my-react-app/src/api.ts` | Frontend API base URL, types, JSON requests, and image upload. |
| `backend/src/app.js` | Express setup, middleware, route mounting, health endpoint, and startup sequence. |
| `backend/src/routes/` | Authentication, products, orders, policies, chat, conversations, and admin endpoints. |
| `backend/src/middleware/auth.js` | Required/optional bearer authentication and administrator authorization. |
| `backend/src/models/` | Mongoose schemas for users, products, orders, policies, conversations, messages, and sessions. |
| `backend/src/services/aiService.js` | Business-data selection and Gemini response generation/fallbacks. |
| `backend/src/config/seedDatabase.js` | Index setup and idempotent demo/admin data initialization. |
| `backend/uploads/` | Locally stored uploaded product images. Keep this directory on persistent storage in deployments. |

## Requirements

- Node.js and npm compatible with the versions required by the installed Vite and backend dependencies.
- MongoDB running locally, or a MongoDB connection string (for example, MongoDB Atlas).
- A Google AI Studio API key only if you want Gemini-powered answers.

## Run locally

Open two terminals from the repository root.

### 1. Configure and start the backend

In the first terminal, run these PowerShell commands:

```powershell
Copy-Item backend\.env.example backend\.env
Set-Location backend
npm install
npm run dev
```

Before starting the server, edit `backend\.env` and set a unique `JWT_SECRET` and a private admin password. Set `MONGO_URI` if MongoDB is not using the local default. Add `GEMINI_API_KEY` if you want the AI provider enabled.

The server connects to MongoDB, prepares indexes, and seeds demo customers, products, orders, policies, and the configured admin. Startup fails explicitly if MongoDB or a valid `JWT_SECRET` is unavailable; the application does not switch to in-memory storage.

The default API port is `5000`. Set `PORT` in `backend/.env` to change it. If that port is occupied, the server retries on the next port; update the frontend API URL to match.

Check that the API is reachable:

```text
http://localhost:5000/api/health
```

### 2. Configure and start the frontend

In a second terminal at the repository root:

```powershell
Copy-Item my-react-app\.env.example my-react-app\.env.local
Set-Location my-react-app
npm install
npm run dev
```

Open the local URL printed by Vite. The frontend uses `VITE_API_URL` from `my-react-app/.env.local`; restart Vite after changing it.

### Demo accounts

Unless changed in `backend/.env`, the seeded local admin is `admin@luma.com` with password `demo123`. Demo customer accounts are `maya@luma.com`, `daniel@luma.com`, and `priya@luma.com`, each with password `demo123`.

These are development credentials only. Configure a private admin password before first startup in any shared or deployed environment. The configured admin credentials are synchronized from the environment whenever the backend starts.

## Configuration

Backend settings are read from `backend/.env` (template: `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port; defaults to `5000`. |
| `MONGO_URI` | MongoDB connection string; defaults to `mongodb://127.0.0.1:27017/queryflow`. |
| `JWT_SECRET` | Private signing secret. Replace the template placeholder before starting the API. |
| `ADMIN_EMAIL` | Email address for the bootstrapped administrator; defaults to `admin@luma.com`. |
| `ADMIN_PASSWORD` | Administrator password; defaults to the demo password if omitted. Set a private value. |
| `ADMIN_NAME` | Display name for the administrator. |
| `GEMINI_API_KEY` | Optional Google AI Studio key. Keep it on the backend only. |
| `GEMINI_MODEL` | Gemini model name; defaults to `gemini-3.8-flash`. |

Frontend settings are read from `my-react-app/.env.local` (template: `my-react-app/.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL, including `/api`, e.g. `http://localhost:5000/api`. |

Do not put server secrets, MongoDB credentials, or the Gemini key in frontend variables. Vite variables are included in browser-delivered code.

## API integration guide

### Base URL and request format

Use the API base URL, including the `/api` prefix. Unless an endpoint is a file upload, send and receive JSON with `Content-Type: application/json`.

For authenticated endpoints, send the token returned by login or registration:

```http
Authorization: Bearer <token>
```

Tokens expire after seven days. Call `POST /auth/logout` to revoke the current session, and use `GET /auth/me` to confirm the token is still valid. Store tokens using the security approach appropriate to your client; do not expose them in URLs or logs.

### Sign in and make an authenticated request

```javascript
const API_BASE_URL = 'http://localhost:5000/api';

const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'maya@luma.com',
    password: 'demo123',
  }),
});

if (!loginResponse.ok) {
  throw new Error(`Login failed: ${loginResponse.status}`);
}

const { token, user } = await loginResponse.json();

const ordersResponse = await fetch(`${API_BASE_URL}/orders`, {
  headers: { Authorization: `Bearer ${token}` },
});

if (!ordersResponse.ok) {
  throw new Error(`Could not load orders: ${ordersResponse.status}`);
}

const orders = await ordersResponse.json();
console.log(user, orders);
```

For a real integration, load the API URL from your environment and handle non-2xx responses. A customer receives only their own orders; an admin receives all orders.

### Ask the assistant

`POST /chat` accepts a question and an optional saved conversation ID:

```javascript
const response = await fetch(`${API_BASE_URL}/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`, // Omit for a guest question.
  },
  body: JSON.stringify({
    question: 'Where is order ORD10245?',
    conversationId: undefined,
  }),
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.message || `Chat failed: ${response.status}`);
}

const { answer, role, conversationId } = await response.json();
```

Questions must be 2–1000 characters. Guests can ask questions, but private order details require authentication. Signed-in chats are stored and return a `conversationId`; guest chats are not persisted.

### Upload an admin product image

Send a `multipart/form-data` request to `POST /products/images` with an `image` file field and an admin bearer token. Accepted file types are JPEG, PNG, and WebP; maximum size is 5 MB. Do not manually set the multipart `Content-Type` header: let the HTTP client add its boundary.

The response contains an `imageUrl`, such as `/uploads/<generated-filename>.webp`. Save that path on the product. The image is served by the API at `/uploads/<generated-filename>`.

## API reference

All paths below are relative to the API base URL (for example, `/products` means `http://localhost:5000/api/products`). `Public/optional` means the endpoint is public and can optionally use a bearer token. Admin endpoints require a valid token whose account role is `admin`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/health` | Public | API status and database-backed mode. |
| `POST` | `/auth/register` | Public | Register a customer; requires `name`, `email`, and a password of at least 8 characters. |
| `POST` | `/auth/login` | Public | Sign in with `email` and `password`; returns `{ token, user }`. |
| `POST` | `/auth/logout` | Authenticated | Revoke the current session. |
| `GET` | `/auth/me` | Authenticated | Return the current user. |
| `GET` | `/products?search=...` | Public/optional | List active products and optionally search by name, SKU, or category. Admins can also see inactive products. |
| `GET` | `/products/:id` | Public/optional | Get a product by ID. Inactive products are visible only to admins. |
| `POST` | `/products` | Admin | Create a product. |
| `PATCH` | `/products/:id` | Admin | Update product fields. |
| `PUT` | `/products/:id` | Admin | Update product fields (same update behavior as `PATCH`). |
| `DELETE` | `/products/:id` | Admin | Deactivate a product; it is not physically deleted. |
| `POST` | `/products/images` | Admin | Upload one validated product image. |
| `GET` | `/orders` | Authenticated | List the signed-in customer's orders, or all orders for an admin. |
| `GET` | `/orders/:id` | Authenticated | Get an order; customers can access only their own. |
| `PATCH` | `/orders/:id/status` | Admin | Set status (`Processing`, `Shipped`, `Delivered`, `Cancelled`) and optionally `eta`. |
| `GET` | `/policies` | Public/optional | List active policies; admins can see inactive ones too. |
| `POST` | `/policies` | Admin | Create a policy (`title`, `detail`, optional `category`). |
| `PATCH` | `/policies/:id` | Admin | Update policy fields. |
| `PUT` | `/policies/:id` | Admin | Update policy fields (same update behavior as `PATCH`). |
| `DELETE` | `/policies/:id` | Admin | Unpublish a policy by marking it inactive. |
| `POST` | `/chat` | Public/optional | Ask a question; signed-in requests can be associated with a saved conversation. |
| `GET` | `/conversations?page=1&limit=20` | Authenticated | List the current user's conversations. Limit is capped at 50. |
| `POST` | `/conversations` | Authenticated | Create a conversation with a `title`. |
| `GET` | `/conversations/:id/messages` | Authenticated | Get messages from a conversation owned by the current user. |
| `DELETE` | `/conversations/:id` | Authenticated | Delete a conversation and its messages. |
| `GET` | `/admin/dashboard` | Admin | Get product/order/conversation counts and recent orders. |

For products, send numeric `price` and `stock` values (not strings). A create request can include `name`, `category`, `price`, and `stock`; `sku`, `description`, `badge`, and `imageUrl` are optional. Server-side validation may reject invalid fields or values.

### Common responses

- Successful requests return the resource or result as JSON. Creation endpoints generally return `201`.
- Invalid or incomplete input returns `400`.
- Missing, expired, or revoked authentication returns `401`.
- Authenticated users without the required role or ownership return `403` (some owner-scoped resources return `404` to avoid disclosing their existence).
- Missing resources return `404`; duplicate unique records can return `409`.
- Service/database/provider unavailability can return `503`.
- Errors use a JSON object with a `message` field.

## AI assistant behavior

The chat service classifies common order, product, and policy questions, then queries MongoDB for relevant records. It checks user permissions before an order record is made available to the assistant. The selected records—not the full database—are sent to Gemini along with the question and instructions not to invent store facts or disclose unsupplied private information.

- Set `GEMINI_API_KEY` on the backend to enable the Gemini provider.
- Set `GEMINI_MODEL` to choose a model; otherwise the backend uses `gemini-3.8-flash`.
- Without a Gemini key, known product/order/policy questions use deterministic responses from the selected database records. General questions return a service-unavailable error.
- Gemini quota, provider configuration, and timeout errors are returned as service errors; check the backend logs and Google AI Studio account when they occur.

This is a simple keyword-based data selector, not a general-purpose retrieval or vector-search system. If adapting it to a new business, extend `backend/src/services/aiService.js` and the relevant models/routes so the backend retrieves authorized, verified data before prompting the model.

## Data and permissions

- The backend creates indexes and inserts demo data idempotently at startup. Existing demo product, order, and policy records are not overwritten by the seed operation.
- The configured admin account's name, email, password, and active state are synchronized from the backend environment at startup.
- Public registration always creates a customer account; it cannot assign an admin role.
- Passwords are hashed with bcrypt. Password fields are not returned in API responses.
- Customer order lists, order detail, chat context, and conversation history are restricted to the authenticated owner. Admin routes check the server-side role.
- Product and policy deletion endpoints deactivate/unpublish records instead of permanently deleting them.
- Product image files are stored on local disk under `backend/uploads`; MongoDB stores the image URL, not the image bytes.

## Deployment checklist

- Use HTTPS and set strong, unique values for `JWT_SECRET`, `ADMIN_PASSWORD`, and database credentials.
- Use a managed/persistent MongoDB deployment and configure its network access appropriately.
- Keep Gemini and database secrets in the server's secret manager/environment, never in the frontend.
- Set `VITE_API_URL` to the public backend API URL when building the frontend.
- Restrict Express CORS to the actual frontend origins. The current backend enables permissive CORS for convenience; do not assume that is the desired production policy.
- Persist `backend/uploads` or move uploaded images to object storage/CDN. Local ephemeral deployment filesystems will lose images on restart or may not share files across instances.
- Configure production logging, monitoring, rate limits, backups, and request-size limits appropriate to your deployment.
- Replace demo accounts/data and avoid exposing demo credentials to customers.

## Useful commands

Run commands from the corresponding application directory:

| Directory | Command | Purpose |
|---|---|---|
| `backend` | `npm run dev` | Start the API with Nodemon. |
| `backend` | `npm start` | Start the API with Node.js. |
| `my-react-app` | `npm run dev` | Start the Vite development server. |
| `my-react-app` | `npm run build` | Type-check and create the production frontend build in `dist/`. |
| `my-react-app` | `npm run lint` | Run Oxlint. |
| `my-react-app` | `npm run preview` | Preview the production frontend build locally. |

More backend-specific notes are available in [`backend/README.md`](./backend/README.md).
