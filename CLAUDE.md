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
- **Server Services**: `src/server/services/` - Third-party integrations
  - `deepgram.js`: Audio transcription service integration
  - `supabaseStorage.js`: File storage management

## TQ Quote Management System

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
- **Feedback via HTTP**: NEVER use `publishFeedback()` in components - feedback is handled automatically via HTTP interceptors. Only add manual feedback if explicitly requested.

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