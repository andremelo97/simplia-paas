# Hub Application Audit Report

## Executive Summary

**Application:** Hub - Self-Service Application Portal
**Scope:** Platform-scoped self-service portal for end users
**Architecture:** Single-page application with minimal routing
**Primary Function:** Display and access user's authorized applications

### Key Metrics
- **UI Components:** 10 core components (including entitlements)
- **API Endpoints:** 2 primary endpoints (`/auth/me`, `/entitlements`)
- **Routes:** 2 main routes (`/`, `/login`)
- **Authentication:** JWT with tenant-scoped headers
- **External Dependencies:** Minimal (React Router, Zustand, Framer Motion)

### Architecture Overview
The Hub application serves as a self-service portal where authenticated users can view and access their authorized applications. It features a simplified architecture focusing on authentication and application discovery, without complex business logic or data management.

---

## API Integration Analysis

### Endpoint Mapping Table

| Route | Method | Frontend Service | UI Component | Purpose | Status |
|-------|--------|------------------|--------------|---------|--------|
| `/internal/api/v1/auth/me` | GET | `hubService.getUserProfile()` | `Home.tsx` | Get user profile and accessible applications | ✅ Active |
| `/internal/api/v1/auth/login` | POST | `hubService.login()` | `Login.tsx` | User authentication | ✅ Active |
| `/internal/api/v1/auth/refresh` | POST | `hubService.refreshToken()` | Auto-refresh | Token refresh | ✅ Active |
| `/internal/api/v1/auth/logout` | POST | `hubService.logout()` | `Header.tsx` | User logout | ✅ Active |
| `/internal/api/v1/entitlements` | GET | `hubService.getEntitlements()` | `TenantEntitlementsSection.tsx` | Get tenant licenses and user assignments (admin only) | ✅ Active |

### API Route Details

#### Primary Endpoint: `/internal/api/v1/auth/me`
- **File:** `src/server/api/internal/routes/auth.js:128`
- **Authentication:** Bearer token required
- **Tenant Context:** Required via `x-tenant-id` header
- **Query Logic:** Joins `user_application_access`, `applications`, and `tenant_applications`
- **Filters:** Active licenses, non-expired access, user permissions
- **Response:** User profile data plus array of accessible applications with metadata

**🔄 Recent Changes (September 2025):**
- **NEW FEATURE:** Added tenant entitlements section for admin users
- **Authentication Fix:** Resolved tenant context issue in `/auth/login` route
- **UX Improvement:** Removed "Tenant:" label from header - now shows only tenant name
- **Component Standardization:** Hub now uses common UI components (`StatusBadge`, `Badge`) for consistency
- **Entitlements API:** New `/internal/api/v1/entitlements` endpoint for read-only license management
- **Admin Dashboard:** Admin users can now view tenant licenses and user assignments
- **Loading Experience:** Simplified global loading state with "Loading..." message
- Consolidated `/me/apps` functionality into `/auth/me` endpoint
- Removed `/me/apps` route and `me.js` file to simplify authentication flow
- `/auth/me` now returns both user profile and accessible apps in a single call
- `/auth/refresh` route is now fully functional and documented

**🐛 Bug Fixes:**
- Fixed authentication failure caused by incorrect tenant context access (`req.tenantId` → `req.tenant.id`)
- Hub login now properly resolves tenant context and authenticates users

```sql
-- Core query for user applications
SELECT a.id, a.slug, a.name,
       uaa.role_in_app AS "roleInApp",
       uaa.expires_at AS "expiresAt",
       ta.status AS "licenseStatus"
  FROM public.user_application_access uaa
  JOIN public.applications a ON a.id = uaa.application_id_fk
  JOIN public.tenant_applications ta ON ta.application_id_fk = uaa.application_id_fk
 WHERE uaa.tenant_id_fk = $1 AND uaa.user_id_fk = $2
   AND uaa.active = true AND ta.active = true
   AND (uaa.expires_at IS NULL OR uaa.expires_at > NOW())
```

#### Entitlements Endpoint: `/internal/api/v1/entitlements`
- **File:** `src/server/api/internal/routes/entitlements.js`
- **Authentication:** Bearer token required
- **Tenant Context:** Required via `x-tenant-id` header
- **Access Control:** Admin users only
- **Query Logic:** Joins `tenant_applications`, `applications`, and `user_application_access`
- **Response:** Array of tenant licenses with assigned users and summary statistics

```sql
-- Core query for tenant entitlements
SELECT ta.application_id_fk AS "applicationId",
       a.slug, a.name,
       ta.status, ta.activated_at AS "activatedAt",
       ta.seats_used AS "seatsUsed", ta.max_users AS "maxUsers"
  FROM public.tenant_applications ta
  INNER JOIN public.applications a ON a.id = ta.application_id_fk
 WHERE ta.tenant_id_fk = $1 AND ta.active = true
 ORDER BY a.name
```

---

## Frontend Architecture

### Component Structure

```
src/client/apps/hub/
├── main.tsx              # Application entry point
├── routes.tsx             # Route configuration
├── pages/
│   ├── Home.tsx          # Main dashboard
│   └── Login.tsx         # Authentication page
├── components/
│   ├── Layout.tsx        # App layout wrapper
│   ├── Header.tsx        # Navigation header
│   ├── Sidebar.tsx       # Navigation sidebar
│   ├── TenantEntitlementsSection.tsx    # Admin entitlements container
│   ├── EntitlementAppCard.tsx           # Individual license card
│   └── EntitlementsSummaryCard.tsx      # Summary table
├── services/
│   └── hub.ts            # API service layer
└── store/
    ├── auth.ts           # Authentication state
    └── ui.ts             # UI state management
```

### State Management

#### Authentication Store (`auth.ts`)
- **Library:** Zustand with persistence
- **Storage Key:** `hub-auth-storage`
- **State Shape:**
  ```typescript
  interface AuthState {
    isAuthenticated: boolean
    user: User | null
    token: string | null
    tenantId: number | null
    isLoading: boolean
    error: AppError | null
    isHydrated: boolean
  }
  ```

#### UI Store (`ui.ts`)
- **Library:** Zustand (simple state)
- **Purpose:** Sidebar visibility control
- **State Shape:**
  ```typescript
  interface UIState {
    sidebarOpen: boolean
    toggleSidebar: () => void
    setSidebarOpen: (open: boolean) => void
  }
  ```

### User Interface Components

#### 1. Login Page (`pages/Login.tsx`)
- **Purpose:** User authentication interface
- **Features:**
  - Two-step authentication (tenant lookup + login)
  - Form validation (client + server)
  - Password visibility toggle
  - Error handling with banner/field-level errors
  - Automatic redirect after authentication
- **Key Functions:**
  - `validateForm()` - Client-side validation
  - `handleSubmit()` - Authentication flow
  - Integration with `useAuthStore` for state management

#### 2. Home Dashboard (`pages/Home.tsx`)
- **Purpose:** Main application portal interface
- **Features:**
  - Grid layout for application cards
  - Simple global loading state with "Loading..." message
  - Empty state handling
  - Application launching via `window.open()`
  - Refresh capability
  - Admin entitlements section (role-based visibility)
- **Key Functions:**
  - `refreshApps()` - Fetch user's applications via auth store
  - `handleAppClick()` - Launch application in new window
  - `getAppIcon()` - Application icon rendering

#### 3. Tenant Entitlements Section (`components/TenantEntitlementsSection.tsx`)
- **Purpose:** Admin-only view of tenant licenses and user assignments
- **Access Control:** Only visible for users with `role === 'admin'`
- **Features:**
  - Section A: Individual application license cards with user details
  - Section B: Summary table with seat usage statistics
  - Independent loading state management
  - Error handling with user feedback
- **Key Functions:**
  - `loadEntitlements()` - Fetch tenant entitlements via hub service
  - Automatic loading on component mount
  - Error handling with feedback system integration

#### 4. Entitlement App Card (`components/EntitlementAppCard.tsx`)
- **Purpose:** Individual license card with user assignment details
- **Features:**
  - Show/Hide Users toggle functionality
  - User table with name, email, role, and granted date
  - License information (activated date, status badge)
  - Seat count display from database
  - Role-based badge variants (admin=error, manager=warning, operations=info)
- **Key Functions:**
  - `getUserDisplayName()` - Display name logic (firstName lastName fallback to email prefix)
  - `formatDate()` - Brazilian date formatting
  - Toggle state management for user visibility

#### 5. Entitlements Summary Card (`components/EntitlementsSummaryCard.tsx`)
- **Purpose:** Summary table of all tenant licenses
- **Features:**
  - Tabular view of all applications
  - Status badges with appropriate colors
  - Seat usage display (used/total from database)
  - Activation and expiry date columns
- **Key Functions:**
  - `getStatusColor()` - Badge variant mapping for license status
  - `getTotalSeats()` - Format seat display with infinity symbol for unlimited
  - `formatDate()` - Brazilian date formatting

#### 6. Layout Components
- **Layout.tsx:** Main app wrapper with header, sidebar, and outlet
- **Header.tsx:** Uses common header component with Hub-specific config
- **Sidebar.tsx:** Minimal navigation (only "Home" link)

### Route Protection

#### Protected Routes
- Uses `ProtectedRoute` wrapper component
- Checks `isAuthenticated` and `isHydrated` state
- Redirects to `/login` if unauthenticated
- Shows loading spinner during state hydration

#### Public Routes
- Uses `PublicRoute` wrapper component
- Redirects authenticated users to `/` (home)
- Only allows access to `/login` for unauthenticated users

---

## Authentication Flow

### Login Process (Two-Step Authentication)

```mermaid
sequenceDiagram
    participant U as User
    participant H as Hub App
    participant API as Backend API
    participant DB as Database

    U->>H: Enter email/password
    H->>API: POST /platform-auth/tenant-lookup
    API->>DB: Query tenants by email domain
    DB-->>API: Return tenant info
    API-->>H: Return tenant data

    H->>API: POST /auth/login (with x-tenant-id)
    API->>DB: Validate credentials in tenant context
    DB-->>API: Return user + JWT token
    API-->>H: Return authenticated session

    H->>H: Save session to localStorage
    H->>H: Update auth store state
    H->>U: Redirect to home dashboard

    Note over H,U: Admin Entitlements Flow (Admin Users Only)
    H->>API: GET /entitlements (if user.role === 'admin')
    API->>DB: Query tenant_applications with user assignments
    DB-->>API: Return licenses + assigned users
    API-->>H: Return entitlements data
    H->>H: Render entitlements section below apps
```

### Session Management
- **Storage:** Browser localStorage via Zustand persistence
- **Key:** `hub-auth-storage`
- **Data:** User profile, JWT token, tenant ID
- **Restoration:** Automatic on app initialization
- **Cleanup:** On logout or session expiry

---

## User Experience Flow

### Application Discovery Flow

```mermaid
flowchart TD
    A[User logs in] --> B[Navigate to Home]
    B --> C[Load user applications]
    C --> D{Applications available?}

    D -->|Yes| E[Display application grid]
    D -->|No| F[Show empty state]

    E --> G[User clicks application]
    G --> H{Application URL configured?}

    H -->|Yes| I[Open in new window]
    H -->|No| J[Show info message]

    F --> K[Show contact admin message]
    K --> L[Provide refresh button]
    L --> C

    Note over A,L: Admin Entitlements Flow (Parallel)
    A --> M{User is admin?}
    M -->|Yes| N[Load tenant entitlements]
    M -->|No| O[Skip entitlements]

    N --> P[Display entitlements section]
    P --> Q[Show license cards with user toggle]
    P --> R[Show summary table]

    Q --> S[User clicks Show/Hide Users]
    S --> T[Toggle user table visibility]

    O --> E
```

### Key User Interactions

1. **Login Process**
   - Enter email/password
   - System looks up tenant automatically
   - Authentication with tenant context
   - Automatic redirect to dashboard

2. **Application Access**
   - View grid of available applications
   - Click to launch in new window/tab
   - Fallback for unconfigured URLs

3. **Admin License Management** (Admin Users Only)
   - View tenant application licenses and status
   - Toggle visibility of assigned users per application
   - View user details including name, email, role, and grant date
   - Review seat usage and license limits in summary table

4. **Error States**
   - Network errors with retry options
   - Empty states with clear messaging
   - Authentication errors with field-level feedback

---

## Database Schema Integration

### Core Tables Used

#### user_application_access
```sql
CREATE TABLE user_application_access (
  id SERIAL PRIMARY KEY,
  user_id_fk INTEGER NOT NULL REFERENCES users(id),
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id),
  application_id_fk INTEGER NOT NULL REFERENCES applications(id),
  role_in_app VARCHAR(50),
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### applications
```sql
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  icon_url VARCHAR(500),
  active BOOLEAN DEFAULT true
);
```

#### tenant_applications
```sql
CREATE TABLE tenant_applications (
  id SERIAL PRIMARY KEY,
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id),
  application_id_fk INTEGER NOT NULL REFERENCES applications(id),
  status VARCHAR(50) DEFAULT 'active',
  active BOOLEAN DEFAULT true
);
```

---

## Security Implementation

### Authentication Security
- **JWT Tokens:** Bearer token authentication
- **Tenant Isolation:** All requests include `x-tenant-id` header
- **Session Storage:** Encrypted localStorage persistence
- **Route Protection:** Client-side route guards

### Data Access Controls
- **User Scope:** Only returns applications user has access to
- **Tenant Scope:** Filters by user's tenant context
- **License Validation:** Checks active licenses and expiry dates
- **Role-Based Access:** Includes user's role within each application

### Security Headers
- **CORS:** Configured for specific origins
- **Content Security Policy:** Implemented via common security middleware
- **XSS Protection:** Input sanitization and output encoding

---

## Performance Considerations

### Frontend Performance
- **Code Splitting:** Single-page app with minimal bundle size
- **State Management:** Efficient Zustand stores with selective re-renders
- **Animation:** Framer Motion for smooth UI transitions
- **Loading States:** Skeleton screens for perceived performance

### API Performance
- **Query Optimization:** Single query with JOINs for app listing
- **Caching Strategy:** Client-side state caching via Zustand
- **Error Handling:** Graceful degradation with retry mechanisms

### Bundle Analysis
- **Dependencies:** Minimal external dependencies
- **Tree Shaking:** Optimized builds via Vite
- **Asset Optimization:** Icon caching and lazy loading

---

## Error Handling

### Frontend Error Patterns
- **Network Errors:** Retry mechanisms with user feedback
- **Authentication Errors:** Clear field-level and banner messages
- **Validation Errors:** Real-time client-side validation
- **API Errors:** Centralized error handling via feedback system

### Backend Error Responses
- **Standard Format:** Consistent error response structure
- **Status Codes:** Appropriate HTTP status codes
- **Error Codes:** Machine-readable error identifiers
- **User Messages:** Human-readable error descriptions

---

## Development Guidelines

### Code Standards
- **TypeScript:** Strict typing for all frontend code
- **ESLint:** Consistent code formatting and linting
- **Component Structure:** Functional components with hooks
- **State Management:** Zustand for lightweight state management

### Testing Strategy
- **Unit Tests:** Component and service layer testing
- **Integration Tests:** API endpoint testing
- **E2E Tests:** Critical user flow testing
- **Performance Tests:** Load testing for API endpoints

### Deployment Considerations
- **Environment Variables:** Configuration via environment files
- **Build Process:** Vite build optimization
- **Static Assets:** CDN deployment for optimal performance
- **Health Checks:** Application health monitoring

---

## Future Enhancement Opportunities

### User Experience
- **Application Categories:** Group applications by category/type
- **Search Functionality:** Search and filter applications
- **Recent Applications:** Track and display recently accessed apps
- **Application Details:** Expanded application information and screenshots

### Administrative Features
- ✅ **License Management:** Read-only view of tenant licenses and user assignments (implemented)
- **Usage Analytics:** Track application usage patterns
- **Access Logs:** Audit trail for application access
- **Bulk Operations:** Mass application management
- **Custom Dashboards:** Personalized user dashboards

### Technical Improvements
- **Progressive Web App:** PWA capabilities for mobile use
- **Offline Support:** Cached application data for offline access
- **Real-time Updates:** WebSocket integration for live updates
- **API Versioning:** Structured API evolution strategy

---

*This audit document provides a comprehensive overview of the Hub application architecture, implementation, and operational characteristics as of the current system state.*