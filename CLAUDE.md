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
│   ├── services/    # Third-party integrations (Deepgram, Supabase)
│   ├── app.js       # Express config
│   ├── tq-api.js    # TQ-specific API server
│   └── index.js     # Main server
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
npm run dev:internal    # Start server only (port 3001)
npm run dev:admin       # Start internal-admin only (port 3002)
npm run dev:hub         # Start Hub app only (port 3003)
npm run dev:tq-api      # Start TQ API server only (port 3004)
npm run dev:tq-front    # Start TQ frontend only (port 3005)
npm run dev:server      # Alias for dev:internal (nodemon server)
npm run dev:client      # Alias for dev:admin (vite client)
npm run migrate         # Run database migrations (REQUIRED after schema changes)

# Testing
npm test               # Run all tests (auto-creates test database)
npm run test:watch      # Run tests in watch mode
npx jest tests/integration/internal/critical-validation.test.js  # Run specific test
npx jest tests/integration/internal/  # Run all internal API tests

# Database
npm run db:create:test  # Create test database
npm run db:drop:test    # Drop test database completely

# Type checking (Frontend only)
npx tsc --noEmit --project src/client/  # Check TypeScript errors in frontend

# Linting/Build verification
npm run build          # Build both client and server
npm run build:client   # Build frontend only
```

## Multi-App Architecture
- **Internal-Admin** (`/internal/api/v1`): Platform administration (tenants, users, apps, pricing) - **Global scope only**
- **Hub App** (`/internal/api/v1/me`): Self-service portal for end users to access their apps
- **TQ App**: Transcription Quote system with session management, patient tracking, and audio recording features
- **Product Apps**: CRM, Automation clients (future development)

### Single Sign-On (SSO) Implementation
The platform implements seamless SSO between Hub and TQ applications:

**SSO Flow:**
1. User logs in to Hub with JWT authentication
2. When accessing TQ, Hub extracts JWT token and tenant ID from auth store
3. TQ URL is opened with SSO parameters: `http://localhost:3005/login?token={JWT}&tenantId={ID}`
4. TQ automatically validates token and logs user in without credentials
5. Shared session state maintained via LocalStorage across applications

**Technical Implementation:**
```javascript
// Hub: SSO initiation (src/client/apps/hub/pages/Home.tsx)
if (app.slug === 'tq') {
  const { token, tenantId } = useAuthStore.getState()
  if (token && tenantId) {
    const tqUrl = `http://localhost:3005/login?token=${encodeURIComponent(token)}&tenantId=${tenantId}`
    window.open(tqUrl, '_blank', 'noopener,noreferrer')
  }
}

// TQ: SSO consumption (src/client/apps/tq/lib/consumeSso.ts)
export const consumeSso = async (): Promise<boolean> => {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  const tenantId = params.get('tenantId')

  if (token && tenantId) {
    const { loginWithToken } = useAuthStore.getState()
    await loginWithToken(token, parseInt(tenantId))
    return true
  }
  return false
}

// Optimized token handling - decode JWT directly instead of API call
loginWithToken: async (token: string, tenantId: number) => {
  const payload = JSON.parse(atob(token.split('.')[1]))
  set({
    isAuthenticated: true,
    user: {
      id: payload.userId,
      email: payload.email,
      tenantId: payload.tenantId,
      // ... extract all user data from JWT payload
    },
    token,
    tenantId: payload.tenantId
  })
}
```

**CORS Configuration:**
```javascript
// src/server/app.js - Allow TQ origin for SSO
const TQ_ORIGIN = process.env.TQ_ORIGIN || 'http://localhost:3005';
if (origin === TQ_ORIGIN) {
  return callback(null, true);
}
```

**Vite Proxy for Development:**
```javascript
// vite.tq.config.ts - Proxy API calls to avoid CORS
proxy: {
  '/internal': {
    target: 'http://localhost:3001',
    changeOrigin: true
  }
}
```

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

### Required Environment Variables for TQ
- `DEEPGRAM_API_KEY`: Deepgram API key for transcription services
- `DEEPGRAM_WEBHOOK_SECRET`: Webhook secret for Deepgram callbacks
- `API_BASE_URL`: Base URL for API calls (default: http://localhost:3001)

## Important Files
- **Migrations**: `src/server/infra/migrations/` - Database schema evolution
- **API Routes**: `src/server/api/internal/routes/` - Express route handlers
- **Models**: `src/server/infra/models/` - Database abstractions
- **Frontend Apps**: `src/client/apps/` - Multi-app architecture
- **Tests**: `tests/integration/internal/` - Critical validation tests
- **Hub App**: `src/client/apps/hub/` - Self-service portal for end users
- **TQ App**: `src/client/apps/tq/` - Transcription Quote application with session management and quote system
- **TQ API**: `src/server/api/tq/routes/` - TQ-specific backend routes
  - `quotes.js`: Complete CRUD API for quotes and quote items (10 endpoints)
  - `sessions.js`: Session management with transcription integration
  - `patients.js`: Patient management for TQ workflow
  - `transcription.js`: Deepgram transcription integration
- **TQ Models**: `src/server/infra/models/` - TQ database models
  - `Quote.js`: Quote management with automatic total calculation
  - `QuoteItem.js`: Quote items with discount system and final price calculation
  - `Session.js`: Session management with patient and transcription linking
- **Common UI Components**: `src/client/common/ui/` - Shared design system components
  - `DropdownMenu`: Context-based dropdown with trigger/content/item components
  - `Input`: Standardized input with purple focus border (#B725B7)
  - `Button`, `Card`, `Select`, `Textarea`, `Progress`: Core UI primitives
- **Server Services**: `src/server/services/` - Third-party integrations
  - `deepgram.js`: Audio transcription service integration
  - `supabaseStorage.js`: File storage management

## TQ Quote Management System

### Database Schema
The TQ application includes a complete quote management system:

```sql
-- Quote table with session relationship
CREATE TABLE tenant_{slug}.quote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
  content TEXT,
  total NUMERIC(12,2) DEFAULT 0.00,
  status quote_status_enum NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Quote status enum
CREATE TYPE quote_status_enum AS ENUM ('draft','sent','approved','rejected','expired');

-- Quote items with discount system
CREATE TABLE tenant_{slug}.quote_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quote(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0.00,
  final_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Quote API Endpoints
Complete CRUD API available at `/api/tq/v1/quotes`:

- **Quote Management**: GET, POST, PUT, DELETE quotes
- **Quote Items**: CRUD operations for items within quotes
- **Automatic Calculations**: POST `/quotes/{id}/calculate` for total recalculation
- **Status Workflow**: Draft → Sent → Approved/Rejected/Expired

### Pricing Logic
- **Item-level discounts**: Each quote item has `base_price`, `discount_amount`, `final_price`
- **Automatic calculation**: `final_price = (base_price - discount_amount) × quantity`
- **Quote total**: Sum of all items' final prices
- **Transparency**: Each discount is itemized for client visibility

### Implementation Details
- **Models**: `Quote.js` and `QuoteItem.js` with automatic total calculation
- **API Routes**: 10 endpoints with full Swagger documentation
- **Tenant isolation**: All quotes scoped to tenant schema
- **Audit trail**: Complete created/updated timestamps with triggers

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
- **Type Check**: Frontend uses TypeScript - check for errors with `npx tsc --noEmit --project src/client/`
- **Test First**: Always run `npm test` before making significant changes
- **Database First**: Create migrations before changing models or adding features
- **Numeric IDs Only**: ALL IDs must be numeric - no string IDs anywhere in the system
- **FK Suffix**: All foreign keys must use `_fk` suffix for consistency
- **Transaction Scope**: Use proper database transactions for multi-step operations

## Common Development Workflows

### Adding a New API Endpoint
1. Create route in `src/server/api/internal/routes/[domain].js`
2. Add model methods in `src/server/infra/models/[Entity].js` if needed
3. Update Swagger documentation with proper tags (global vs tenant-scoped)
4. Add integration tests in `tests/integration/internal/`
5. Run `npm test` to verify implementation

### Adding a New Frontend Feature
1. Create components in `src/client/apps/[app]/features/[domain]/`
2. Add service methods in `src/client/apps/[app]/services/`
3. Update store in `src/client/apps/[app]/shared/store/` if needed
4. Use common UI components from `src/client/common/ui/` (Button, Input, Card, DropdownMenu, etc.)
5. Follow design system: purple primary color (#B725B7), consistent spacing, Montserrat font
6. Follow `/features` architecture pattern (not `/pages`)
7. Run `npx tsc --noEmit --project src/client/` to check types

### TQ Application Structure
TQ follows the same `/features` architecture as internal-admin:

#### Key TQ Features Implemented:
- **NewSession**: Audio transcription interface with split-button design
  - Split button for "Start Transcribing" vs "Upload Audio" mode selection
  - Compact patient input field with inline "Create new patient" CTA
  - Timer, VU meter, and microphone selection controls
  - Large transcription textarea with auto-save simulation
  - Pause/resume functionality for recordings
- **Transcription Service**: `transcriptionService.ts` for API communication with Deepgram
- **Audio Components**: AudioUploadModal for file uploads, recording controls

#### TQ UI Design Patterns:
- **Split Button**: Main action + dropdown for mode selection using DropdownMenu component
- **Compact Inputs**: Fixed-width inputs (w-80) instead of full-width for better UX
- **Purple Primary**: Consistent #B725B7 color for focus states and primary actions
- **Card Layouts**: Proper padding (px-6 py-4) for content spacing

```
src/client/apps/tq/
├── features/           # Feature-based organization
│   ├── auth/          # Authentication pages
│   │   └── Login.tsx
│   └── home/          # Home/Dashboard functionality
│       └── Home.tsx
├── shared/            # Shared TQ components/services
│   ├── components/    # Layout, Sidebar, Header (copied from Hub)
│   ├── store/         # Zustand stores (auth, ui)
│   └── types/         # TypeScript interfaces
├── services/          # API service layer
├── lib/              # Utilities (SSO consumption)
└── App.tsx           # TQ application root
```

**Key TQ Implementation Details:**
- **Shared UI**: Identical Layout, Sidebar, Header components as Hub
- **Simplified Navigation**: Only "Home" menu item in sidebar
- **SSO Integration**: Automatic login via URL parameters from Hub
- **Features Structure**: Follows enterprise `/features` pattern instead of `/pages`

### Database Schema Changes
1. Create migration file in `src/server/infra/migrations/`
2. Update model classes in `src/server/infra/models/`
3. Run `npm run migrate` to apply changes
4. Update tests with new schema expectations
5. Run `npm test` to verify everything works

### Grant/Revoke Implementation Pattern
```javascript
// ALWAYS follow this pattern for seat management
// 1. Grant: TenantApplication.incrementSeat()
// 2. Revoke: TenantApplication.decrementSeat()
// 3. Reactivate: TenantApplication.incrementSeat()
```

## Common Troubleshooting
- **Test database issues**: Run `npm run db:drop:test` then `npm test` to recreate clean test DB
- **Seat counting inconsistency**: Verify all grant/revoke/reactivate endpoints call seat increment/decrement
- **Multi-tenancy conflicts**: Ensure platform-scoped routes don't use `search_path`, tenant-scoped routes do
- **Pricing not configured**: Add entries to `application_pricing` table before granting access
- **Build failures**: Check for TypeScript errors in frontend, JavaScript syntax in backend
- **TypeScript errors**: Run `npx tsc --noEmit --project src/client/` to see all type issues
- **Migration failures**: Check if previous migrations ran successfully with `npm run migrate`
- **CORS issues**: Ensure TQ_ORIGIN is configured in server CORS settings for SSO
- **SSO token errors**: Verify JWT token is valid and contains required payload (userId, tenantId)
- **Vite proxy issues**: Check proxy configuration in vite.tq.config.ts for API routing

---

**📖 For complete technical documentation, see [CLAUDE2.md](./CLAUDE2.md)**