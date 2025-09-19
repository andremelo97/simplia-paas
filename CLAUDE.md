# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start for Development
- Backend is **JavaScript only** (.js files) with Express + PostgreSQL
- Frontend is **TypeScript** (.tsx/.ts files) with React + Vite
- Use `npm run dev` to run both server and client concurrently
- All database changes require migrations in `src/server/infra/migrations/`
- Always run tests before making significant changes: `npm test`

## Critical Development Rules
- **ALL IDs are numeric**: Use numeric IDs everywhere (PKs, FKs, headers, JWT tokens)
- **FK naming convention**: All foreign keys use `_fk` suffix (`tenant_id_fk`, `user_id_fk`)
- **Multi-tenancy**: Each user belongs to exactly one tenant via `users.tenant_id_fk`
- **Seat counting**: MUST call `TenantApplication.incrementSeat()` on grant, `decrementSeat()` on revoke
- **No TypeScript in backend**: Server code is JavaScript only (.js files)

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

## Essential Commands
```bash
# Development
npm run dev             # Start both server (3001) + internal-admin (3002)
npm run dev:hub         # Start Hub app only (port 3003)
npm run migrate         # Run database migrations (REQUIRED after schema changes)

# Testing
npm test               # Run all tests (auto-creates test database)
npm run test:watch      # Run tests in watch mode
npx jest tests/integration/internal/critical-validation.test.js  # Run specific test

# Database
npm run db:create:test  # Create test database
npm run db:drop:test    # Drop test database completely
```

## Multi-App Architecture
- **Internal-Admin** (`/internal/api/v1`): Platform administration (tenants, users, apps, pricing) - **Global scope only**
- **Hub App** (`/internal/api/v1/me`): Self-service portal for end users to access their apps
- **Product Apps**: TQ, CRM, Automation clients (future development)

## API Route Categories
- **Platform-Scoped** (no tenant header): `/applications`, `/platform-auth`, `/tenants`, `/audit`, `/metrics`, `/me/*`
- **Tenant-Scoped** (requires x-tenant-id header): `/auth`, `/users`, `/entitlements` 

## Regras para Multi-Tenancy no Desenvolvimento
- **Não** mover `users`/`user_application_access` para schemas de tenant.
- **Internal-Admin = Global**: `/platform-auth/*` e outras rotas de admin NÃO aplicam `search_path` (usa apenas `public`).
- Hub/Apps = **Platform-scoped**: /me routes são platform-scoped, NÃO aplicar search_path.
- Product routes = **Tenant-Scoped**: aplicar `SET LOCAL search_path TO tenant_<slug>, public`.
- Prefixe `public.` quando quiser deixar claro que é core.
- `createSchema()` é ponto de extensão para tabelas por-tenant (idempotentes).

## Database Conventions
- **Numeric IDs**: All PKs/FKs are `INTEGER NOT NULL`
- **FK naming**: Always use `_fk` suffix (`tenant_id_fk`, `user_id_fk`)
- **Schema isolation**: `SET LOCAL search_path TO tenant_<slug>, public` for tenant-scoped operations
- **User-tenant relationship**: 1:1 via `users.tenant_id_fk`
- **Migrations**: All schema changes go in `src/server/infra/migrations/`

## API Patterns
```javascript
// Always use numeric IDs in routes and filters
GET /internal/api/v1/tenants/users?tenantId=123

// JWT contains numeric tenant ID only
{userId: 123, tenantId: 456, role: 'admin'}

// All FK fields follow naming convention
users.tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id)
```

## Testing Guidelines
- **Before major changes**: Always run `npm test` to ensure no regressions
- **Test structure**: `/tests/integration/internal/` contains critical validation tests
- **Database**: Tests auto-create and cleanup test database
- **Path aliases**: Use `@server/*`, `@client/*`, `@shared/*` in tests
- **Specific tests**: `npx jest tests/integration/internal/critical-validation.test.js`

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

## Development Best Practices
- **Type Check**: Frontend uses TypeScript - check for errors with `npx tsc --noEmit` in `src/client/`
- **Test First**: Always run `npm test` before making significant changes
- **Database First**: Create migrations before changing models or adding features
- **Numeric IDs Only**: ALL IDs must be numeric - no string IDs anywhere in the system
- **FK Suffix**: All foreign keys must use `_fk` suffix for consistency
- **Transaction Scope**: Use proper database transactions for multi-step operations

## Common Troubleshooting
- **Test database issues**: Run `npm run db:drop:test` then `npm test` to recreate clean test DB
- **Seat counting inconsistency**: Verify all grant/revoke/reactivate endpoints call seat increment/decrement
- **Multi-tenancy conflicts**: Ensure platform-scoped routes don't use `search_path`, tenant-scoped routes do
- **Pricing not configured**: Add entries to `application_pricing` table before granting access
- **Build failures**: Check for TypeScript errors in frontend, JavaScript syntax in backend

---

**📖 For complete technical documentation, see [CLAUDE2.md](./CLAUDE2.md)**