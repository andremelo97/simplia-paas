# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules (Breaking These Causes Bugs)

### ID Conventions
- **ALL IDs are numeric**: PKs, FKs, headers, JWT tokens - NO EXCEPTIONS
- **FK naming**: ALL foreign keys use `_fk` suffix (`tenant_id_fk`, `user_id_fk`)
- **Source of truth**: Use `req.tenant.id` (numeric), never `req.tenant.slug` for DB

### Language Split
- **Backend**: JavaScript ONLY (.js files) in `src/server/`
- **Frontend**: TypeScript (.tsx/.ts files) in `src/client/`

### Multi-Tenancy
- **User-Tenant**: 1:1 via `users.tenant_id_fk INTEGER NOT NULL`
- **Platform routes**: `/platform-auth/*`, `/applications`, `/tenants`, `/metrics` - NO search_path
- **Tenant routes**: `/auth/*`, `/users`, `/entitlements` - require `x-tenant-id` header

### Seat Counting
```javascript
// Grant/Reactivate: TenantApplication.incrementSeat(tenantId, applicationId)
// Revoke: TenantApplication.decrementSeat(tenantId, applicationId)
```

## Quick Start

```bash
npm install && cp .env.example .env && npm run migrate  # Initial setup
npm run dev                # Internal API (3001) + Internal-Admin (3002)
npm run dev:hub            # Hub frontend (3003)
npm run dev:tq-api         # TQ API (3004)
npm run dev:tq-front       # TQ frontend (3005)
npm run dev:website        # Website (3006)
npm test                   # Run tests
npx tsc --noEmit --project src/client/  # Type check frontend
```

## Port Architecture (NEVER CHANGE)
```
3001 - Internal API Server
3002 - Internal-Admin Frontend
3003 - Hub Frontend
3004 - TQ API Server
3005 - TQ Frontend
3006 - Website
```

## Project Structure
```
src/
├── server/           # Express.js backend (JavaScript .js)
│   ├── api/         # Route handlers (internal/, tq/)
│   ├── infra/       # Database, middleware, models
│   └── services/    # Third-party (Deepgram, Supabase)
├── client/          # React frontend (TypeScript)
│   ├── apps/        # hub/, tq/, internal-admin/
│   └── common/      # Shared UI components, i18n
└── shared/          # Shared utilities (.js)
```

## Two API Servers
- **Internal API** (`src/server/index.js` → port 3001): Platform management, tenants, users, licensing
- **TQ API** (`src/server/tq-api.js` → port 3004): Transcription Quote product endpoints
- Public routes (webhooks, public quotes) are registered BEFORE auth middleware in tq-api.js

## SSO Flow (Hub → TQ)
1. Hub opens TQ: `http://localhost:3005/login?token={JWT}&tenantId={ID}`
2. TQ decodes JWT directly (no API call), stores in auth store
3. Session shared via localStorage `auth-storage` key

## Storage Architecture (Per-Tenant Buckets)
```
tenant-{subdomain}/
├── audio-files/    # Transcription audio
└── branding/       # Logo, favicon, video
```
- Buckets created automatically during tenant provisioning
- Public URLs (non-expiring)

## Timezone & i18n
- **JWT includes**: `timezone` (IANA) and `locale` (derived)
- **Two languages**: pt-BR (Brazil), en-US (rest of world)
- **Date formatting**: Use `useDateFormatter()` hook - never hardcode locale
- **UI text**: Use `useTranslation('tq')` or `useTranslation('hub')`

## Feedback System
- HTTP interceptor auto-publishes feedback for `meta.code` responses
- NEVER use `publishFeedback()` manually in components
- Add codes to `src/client/common/feedback/catalog.ts`

## TQ Features
- **Sessions**: Audio transcription with Deepgram
- **Templates**: Clinical document templates with TipTap editor
- **Quotes**: AI-generated quotes from transcriptions
- **Clinical Reports**: Medical documentation with print/PDF
- **Public Quotes**: Shareable quote pages with Puck page builder

## API Patterns

### Response Format
```javascript
res.json({
  data: { ... },
  meta: { code: 'ENTITY_CREATED', message: '...' }
})
```

### Tenant-Scoped Routes
```javascript
// Always use req.tenant?.schema for tenant context
const data = await Model.findAll(req.tenant?.schema)
```

## Environment Variables (Required)
```bash
DATABASE_URL=...
JWT_SECRET=...
DEEPGRAM_API_KEY=...
OPENAI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Database
- Migrations in `src/server/infra/migrations/`
- Run `npm run migrate` after schema changes
- Tenant schemas: `tenant_{slug}` with `SET LOCAL search_path`

## Testing
```bash
npm test                              # All tests
npm run test:watch                    # Watch mode
npx jest tests/integration/internal/  # Specific folder
npx jest tests/api/tq/sessions.test.js  # Single test file
npm run test:e2e                      # Playwright E2E tests
npm run test:e2e:hub                  # Hub E2E only
npm run test:e2e:tq                   # TQ E2E only
```

## Common Issues

| Issue | Solution |
|-------|----------|
| TypeScript errors | `npx tsc --noEmit --project src/client/` |
| Port conflicts (Windows) | `netstat -ano \| findstr :PORT` then `taskkill /PID X /F` |
| Migrations fail | Check previous migrations with `npm run migrate` |
| CORS issues | Verify TQ_ORIGIN in server CORS config |
| TQ API routing | Use full paths `/api/tq/v1/...` |

## Documentation
- **API docs**: `docs/INTERNAL-API.md`, `docs/tq-api.md`
- **Timezone**: `docs/timezone-internationalization.md`
- **Transcription quota**: `docs/transcription-quota-system.md`
- **Public quotes**: `docs/tq-public-quotes-puck.md`

## Best Practices
- Always read files before editing
- Use `useDateFormatter()` for dates, `useTranslation()` for text
- Never hardcode pt-BR or en-US in components
- Prefer editing existing files over creating new ones
- Run tests before major changes
