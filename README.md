# Team Hub

A real-time team collaboration platform where teams manage shared goals, post announcements, and track action items together. Built as a full-stack monorepo with role-based access, optimistic UI, live updates over Socket.io, email notifications, and a workspace analytics dashboard.

---

## Stack

| Layer        | Technology                                   |
| ------------ | -------------------------------------------- |
| Monorepo     | Turborepo + npm workspaces                   |
| Frontend     | Next.js 14 (App Router, JavaScript)          |
| Styling      | Tailwind CSS                                 |
| State        | Zustand                                      |
| Backend      | Node.js + Express.js (REST)                  |
| Database     | PostgreSQL + Prisma ORM                      |
| Auth         | JWT (access + refresh) in `httpOnly` cookies |
| Real-time    | Socket.io                                    |
| File storage | Cloudinary (avatars + attachments)           |
| Email        | Nodemailer (invites + @mention notifications)|
| API docs     | Swagger / OpenAPI at `/api/docs`             |
| Deployment   | Railway (web + api as separate services)     |

---

## Repository Layout

```
team-hub/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── api/          # Express backend
├── packages/
│   └── shared/       # Shared constants, validators, RBAC matrix
├── turbo.json
└── package.json
```

---

## Getting Started

### 1. Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (local instance or hosted)

### 2. Install

```bash
npm install
```

### 3. Configure environment

Copy each `.env.example` to `.env` and fill in the values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

`apps/api/.env` requires:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (optional — emails are skipped when not set)
- `WEB_ORIGIN` — e.g. `http://localhost:3000`

`apps/web/.env` requires:

- `NEXT_PUBLIC_API_URL` — e.g. `http://localhost:4000`

### 4. Database

```bash
cd apps/api
npx prisma migrate dev
npm run seed       # optional: creates a demo workspace
```

### 5. Run the app

From the repo root:

```bash
npm run dev        # runs web + api together via Turborepo
```

- Web: http://localhost:3000
- API: http://localhost:4000
- API docs: http://localhost:4000/api/docs

---

## Scripts

```bash
npm run dev        # web + api in parallel
npm run build      # build all apps
npm run lint       # lint all apps
npm run seed       # seed the database (run from apps/api)
```

---

## Features

### Core

- Email + password authentication with JWT access/refresh tokens
- Multi-workspace support with role-based membership (ADMIN / MEMBER)
- Workspaces, invitations, and role management
- Goals with milestones, progress tracking, and activity updates
- Action items with Kanban + list views, priority, status, due date
- Announcements with rich text, attachments, reactions, comments, and @mentions
- In-app notifications panel with live toast on @mention
- Avatar uploads via Cloudinary; default initials avatar on register
- Dark / light theme with system-preference detection

### Advanced

- **Optimistic UI** — Zustand stores apply mutations instantly and roll back on failure
- **Advanced RBAC** — shared permission matrix enforced by API middleware and UI gates

### Bonus

- Swagger / OpenAPI docs at `/api/docs`
- Email notifications for invitations and @mentions (Nodemailer)
- Workspace analytics dashboard with CSV export

---

## Architecture Notes

**Backend** follows `routes → controllers → services → prisma`. Prisma is never called directly from a route handler.

**Frontend** uses Server Components by default. Client Components are reserved for forms, hooks, sockets, and Zustand stores.

**Real-time events** are scoped to the workspace room (`workspace:{id}`); they are never emitted globally.

**Permissions** live in `packages/shared/permissions.js` and are enforced by `requireAuth` + `requirePermission(...)` middleware on every protected route.

---

## Deployment

The app is designed to deploy on Railway as two services backed by a PostgreSQL plugin:

1. Provision a PostgreSQL database on Railway and copy its `DATABASE_URL`.
2. Create an `api` service from the repo with root `apps/api`. Set environment variables and run `npx prisma migrate deploy` on first boot.
3. Create a `web` service from the repo with root `apps/web`. Set `NEXT_PUBLIC_API_URL` to the deployed API URL.
4. In production, configure cookies as `sameSite=none; secure` because the web and api are served from different origins.

---

## Known Limitations

- No automated test suite (manual smoke testing was used as the quality gate).
- Avatar storage requires Cloudinary; without credentials, uploads fall back to initials avatars only.
- Email delivery requires SMTP; without it, invites and mention notifications are silently skipped (no user-facing failure).

---

## License

This project is provided as a technical assessment submission.
