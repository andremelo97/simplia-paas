# CLAUDE.md

Guidance for Claude Code when working with this repository.

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
npm run dev                # All services (ports 3001-3005)
npm run dev:tq-api         # TQ API only (3004)
npm run dev:tq-front       # TQ frontend only (3005)
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
npm test                    # All tests
npm run test:watch          # Watch mode
npx jest tests/integration/internal/  # Specific folder
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
