# Civix

Civic engagement platform where residents report local issues, vote on priorities, and ward admins manage complaint resolution — with auto-generated PDF complaint letters emailed when upvote thresholds are crossed.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/civix run dev` — React frontend (port 20985, proxied at `/`)
- `pnpm run typecheck` — full typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- Required env secrets: `MONGODB_URI`, `SESSION_SECRET`
- Optional env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `WARD1_EMAIL`, `WARD2_EMAIL`, `WARD3_EMAIL`, `DEFAULT_WARD_EMAIL`, `UPVOTE_THRESHOLD` (default: 2)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Mongoose (MongoDB)
- Frontend: React 19 + Vite, Tailwind CSS, shadcn/ui, wouter (routing), TanStack Query
- Maps: react-leaflet + Leaflet.js
- Auth: JWT in httpOnly cookie (`civix_token`), bcryptjs for password hashing
- Email: nodemailer (SMTP or JSON transport fallback)
- PDF: Pure-Node raw PDF generator (no external lib)
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)

## Where things live

- `artifacts/api-server/src/` — Express API server
  - `routes/` — auth, issues, polls, feedback, contact, contributors, sos, admin
  - `models/` — User, Issue, Poll, Feedback, Contact, SOS Mongoose models
  - `lib/` — mongodb.ts, emailService.ts, pdfGenerator.ts, logger.ts
- `artifacts/civix/src/` — React frontend
  - `pages/` — home, about, contact, contributors, feedback, issue-map, voting-system, login, register, profile, sos, admin-dashboard, not-found
  - `components/layout/` — Navbar, Layout
  - `contexts/` — AuthContext, ThemeContext
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for API)
- `lib/api-zod/` — generated Zod schemas
- `lib/api-client-react/` — generated TanStack Query hooks

## Architecture decisions

- JWT stored in httpOnly cookie — no localStorage, XSS-resistant
- Upvote deduplication via IP stored in `upvotedBy[]` on Issue document
- PDF generated as raw PDF bytes (pure Node, no external lib) to avoid esbuild bundling issues with fontkit/pdfkit
- Ward admin role enforced server-side via `requireWardAdmin` middleware on all `/api/admin/*` routes
- `connectDB()` is non-blocking at startup — server starts even if MongoDB is temporarily unavailable

## Product

- **Issue Reporting**: Residents post complaints with title, description, category, ward, GPS pin on Leaflet map, and image URL
- **Upvote System**: Community upvotes issues; when threshold (default: 2) is crossed, a formal PDF complaint letter is auto-emailed to the ward officer
- **Live Issue Map**: Leaflet map filtered by ward/category/status with marker popups; Heatmap mode shows resolved (green) vs urgent (red) zones
- **Ward Admin Dashboard**: Admins can view all complaints in their ward, update statuses, and download individual PDFs
- **Voting System**: Community polls with create/browse/vote/analytics tabs
- **Role-based access**: `citizen` (default) and `ward_admin` roles; admin dashboard protected server-side
- **Dark mode**: Full light/dark theme via CSS variables

## User preferences

- MongoDB Atlas cluster: cluster0.hdyd7be.mongodb.net
- Upvote threshold set to 2 for demo purposes

## Gotchas

- `pdfkit` and `pdfmake` both fail at esbuild bundle time (fontkit/@swc/helpers issues) — use pure-Node PDF writer in `lib/pdfGenerator.ts`
- `useToast` hook lives at `@/hooks/use-toast`, not `@/components/ui/use-toast`
- Issue map defaults to Karachi coordinates (`[24.8607, 67.0011]`)
- Ward officer emails must be set via `WARD1_EMAIL` etc. env vars; falls back to `SMTP_FROM`

## Pointers

- See `pnpm-workspace` skill for workspace structure
- OpenAPI spec: `lib/api-spec/openapi.yaml`
