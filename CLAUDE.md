# CLAUDE.md

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
npm run dev             # Run both server + client
npm run dev:server      # Server only (port 3001)
npm run dev:client      # Client only (port 3002)
npm run migrate         # Run database migrations
npm test               # Run all tests
```

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

---

**📖 For complete technical documentation, see [CLAUDE2.md](./CLAUDE2.md)**