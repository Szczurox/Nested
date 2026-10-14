# Nested Server

Self-hosted backend for Nested.

## Architecture

- **Fastify 5** serves the HTTP API and static uploaded files.
- **PostgreSQL 16** stores users, sessions, groups, memberships, invites,
  categories, channels, messages, participants, and custom emoji metadata.
- **Prisma** manages the schema and migrations.
- **Argon2id** hashes passwords.
- **HTTP-only session cookies** authenticate browser requests and Socket.IO
  connections.
- **Socket.IO** provides messages, typing, presence, voice signaling, and group
  navigation/profile updates.
- **Local file storage** persists avatars, group icons, message uploads, and
  custom emoji. Docker mounts this storage at `/app/uploads`.

Normal channel access is based on group membership. Channel participant records
are retained for presence, activity, and voice state; they do not restrict
ordinary group members from reading or sending messages.

## Local development

1. Start PostgreSQL and create the `nested` database.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Install dependencies:

    ```powershell
    npm install
    ```

4. Generate Prisma Client:

    ```powershell
    npm run prisma:generate
    ```

5. Apply development migrations:

    ```powershell
    npm run prisma:migrate -- --name init
    ```

6. Start the development server:

    ```powershell
    npm run dev
    ```

The health endpoint is available at `http://127.0.0.1:4000/health`.

Available scripts:

```text
npm run dev              # TypeScript watch server
npm run build            # Compile to dist/
npm start                # Run the compiled server
npm test                 # Run Vitest
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Create/apply a development migration
```

## HTTP API

All authenticated requests use the `nested_session` HTTP-only cookie. The
frontend must send credentials for cross-origin requests.

### Authentication and profile

- `POST /api/auth/register` with `{ "username": "...", "password": "..." }`
- `POST /api/auth/login` with `{ "username": "...", "password": "..." }`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/profile`
- `PATCH /api/profile` with an optional `username` and/or `nickname`
- `POST /api/profile/avatar` as multipart form data

Updating a profile nickname updates the user's group membership nicknames and
broadcasts the change to connected group clients.

### Groups, channels, and messages

- `POST|GET /api/groups`
- `GET /api/groups/:groupId`
- `POST /api/groups/:groupId/icon`
- `GET /api/groups/:groupId/members`
- `PATCH /api/groups/:groupId/members/:userId`
- `POST /api/groups/:groupId/invites`
- `POST /api/groups/:groupId/invites/:inviteId/accept`
- `GET|POST /api/groups/:groupId/categories`
- `PATCH|DELETE /api/groups/:groupId/categories/:categoryId`
- `GET|POST /api/groups/:groupId/channels`
- `PATCH|DELETE /api/groups/:groupId/channels/:channelId`
- `GET /api/channels/:channelId/participants`
- `PATCH /api/channels/:channelId/participants/:userId`
- `PATCH /api/channels/:channelId/activity`
- `GET /api/channels/:channelId/messages?limit=20&before=<message-id>`
- `POST /api/channels/:channelId/messages`
- `PATCH|DELETE /api/channels/:channelId/messages/:messageId`
- `POST /api/channels/:channelId/uploads` as multipart form data

Group creation automatically creates a fully privileged creator membership.
Mutating group structure requires `MANAGE_CHANNELS`. Invite acceptance grants
normal channel access. Deleting a category detaches its channels instead of
deleting them. Message pages use a chronological message-ID cursor and are
subject to a server-side one-message-per-second rate limit.

### Custom emoji

- `GET /api/groups/:groupId/emojis`
- `POST /api/groups/:groupId/emojis` as multipart form data

Emoji uploads accept PNG, JPEG, GIF, and WebP images up to 1 MB. Managing emoji
requires `MANAGE_EMOTES`.

## Realtime API

Socket.IO is attached to the same HTTP service and authenticates using the
session cookie. Connect with credentials enabled, then use:

- `group.join` / `group.leave` with `{ "groupId": "..." }`
- `channel.join` / `channel.leave` with `{ "channelId": "..." }`
- `voice.join` / `voice.leave` with `{ "channelId": "..." }`
- `typing.updated` with `{ "channelId": "...", "typing": true|false }`
- `message.send` with the HTTP message payload

The server emits channel events including `message.created`,
`message.updated`, `message.deleted`, `typing.updated`, and
`presence.updated`. Voice signaling uses the same authenticated connection.

Group-room events keep navigation and profile data synchronized:

- `group.category.created`
- `group.category.updated`
- `group.category.deleted`
- `group.channel.created`
- `group.channel.updated`
- `group.channel.deleted`
- `group.user.updated`

The legacy signaling events `get clients`, `sending signal`, and
`returning signal` remain supported for frontend compatibility.

## Docker deployment

Docker Compose runs the API and PostgreSQL as separate services. PostgreSQL
data is persisted in `nested-postgres-data`. Uploaded avatars, group icons,
message media, and custom emoji are persisted in `nested-upload-data`. The
entrypoint waits for PostgreSQL, applies pending migrations, and starts the API.

```powershell
docker compose up --build
```

The API is available at `http://localhost:4000`. To stop services while
retaining data:

```powershell
docker compose down
```

To remove the database volume as well (all demo data will be lost):

```powershell
docker compose down -v
```

Rebuild only the API after source changes:

```powershell
docker compose up -d --build server
```

## Configuration

Copy `.env.example` for local development. Important settings are:

| Variable                | Purpose                              |
| ----------------------- | ------------------------------------ |
| `DATABASE_URL`          | PostgreSQL connection string         |
| `HOST` / `PORT`         | HTTP bind address and port           |
| `WEB_ORIGIN`            | Allowed frontend origin for CORS     |
| `PUBLIC_URL`            | Base URL used for uploaded-file URLs |
| `SESSION_COOKIE_NAME`   | Session cookie name                  |
| `SESSION_COOKIE_SECURE` | Set `true` behind HTTPS              |
| `SESSION_TTL_DAYS`      | Session lifetime                     |
| `STORAGE_DIR`           | Upload storage directory             |

Compose sets `STORAGE_DIR=/app/uploads` and uses
`SESSION_COOKIE_SECURE=false` for local HTTP. Set
`SESSION_COOKIE_SECURE=true` when running behind an HTTPS reverse proxy.

## Production notes

- Use HTTPS and secure cookies.
- Use a shared object store instead of local disk when running multiple API
  instances.
- Keep `.env` files and credentials out of source control.
- Rotate any credentials that may have been exposed during development.
- Back up PostgreSQL and the upload volume together.
