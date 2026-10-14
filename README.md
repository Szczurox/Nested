# Nested

Nested is a full-stack real-time chat application consisting of a **Next.js frontend (`web`)**, a self-hosted **Fastify API backend (`server`)**, and a **PostgreSQL** database.

---

## Project Structure

```text
nested/
├── docker-compose.yml       # Root orchestrator for local development
├── web/                     # Next.js frontend application
│   ├── Dockerfile
│   └── ...
└── server/                  # Fastify backend API & database layer
    ├── Dockerfile
    ├── docker-entrypoint.sh
    └── prisma/

```

---

## Getting Started with Docker (Recommended)

The easiest way to run the entire stack (Database, Backend, and Frontend) together is using Docker Compose from the root directory.

### Prerequisites

- [Docker Desktop](https://www.docker.com/) installed and running.

### Quick Start

1. Open your terminal in the root project folder.
2. Build and start all services simultaneously:

```bash
docker compose up --build

```

3. Access your apps:

- **Web Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:4000](http://localhost:4000) (Health check: `/health`)

### Docker Management Commands

- **Run in background (Detached mode):**

```bash
docker compose up -d --build

```

- **Stop all services:**

```bash
docker compose down

```

- **Stop services and wipe database/upload volumes (Clears demo data):**

```bash
docker compose down -v

```

- **Rebuild only the server after code changes:**

```bash
docker compose up -d --build server

```

---

## Architecture Overview

### 🌐 Frontend (`web`)

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Styling & Animation:** SCSS modules, Framer Motion
- **Realtime / Voice:** Socket.IO client communicating with `nested-server`
- **Authentication:** Authenticated via `nested_session` HTTP-only cookies set by the API.

### ⚙️ Backend (`server`)

- **Framework:** Fastify 5 (serves HTTP API & static uploaded files)
- **Database & ORM:** PostgreSQL 16 managed via Prisma
- **Security:** Argon2id password hashing, HTTP-only session cookies
- **Realtime:** Socket.IO for messaging, typing indicators, presence, and voice signaling
- **Storage:** Local file storage persisted in Docker via a mounted volume (`/app/uploads`) for avatars, group icons, attachments, and custom emojis.

---

## Local Development (Without Docker)

If you prefer to run the services natively on your machine:

### 1. Database & Server Setup

1. Spin up a local PostgreSQL 16 instance and create a database named `nested`.
2. Navigate to the `server/` directory, copy `.env.example` to `.env`, and configure your `DATABASE_URL`.
3. Install dependencies and run migrations:

```bash
cd server
npm install
npx prisma generate
npm run prisma:migrate -- --name init
npm run dev

```

### 2. Frontend Setup

1. Navigate to the `web/` directory.
2. Copy or create a `.env.local` file if your backend runs elsewhere (defaults to `http://localhost:4000`):

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:4000

```

3. Install dependencies and run the development server:

```bash
cd web
npm install
npm run dev

```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

### Server (`server/.env`)

| Variable                | Description                      | Default / Example                                               |
| ----------------------- | -------------------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string     | `postgresql://nested:nested@postgres:5432/nested?schema=public` |
| `HOST` / `PORT`         | HTTP bind address and port       | `0.0.0.0` / `4000`                                              |
| `WEB_ORIGIN`            | Allowed frontend origin for CORS | `http://localhost:3000`                                         |
| `PUBLIC_URL`            | Base URL used for uploaded files | `http://localhost:4000`                                         |
| `SESSION_COOKIE_NAME`   | Name of the session cookie       | `nested_session`                                                |
| `SESSION_COOKIE_SECURE` | Set `true` if serving over HTTPS | `false`                                                         |
| `SESSION_TTL_DAYS`      | Session lifetime in days         | `30`                                                            |
| `STORAGE_DIR`           | Path to file upload storage      | `/app/uploads`                                                  |

### Web (`web/.env.local`)

| Variable                 | Description                    | Default / Example       |
| ------------------------ | ------------------------------ | ----------------------- |
| `NEXT_PUBLIC_SERVER_URL` | Public URL for the backend API | `http://localhost:4000` |

---

## Deployment (Vercel & Production)

- **Frontend (`web`):** Typically deployed to [Vercel](https://vercel.com/). Make sure to set `NEXT_PUBLIC_SERVER_URL` in Vercel's project environment variables.
- **Backend & Database (`server`):** Can be deployed to any VPS (DigitalOcean, AWS, etc.) using Docker or deployed independently with a managed PostgreSQL provider. Ensure `SESSION_COOKIE_SECURE=true` is set when running behind HTTPS.
