# ChatApp — Backend Agent Guide

This file is the authoritative reference for AI agents (Claude, Codex, Copilot) working on the **backend** of the ChatApp project. Read it fully before writing or modifying any code.

---

## Project Overview

A real-time chat application backend. Handles authentication, user profiles, presence (online/offline), and generates Stream Chat tokens for the mobile client.

**Frontend repo:** `../chatapp` — React Native 0.85 mobile app.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (TypeScript) |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 (client engine via `@prisma/adapter-pg`) |
| Auth | JWT — access + refresh tokens, Passport.js |
| Hashing | bcrypt |
| Real-time | WebSocket (`@nestjs/platform-ws`) |
| Chat | Stream Chat (`stream-chat`) |
| Docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Package manager | pnpm |
| Node | ≥ 22 |

---

## Running the Project

### Prerequisites
- Docker Desktop running
- `.env` file present (see Environment Variables below)

### Start the database
```bash
docker-compose up -d
```

### Apply migrations (first time or after schema changes)
```bash
npx prisma migrate dev --name <description>
```

### Regenerate Prisma client (after schema changes)
```bash
npx prisma generate
```

### Start dev server
```bash
pnpm start:dev
```

Server: `http://localhost:3000`
Swagger UI: `http://localhost:3000/docs`
All routes are prefixed with `/api`.

---

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chatapp?schema=public"

JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

STREAM_API_KEY="..."
STREAM_API_SECRET="..."

PORT=3000
```

---

## Project Structure

```
src/
├── app.module.ts          # Root module — imports all feature modules
├── main.ts                # Bootstrap: CORS, ValidationPipe, Swagger, WsAdapter
├── auth/
│   ├── auth.controller.ts # POST /auth/register|login|refresh|logout, GET /auth/me|stream-token
│   ├── auth.service.ts    # Business logic, token generation, Stream Chat token
│   ├── decorators/
│   │   └── current-user.decorator.ts   # @CurrentUser() param decorator
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts           # Access token guard
│   │   └── jwt-refresh.guard.ts        # Refresh token guard
│   └── strategies/
│       ├── jwt.strategy.ts             # Validates access token, attaches full User to request
│       └── jwt-refresh.strategy.ts     # Validates refresh token, attaches { sub, email, refreshToken }
├── users/
│   ├── users.controller.ts  # GET /users, PATCH /users/me
│   ├── users.service.ts     # DB queries, phone normalisation, profile updates
│   └── dto/
│       ├── update-profile.dto.ts
│       └── user-response.dto.ts        # Swagger response schema (no sensitive fields)
├── presence/
│   ├── presence.gateway.ts   # WebSocket gateway — online/offline events
│   ├── presence.service.ts
│   ├── presence.controller.ts
│   └── presence.module.ts
└── prisma/
    ├── prisma.service.ts   # Extends PrismaClient; passes PrismaPg adapter in constructor
    └── prisma.module.ts    # @Global() — PrismaService available everywhere
```

---

## Database Schema

```prisma
model User {
  id                 String    @id @default(cuid())
  firstName          String
  lastName           String
  username           String    @unique   // format: name_XX (e.g. john_12)
  email              String    @unique
  phoneNumber        String?   @unique
  passwordHash       String
  hashedRefreshToken String?
  lastSeenAt         DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

### Prisma 7 rules
- **No `url` in `schema.prisma`** — connection URL lives only in `prisma.config.ts`.
- `PrismaService` must pass the adapter explicitly: `super({ adapter: new PrismaPg({ connectionString: ... }) })`.
- Always run `npx prisma generate` after schema changes.

---

## API Reference

All routes are under `/api`. Protected routes require `Authorization: Bearer <accessToken>`.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Register new user. Returns `{ user, accessToken, refreshToken }` |
| POST | `/auth/login` | None | Login. Returns `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh` | Refresh token | Issue new token pair |
| POST | `/auth/logout` | Access token | Clears stored refresh token |
| GET | `/auth/me` | Access token | Returns sanitized current user |
| GET | `/auth/stream-token` | Access token | Returns `{ token }` for Stream Chat SDK |

**Register body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "john_12",
  "email": "john@example.com",
  "phoneNumber": "+27821234567",
  "password": "SecurePass1!"
}
```

**Login body:**
```json
{ "email": "john@example.com", "password": "SecurePass1!" }
```

### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users` | Access token | List all users (no sensitive fields) |
| PATCH | `/users/me` | Access token | Update own profile (firstName, lastName, username, phoneNumber) |

**Public user shape** (no `passwordHash` or `hashedRefreshToken`):
```json
{
  "id": "clxyz...",
  "firstName": "John",
  "lastName": "Doe",
  "username": "john_12",
  "email": "john@example.com",
  "phoneNumber": "+27821234567",
  "lastSeenAt": "2026-05-04T10:00:00.000Z",
  "createdAt": "2026-05-04T09:00:00.000Z",
  "updatedAt": "2026-05-04T09:00:00.000Z"
}
```

---

## Key Conventions

### Sensitive fields
`passwordHash` and `hashedRefreshToken` are **never returned to clients**. Strip them in `AuthService.sanitize()` or exclude them at the Prisma `select` level using the `publicUserSelect` constant in `UsersService`.

### Phone numbers
Always normalize before storing/comparing: strip non-digit characters, preserve leading `+`. Use `UsersService.normalizePhoneNumber()`.

### Username format
Must match `/^[a-zA-Z0-9_]+_\d+$/` — letters/numbers/underscores followed by underscore and digits (e.g. `john_12`).

### DTOs
- Use `!` definite assignment assertion on all DTO properties (e.g. `email!: string`).
- Always add `@ApiProperty` / `@ApiPropertyOptional` decorators alongside validation decorators.

### Swagger
- Tag controllers with `@ApiTags('GroupName')`.
- Annotate every endpoint with `@ApiOperation` + `@ApiResponse` for each status code.
- Protected endpoints get `@ApiBearerAuth('access-token')` or `@ApiBearerAuth('refresh-token')`.

### Guards
- `@UseGuards(JwtAuthGuard)` — validates access token.
- `@UseGuards(JwtRefreshGuard)` — validates refresh token; injects `{ sub, email, refreshToken }` as the user.
- Use `@CurrentUser('id')` to extract just the user ID, or `@CurrentUser()` for the full object.

### Module structure
Each feature module owns its controller, service, and DTOs. `PrismaModule` is `@Global()` — do not re-import it in feature modules. `UsersModule` exports `UsersService` so `AuthModule` can import it.

---

## Adding a New Feature — Checklist

1. Create `src/<feature>/<feature>.module.ts`, `.service.ts`, `.controller.ts`
2. Add DTOs in `src/<feature>/dto/` with `@ApiProperty` decorators
3. Register the module in `src/app.module.ts`
4. Add `@ApiTags`, `@ApiOperation`, `@ApiResponse` to the controller
5. If the schema changes: update `prisma/schema.prisma`, run `prisma migrate dev --name <desc>`, run `prisma generate`
6. Protect endpoints with `@UseGuards(JwtAuthGuard)` and document with `@ApiBearerAuth('access-token')`
