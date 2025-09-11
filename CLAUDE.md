# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Guidance for Claude Code when working with Simplia PaaS codebase.

## Tech Stack
- **Backend**: Node.js + Express + PostgreSQL (JavaScript only - .js files)
- **Frontend**: React + TypeScript + Vite (TypeScript - .tsx/.ts files)  
- **Database**: PostgreSQL with multi-tenant schemas

## Key Rules
- **Backend = JavaScript**: All server code uses .js files, NO TypeScript
- **Frontend = TypeScript**: All client code uses .tsx/.ts files
- **Numeric-Only IDs**: ALL IDs (PK/FK/headers/JWT) are ALWAYS numeric - no string IDs
- **FK Naming**: ALL foreign keys use `_fk` suffix (`tenant_id_fk`, `user_id_fk`)
- **1:1 User-Tenant**: Users belong to exactly one tenant via `users.tenant_id_fk`

## Structure
```
src/
├── server/           # Express.js backend (JavaScript .js)
│   ├── api/         # Route handlers
│   ├── infra/       # Database, middleware, models
│   └── app.js       # Express config
├── client/          # React frontend (TypeScript .tsx/.ts)
│   ├── apps/        # Multi-app architecture
│   ├── common/      # Shared UI components
│   └── main.tsx     # React bootstrap
└── shared/          # Shared utilities (JavaScript .js)
```

## Development Commands
```bash
npm install              # Install dependencies
npm run dev             # Run both server + internal-admin client
npm run dev:server      # Server only (port 3001)
npm run dev:client      # Internal-admin only (port 3002)
npm run dev:hub         # Hub app only (port 3003)
npm run migrate         # Run database migrations
npm test               # Run all tests
npm run test:watch      # Run tests in watch mode
npm run db:create:test  # Create test database
npm run db:drop:test    # Drop test database
npm run build           # Build for production
npm start              # Start production server
```

## Multi-App Architecture
- **Internal-Admin** (`/internal/api/v1`): Platform administration (tenants, users, apps, pricing)
- **Hub App** (`/internal/api/v1/me`): Self-service portal for end users to access their apps
- **Product Apps**: TQ, CRM, Automation clients (future development)

## Critical Routes and Middleware
- **Platform-Scoped Routes** (NO tenant header needed):
  - `/internal/api/v1/applications`, `/platform-auth`, `/tenants`, `/audit`, `/metrics`
  - `/internal/api/v1/me/*` - **CRITICAL**: Hub self-service routes use public schema only
- **Tenant-Scoped Routes** (x-tenant-id header required):
  - `/internal/api/v1/auth`, `/users`, `/entitlements` 

## Regras para Multi-Tenancy no Desenvolvimento
- **Não** mover `users`/`user_application_access` para schemas de tenant.
- internal-admin = **Global**: não aplicar `search_path` (usa apenas `public`).
- Hub/Apps = **Platform-scoped**: /me routes são platform-scoped, NÃO aplicar search_path.
- Product routes = **Tenant-Scoped**: aplicar `SET LOCAL search_path TO tenant_<slug>, public`.
- Prefixe `public.` quando quiser deixar claro que é core.
- `createSchema()` é ponto de extensão para tabelas por-tenant (idempotentes).

## Critical Database Rules
- **ALL FKs are numeric**: `INTEGER NOT NULL REFERENCES`
- **FK naming**: Use `_fk` suffix (`tenant_id_fk`, `user_id_fk`)
- **Multi-tenancy**: Schema-per-tenant with `SET search_path`
- **1:1 Model**: Each user belongs to exactly one tenant
- **Authorization**: 5-layer enterprise licensing system

## API Patterns
```javascript
// Always use numeric IDs in routes
GET /internal/api/v1/tenants/:tenantId/users

// JWT contains numeric tenant ID only
{userId: 123, tenantId: 456, role: 'admin'}

// All FK fields follow naming convention
users.tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id)
```

## Testing
- **Framework**: Jest + Supertest
- **Test DB**: Auto-created `TEST_DATABASE_NAME`
- **Path Aliases**: `@server/*`, `@client/*`, `@shared/*`
- **Auth Testing**: JWT role override support
- **Run specific tests**: `npx jest tests/integration/internal/critical-validation.test.js`
- **Test patterns**: `npx jest --testNamePattern="Layer 1"`

## Environment Setup
- Copy `.env.example` to `.env` and configure database settings
- PostgreSQL required for local development
- Test database automatically created with `npm test`

## Important Files
- **Migrations**: `src/server/infra/migrations/` - Database schema evolution
- **API Routes**: `src/server/api/internal/routes/` - Express route handlers
- **Models**: `src/server/infra/models/` - Database abstractions
- **Frontend Apps**: `src/client/apps/` - Multi-app architecture
- **Tests**: `tests/integration/internal/` - Critical validation tests
- **Hub App**: `src/client/apps/hub/` - Self-service portal for end users

## Critical Seat Counting Rules
- **Grant**: MUST call `TenantApplication.incrementSeat(tenantId, applicationId)`
- **Revoke**: MUST call `TenantApplication.decrementSeat(tenantId, applicationId)`
- **Reactivate**: MUST call `TenantApplication.incrementSeat(tenantId, applicationId)`
- **All endpoints MUST maintain seat consistency**: Interface must always reflect database state

## Exemplos de Implementação (Docs-Only)

**Middleware (exemplo de documentação):**
```js
// Apenas para rotas tenant-scoped
async function withTenant(tenantSchema, fn) {
  await db.query('BEGIN');
  try {
    await db.query(`SET LOCAL search_path TO ${tenantSchema}, public`);
    const out = await fn();
    await db.query('COMMIT');
    return out;
  } catch (e) {
    await db.query('ROLLBACK'); throw e;
  }
}
```

---

**📖 For complete technical documentation, see [CLAUDE2.md](./CLAUDE2.md)**