# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 Critical Rules (Breaking These Causes Bugs)

### ID Conventions
- **ALL IDs are numeric**: PKs, FKs, headers, JWT tokens, route params - NO EXCEPTIONS
- **FK naming**: ALL foreign keys MUST use `_fk` suffix (`tenant_id_fk`, `user_id_fk`, `application_id_fk`)
- **Source of truth**: Always use `req.tenant.id` (numeric), never `req.tenant.slug` for DB operations
- **JWT tokens**: Only numeric IDs (`{userId: 123, tenantId: 456}`)
- **x-tenant-id header**: Only accepts numeric values as strings

### Language Split
- **Backend**: JavaScript ONLY (.js files) - NO TypeScript in `src/server/`
- **Frontend**: TypeScript (.tsx/.ts files) in `src/client/`

### Multi-Tenancy
- **User-Tenant relationship**: 1:1 via `users.tenant_id_fk INTEGER NOT NULL`
- **Schema isolation**: Use `SET LOCAL search_path TO tenant_<slug>, public` ONLY for tenant-scoped routes
- **Platform routes**: `/platform-auth/*`, `/applications`, `/tenants`, `/metrics`, `/me/*` are platform-scoped (NO search_path)
- **Tenant routes**: `/auth/*`, `/users`, `/entitlements` require `x-tenant-id` header and search_path

### Seat Counting (CRITICAL)
```javascript
// ALWAYS maintain seat consistency:
// Grant/Reactivate: TenantApplication.incrementSeat(tenantId, applicationId)
// Revoke: TenantApplication.decrementSeat(tenantId, applicationId)
// Interface MUST always reflect database state
```

### Database Migrations
- All schema changes MUST have a migration in `src/server/infra/migrations/`
- Run `npm run migrate` after creating new migrations
- Run `npm test` to verify migrations don't break existing functionality

## Quick Start Commands

```bash
# Initial Setup (First Time)
npm install                      # Install all dependencies
cp .env.example .env            # Create environment file (then configure DB settings)
npm run migrate                 # Run database migrations

# Development - Choose Your Workflow
npm run dev                     # Run ALL: Internal API + Internal-Admin (ports 3001 + 3002)
npm run dev:internal            # Internal API only (port 3001)
npm run dev:admin               # Internal-Admin frontend only (port 3002)
npm run dev:hub                 # Hub frontend only (port 3003)
npm run dev:tq-api              # TQ API server only (port 3004)
npm run dev:tq-front            # TQ frontend only (port 3005)

# Testing
npm test                        # Run all tests (auto-creates test DB)
npm run test:watch              # Run tests in watch mode

# Type Checking & Build
npx tsc --noEmit --project src/client/  # Check TypeScript errors
npm run build                   # Build production bundle
```

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

### 🚀 Port Architecture (NEVER CHANGE!)
```
3001 - Internal API Server (Hub + Internal-Admin consume)
3002 - Internal-Admin Frontend
3003 - Hub Frontend
3004 - TQ API Server (Dedicated TQ backend)
3005 - TQ Frontend
```

### Applications
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

## Hub Branding Configuration System

### Overview
The Branding Configuration system allows tenants to customize their brand identity (colors, logo, company information) across all applications. Branding data is stored globally and used by Public Quote Access and other tenant-facing features.

### Database Schema
```sql
-- Global branding table (NOT tenant-scoped)
CREATE TABLE public.tenant_branding (
  id SERIAL PRIMARY KEY,
  tenant_id_fk INTEGER NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  primary_color VARCHAR(7) DEFAULT '#B725B7',
  secondary_color VARCHAR(7) DEFAULT '#E91E63',
  accent_color VARCHAR(7) DEFAULT '#5ED6CE',
  logo_url TEXT,
  favicon_url TEXT,
  background_video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX tenant_branding_tenant_id_idx ON public.tenant_branding(tenant_id_fk);
```

### Default Colors
- **Primary**: `#B725B7` (Purple)
- **Secondary**: `#E91E63` (Pink)
- **Accent**: `#5ED6CE` (Cyan)

### API Endpoints

**Branding Configuration** (`/internal/api/v1/branding`):
- `GET /` - Get current tenant branding (creates default if not exists)
- `POST /` - Create or update branding (upsert)
- File uploads: `logo`, `favicon`, `backgroundVideo` (multipart/form-data)

### Supabase Storage Integration

**Bucket**: `branding-assets`
**Structure**:
```
branding-assets/
├── tenant_1/
│   ├── logo.png
│   ├── favicon.ico
│   └── background-video.mp4
├── tenant_2/
│   └── ...
```

**Upload Implementation** (`src/server/services/supabaseStorage.js`):
- `uploadBrandingAsset()` - Upload logo/favicon/video
- **Public URLs**: Permanent, non-expiring URLs (not signed URLs)
- **File Management**: Deletes old file before uploading new one (if different path)
- **MIME Types**: Validates file types (images: PNG/JPG/SVG, video: MP4)

**Fixed Issues**:
- ✅ URLs no longer expire after 24 hours (using Public URLs)
- ✅ Order of operations: Upload → Delete old (not delete → upload)
- ✅ Comparison check: Only delete if `oldPath !== newPath`

### Frontend Implementation

**Configuration Page** (`src/client/apps/hub/features/configurations/BrandingConfiguration.tsx`):
- Form fields: Company Name, Primary/Secondary/Accent Colors
- File uploads: Logo, Favicon, Background Video
- Color pickers for brand colors
- Preview of uploaded assets
- "Save Changes" button → POST `/internal/api/v1/branding`

**Configuration Layout** (`src/client/common/ui/ConfigurationLayout.tsx`):
- Shared component used by both Hub and TQ
- 2-column layout: 20% sidebar, 80% content area
- Consistent design pattern

**Configuration Wrapper** (`src/client/apps/hub/features/configurations/Configurations.tsx`):
- Route: `/configurations`
- Renders `BrandingConfiguration` component
- Navigation in Hub sidebar (admin-only)

### Backend Implementation

**Model** (`src/server/infra/models/TenantBranding.js`):
- `findByTenantId(tenantId)` - Get branding for tenant
- `upsert(tenantId, data)` - Create or update branding
- `getDefaults()` - Returns default color values

**Routes** (`src/server/api/internal/routes/branding.js`):
- `GET /` - Fetch branding (creates defaults if missing)
- `POST /` - Upsert branding with file uploads
- File handling: Multipart uploads via `multer`
- Supabase integration for asset storage

**Provisioner**:
- No seeding required - branding created on-demand via upsert
- Defaults applied automatically if no branding exists

### Public Quote Integration

**Usage**: Public Quote Access (`/api/tq/v1/pq/:accessToken`) returns branding data alongside quote content:

```json
{
  "contentPackage": { /* quote data */ },
  "branding": {
    "companyName": "ACME Medical",
    "primaryColor": "#B725B7",
    "logoUrl": "https://supabase.co/storage/v1/object/public/branding-assets/tenant_2/logo.png"
  }
}
```

**Frontend Rendering**: Public quote pages use branding colors/logo for customized client experience

### Navigation & Access Control

**Sidebar Item** (`src/client/apps/hub/shared/components/Sidebar.tsx`):
- "Configurations" menu item (admin-only)
- Icon: `Settings`
- Route: `/configurations`

**Route** (`src/client/apps/hub/routes/index.tsx`):
- `/configurations` → `Configurations` component wrapper
- Renders `BrandingConfiguration` for branding settings

### Service Layer

**Frontend Service** (inline in component):
```typescript
// GET branding
const response = await http.get('/internal/api/v1/branding')

// POST branding with files
const formData = new FormData()
formData.append('companyName', companyName)
formData.append('primaryColor', primaryColor)
formData.append('logo', logoFile)
await http.post('/internal/api/v1/branding', formData)
```

### File Upload Flow

1. User selects logo/favicon/video file
2. Frontend creates `FormData` with file + branding data
3. Backend receives multipart upload via `multer`
4. Supabase uploads file to `branding-assets/tenant_{id}/`
5. Public URL generated and stored in database
6. Old file deleted (if different path)
7. Response includes updated branding with new URLs

### Environment Variables

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BRANDING_BUCKET=branding-assets
```

### Implementation Best Practices

1. **Global Table**: Branding stored in `public.tenant_branding` (not tenant-scoped schemas)
2. **Public URLs**: Use permanent URLs for assets (not expiring signed URLs)
3. **Upsert Pattern**: Single endpoint for create/update
4. **Defaults on Demand**: Create default branding automatically if missing
5. **File Validation**: Check MIME types before upload
6. **Cleanup**: Delete old assets when uploading new ones

### Common Issues & Solutions

- **Expiring URLs**: Use `getPublicUrl()` instead of `createSignedUrl()` for permanent URLs
- **Upload Failures**: Check Supabase environment variables are loaded
- **File Deletion Errors**: Compare paths before deleting (`oldPath !== newPath`)
- **CORS Issues**: Ensure Supabase bucket has public read access
- **Missing Assets**: Verify bucket permissions and public URL settings

## Timezone & Internationalization System

### Overview
The platform serves multiple countries (Brazil, Australia) with different timezones and languages. The Timezone & i18n system ensures dates/times display correctly in the user's timezone and UI text appears in the appropriate language.

### Supported Locales
- **Brazil**: `pt-BR` (Portuguese) → `America/Sao_Paulo` timezone
- **Australia**: `en-AU` (English) → `Australia/Gold_Coast` timezone
- **Fallback**: `en-US` (English) for other regions

### Database Schema
Timezone is stored immutably in the tenants table:
```sql
CREATE TABLE public.tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(63) NOT NULL UNIQUE,
  schema_name VARCHAR(63) NOT NULL UNIQUE,
  timezone VARCHAR(100) NOT NULL, -- IANA timezone identifier (e.g., 'America/Sao_Paulo')
  status VARCHAR(20) DEFAULT 'active',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**IMPORTANT**: Timezone is set once at tenant creation and cannot be changed.

### JWT Payload with Timezone & Locale
**Modified Files**:
- `src/shared/types/user.js` - `createJwtPayload()` function
- `src/server/infra/authService.js` - `login()`, `register()`, `refreshToken()` methods

**JWT Payload Structure**:
```javascript
{
  userId: 123,
  tenantId: 456,
  email: "user@example.com",
  name: "John Doe",
  role: "admin",
  schema: "tenant_acme",
  timezone: "America/Sao_Paulo",  // NEW: IANA timezone from tenants table
  locale: "pt-BR",                // NEW: Derived from timezone via mapping utility
  allowedApps: [...],
  userType: {...},
  platformRole: null,
  iat: 1234567890
}
```

**How It Works**:
1. User logs into Hub or TQ
2. Backend queries `tenants.timezone` from database
3. Backend derives `locale` from timezone using mapping utility
4. Both `timezone` and `locale` added to JWT payload
5. JWT passed to TQ via SSO URL parameters
6. Frontend decodes JWT and extracts timezone/locale
7. Frontend stores in Auth Store for global access

### Backend Implementation

**Locale Mapping Utility** (`src/server/infra/utils/localeMapping.js`):
```javascript
// Maps IANA timezone to locale code
getLocaleFromTimezone('America/Sao_Paulo')      // → 'pt-BR'
getLocaleFromTimezone('Australia/Gold_Coast')   // → 'en-AU'
getLocaleFromTimezone('America/New_York')       // → 'en-US' (fallback)

// Extract language code from locale
getLanguageFromLocale('pt-BR')  // → 'pt'
getLanguageFromLocale('en-AU')  // → 'en'

// Validate timezone support
isSupportedTimezone('America/Sao_Paulo')  // → true
isSupportedTimezone('Invalid/Timezone')   // → false

// Get locale metadata (currency, date format, etc.)
getLocaleMetadata('pt-BR')  // → { currency: 'BRL', dateFormat: 'DD/MM/YYYY', ... }
```

**Modified createJwtPayload()** (`src/shared/types/user.js:47-83`):
```javascript
function createJwtPayload(user, tenant, allowedApps = [], userType = null) {
  // Derive locale from timezone using mapping utility
  let locale = 'pt-BR'; // Default to Brazilian Portuguese
  if (tenant.timezone) {
    try {
      const { getLocaleFromTimezone } = require('../server/infra/utils/localeMapping');
      locale = getLocaleFromTimezone(tenant.timezone);
    } catch (error) {
      console.warn('Failed to derive locale from timezone, using default pt-BR:', error.message);
    }
  }

  return {
    userId: user.id,
    tenantId: numericTenantId,
    email: user.email,
    name: user.name,
    role: user.role,
    schema: tenant.schema,
    timezone: tenant.timezone || 'America/Sao_Paulo', // IANA timezone identifier
    locale: locale, // Derived from timezone (pt-BR, en-AU, etc.)
    allowedApps: allowedApps,
    userType: userType ? { ... } : null,
    platformRole: user.platformRole || null,
    iat: Math.floor(Date.now() / 1000)
  };
}
```

**Modified authService.js** (`src/server/infra/authService.js`):
- **login()** method (lines 257-272): Fetches tenant timezone from DB if missing in context
- **register()** method (lines 135-150): Same enrichment logic
- **refreshToken()** method (lines 331-347): Fetches fresh timezone during refresh

```javascript
// Ensure tenant context includes timezone (fetch from DB if missing)
let enrichedTenantContext = tenantContext;
if (!tenantContext.timezone) {
  try {
    const Tenant = require('./models/Tenant');
    const tenant = await Tenant.findById(tenantIdFk);
    if (tenant) {
      enrichedTenantContext = {
        ...tenantContext,
        timezone: tenant.timezone
      };
    }
  } catch (error) {
    console.warn('Failed to fetch tenant timezone, using default:', error.message);
  }
}

// Generate JWT payload with entitlements (includes timezone & locale)
const jwtPayload = createJwtPayload(user, enrichedTenantContext, allowedApps, userType);
```

### Frontend Implementation

**Auth Store Updates** (`src/client/apps/tq/shared/store/auth.ts`):
```typescript
interface AuthState {
  // ... existing fields
  tenantTimezone?: string  // IANA timezone identifier (e.g., 'America/Sao_Paulo')
  tenantLocale?: string    // Locale code (e.g., 'pt-BR', 'en-AU')
  // ... rest
}

// SSO login method extracts timezone/locale from JWT
loginWithToken: async (token: string, tenantId: number) => {
  const payload = decodeJWTPayload(base64Payload)

  set({
    // ... existing fields
    tenantTimezone: payload.timezone || 'America/Sao_Paulo',
    tenantLocale: payload.locale || 'pt-BR',
    // ... rest
  })
}

// Persist timezone/locale in localStorage
partialize: (state) => ({
  // ... existing fields
  tenantTimezone: state.tenantTimezone,
  tenantLocale: state.tenantLocale
})
```

**Date/Time Formatter Utilities** (`src/client/common/utils/dateTime.ts`):
```typescript
// Format date in short format (DD/MM/YYYY)
formatShortDate(date, timezone, locale)

// Format date in long format (DD de MMM de YYYY)
formatLongDate(date, timezone, locale)

// Format time in 24h format (HH:mm)
formatTime(date, timezone, locale)

// Format date and time (DD/MM/YYYY HH:mm)
formatDateTime(date, timezone, locale)

// Format relative time (e.g., "2 hours ago", "há 2 horas")
formatRelativeTime(date, timezone, locale)

// Format month and year (MMM YYYY)
formatMonthYear(date, timezone, locale)

// Get current date in tenant timezone
getNowInTimezone(timezone)
```

**All formatters use native `Intl.DateTimeFormat` API** - no external dependencies.

**useDateFormatter Hook** (`src/client/common/hooks/useDateFormatter.ts`):
```typescript
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

const Component = () => {
  const { formatShortDate, formatDateTime, getTimezone, getLocale } = useDateFormatter()

  return (
    <div>
      <p>Date: {formatShortDate(session.created_at)}</p>
      <p>Time: {formatDateTime(session.updated_at)}</p>
      <p>Timezone: {getTimezone()}</p>
      <p>Locale: {getLocale()}</p>
    </div>
  )
}
```

**Hook automatically reads timezone/locale from Auth Store** - no manual passing required.

### Component Migration Pattern

**Before** (Hardcoded locale):
```typescript
// ❌ OLD - Hardcoded 'pt-BR'
<span>
  {new Date(session.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })}
</span>
```

**After** (Timezone-aware):
```typescript
// ✅ NEW - Uses tenant timezone/locale
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

const SessionRow = ({ session }) => {
  const { formatShortDate } = useDateFormatter()

  return <span>{formatShortDate(session.created_at)}</span>
}
```

**Example Migration** (`src/client/apps/tq/components/session/SessionRow.tsx:45-49`):
- Removed hardcoded `toLocaleDateString('pt-BR', ...)`
- Added `useDateFormatter()` hook
- Replaced with `formatShortDate(session.created_at)`

### SSO Flow with Timezone
1. **Hub Login**: User logs in, JWT includes `timezone` and `locale`
2. **Open TQ**: Hub opens TQ with SSO URL: `http://localhost:3005/login?token={JWT}&tenantId={ID}`
3. **TQ Decodes JWT**: Extracts timezone/locale from JWT payload
4. **Store in Auth**: Stores in Zustand Auth Store (`tenantTimezone`, `tenantLocale`)
5. **Persist**: Persists to localStorage for future sessions
6. **Global Access**: All components use `useDateFormatter()` hook for consistent formatting

### Implementation Status

**✅ Phase 1 - Timezone Global (COMPLETED)**:
- [x] Backend: Modify `createJwtPayload()` to include `timezone` and `locale`
- [x] Backend: Query tenant timezone when generating JWT token
- [x] Backend: Create timezone → locale mapping utility
- [x] Frontend: Add `tenantTimezone` and `tenantLocale` to Auth Store interfaces
- [x] Frontend: Auth stores decode JWT automatically and extract timezone/locale
- [x] Frontend: Create `src/client/common/utils/dateTime.ts` formatters
- [x] Frontend: Create `useDateFormatter()` hook
- [x] Frontend: Example refactor of SessionRow component

**✅ Phase 2 - Component Migration (COMPLETED)**:
- [x] Migrated **10 files** to use `useDateFormatter()` hook
- [x] Components migrated:
  - `PublicQuoteLinkRow.tsx` - Public quote links with expiration dates
  - `GeneratePublicQuoteModal.tsx` - Public quote generation modal
  - `PatientRow.tsx` - Patient list rows
  - `QuoteRow.tsx` - Quote list rows
  - `ClinicalReportRow.tsx` - Clinical report list rows
  - `ItemRow.tsx` - Item list rows
  - `TemplateRow.tsx` - Template list rows
  - `SessionRow.tsx` - Session list rows (Phase 1 example)
- [x] Hooks migrated to use formatter utilities:
  - `useQuotes.ts` - `formatDate()` helper function
  - `useSessions.ts` - `formatDate()` helper function
  - `usePatients.ts` - `formatDate()` helper function
- [x] All hardcoded `toLocaleDateString('pt-BR')` calls replaced
- [x] All components now respect tenant timezone and locale

**📋 Phase 3 - i18n UI (PENDING)**:
- [ ] Install react-i18next dependencies
- [ ] Create translation files (pt-BR, en-AU, en-US)
- [ ] Integrate i18n in App roots (TQ, Hub)
- [ ] Translate main screens starting with TQ

**📋 Phase 4 - AI Multilingual (PENDING)**:
- [ ] Pass tenant locale to AI Agent route
- [ ] Add language instruction to system message based on locale
- [ ] Add language hint to Deepgram transcription requests

### Best Practices

**DO**:
- ✅ Use `useDateFormatter()` hook in all components that display dates
- ✅ Use `Intl.DateTimeFormat` API (native, no dependencies)
- ✅ Store timezone/locale in Auth Store (single source of truth)
- ✅ Extract timezone/locale from JWT (automatic via SSO)
- ✅ Default to `America/Sao_Paulo` / `pt-BR` if missing

**DON'T**:
- ❌ Hardcode locale in `toLocaleDateString('pt-BR')` calls
- ❌ Use external date libraries (moment.js, date-fns) - native API is sufficient
- ❌ Pass timezone/locale as props to every component (use hook instead)
- ❌ Modify tenant timezone after creation (immutable field)

### Testing Timezone System

**Manual Testing**:
1. Create tenant with `America/Sao_Paulo` timezone
2. Login to Hub, verify JWT contains `timezone` and `locale`
3. Open TQ via SSO, verify Auth Store has correct values
4. Check dates display in `DD/MM/YYYY` format (Brazilian standard)
5. Create Australian tenant with `Australia/Gold_Coast` timezone
6. Verify dates display in Australian format with correct timezone offset

**Automated Testing**:
```javascript
// Test locale mapping
const { getLocaleFromTimezone } = require('./localeMapping');
expect(getLocaleFromTimezone('America/Sao_Paulo')).toBe('pt-BR');
expect(getLocaleFromTimezone('Australia/Gold_Coast')).toBe('en-AU');

// Test date formatters
const { formatShortDate } = require('./dateTime');
const date = new Date('2025-01-10T15:30:00Z');
expect(formatShortDate(date, 'America/Sao_Paulo', 'pt-BR')).toBe('10/01/2025');
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
- `OPENAI_API_KEY`: OpenAI API key for AI agent medical summaries
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-4o-mini)
- `SUPABASE_URL`: Supabase project URL for audio file storage
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for Supabase storage
- `SUPABASE_STORAGE_BUCKET`: Storage bucket name for audio files (default: tq-audio-files)

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
  - `templates.js`: Template management with TipTap integration (7 endpoints)
- **TQ Models**: `src/server/infra/models/` - TQ database models
  - `Quote.js`: Quote management with automatic total calculation
  - `QuoteItem.js`: Quote items with discount system and final price calculation
  - `Session.js`: Session management with patient and transcription linking
  - `Template.js`: Template management with usage tracking and search
- **Common UI Components**: `src/client/common/ui/` - Shared design system components
  - `DropdownMenu`: Context-based dropdown with trigger/content/item components
  - `Input`: Standardized input with purple focus border (#B725B7)
  - `SearchInput`: Reusable search input with clear button and consistent styling
  - `Button`, `Card`, `Select`, `Textarea`, `Progress`: Core UI primitives
  - `RichTextEditor`: Generic TipTap wrapper for rich text editing
  - `TemplateEditor`: Template-specific editor with syntax highlighting and variables palette
  - `ConfigurationLayout`: Reusable 2-column layout for configuration pages (Hub & TQ) with 20% sidebar and 80% content area
- **Server Services**: `src/server/services/` - Third-party integrations
  - `deepgram.js`: Audio transcription service integration
  - `supabaseStorage.js`: File storage management

## TQ Quote Management System

### HTML Rendering Consistency (TipTap → Puck Preview)

**Problem Solved**: Editor and preview showed different line spacing for quote content.

**Solution Implemented**:
1. **TipTap Config**: Commented `class: 'editor-paragraph'` to prevent class injection
2. **CSS Compatibility**: Added `.prose` rules to match TipTap spacing:
   ```css
   /* Normal paragraphs */
   .prose p { margin: 0 0 0.5rem 0; }

   /* Empty paragraphs (double line breaks) create extra spacing */
   .prose p:empty { margin: 0 0 1rem 0; min-height: 1rem; }
   ```
3. **Result**: Quote content renders identically in `/quotes/:id/edit` and Puck Preview

**Files Modified**:
- `src/shared/components/tiptap-templates/simple/simple-editor.tsx` - Class commented
- `src/client/index.css` - Prose compatibility rules added

### Quote CRUD Interface
Complete quote management with full CRUD operations:
- **Quote Listing**: `/quotes` - Overview page with patient/session data
- **Quote Creation**: Via AI agent template filling in NewSession
- **Quote Editing**: `/quotes/:id/edit` - 60/40 layout (quote details + patient/session info)
- **Automatic Feedback**: All mutations return `meta.code` for HTTP interceptor feedback
- **Stay on Page**: Edit page doesn't navigate away after save - updates local state

### Database Schema
The TQ application includes a complete quote management system:

```sql
-- Quote table with session relationship and sequential numbering
CREATE TABLE tenant_{slug}.quote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(10) NOT NULL UNIQUE DEFAULT ('QUO' || LPAD(nextval('quote_number_seq')::text, 6, '0')),
  session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
  content TEXT,
  total NUMERIC(12,2) DEFAULT 0.00,
  status quote_status_enum NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Quote number sequence for unique incremental numbers (QUO000001, QUO000002, etc.)
CREATE SEQUENCE quote_number_seq START WITH 1 INCREMENT BY 1;

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

## TQ Template Management System

### Database Schema
The TQ application includes a complete template management system for clinical documentation:

```sql
-- Template table for AI-powered clinical documentation
CREATE TABLE tenant_{slug}.template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '{timeZone}'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '{timeZone}'),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_template_title ON template(title);
CREATE INDEX idx_template_active ON template(active);
CREATE INDEX idx_template_created_at ON template(created_at);

-- Automatic timestamp updates
CREATE TRIGGER update_template_updated_at
  BEFORE UPDATE ON template
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Template Syntax Support
Templates support rich syntax for dynamic content generation:
- **Placeholders**: `[patient_name]`, `[date]`, `[symptoms]` - User input fields
- **Variables**: `$current_date$`, `$doctor_name$`, `$clinic_name$` - System variables
- **Instructions**: `(Ask about medication history)` - AI guidance notes

### Template API Endpoints
Complete CRUD API available at `/api/tq/v1/templates`:

- **Template Management**: GET, POST, PUT, DELETE templates
- **Search & Pagination**: Full-text search in title and description
- **Usage Tracking**: Automatic increment of usage_count when templates are used
- **Most Used**: GET `/templates/most-used` for popular templates
- **Active Filtering**: Filter by active status for template availability

### Template Editor Implementation
- **TipTap Editor**: Rich text editing with custom extensions
- **Syntax Highlighting**: Visual differentiation of placeholders, variables, instructions
- **Variables Palette**: Quick insertion of available system variables
- **Help Panel**: Contextual guidance for template syntax
- **Live Preview**: Real-time rendering of template content

### Frontend Implementation
- **Templates Page**: Full CRUD interface following TQ design patterns
- **2-Column Create Layout**: 60% main form, 40% creation guide with sticky sidebar
- **Template Creation Guide**: Comprehensive guide with syntax examples and system variables
- **TipTap Integration**: Custom `TemplateEditor` component with syntax support
- **Design Consistency**: Matches Patients/Sessions pages (variant="primary", space-y-8)
- **Empty States**: User-friendly empty states without action buttons
- **Search & Filters**: Simple Card-based filtering like other TQ features
- **Responsive Design**: Mobile-friendly interface with collapsible guide

### API Response Format
Templates follow the standard TQ API response format:
```json
{
  "data": [...],
  "meta": {
    "total": 0,
    "limit": 50,
    "offset": 0
  }
}
```

### Implementation Details
- **Model**: `Template.js` with full CRUD operations and usage tracking
- **API Routes**: 7 endpoints with complete OpenAPI documentation
- **Tenant Isolation**: All templates scoped to tenant schema via `req.tenant?.schema`
- **Frontend Service**: `templatesService.ts` with proper TQ API URL paths (`/api/tq/v1/templates`)
- **Robust Error Handling**: Defensive programming for API response variations
- **Usage Analytics**: Automatic tracking of template usage for insights

### AI Agent Integration
The template system is fully integrated with AI agent functionality:
- **TemplateQuoteModal**: NewSession modal for template-based quote creation with AI filling
- **Complete Workflow**: transcription creation → session creation → AI template filling → quote creation
- **Template Filling**: AI agent automatically fills templates using session transcription data via OpenAI GPT-4o-mini
- **HTML Preservation**: AI receives HTML templates directly and preserves all formatting (bold, spacing, lists)
- **Critical Content Rules**: AI can only modify content inside `[placeholders]` and `(instructions)` - never changes resolved variables
- **Context Analysis**: Parse transcription for relevant clinical information
- **Variable Substitution**: Replace system variables with database values before sending to AI
- **Instruction Processing**: Follow template instructions for content formatting
- **Usage Tracking**: Automatic increment of template usage when quotes are created
- **Success Feedback**: Toast notifications with clickable quote navigation
- **Integration Points**: Session text → Transcription → Session → AI fill template → Quote

**AI Agent Prompt Architecture:**
```javascript
// System variables resolved first (patient name, doctor name, dates from database)
const templateWithVariables = resolveTemplateVariables(template.content, variableContext)

// HTML sent directly to AI (no stripping)
const templateForAI = templateWithVariables // Use HTML directly

// Explicit HTML preservation rules in prompt
CRITICAL HTML PRESERVATION RULES:
1. Return COMPLETE HTML exactly as provided, with ALL tags preserved
2. DO NOT modify, add, or remove ANY HTML tags
3. DO NOT change text OUTSIDE of [brackets] or (parentheses)
4. Patient names, doctor names, dates are REAL DATA from database - never change them

// AI response used directly as HTML (no conversion)
const filledTemplateHtml = filledTemplate // Already HTML from AI
```

### Common Issues & Solutions
- **Route Registration**: Templates router mounted at `/templates` in TQ API
- **URL Paths**: Frontend must use full TQ API paths (`/api/tq/v1/templates`)
- **Tenant Schema**: Use `req.tenant?.schema` (not `req.tenantSchema`) for consistency
- **Response Format**: Backend returns `data/meta` structure, frontend handles gracefully
- **Middleware**: Global TQ middlewares handle auth/tenant - no individual route middleware needed

## TQ AI Agent Configuration System

### Overview
The AI Agent Configuration system allows admins to customize the `system_message` that defines how the AI Agent generates medical summaries from transcriptions, with support for dynamic template variables.

### Database Schema
```sql
-- Per-tenant AI Agent configuration table
CREATE TABLE tenant_{slug}.ai_agent_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE '{timeZone}'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE '{timeZone}')
);

-- Auto-update timestamp trigger
CREATE TRIGGER ai_agent_configuration_updated_at_trigger
  BEFORE UPDATE ON tenant_{slug}.ai_agent_configuration
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Template Variables Support
AI Agent system messages support dynamic variables that are resolved before sending to OpenAI:

**Patient Variables:**
- `$patient.first_name$` - Patient's first name
- `$patient.last_name$` - Patient's last name
- `$patient.fullName$` - Patient's full name (first + last)

**Date Variables:**
- `$date.now$` - Current date (formatted)
- `$session.created_at$` - Session creation date (formatted)

**Session Variables:**
- `$transcription$` - Full session transcription text (automatically loaded)

**Provider Variables:**
- `$me.first_name$` - Provider's first name (from JWT)
- `$me.last_name$` - Provider's last name (from JWT)
- `$me.fullName$` - Provider's full name (first + last)

### API Endpoints

**AI Agent Configuration** (`/api/tq/v1/configurations/ai-agent`):
- `GET /` - Get current configuration
- `PUT /` - Update system message
- `POST /reset` - Reset to default system message

### Default System Message
Stored in `src/server/infra/utils/aiAgentDefaults.js`:
```javascript
export const DEFAULT_SYSTEM_MESSAGE = `You are a medical assistant creating patient-friendly treatment summaries.

Patient: $patient.fullName$
Provider: $me.fullName$
Date: $date.now$

Transcription:
$transcription$

Create a clear, professional summary.`;
```

### AI Agent Chat Integration

**Updated Chat Flow:**
1. **Initial Conversation**: Frontend sends empty `messages` array + `sessionId` + `patientId`
2. **Backend Resolution**:
   - Fetch `system_message` from `ai_agent_configuration` table
   - Load Session with `includePatient=true` (loads transcription via JOIN)
   - Extract transcription text from `session.transcription?.text`
   - Resolve all template variables in system message
3. **OpenAI Call**: System message with resolved variables sent to OpenAI
4. **Response**: Backend returns `{response, systemMessageUsed}` where `systemMessageUsed` contains the exact message sent to OpenAI
5. **Frontend Display**: Shows `systemMessageUsed` with transcription truncated to first 3 words + "..." for UI clarity

**API Request (Initial):**
```json
{
  "messages": [],
  "sessionId": "uuid-string",
  "patientId": "uuid-string"
}
```

**API Response:**
```json
{
  "data": {
    "response": "Patient Name: John Doe...",
    "systemMessageUsed": "You are a medical assistant...\n\nPatient: John Doe\nProvider: Dr. Smith\nDate: October 8, 2025\n\nTranscription:\nPatient presented with..."
  },
  "meta": {
    "code": "AI_RESPONSE_GENERATED"
  }
}
```

### Frontend Implementation

**Configuration Page** (`src/client/apps/tq/features/configurations/AIAgentConfiguration.tsx`):
- Textarea with `system_message` pre-filled from backend
- Helper text listing all available template variables
- "Save Changes" button → PUT `/api/tq/v1/configurations/ai-agent`
- "Reset to Default" button → POST `/api/tq/v1/configurations/ai-agent/reset`
- States: loading, error, success (via HTTP interceptor feedback)

**Configuration Layout** (`src/client/common/ui/ConfigurationLayout.tsx`):
- Shared component used by both TQ and Hub
- 2-column layout: 20% sidebar (navigation), 80% content area
- Consistent design pattern across apps

**AI Agent Modal** (`src/client/apps/tq/components/ai-agent/AIAgentModal.tsx`):
- First message displays `systemMessageUsed` from backend
- Transcription truncated to first 3 words + "..." (display only)
- Backend receives full transcription (no truncation)
- `whitespace-pre-wrap` preserves formatting

### Backend Implementation

**Model** (`src/server/infra/models/AIAgentConfiguration.js`):
- `findByTenant(schema)` - Get configuration for tenant
- `upsert(schema, systemMessage)` - Create or update configuration
- `reset(schema)` - Reset to default from `aiAgentDefaults.js`
- `getDefaultSystemMessage()` - Returns default system message constant

**Routes** (`src/server/api/tq/routes/ai-agent-configuration.js`):
- Mounted at `/configurations/ai-agent` in TQ API
- 3 endpoints: GET, PUT, POST reset
- Returns `meta.code` for automatic feedback toasts

**AI Agent Route Updates** (`src/server/api/tq/routes/ai-agent.js`):
- `/chat` endpoint modified to:
  - Fetch configuration via `AIAgentConfiguration.findByTenant()`
  - Load Session with `Session.findById(sessionId, schema, true)` (includes patient + transcription)
  - Extract transcription: `session.transcription?.text || null`
  - Resolve variables: `resolveTemplateVariables(systemMessage, context)`
  - Add resolved system message to OpenAI messages
  - Return `systemMessageUsed` in response

**Template Variable Resolver** (`src/server/services/templateVariableResolver.js`):
- Updated to support `$transcription$` variable
- Context includes: patient, date, session, transcription, me (provider)
- `validateTemplateVariables()` includes transcription validation

**Provisioner** (`src/server/infra/provisioners/tq.js`):
- Creates `ai_agent_configuration` table during tenant schema creation
- Seeds default configuration using `DEFAULT_SYSTEM_MESSAGE` from `aiAgentDefaults.js`
- Eliminates code duplication (single source of truth)

### Navigation & Access Control

**Sidebar Item** (`src/client/apps/tq/shared/components/Sidebar.tsx`):
- "Configurations" menu item (admin-only visibility)
- Icon: `Settings`
- Route: `/configurations`

**Route** (`src/client/apps/tq/routes/index.tsx`):
- `/configurations` → `Configurations` component wrapper
- Renders `AIAgentConfiguration` for AI Agent settings

**Layout Adjustment** (`src/client/apps/tq/shared/components/Layout.tsx`):
- Conditional padding removal on `/configurations` route
- Prevents drawer overlap with sidebar

### Service Layer

**Frontend Service** (`src/client/apps/tq/services/aiAgentConfigurationService.ts`):
```typescript
export const aiAgentConfigurationService = {
  getConfiguration: () => http.get('/api/tq/v1/configurations/ai-agent'),
  updateConfiguration: (systemMessage: string) =>
    http.put('/api/tq/v1/configurations/ai-agent', { systemMessage }),
  resetConfiguration: () =>
    http.post('/api/tq/v1/configurations/ai-agent/reset', {})
}
```

### Feedback Codes

**New Feedback Catalog Entries** (`src/client/common/feedback/catalog.ts`):
```typescript
AI_AGENT_CONFIGURATION_UPDATED: {
  title: "Configuration Updated",
  message: "AI Agent configuration updated successfully."
},
AI_AGENT_CONFIGURATION_RESET: {
  title: "Configuration Reset",
  message: "AI Agent configuration reset to default."
}
```

### Text-to-HTML Conversion

**Utility** (`src/client/apps/tq/lib/textToHtml.ts`):
- `plainTextToHtml()` - Converts AI Agent responses to TipTap-compatible HTML
- **Rules**:
  - Double line breaks (`\n\n`) → `<p></p>` empty spacer (section breaks)
  - Single line breaks (`\n`) → separate `<p>` tags (no `<br>`)
  - `**text**` → `<strong>text</strong>` (bold conversion)
  - Matches `simple-editor` output format exactly
- **Usage**: AI Agent responses formatted before insertion into Clinical Reports/Quotes

### Implementation Best Practices

1. **Single Source of Truth**: Default system message in `aiAgentDefaults.js` used by both provisioner and reset
2. **Backend-Only Variable Resolution**: Frontend displays resolved values, never resolves itself
3. **Transparent Display**: Frontend shows exact system message sent to OpenAI (with truncation for readability)
4. **Automatic Feedback**: No manual `publishFeedback()` calls - HTTP interceptor handles all feedback
5. **Validation**: Empty `messages` array allowed when `sessionId` present (initial conversation)
6. **Error Handling**: Defensive checks for missing transcription, patient, or configuration data

### Common Issues & Solutions

- **Configuration Not Loading**: Ensure frontend calls `/api/tq/v1/configurations/ai-agent` (not `/tq/configurations/...`)
- **Variables Not Resolving**: Backend must load Session with `includePatient=true` to get transcription
- **Textarea Styling Issues**: Use `Textarea` component from `@client/common/ui` for consistent borders
- **Duplicated System Message**: Frontend sends empty array, backend handles everything
- **Transcription Overflow**: Truncate in frontend display only, send full text to backend
- **SQL Errors**: Avoid single quotes in default message (use `do not` instead of `don't` or escape with `''`)

## TQ Public Quote System

### Overview
The Public Quote system allows quotes to be shared externally via secure links with customizable templates powered by Puck page builder. The system supports template management, password protection, link expiration, and usage analytics.

### Database Schema

```sql
-- Public Quote Templates (reusable Puck layouts)
CREATE TABLE tenant_{slug}.public_quote_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '{timeZone}'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '{timeZone}'),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content JSONB NOT NULL,  -- Puck layout configuration
  is_default BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true
);

-- Constraint: Only 1 template can be default per tenant
CREATE UNIQUE INDEX idx_public_quote_template_default
  ON public_quote_template(is_default)
  WHERE is_default = true;

-- Public Quote Instances (shared links)
CREATE TABLE tenant_{slug}.public_quote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '{timeZone}'),
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE '{timeZone}'),
  quote_id UUID NOT NULL REFERENCES quote(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public_quote_template(id) ON DELETE SET NULL,
  access_token VARCHAR(64) UNIQUE NOT NULL,  -- Secure random token
  password_hash VARCHAR(255),  -- Optional password protection
  views_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true
);
```

### Relationships
- **1:N Template → Public Quote**: One template can be used by multiple public quotes
- **1:N Quote → Public Quote**: One quote can have multiple public share instances
- **Template Deletion**: ON DELETE SET NULL - public quotes remain active with no template

### API Endpoints

**Public Quote Templates** (`/api/tq/v1/public-quote-templates`):
- `GET /?isDefault=true&active=true` - List all templates with filters (max 3 per tenant)
- `GET /:id` - Get template by ID
- `POST /` - Create new template (enforces max 3 limit)
- `PUT /:id` - Update template (auto-unsets other defaults when setting default)
- `DELETE /:id` - Delete template

**Public Quotes** (`/api/tq/v1/public-quotes`):
- `POST /` - Create public quote link
- `GET /by-quote/:quoteId` - Get all public links for a quote
- `DELETE /:id` - Revoke public quote link (soft delete)

### Template Limits
- **Max 3 templates per tenant** - Enforced at API level
- Only 1 template can be marked as default
- Templates cannot be deleted if they're the default (must set another as default first)

### Security Features
- **Secure tokens**: 64-character cryptographically random access tokens
- **Password protection**: Optional bcrypt-hashed passwords
- **Link expiration**: Controlled via `quote.expires_at` (inherited from quote)
- **Soft delete**: Revoked links remain in database for audit via `active` flag

### Puck Integration
Templates store complete Puck page builder configuration in `content` JSONB field:
- Component tree structure
- Layout configuration
- Styling and branding (uses tenant colors/logo automatically)
- Custom components for quote data rendering

**Available Components** (54+ components across 6 categories):
- **Layout**: Grid, Flex, Space, Divider (NEW - horizontal separator with customizable color, thickness, and spacing)
- **Typography**: Heading, Text
- **Actions**: Button
- **Quote Info**: QuoteNumber, QuoteTotal, QuoteItems, QuoteContent
- **Header**: Header (fixed top bar with logo)
- **Other**: CardContainer, CardWithIcon, Hero, Logos, Stats

### Implementation Details
- **Models**: `PublicQuoteTemplate.js` and `PublicQuote.js`
- **API Routes**:
  - `public-quote-templates.js` - 5 endpoints (simplified with filters)
  - `public-quotes.js` - 3 endpoints (updated to support template_id)
- **Tenant Isolation**: All templates and public quotes scoped to tenant schema
- **Analytics**: Track views and last viewed timestamp per public quote
- **Simplified Routes**: No `/duplicate` or `/default` routes - use POST with populated body and GET with `isDefault=true` filter

### Usage Flow
1. **Create Template**: User creates up to 3 custom templates in `/public-quotes` using Puck editor
2. **Select Template**: In `/quotes/:id/edit`, user selects template from dropdown
3. **Generate Link**: System creates public_quote record with selected template_id and secure token
4. **Share Link**: `https://app.com/public/{access_token}` sent to client
5. **Client Views**: Public page renders quote data using template's Puck configuration
6. **Analytics**: System tracks views and timestamps automatically

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

## Timezone & Internationalization System

### Overview
The platform implements a comprehensive timezone and internationalization system to support global operations (Brazil and Australia). Timezone data is propagated via JWT tokens and automatically applied to all date/time displays.

### Implementation

**Phase 1: Backend & Infrastructure (✅ COMPLETED)**

1. **Locale Mapping Utility** (`src/server/infra/utils/localeMapping.js`):
```javascript
// Maps IANA timezone identifiers to locale codes
getLocaleFromTimezone('America/Sao_Paulo')      // → 'pt-BR'
getLocaleFromTimezone('Australia/Gold_Coast')   // → 'en-AU'
getLanguageFromLocale('pt-BR')                  // → 'pt'
isSupportedTimezone(timezone)                   // → boolean
getLocaleMetadata(locale)                       // → {currency, dateFormat, ...}
```

2. **JWT Payload Enhancement** (`src/shared/types/user.js`):
- Added `timezone` and `locale` fields to JWT payload
- `locale` is automatically derived from `timezone` using localeMapping utility
- Example: `{userId: 123, tenantId: 456, timezone: 'America/Sao_Paulo', locale: 'pt-BR', ...}`

3. **Auth Service Updates** (`src/server/infra/authService.js`):
- `login()`, `register()`, `refreshToken()` methods fetch tenant timezone from DB
- Enriches tenant context before creating JWT payload
- Ensures timezone is always present in JWT tokens

4. **Auth Store Updates**:
- **TQ Auth Store** (`src/client/apps/tq/shared/store/auth.ts`):
  - Added `tenantTimezone` and `tenantLocale` fields
  - SSO `loginWithToken()` extracts from JWT payload
  - Persisted to localStorage via `partialize`
- **Hub Auth Store** (`src/client/apps/hub/store/auth.ts`):
  - Same fields and JWT extraction logic
  - Works seamlessly with SSO flow from Hub to TQ

5. **Date Formatting Utilities** (`src/client/common/utils/dateTime.ts`):
```typescript
// Pure utility functions using Intl.DateTimeFormat API
formatShortDate(date, timezone, locale)     // → "15/01/2025"
formatLongDate(date, timezone, locale)      // → "January 15, 2025"
formatTime(date, timezone, locale)          // → "14:30"
formatDateTime(date, timezone, locale)      // → "Jan 15, 2025, 2:30 PM"
formatRelativeTime(date, timezone, locale)  // → "2 hours ago"
formatMonthYear(date, timezone, locale)     // → "Jan 15"
getNowInTimezone(timezone)                  // → Date object in timezone
```

6. **React Hook** (`src/client/common/hooks/useDateFormatter.ts`):
```typescript
// Automatic timezone/locale detection from auth store
const { formatShortDate, formatLongDate, formatDateTime } = useDateFormatter()

// Works in both TQ and Hub apps via dynamic imports
// Falls back to 'America/Sao_Paulo' / 'pt-BR' if store not available
```

**Phase 2: Frontend Component Migration (✅ COMPLETED)**

All 23 components migrated to use timezone-aware date formatting:

**TQ Components (21):**
- SessionRow, PublicQuoteLinkRow, GeneratePublicQuoteModal
- PatientRow, QuoteRow, ClinicalReportRow, ItemRow, TemplateRow
- useQuotes, useSessions, usePatients (hooks)
- RecentPatientRow, ReportCard, SessionCard, QuoteCard
- resolveTemplateVariables (utility)
- Home (7 occurrences migrated)
- EditQuote
- PatientHistory (7 occurrences migrated)
- ViewClinicalReport
- EditClinicalReport

**Hub Components (2):**
- EntitlementsSummaryCard
- EntitlementAppCard

**Migration Pattern:**
```typescript
// Before
const date = new Date(created_at).toLocaleDateString('pt-BR', {...})

// After
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
const { formatShortDate } = useDateFormatter()
const date = formatShortDate(created_at)
```

**Phase 3: UI Internationalization (✅ COMPLETED)**

Language rule: **pt-BR for Brazil, en-US for everything else** (including Australia, USA, Europe, etc.)

**Dependencies installed:**
```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

**Translation files created:**
- `src/client/common/i18n/locales/pt-BR/` - Brazilian Portuguese translations
  - `common.json` - Common UI strings (save, cancel, delete, etc.)
  - `tq.json` - TQ-specific strings (patients, sessions, quotes, etc.)
  - `hub.json` - Hub-specific strings (entitlements, apps, etc.)
- `src/client/common/i18n/locales/en-US/` - English translations
  - `common.json`, `tq.json`, `hub.json` (same structure)

**i18n Configuration** (`src/client/common/i18n/config.ts`):
- Custom language detector reads `tenantLocale` from auth store (localStorage)
- Automatic language switching: `pt-BR` → pt-BR, anything else → `en-US`
- No caching (language managed via auth store)
- Fallback language: `en-US`
- Namespaces: `common`, `tq`, `hub`

**App Integration:**
- **TQ App** (`src/client/apps/tq/App.tsx`): Watches `tenantLocale` from auth store, calls `i18n.changeLanguage()` on change
- **Hub App** (`src/client/apps/hub/main.tsx`): I18nSync component watches `tenantLocale`, syncs language

**Usage Pattern:**
```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation('tq') // or 'hub' or 'common'

  return (
    <div>
      <h1>{t('patients.title')}</h1>
      <p>{t('common:welcome_back')}</p>
      <Button>{t('common:save')}</Button>
    </div>
  )
}
```

**Example Migration** (PatientRow.tsx):
```typescript
// Before
<Button aria-label={`Edit ${formatPatientName(patient)}`}>

// After
const { t } = useTranslation('tq')
<Button aria-label={`${t('patients.edit')} ${formatPatientName(patient)}`}>
```

**Phase 4: AI & Transcription Multilingual (NOT STARTED)**
- Pass tenant locale to AI Agent routes
- Add language instruction to OpenAI system messages
- Add language hint to Deepgram transcription requests

### Key Design Decisions
- **Single Source of Truth**: Timezone stored in `tenants.timezone` (IANA format)
- **Locale Derivation**: Automatic mapping from timezone (no separate locale field)
- **JWT Propagation**: Timezone/locale included in JWT for SSO compatibility
- **No External Dependencies**: Uses native `Intl.DateTimeFormat` API (Phase 1-2) and react-i18next (Phase 3)
- **Two Languages Only**: pt-BR (Brazil) and en-US (rest of world)
- **Universal Hook**: `useDateFormatter()` works in both TQ and Hub apps
- **Graceful Fallbacks**: Defaults to 'America/Sao_Paulo' / 'pt-BR' if data missing

### Files Modified/Created
**Backend:**
- `src/server/infra/utils/localeMapping.js` (created, updated for 2 languages only)
- `src/shared/types/user.js` (modified - createJwtPayload)
- `src/server/infra/authService.js` (modified - login, register, refreshToken)

**Frontend - Phase 1&2:**
- `src/client/common/utils/dateTime.ts` (created)
- `src/client/common/hooks/useDateFormatter.ts` (created)
- `src/client/apps/tq/shared/store/auth.ts` (modified)
- `src/client/apps/hub/store/auth.ts` (modified)
- 23 component files migrated to use `useDateFormatter()`

**Frontend - Phase 3:**
- `src/client/common/i18n/config.ts` (created)
- `src/client/common/i18n/index.ts` (created)
- `src/client/common/i18n/locales/pt-BR/*.json` (created - 3 files)
- `src/client/common/i18n/locales/en-US/*.json` (created - 3 files)
- `src/client/apps/tq/App.tsx` (modified - i18n sync)
- `src/client/apps/hub/main.tsx` (modified - i18n sync)
- `src/client/apps/tq/components/patients/PatientRow.tsx` (example migration)

## Development Best Practices
- **Type Check**: Frontend uses TypeScript - check for errors with `npx tsc --noEmit --project src/client/`
- **Test First**: Always run `npm test` before making significant changes
- **Database First**: Create migrations before changing models or adding features
- **Numeric IDs Only**: ALL IDs must be numeric - no string IDs anywhere in the system
- **FK Suffix**: All foreign keys must use `_fk` suffix for consistency
- **Transaction Scope**: Use proper database transactions for multi-step operations
- **Feedback via HTTP**: NEVER use `publishFeedback()` in components - feedback is handled automatically via HTTP interceptors. Only add manual feedback if explicitly requested.
- **Timezone-Aware Dates**: ALWAYS use `useDateFormatter()` hook for displaying dates/times - never use `toLocaleDateString()` directly
- **i18n for UI Text**: ALWAYS use `useTranslation('tq')` or `useTranslation('hub')` hook for UI strings - never hardcode text in Portuguese or English

## Automatic Feedback System

### HTTP Interceptor Feedback
All API responses with `meta.code` trigger automatic feedback toasts:

**Backend Response Format:**
```javascript
res.json({
  data: { ...entity },
  meta: {
    code: 'ENTITY_UPDATED',  // Must be in FEEDBACK_CATALOG
    message: 'Entity updated successfully'  // Fallback message
  }
})
```

**How it works:**
1. HTTP client (`src/client/config/http.ts`) intercepts all responses
2. For mutative methods (POST, PUT, PATCH, DELETE), checks for `meta.code`
3. Looks up message in `FEEDBACK_CATALOG` (`src/client/common/feedback/catalog.ts`)
4. Publishes feedback automatically - NO manual `publishFeedback()` needed in components
5. Toast appears with title and message from catalog

**Feedback Catalog Entries (TQ):**
```typescript
// src/client/common/feedback/catalog.ts
QUOTE_CREATED: { title: "Quote Created", message: "Quote created successfully." }
QUOTE_UPDATED: { title: "Quote Updated", message: "Quote updated successfully." }
SESSION_UPDATED: { title: "Session Updated", message: "Session updated successfully." }
PATIENT_CREATED: { title: "Patient Created", message: "Patient created successfully." }
TEMPLATE_FILLED: { title: "Template Filled", message: "Template filled successfully with AI." }
```

**Component Implementation:**
```typescript
// ❌ WRONG - Manual feedback
const handleSave = async () => {
  await quotesService.updateQuote(id, data)
  publishFeedback({ kind: 'success', message: 'Saved!' })  // DON'T DO THIS
}

// ✅ CORRECT - Automatic feedback via interceptor
const handleSave = async () => {
  const updated = await quotesService.updateQuote(id, data)
  setQuote(updated)  // Just update local state
  // Success feedback is handled automatically by HTTP interceptor
}
```

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
- **Home Dashboard**: Comprehensive dashboard with multiple sections
  - **Quick Actions**: 3 action cards (Start New Session, Add Patient, View Sessions)
  - **Latest Quotes**: 6 cards in 3-column grid showing most recent quotes
  - **Latest Reports**: 6 cards in 3-column grid showing most recent clinical reports
  - **Sessions This Week**: 6 cards in 3-column grid showing most recent sessions
  - **Patients Recently Added**: 5 most recent patients in list format with avatars
  - **Recent Activity**: 5 most recent activities (patients, sessions, quotes) in timeline format
  - **Global Search**: Header search bar with live results for patients, sessions, quotes, reports, and templates
  - **Visual Separators**: Horizontal dividers between sections for clear organization
  - **Double-click Navigation**: All cards and rows support double-click to edit/view
  - **Color Consistency**: Icons match sidebar colors (Users=#5ED6CE, FileText=#B725B7, Receipt=#E91E63)
- **NewSession**: Audio transcription interface with split-button design
  - Split button for "Start Transcribing" vs "Upload Audio" mode selection
  - Compact patient input field with inline "Create new patient" CTA
  - Timer, VU meter, and microphone selection controls
  - Large transcription textarea with auto-save simulation
  - Pause/resume functionality for recordings
- **Quote Management System**: Complete CRUD system for quotes and quote items
  - 10 API endpoints for quotes and quote items with automatic pricing calculation
  - Database schema with `quote` and `quote_item` tables, status ENUMs, and triggers
  - Item-level discount system with transparent final pricing
- **AI Agent Integration**: Medical summary generation using OpenAI GPT-4o-mini
  - Interactive chat interface for iterative summary refinement
  - Medical-focused prompts optimized for 2nd person summaries
  - Direct quote creation from AI-generated summaries
- **Patient Management**: Complete CRUD system for patient records
  - **Patient History**: Comprehensive history page at `/patients/:id/history` with:
    - 4 metric cards: Total Sessions, Total Quotes, Approved Quotes, Total Reports
    - 4 tabs: Sessions, Quotes, Clinical Reports, Timeline
    - Timeline view with vertical spine visualization (newest first)
    - Pagination (10 items per page) across all tabs
    - Navigation: Edit button in History → Edit Patient, View History button in Edit → History
- **Clinical Report Management**: Complete CRUD system with print/PDF support
  - **View Clinical Report**: `/clinical-reports/:id/view` with Edit and Print/PDF buttons
  - **Print/PDF Implementation**: Simple HTML rendering (no TipTap) for proper pagination
    - Uses `dangerouslySetInnerHTML` for direct HTML rendering
    - Custom `@media print` CSS with A4 page setup and 2cm margins
    - Automatic pagination across multiple pages
    - Page numbers at bottom center
    - Hides URL, sidebar, and header in print view
- **Session Management**: Audio session tracking with transcription integration
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
│   ├── home/          # Home/Dashboard functionality
│   │   └── Home.tsx
│   ├── patients/      # Patient management
│   │   ├── Patients.tsx           # Patient listing page
│   │   ├── CreatePatient.tsx      # Patient creation
│   │   ├── EditPatient.tsx        # Patient editing (with View History button)
│   │   └── PatientHistory.tsx     # Patient history with tabs and timeline
│   ├── clinical-reports/  # Clinical report management
│   │   ├── ClinicalReports.tsx    # Report listing page
│   │   ├── EditClinicalReport.tsx # Report editing
│   │   └── ViewClinicalReport.tsx # Report viewing with Print/PDF
│   ├── session/       # Session management and transcription
│   ├── quotes/        # Quote management system
│   └── templates/     # Template management with TipTap editor
│       ├── Templates.tsx    # Main listing page
│       ├── CreateTemplate.tsx  # Template creation
│       └── EditTemplate.tsx    # Template editing
├── components/        # Reusable TQ components
│   ├── home/          # Home page components
│   │   ├── QuickActionCard.tsx    # Action card for Quick Actions
│   │   ├── QuoteCard.tsx          # Quote card for Latest Quotes
│   │   ├── SessionCard.tsx        # Session card for Sessions This Week
│   │   ├── ReportCard.tsx         # Report card for Latest Reports
│   │   ├── RecentPatientRow.tsx   # Patient row for Recently Added
│   │   ├── ActivityFeed.tsx       # Activity feed component
│   │   └── QuickSearchBar.tsx     # Global search bar for header
│   └── patients/      # Patient-specific components
│       ├── PatientRow.tsx         # Patient table row (with History button)
│       └── history/               # Patient history components
│           ├── HistoryRow.tsx     # Generic history row for tabs
│           └── TimelineItem.tsx   # Timeline item with vertical spine
├── shared/            # Shared TQ components/services
│   ├── components/    # Layout, Sidebar, Header (copied from Hub)
│   ├── store/         # Zustand stores (auth, ui)
│   └── types/         # TypeScript interfaces
├── services/          # API service layer
│   ├── templates.ts        # Template API service with TQ API integration
│   ├── patients.ts         # Patient API service
│   ├── sessions.ts         # Session API service
│   ├── quotes.ts           # Quote API service
│   └── clinicalReports.ts  # Clinical reports API service
├── lib/              # Utilities (SSO consumption)
└── App.tsx           # TQ application root
```

**Key TQ Implementation Details:**
- **Shared UI**: Identical Layout, Sidebar, Header components as Hub
- **Simplified Navigation**: Menu includes Home, Patients, Sessions, Quotes, Clinical Reports, Templates
- **SSO Integration**: Automatic login via URL parameters from Hub
- **Features Structure**: Follows enterprise `/features` pattern instead of `/pages`
- **Dedicated TQ API**: Separate API server on port 3004 with tenant-scoped routes
- **Complete Backend**: Full CRUD APIs for patients, sessions, quotes, clinical reports, templates, and AI agent integration
- **Medical Workflow**: End-to-end transcription → AI summary → quote generation workflow
- **Global Search**: Live search across all entities with keyboard navigation (Arrow keys, Enter, Escape)
- **UI Consistency**: All icons match sidebar (Users, FileText, Receipt, ClipboardList, FileType)
- **Default Sidebar State**: Internal-admin sidebar starts collapsed; TQ sidebar starts expanded

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
- **TQ API routing errors**: Ensure frontend services use full paths (`/api/tq/v1/templates` not `/templates`)
- **Template API errors**: Use `req.tenant?.schema` (not `req.tenantSchema`) for tenant context
- **API response format**: TQ APIs should return `{data: [...], meta: {...}}` format consistently
- **Route duplication**: Don't add route prefixes in individual route files if already mounted with prefix
- **Port conflicts (Windows)**: Use `netstat -ano | findstr :PORT` and `taskkill /PID X /F` to free ports

---

**📖 For complete technical documentation, see [CLAUDE2.md](./CLAUDE2.md)**