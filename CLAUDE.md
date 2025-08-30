# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Simplia PaaS is a Node.js fullstack monorepo combining Express.js backend with React frontend.

**IMPORTANT**: Backend is ALWAYS Node.js with JavaScript (.js files), Frontend is React with TypeScript (.tsx/.ts files).

## Architecture

- **Monorepo Structure**: Single `package.json` with all dependencies, unified TypeScript configuration
- **src/server/**: Express.js backend with PostgreSQL integration (JavaScript only - .js files)
- **src/client/**: React frontend built with Vite (TypeScript - .tsx/.ts files)
- **src/shared/**: Shared utilities between client/server (JavaScript - .js files)
- **Path Aliases**: 
  - `@shared/*` maps to `src/shared/*`
  - `@server/*` maps to `src/server/*` 
  - `@client/*` maps to `src/client/*`

## Development Commands

```bash
# Install dependencies
npm install

# Run both server and client in development
npm run dev

# Run only server (uses nodemon for hot reload)
npm run dev:server

# Run only client (Vite dev server on port 3000)
npm run dev:client

# Build entire application
npm run build

# Build client only (outputs to dist/client)
npm run build:client

# Build server only (outputs to dist/server)
npm run build:server

# Start production server
npm start

# Database operations
npm run migrate                    # Run all pending migrations
npm run db:create:test            # Create test database (idempotent)
npm run db:drop:test              # Drop test database completely

# Testing
npm test                          # Run all tests (auto-creates test DB)
npm run test:watch                # Run tests in watch mode
npx jest --testNamePattern="Layer 1" # Run specific test pattern
npx jest tests/critical-validation.test.js # Run specific test file
```

## Key Configuration

- **TypeScript**: Main config in `tsconfig.json` (for client only), server-specific build uses `tsconfig.server.json`
- **Client Build**: Vite configured with root at `src/client`, outputs to `dist/client`
- **Server**: Node.js with JavaScript - NO TypeScript compilation needed
- **Hot Reload**: Server uses nodemon for .js files, client uses Vite's built-in HMR

## Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL (pg), CORS, dotenv, bcrypt, jsonwebtoken (JavaScript only)
- **Frontend**: React 18, TypeScript, Vite
- **Development**: nodemon, concurrently for parallel execution
- **Multi-tenancy**: Schema-per-tenant with PostgreSQL search_path switching
- **Licensing**: ServiceNow/Salesforce-inspired multi-layered entitlement system

## Multi-tenancy Architecture

- **Schema Switching**: Uses `SET search_path TO tenant_schema, public` for tenant isolation
- **Tenant Resolution**: Via `x-tenant-id` header or subdomain extraction
- **Database**: Single PostgreSQL database with multiple schemas (tenant_abc, tenant_xyz, etc.)
- **Middleware**: Automatic tenant context injection in Express requests (`req.tenant`)

## User Management & Authentication

- **User Storage**: `public.users` table with `tenant_id` foreign key for tenant isolation
- **Authentication**: JWT tokens with tenant + user context + app entitlements (`{userId, tenantId, role, schema, allowedApps[], userType}`)
- **Role Hierarchy**: `operations < manager < admin` with permission-based access control
- **Middleware Chain**: `tenant → auth → appAccess → routes` for automatic context injection
- **Password Security**: bcrypt with configurable salt rounds

## Backend Architecture (JavaScript)

### Core Components
- **Models**: Database abstractions with tenant-aware CRUD operations
  - `User.js`, `TenantUser.js` - User management
  - `Tenant.js` - Tenant management with schema isolation
  - `Application.js`, `TenantApplication.js`, `UserApplicationAccess.js`, `UserType.js` - Licensing system
  - `AccessLog.js` - Audit trail for compliance
- **Services**: Business logic layer (`authService.js`, `userService.js`) with validation and permissions
- **Middleware**: Request processing 
  - `tenant.js` - Multi-tenancy context injection
  - `auth.js` - JWT validation with app entitlements
  - `appAccess.js` - Application-level authorization with audit logging
- **Routes**: API endpoints 
  - `auth.js`, `users.js` - Authentication and user management
  - `applications.js` - Application catalog and tenant licenses  
  - `entitlements.js` - License and access management

### Database Layer
- **Connection**: Singleton database instance with connection pooling (`database.js`)
- **Tenant Isolation**: Schema-per-tenant with automatic `search_path` switching
- **Queries**: Tenant-aware queries using `database.queryWithTenant(tenantContext, sql, params)`

### Request Flow
1. **Tenant Resolution**: Extract tenant from header/subdomain → validate → set `req.tenant`
2. **Authentication**: Validate JWT → verify user status → set `req.user` with `allowedApps[]`
3. **Application Authorization**: Check tenant license + user app access → set `req.appAccess`
4. **Business Logic**: Execute with full context (tenant + user + app permissions)
5. **Database**: Switch to tenant schema → execute query → return results
6. **Audit**: Log access attempts for compliance and security

## Multi-Layered Licensing System

ServiceNow/Salesforce-inspired entitlement architecture with five authorization levels:

### Database Tables (7 total)
- `tenants` - Tenant registry with schema mapping and audit fields
- `users` - Users with tenant isolation and audit fields (13 columns)
- `user_types` - User hierarchy (operations < manager < admin) with pricing tiers
- `applications` - Product catalog with standardized slugs (tq, pm, billing, reports)
- `tenant_applications` - Tenant-level licenses with expiration, user limits, and seat tracking (14 columns)
- `user_application_access` - Individual user permissions per application
- `application_access_logs` - Complete audit trail with IP, User-Agent, API path, and decision reason (13 columns)

### Enterprise Authorization Flow (5 Layers)
1. **Tenant License Check**: Does tenant have active, non-expired license for application?
2. **Seat Availability Check**: Is tenant within user limits for the application?
3. **User Access Check**: Does individual user have permission to access app?
4. **Role Validation**: Does user have required role within the application?
5. **Audit Logging**: Record all access attempts (granted/denied) with full context (IP, User-Agent, API path, reason)

### Middleware Usage
```javascript
// Protect routes by application (versioned internal API)
app.get('/internal/api/v1/tq/*', requireTranscriptionQuoteAccess(), handler);

// Require specific role within app
app.get('/internal/api/v1/tq/admin', requireTranscriptionQuoteAccess('admin'), handler);

// Check any app access for general features  
app.get('/internal/api/v1/dashboard', requireAnyAppAccess, handler);
```

### JWT Token Enhancement
Login/registration now includes `allowedApps[]` (application slugs array instead of IDs for performance) and `userType` in JWT payload for efficient authorization without database lookups on every request. Application slugs are standardized: `['tq', 'pm', 'billing', 'reports']` replacing numeric IDs for faster string comparison.

### JWT Role Override for Testing
Authentication middleware now supports JWT role override - when a JWT token contains a `role` field, it takes precedence over the database user role. This provides flexibility for testing different authorization scenarios and enables fine-grained permission testing without modifying database records.

## Internal API Structure (Versioned)

The system uses a **versioned internal API** structure for administrative tools:

### API Endpoints Structure
```
GET  /health                            # Public health check (monitoring)
POST /internal/api/v1/auth/login        # Authentication 
GET  /internal/api/v1/auth/me           # User profile
GET  /internal/api/v1/users             # User management (requires x-tenant-id)
GET  /internal/api/v1/applications      # Product catalog (global, no tenant)
GET  /internal/api/v1/entitlements      # License management (requires x-tenant-id)
GET  /internal/api/v1/tq/dashboard      # Protected app endpoint
GET  /internal/api/v1/tq/admin          # Admin-only endpoint
GET  /docs/internal                     # Swagger documentation (admin-only)
```

### Environment Configuration
```bash
INTERNAL_API_PREFIX=/internal/api/v1    # Configurable API prefix
ENABLE_INTERNAL_DOCS=true               # Enable Swagger documentation
INTERNAL_DOCS_PATH=/docs/internal       # Swagger endpoint path
ADMIN_PANEL_ORIGIN=http://localhost:5173  # CORS allowed origin
ENABLE_HELMET=true                      # Security headers
```

### Security Features
- **CORS Restriction**: Limited to admin panel origin + test environments
- **Platform Roles**: `platform_role` field for Simplia internal team (`internal_admin`)
- **Protected Documentation**: Swagger requires `internal_admin` platform role
- **Versioned Structure**: Clean separation between internal tools and future public APIs

### Platform Roles vs Tenant Roles
- **Tenant Roles** (`operations` < `manager` < `admin`): Control access within tenant context
- **Platform Roles** (`internal_admin`): Control access to Simplia's internal administrative tools
- JWT tokens include both: `{role: 'admin', platformRole: 'internal_admin'}`

## Database Migrations

- **Location**: `src/server/migrations/` - SQL files executed in alphabetical order
- **Execution**: `npm run migrate` - Runs all pending migrations

### Migration Structure (Reorganized)

The migration system has been reorganized from 5 fragmented files into 3 well-organized migrations:

#### **001_create_core_tables.sql** - Foundation
- **All 7 core tables**: tenants, users, user_types, applications, tenant_applications, user_application_access, application_access_logs
- **Complete relationships**: All foreign keys and constraints
- **Audit fields**: `active`, `created_at`, `updated_at` on all tables  
- **Automatic triggers**: PostgreSQL triggers for `updated_at` maintenance
- **Comprehensive comments**: Full documentation on tables and columns

#### **002_create_indexes.sql** - Performance
- **Organized by purpose**: Primary lookup, performance, audit, business logic
- **18+ optimized indexes**: Including composite and partial indexes
- **Authorization optimization**: Specific indexes for 5-layer auth flow
- **Audit performance**: Indexes for compliance and security queries

#### **003_seed_initial_data.sql** - Essential Data
- **User types hierarchy**: operations (0) < manager (1) < admin (2)  
- **Application catalog**: tq, pm, billing, reports with standardized slugs
- **Default tenants**: Development and testing tenants
- **Sample users**: Admin and manager users for testing
- **Initial licenses**: TQ application licensed for default tenants

### Migration Benefits
- ✅ **Cleaner structure**: 3 logical migrations vs 5 scattered files
- ✅ **Better organization**: Tables → Indexes → Seeds
- ✅ **Complete documentation**: Every table and field documented
- ✅ **Atomic operations**: Each migration has single clear purpose
- ✅ **Backup preserved**: Old migrations saved in `_backup/` folder

### Environment Variables (.env.example)
- Database connection (PostgreSQL)
- JWT secret and expiration  
- Bcrypt salt rounds
- Tenant configuration (default tenant, header name)
- Server port and environment settings
- `TEST_DATABASE_NAME` - Separate test database (auto-created before tests)

## Testing and Quality Assurance

- **Testing Framework**: Jest with Supertest for API testing
- **Test Structure**: Tests located in `tests/` directory with `*.test.js` pattern
- **Test Database**: Automatic creation/cleanup with `TEST_DATABASE_NAME` from .env
- **Test Setup**: Global setup in `tests/setup.js` handles database migrations and cleanup
- **Auth Helpers**: `tests/auth-helper.js` provides JWT token generation utilities
- **Critical Tests**: `tests/critical-validation.test.js` validates all 5 authorization layers (all 10 tests passing ✅)
- **Automatic Flow**: `npm test` auto-creates test DB → runs migrations → executes tests
- **Token Testing**: JWT role override enables testing admin/manager/operations roles without database modifications
- **No Linting**: No code formatting tools configured yet

## Development Notes

- **Server Entry Point**: `src/server/index.js` - Express app bootstrap, `src/server/app.js` - Express configuration (separated for testing)
- **Health Check**: `GET /health` endpoint available for monitoring
- **Example Routes**: Transcription Quote routes (`/internal/api/v1/tq/*`) demonstrate the full 5-layer authorization flow
- **Application Slugs**: Use standardized slugs (`tq`, `pm`, `billing`, `reports`) not full names
- **Database Password**: Must be converted to string in database config (common PostgreSQL connection issue)
- **Migration Dependencies**: `runMigrations.js` requires `dotenv` loading to access environment variables
- **Test Database Scripts**: `src/server/scripts/db-create-test.js` and `db-drop-test.js` handle automatic test DB lifecycle
- **Testing Architecture**: Server app separated from bootstrap for testability, test DB creation is gracefully handled when PostgreSQL unavailable locally

## Enterprise Features Implemented

- **Audit Trail**: All database tables have `active`, `created_at`, `updated_at` fields with automatic PostgreSQL triggers for `updated_at`
- **Performance Optimized**: 18 indexes for critical queries, JWT with app slugs (replacing IDs) for fast string-based authorization
- **Compliance Ready**: Complete access logging with IP, User-Agent, API path, and detailed denial reasons
- **Seat Management**: User limits and seat tracking per tenant per application with availability checks
- **Foreign Key Integrity**: 7 FK relationships ensure referential integrity across all entities
- **Multi-Status Support**: Applications and tenants support multiple status states (active, trial, expired, suspended)
- **Automatic Timestamps**: PostgreSQL triggers automatically update `updated_at` on any record modification