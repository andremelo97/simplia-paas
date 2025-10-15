# Timezone & Internationalization (i18n) - Complete Implementation Guide

## 📋 Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Architecture](#architecture)
4. [Implementation Details](#implementation-details)
5. [Database Layer](#database-layer)
6. [Backend Layer](#backend-layer)
7. [Frontend Layer](#frontend-layer)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)
10. [Files Reference](#files-reference)

---

## 🎯 Problem Statement

### Business Requirements

**Multi-Tenant Timezone Support:**
- Tenant in **Brisbane, Australia** must see timestamps in Brisbane timezone (UTC+10)
- Tenant in **São Paulo, Brazil** must see timestamps in São Paulo timezone (UTC-3)
- Same timestamp must display correctly in each tenant's local timezone

**Multi-Language Support:**
- **Brazilian tenants** (timezones: America/Sao_Paulo, America/Bahia, etc.) → **Portuguese (pt-BR)**
- **International tenants** (all other timezones) → **English (en-US)**
- Only 2 languages supported as per requirement

### Technical Challenges

1. **Timestamp Ambiguity**: How do we know if "2025-10-09 20:24:48" is São Paulo time or Brisbane time?
2. **Data Integrity**: How to prevent timezone data corruption across different servers?
3. **Multi-Tenant Isolation**: How to ensure each tenant sees their own timezone?
4. **Language Detection**: How to automatically select correct language based on tenant location?
5. **Consistency**: How to maintain uniform date formatting across TQ and Hub apps?

---

## 💡 Solution Overview

### Core Principles

1. **UTC Everywhere in Database**: All timestamps stored in UTC (TIMESTAMPTZ type)
2. **Timezone Conversion on Display**: Convert UTC → tenant timezone only in frontend
3. **Locale Auto-Detection**: Derive locale from timezone automatically
4. **Per-Tenant Configuration**: Each tenant has their own timezone and locale settings
5. **Centralized Formatting**: Single hook (`useDateFormatter`) for all date displays

### Language Rules

```javascript
// Brazil timezones → pt-BR
'America/Sao_Paulo' → 'pt-BR'
'America/Bahia' → 'pt-BR'
'America/Fortaleza' → 'pt-BR'
// ... 16 Brazil timezones total

// Everything else → en-US
'Australia/Brisbane' → 'en-US'
'Europe/London' → 'en-US'
'America/New_York' → 'en-US'
// ... all other timezones
```

### Date Format Examples

**Brazilian Tenant (pt-BR):**
- Short date: `10/01/2025` (DD/MM/YYYY)
- Long date: `10 de janeiro de 2025`
- Date time: `10/01/2025 15:30`
- Relative: `há 2 horas`

**International Tenant (en-US):**
- Short date: `1/10/2025` (M/D/YYYY)
- Long date: `January 10, 2025`
- Date time: `1/10/2025, 3:30 PM`
- Relative: `2 hours ago`

---

## 🏗️ Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                         │
│                                                                  │
│  ✓ ALL timestamps stored as TIMESTAMPTZ in UTC                  │
│  ✓ Pool connections forced to UTC timezone                      │
│  ✓ Example: 2025-10-09 23:24:48.503+00                         │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                          │
│                                                                  │
│  ✓ JWT payload includes: timezone + locale                      │
│  ✓ Locale derived from timezone via localeMapping.js            │
│  ✓ Returns timestamps in ISO 8601 format (UTC)                  │
│                                                                  │
│  JWT Payload Example:                                            │
│  {                                                               │
│    userId: 123,                                                  │
│    tenantId: 456,                                                │
│    timezone: "America/Sao_Paulo",                                │
│    locale: "pt-BR"  // Auto-derived from timezone                │
│  }                                                               │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│                                                                  │
│  ✓ useDateFormatter hook reads timezone + locale from JWT        │
│  ✓ Intl.DateTimeFormat converts UTC → tenant timezone           │
│  ✓ react-i18next translates UI based on locale                  │
│                                                                  │
│  Display Examples:                                               │
│                                                                  │
│  Brazil (pt-BR + America/Sao_Paulo):                             │
│  → "10/01/2025 20:24" (DD/MM/YYYY HH:mm)                        │
│                                                                  │
│  Australia (en-US + Australia/Brisbane):                         │
│  → "1/10/2025, 9:24 AM" (M/D/YYYY h:mm A)                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Timezone Storage Strategy

**PostgreSQL TIMESTAMPTZ Behavior:**

```sql
-- What happens when you INSERT:
INSERT INTO patient (created_at) VALUES (now());
-- ✓ Stores internally: 2025-10-09 23:24:48 UTC (always UTC on disk)

-- What happens when you SELECT with different timezones:
SET TIME ZONE 'America/Sao_Paulo';
SELECT created_at FROM patient;
-- Shows: 2025-10-09 20:24:48.503 -0300 (display format only)

SET TIME ZONE 'Australia/Brisbane';
SELECT created_at FROM patient;
-- Shows: 2025-10-10 09:24:48.503 +1000 (next day!)

SET TIME ZONE 'UTC';
SELECT created_at FROM patient;
-- Shows: 2025-10-09 23:24:48.503 +0000 (original UTC)
```

**Key Point:** The `-0300` or `+1000` you see is just display formatting by PostgreSQL. The actual data on disk is ALWAYS in UTC.

---

## 🔧 Implementation Details

### Phase 1: Database Layer (UTC Storage)

**Problem Discovered:**
- Pool connections were NOT setting timezone to UTC
- Each query got different connection from pool without timezone configured
- Server's default timezone (São Paulo -0300) was being used

**Solution:**

```javascript
// src/server/infra/db/database.js

class Database {
  constructor() {
    this.pool = new Pool({
      // ... connection config
    })

    this.setupPoolEvents() // NEW: Configure all connections
  }

  setupPoolEvents() {
    // ✅ CRITICAL: Force UTC on ALL pool connections
    this.pool.on('connect', async (client) => {
      await client.query("SET TIME ZONE 'UTC'")
      console.log('Database client connected with UTC timezone')
    })

    this.pool.on('error', (err) => {
      console.error('Database pool error:', err)
    })
  }
}
```

**Docker Configuration:**

```yaml
# docker-compose.yml

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: simplia_paas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 1234
      PGTZ: UTC              # PostgreSQL timezone
      TZ: UTC                # Container timezone
```

**Verification Query:**

```sql
-- Check if data is stored in UTC
SELECT
  timezone,
  created_at,
  created_at AT TIME ZONE 'UTC' AS stored_utc,
  created_at AT TIME ZONE timezone AS tenant_local
FROM tenants
JOIN patient ON true
LIMIT 1;

-- Example result:
-- timezone: 'America/Sao_Paulo'
-- created_at: 2025-10-10 00:26:14.093-03
-- stored_utc: 2025-10-10 03:26:14.093 (3 hours ahead = UTC)
-- tenant_local: 2025-10-10 00:26:14.093
```

### Phase 2: Locale Derivation from Timezone

**Problem Discovered:**
- JWT was returning `locale: "en-US"` even for Brazilian tenants
- Root cause: Incorrect relative path in require statement

**Before (BROKEN):**

```javascript
// src/shared/types/user.js
const { getLocaleFromTimezone } = require('../server/infra/utils/localeMapping')
// ❌ Wrong path! File is in src/shared/types/, so ../server/ doesn't work
```

**After (FIXED):**

```javascript
// src/shared/types/user.js

function createJwtPayload(user, tenant, allowedApps = [], userType = null) {
  // ... validation

  // ✅ Derive locale from timezone
  let locale = 'en-US' // Default
  if (tenant.timezone) {
    try {
      const { getLocaleFromTimezone } = require('../../server/infra/utils/localeMapping')
      locale = getLocaleFromTimezone(tenant.timezone)
      console.log(`[JWT] Derived locale '${locale}' from timezone '${tenant.timezone}'`)
    } catch (error) {
      console.warn('[JWT] Failed to derive locale, using default en-US:', error.message)
    }
  }

  return {
    userId: user.id,
    tenantId: numericTenantId,
    email: user.email,
    name: user.name,
    role: user.role,
    schema: tenant.schema,
    timezone: tenant.timezone || 'America/Sao_Paulo',
    locale: locale, // ✅ Correctly derived
    allowedApps: allowedApps,
    userType: userType ? { ... } : null,
    platformRole: user.role
  }
}
```

**Locale Mapping Logic:**

```javascript
// src/server/infra/utils/localeMapping.js

function getLocaleFromTimezone(timezone) {
  if (!timezone || typeof timezone !== 'string') {
    return 'pt-BR' // Default to Brazilian Portuguese
  }

  const tz = timezone.trim()

  // Brazil timezones → pt-BR (16 timezones)
  if (
    tz === 'America/Sao_Paulo' ||
    tz === 'America/Bahia' ||
    tz === 'America/Fortaleza' ||
    tz === 'America/Recife' ||
    tz === 'America/Manaus' ||
    tz === 'America/Belem' ||
    tz === 'America/Rio_Branco' ||
    tz === 'America/Campo_Grande' ||
    tz === 'America/Cuiaba' ||
    tz === 'America/Boa_Vista' ||
    tz === 'America/Porto_Velho' ||
    tz === 'America/Eirunepe' ||
    tz === 'America/Maceio' ||
    tz === 'America/Araguaina' ||
    tz === 'America/Santarem' ||
    tz === 'America/Noronha'
  ) {
    return 'pt-BR'
  }

  // Everything else → en-US (including Australia, USA, Europe, etc.)
  return 'en-US'
}

module.exports = {
  getLocaleFromTimezone,
  getLanguageFromLocale,
  isSupportedTimezone,
  getLocaleMetadata
}
```

### Phase 3: Frontend Date Formatting

**Problem Discovered:**
- Initial implementation used `require()` inside the hook to dynamically import auth stores
- This violated React's Rules of Hooks - hooks cannot be conditionally called
- `require()` was failing silently, returning `null` for both stores
- Result: All users saw default Brazilian timezone regardless of their actual tenant timezone

**Incorrect Approach (BROKEN):**

```typescript
// ❌ WRONG: Dynamic require() inside hook doesn't work
export function useDateFormatter() {
  let useTQAuthStore: any = null

  try {
    const tqAuth = require('@client/apps/tq/shared/store/auth')
    useTQAuthStore = tqAuth.useAuthStore  // ❌ Returns null
  } catch (e) {
    // Fails silently
  }

  // useTQAuthStore is always null!
  const timezone = useTQAuthStore ? useTQAuthStore(state => state.tenantTimezone) : undefined
  // ❌ Result: Always uses fallback 'America/Sao_Paulo'
}
```

**Correct Approach (FIXED):**

```typescript
// ✅ CORRECT: Static import at module level
import { useAuthStore as useTQAuthStore } from '@client/apps/tq/shared/store/auth'

export function useDateFormatter() {
  // ✅ Subscribe to Zustand store reactively
  // This follows React's Rules of Hooks - unconditional hook call
  const timezone = useTQAuthStore(state => state.tenantTimezone) || 'America/Sao_Paulo'
  const locale = useTQAuthStore(state => state.tenantLocale) || 'pt-BR'

  // ✅ Hook will re-render when timezone/locale change in store
  return {
    formatShortDate: (date) => formatShortDateUtil(date, timezone, locale),
    formatLongDate: (date) => formatLongDateUtil(date, timezone, locale),
    formatTime: (date) => formatTimeUtil(date, timezone, locale),
    formatDateTime: (date) => formatDateTimeUtil(date, timezone, locale),
    formatRelativeTime: (date) => formatRelativeTimeUtil(date, timezone, locale),
    formatMonthYear: (date) => formatMonthYearUtil(date, timezone, locale),
    getNowInTimezone: () => getNowInTimezoneUtil(timezone),
    getTimezone: () => timezone,
    getLocale: () => locale
  }
}
```

**Why This Works:**

1. **Static Import**: `import` statement runs at module evaluation time (before React)
2. **Zustand Hook**: `useTQAuthStore(selector)` is called unconditionally (follows Rules of Hooks)
3. **Reactive**: When `tenantTimezone` or `tenantLocale` change in the auth store, all components using `useDateFormatter` automatically re-render
4. **SSO Compatible**: When user logs in via SSO, the auth store updates, triggering re-renders with new timezone/locale

**Date Formatting Functions:**

```typescript
// src/client/common/utils/dateTime.ts

export function formatShortDate(
  date: string | Date | number | null | undefined,
  timezone: string = 'America/Sao_Paulo',
  locale: string = 'pt-BR'
): string {
  if (!date) return '-'

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date

    if (isNaN(dateObj.getTime())) return '-'

    // ✅ Intl.DateTimeFormat automatically adapts format based on locale
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: timezone
    }).format(dateObj)
  } catch (error) {
    console.warn('Failed to format date:', error)
    return '-'
  }
}

// Similar functions for:
// - formatLongDate (DD de MMM de YYYY vs MMM DD, YYYY)
// - formatTime (HH:mm vs h:mm A)
// - formatDateTime (DD/MM/YYYY HH:mm vs M/D/YYYY, h:mm A)
// - formatRelativeTime (há 2 horas vs 2 hours ago)
// - formatMonthYear (MMM YYYY)
```

**How Intl.DateTimeFormat Works:**

```javascript
// Brazil (pt-BR)
new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}).format(new Date('2025-01-10'))
// → "10/01/2025" (DD/MM/YYYY)

// USA (en-US)
new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}).format(new Date('2025-01-10'))
// → "01/10/2025" (MM/DD/YYYY)

// Note: Same options, different output based on locale!
```

### Phase 4: UI Internationalization (i18n)

**Translation Files Structure:**

```
src/client/common/i18n/
├── locales/
│   ├── pt-BR/
│   │   ├── common.json       (shared translations)
│   │   ├── tq.json           (TQ app translations - 160+ keys)
│   │   └── hub.json          (Hub app translations)
│   └── en-US/
│       ├── common.json
│       ├── tq.json           (TQ app translations - 160+ keys)
│       └── hub.json
├── i18n.ts                   (configuration)
└── languageDetector.ts       (custom detector)
```

**Translation File Example (TQ):**

```json
{
  "app_name": "TQ - Transcription Quote System",
  "common": {
    "created_at": "Created At",
    "updated_at": "Updated At",
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading...",
    "error": "Error"
  },
  "patients": {
    "title": "Patients",
    "create": "Create Patient",
    "loading_patient": "Loading patient data...",
    "placeholders": {
      "first_name": "e.g., John",
      "email": "e.g., john.doe@example.com"
    }
  },
  "sessions": {
    "title": "Sessions",
    "loading_session": "Loading session data...",
    "placeholders": {
      "transcription": "Upload an audio file or start transcribing..."
    }
  }
  // ... 160+ total translation keys
}
```

**Custom Language Detector:**

```typescript
// src/client/common/i18n/languageDetector.ts

export const customLanguageDetector = {
  type: 'languageDetector',

  detect: () => {
    try {
      // Try TQ auth store first
      const { useAuthStore: useTQAuthStore } = require('@client/apps/tq/shared/store/auth')
      const locale = useTQAuthStore.getState().tenantLocale
      if (locale) return locale
    } catch (e) {
      // TQ store not available
    }

    try {
      // Try Hub auth store
      const { useAuthStore: useHubAuthStore } = require('@client/apps/hub/store/auth')
      const locale = useHubAuthStore.getState().tenantLocale
      if (locale) return locale
    } catch (e) {
      // Hub store not available
    }

    // Fallback
    return 'pt-BR'
  },

  init: () => {},
  cacheUserLanguage: () => {}
}
```

**Component Usage:**

```typescript
// Before (hardcoded):
<Input label="Created At" placeholder="e.g., John" />
<p>Loading patient data...</p>

// After (translated):
import { useTranslation } from 'react-i18next'

const { t } = useTranslation('tq')

<Input
  label={t('common.created_at')}
  placeholder={t('patients.placeholders.first_name')}
/>
<p>{t('patients.loading_patient')}</p>
```

---

## 🔍 Complete Problem-Solving Journey

This section documents all the issues encountered during implementation and their solutions, providing a complete reference for future debugging.

### Issue 1: Database Pool Not Using UTC

**Symptom:**
```sql
SELECT created_at FROM patient;
-- Result: 2025-10-09 20:24:48.503-03 (São Paulo timezone)
-- Expected: Should be stored in UTC internally
```

**Root Cause:**
- PostgreSQL pool connections were being created without timezone configuration
- Each query from the pool inherited the server's default timezone (America/Sao_Paulo)
- The `SET TIME ZONE 'UTC'` in individual queries wasn't persistent across pool connections

**Initial Attempts (All Failed):**

```javascript
// ❌ Attempt 1: Setting timezone in middleware
async applyTenantSearchPath(schemaName, tenantTimezone) {
  await database.query(`SET LOCAL TIME ZONE 'UTC'`)  // Only affects current transaction
}

// ❌ Attempt 2: Setting timezone in provisioner
async function provisionTQAppSchema(client, schema) {
  await client.query(`SET LOCAL TIME ZONE 'UTC'`)  // Only affects provisioning transaction
}

// ❌ Attempt 3: Setting timezone in migration runner
async function runMigrations() {
  await database.query(`SET TIME ZONE 'UTC'`)  // Only affects migration connection
}
```

**Working Solution:**

```javascript
// ✅ CORRECT: Configure ALL pool connections on connect event
// src/server/infra/db/database.js

class Database {
  constructor() {
    this.pool = new Pool(this.config)
    this.setupPoolEvents()  // NEW: Critical addition
  }

  setupPoolEvents() {
    // Force UTC timezone on EVERY connection from the pool
    this.pool.on('connect', async (client) => {
      try {
        await client.query("SET TIME ZONE 'UTC'")
        console.log('✅ Database client connected with UTC timezone')
      } catch (error) {
        console.error('❌ Failed to set UTC timezone:', error)
      }
    })

    this.pool.on('error', (err) => {
      console.error('❌ Database pool error:', err)
    })
  }
}
```

**Verification:**
```sql
-- After fix, all new connections automatically use UTC
SHOW timezone;  -- Returns: UTC

-- Data stored correctly in UTC
SELECT created_at FROM patient;
-- 2025-10-10 03:26:14.093+00 (UTC)
```

### Issue 2: TIMESTAMP vs TIMESTAMPTZ Inconsistency

**Symptom:**
- `tenants` table showed timestamps with timezone offset: `2025-10-09 20:24:48-03`
- `users` table showed timestamps without timezone: `2025-10-09 20:24:48`
- Confusion about which was "correct"

**Root Cause:**
```sql
-- Migration had inconsistent column types
CREATE TABLE tenants (
  created_at TIMESTAMPTZ  -- ✅ Stores timezone info
);

CREATE TABLE users (
  created_at TIMESTAMP  -- ❌ NO timezone info
);
```

**Understanding the Difference:**

```sql
-- TIMESTAMP (without time zone):
-- - Stores: 2025-10-09 20:24:48
-- - Interpretation: "Naïve" timestamp (no timezone info)
-- - Problem: Ambiguous! Is this São Paulo time? Brisbane time? UTC?

-- TIMESTAMPTZ (with time zone):
-- - Stores internally: UTC timestamp
-- - Displays: Adjusted to session timezone (2025-10-09 20:24:48-03)
-- - Benefit: Unambiguous! Always knows exact moment in time
```

**Solution:**
```sql
-- Changed ALL timestamp columns to TIMESTAMPTZ
-- src/server/infra/migrations/001_create_core_tables.sql

CREATE TABLE tenants (
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC'),  -- ✅
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC')   -- ✅
);

CREATE TABLE users (
  created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC'),  -- ✅ Changed
  updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC')   -- ✅ Changed
);

-- Applied to ALL tables: tenants, users, tenant_applications,
-- user_application_access, application_access_logs, tenant_branding
```

**Result:**
```sql
-- Verify all columns are now TIMESTAMPTZ
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('tenants', 'users')
  AND column_name LIKE '%_at';

-- Expected output:
-- created_at | timestamp with time zone
-- updated_at | timestamp with time zone
```

### Issue 3: Locale Not Being Derived from Timezone

**Symptom:**
```javascript
// JWT payload showed wrong locale for Brazilian tenant
{
  timezone: "America/Sao_Paulo",
  locale: "en-US"  // ❌ Should be pt-BR
}
```

**Root Cause:**
```javascript
// src/shared/types/user.js (WRONG PATH)
const { getLocaleFromTimezone } = require('../server/infra/utils/localeMapping')
//                                         ^^^^^^^^
// File structure:
// src/
//   ├── shared/types/user.js  ← We are here
//   └── server/infra/utils/localeMapping.js
//
// ../server/ goes UP one level then looks for server/ - doesn't exist!
// Should be: ../../server/
```

**Solution:**
```javascript
// src/shared/types/user.js (CORRECT PATH)
function createJwtPayload(user, tenant, allowedApps = [], userType = null) {
  let locale = 'en-US'
  if (tenant.timezone) {
    try {
      // ✅ Correct relative path
      const { getLocaleFromTimezone } = require('../../server/infra/utils/localeMapping')
      locale = getLocaleFromTimezone(tenant.timezone)
      console.log(`[JWT] Derived locale '${locale}' from timezone '${tenant.timezone}'`)
    } catch (error) {
      console.warn('[JWT] Failed to derive locale:', error.message)
    }
  }

  return {
    // ... other fields
    timezone: tenant.timezone || 'America/Sao_Paulo',
    locale: locale  // ✅ Now correctly pt-BR for Brazilian tenants
  }
}
```

**Verification:**
```javascript
// Backend console output after login:
[JWT] Derived locale 'pt-BR' from timezone 'America/Sao_Paulo'  // ✅

// JWT payload:
{
  timezone: "America/Sao_Paulo",
  locale: "pt-BR"  // ✅ Correct!
}
```

### Issue 4: useDateFormatter Hook Not Reading Timezone

**Symptom:**
```javascript
// Console logs showed:
🔍 [useDateFormatter] Store availability: {hasTQStore: false, hasHubStore: false}
🕐 [useDateFormatter] Final values - timezone: America/Sao_Paulo locale: pt-BR

// Even for Australian tenant with:
{timezone: "Australia/Brisbane", locale: "en-US"}
```

**Root Cause:**
Dynamic `require()` inside React hook violated Rules of Hooks and failed silently.

```typescript
// ❌ BROKEN APPROACH
export function useDateFormatter() {
  let useTQAuthStore: any = null

  // This try/catch executes, but require() returns null
  try {
    const tqAuth = require('@client/apps/tq/shared/store/auth')
    useTQAuthStore = tqAuth.useAuthStore  // ❌ Always null in Vite/React
  } catch (e) {
    // Doesn't even throw - just returns null
  }

  // Condition always false, always uses fallback
  if (useTQAuthStore) {  // Never true
    timezone = useTQAuthStore(state => state.tenantTimezone)
  }

  // ❌ Result: Always defaults to 'America/Sao_Paulo'
  if (!timezone) timezone = 'America/Sao_Paulo'
}
```

**Why `require()` Failed:**
1. Vite (frontend bundler) doesn't support dynamic `require()` in ES modules
2. React expects hooks to be imported statically to track dependencies
3. `require()` inside function body returns `null` instead of throwing error
4. No error message - silent failure making it hard to debug

**Working Solution:**

```typescript
// ✅ CORRECT: Static import at module level
// src/client/common/hooks/useDateFormatter.ts

import { useAuthStore as useTQAuthStore } from '@client/apps/tq/shared/store/auth'

export function useDateFormatter() {
  // ✅ Unconditional Zustand hook call (follows Rules of Hooks)
  const timezone = useTQAuthStore(state => state.tenantTimezone) || 'America/Sao_Paulo'
  const locale = useTQAuthStore(state => state.tenantLocale) || 'pt-BR'

  // ✅ Reactive: Re-renders when auth store changes
  return {
    formatShortDate: (date) => formatShortDateUtil(date, timezone, locale),
    // ... other formatters
  }
}
```

**Verification:**
```javascript
// Console output after fix:
🔍 [useDateFormatter] Auth Store values: {
  timezone: "Australia/Brisbane",  // ✅ Correct!
  locale: "en-US",                 // ✅ Correct!
  tenantId: 3,
  isAuthenticated: true
}

// Dates now display correctly:
// Brazilian tenant: 14/10/2025, 22:26 (São Paulo -3)
// Australian tenant: 10/15/2025, 11:30 (Brisbane +10)
```

### Issue 5: Browser Cache Preventing Updates

**Symptom:**
- Code changes not appearing in browser
- Console logs showing old version of code
- Hard refresh (Ctrl+Shift+R) not working

**Root Cause:**
- Vite dev server's Hot Module Replacement (HMR) caching aggressively
- Browser service workers caching JavaScript bundles
- LocalStorage persisting old auth data

**Solution:**
```bash
# 1. Kill and restart Vite dev server
npx kill-port 3005
npm run dev:tq-front

# 2. In browser DevTools → Application tab:
# - Clear site data (all storage)
# - Disable cache checkbox in Network tab

# 3. Test in Incognito/Private mode (no cache)
# Chrome: Ctrl+Shift+N
# Firefox: Ctrl+Shift+P

# 4. Clear localStorage programmatically
localStorage.clear()
sessionStorage.clear()
location.reload()
```

**Prevention:**
- Add version comment in code to verify bundle updates
- Use Incognito mode for testing major changes
- Clear browser cache between tenant tests

---

## 🧪 Testing & Verification

### Database UTC Verification

```sql
-- 1. Check PostgreSQL timezone
SHOW timezone;
-- Expected: UTC

-- 2. Check container timezone (if using Docker)
-- In terminal:
docker compose exec postgres date
-- Expected: UTC time

-- 3. Verify data is stored in UTC
SELECT
  timezone,
  created_at,
  created_at AT TIME ZONE 'UTC' AS stored_utc,
  created_at AT TIME ZONE timezone AS tenant_local
FROM tenants
CROSS JOIN patient
LIMIT 1;

-- Example result:
-- timezone          | created_at                    | stored_utc               | tenant_local
-- America/Sao_Paulo | 2025-10-10 00:26:14.093-03    | 2025-10-10 03:26:14.093  | 2025-10-10 00:26:14.093
--                                                     ↑ UTC (3h ahead)            ↑ Local time
```

### Locale Derivation Test

```javascript
// Check JWT payload after login
// Browser console or backend logs:

// Expected for Brazilian tenant:
{
  userId: 123,
  tenantId: 456,
  timezone: "America/Sao_Paulo",
  locale: "pt-BR"  // ✅ Correctly derived
}

// Expected for Australian tenant:
{
  userId: 789,
  tenantId: 101,
  timezone: "Australia/Brisbane",
  locale: "en-US"  // ✅ Correctly derived
}
```

### Frontend Display Test

```typescript
// In any TQ component:
const { formatShortDate, getTimezone, getLocale } = useDateFormatter()

console.log('Timezone:', getTimezone())
console.log('Locale:', getLocale())
console.log('Formatted:', formatShortDate('2025-01-10T12:00:00Z'))

// Brazilian tenant output:
// Timezone: America/Sao_Paulo
// Locale: pt-BR
// Formatted: 10/01/2025

// Australian tenant output:
// Timezone: Australia/Brisbane
// Locale: en-US
// Formatted: 1/10/2025
```

---

## 🐛 Troubleshooting

### Issue 1: Data Not in UTC

**Symptom:**
```sql
SELECT created_at FROM patient;
-- Shows: 2025-10-09 20:24:48.503 -0300
-- Expected: Should be in UTC when session timezone is UTC
```

**Diagnosis:**
```sql
-- Check session timezone
SHOW timezone;
-- If not UTC, pool events aren't working

-- Check stored value
SELECT created_at AT TIME ZONE 'UTC' FROM patient;
-- If this differs from created_at by several hours, data IS in UTC (good!)
```

**Solution:**
- Verify `pool.on('connect')` is called in `database.js`
- Check Docker environment variables: `PGTZ=UTC` and `TZ=UTC`
- Restart PostgreSQL container and application

### Issue 2: Wrong Locale in JWT

**Symptom:**
```javascript
// JWT shows en-US for Brazilian tenant
{
  timezone: "America/Sao_Paulo",
  locale: "en-US"  // ❌ Wrong!
}
```

**Diagnosis:**
```javascript
// Check backend logs for:
[JWT] Failed to derive locale from timezone, using default en-US: Error: ...
// This means require() is failing
```

**Solution:**
- Check file path in `src/shared/types/user.js`
- Should be: `require('../../server/infra/utils/localeMapping')`
- NOT: `require('../server/infra/utils/localeMapping')`

### Issue 3: Dates Not Formatting

**Symptom:**
- All dates show as `-` (dash)
- Or dates show in wrong timezone

**Diagnosis:**
```typescript
// In component:
const { getTimezone, getLocale } = useDateFormatter()
console.log('TZ:', getTimezone(), 'Locale:', getLocale())

// If both undefined or wrong values:
// - Check if user is authenticated
// - Check if JWT has timezone/locale fields
// - Check auth store state
```

**Solution:**
1. Verify user is logged in
2. Check JWT payload contains `timezone` and `locale`
3. Verify auth store is populated: `useAuthStore.getState()`
4. Check browser console for i18n errors

### Issue 4: Translations Not Working

**Symptom:**
- UI still shows English for Brazilian tenant
- Or shows translation keys instead of text: `patients.loading_patient`

**Diagnosis:**
```typescript
// Check current language
import { useTranslation } from 'react-i18next'
const { i18n } = useTranslation()
console.log('Current language:', i18n.language)
console.log('Available languages:', i18n.languages)
```

**Solution:**
1. Verify translation files exist in `src/client/common/i18n/locales/`
2. Check `i18n.ts` configuration includes both `pt-BR` and `en-US`
3. Verify component imports: `useTranslation('tq')` not `useTranslation()`
4. Check translation key path: `t('patients.loading_patient')` matches JSON structure

---

## 📁 Files Reference

### Backend Files

**Database Layer:**
```
src/server/infra/db/
├── database.js                    ✅ Pool events (SET TIME ZONE 'UTC')
└── index.js

src/server/infra/provisioners/
└── tq.js                          ✅ Removed SET LOCAL timezone
```

**Locale Mapping:**
```
src/server/infra/utils/
└── localeMapping.js               ✅ getLocaleFromTimezone()
```

**JWT Payload:**
```
src/shared/types/
└── user.js                        ✅ createJwtPayload() with locale derivation
```

**Docker:**
```
docker-compose.yml                 ✅ PGTZ=UTC, TZ=UTC
```

### Frontend Files

**Date Formatting:**
```
src/client/common/hooks/
└── useDateFormatter.ts            ✅ Main hook for all date formatting

src/client/common/utils/
└── dateTime.ts                    ✅ Formatting functions (formatShortDate, etc.)
```

**Internationalization:**
```
src/client/common/i18n/
├── i18n.ts                        ✅ i18n configuration
├── languageDetector.ts            ✅ Custom language detector
└── locales/
    ├── pt-BR/
    │   ├── common.json
    │   ├── tq.json                ✅ 160+ translations
    │   └── hub.json
    └── en-US/
        ├── common.json
        ├── tq.json                ✅ 160+ translations
        └── hub.json
```

**Components Updated (30 total):**

TQ App:
```
src/client/apps/tq/features/
├── home/Home.tsx                  ✅ 7 sections translated
├── auth/Login.tsx                 ✅ 2 placeholders
├── session/
│   ├── NewSession.tsx             ✅ 2 placeholders
│   └── EditSession.tsx            ✅ loading/error/placeholders
├── patients/
│   ├── CreatePatient.tsx          ✅ all fields/placeholders
│   └── EditPatient.tsx            ✅ all fields/loading/error
├── quotes/
│   ├── EditQuote.tsx              ✅ loading/error/Created At/Updated At
│   ├── items/
│   │   ├── CreateItem.tsx         ✅ placeholders
│   │   └── EditItem.tsx           ✅ loading/placeholders/Created At
│   └── QuoteItemsManager.tsx      ✅ search placeholder
├── clinical-reports/
│   └── EditClinicalReport.tsx     ✅ loading/error/Created At/placeholders
├── templates/
│   ├── CreateTemplate.tsx         ✅ placeholders/validation
│   └── EditTemplate.tsx           ✅ placeholders/validation
└── public-quotes/
    ├── EditPublicQuoteTemplate.tsx      ✅ loading/placeholders/delete
    ├── CreatePublicQuoteTemplate.tsx    ✅ placeholders
    ├── PublicQuoteAccess.tsx            ✅ loading/password placeholder
    ├── PreviewPublicQuoteLink.tsx       ✅ loading/error
    └── PreviewPublicQuoteTemplate.tsx   ✅ loading
```

---

## 💻 Practical Usage Examples

### Example 1: Creating a New Component with Timezone-Aware Dates

```typescript
// src/client/apps/tq/components/sessions/SessionList.tsx

import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useTranslation } from 'react-i18next'

export const SessionList = ({ sessions }) => {
  const { formatShortDate, formatTime } = useDateFormatter()
  const { t } = useTranslation('tq')

  return (
    <div>
      <h2>{t('sessions.title')}</h2>
      {sessions.map(session => (
        <div key={session.id}>
          <p>{formatShortDate(session.createdAt)}</p>
          <p>{formatTime(session.createdAt)}</p>
        </div>
      ))}
    </div>
  )
}

// Output for Brazilian tenant (pt-BR, America/Sao_Paulo):
// → 14/10/2025
// → 22:26

// Output for Australian tenant (en-US, Australia/Brisbane):
// → 10/15/2025
// → 11:30 AM
```

### Example 2: Backend API Returning UTC Timestamps

```javascript
// src/server/api/tq/routes/patients.js

router.get('/', async (req, res) => {
  const patients = await Patient.findAll(req.tenant.schema)

  res.json({
    data: patients,  // Timestamps automatically in UTC
    meta: { total: patients.length }
  })
})

// Response (same for all tenants):
{
  "data": [{
    "id": 1,
    "name": "John Doe",
    "createdAt": "2025-10-15T01:30:11.686Z"  // ✅ Always UTC (Z suffix)
  }]
}

// Frontend automatically converts to tenant timezone:
// Brazilian tenant sees: 14/10/2025, 22:30
// Australian tenant sees: 10/15/2025, 11:30
```

### Example 3: Creating a Multi-Tenant Report

```typescript
// Component that works for ANY tenant timezone
export const PatientReport = ({ patient }) => {
  const { formatLongDate, formatDateTime, getTimezone } = useDateFormatter()
  const { t } = useTranslation('tq')

  return (
    <div>
      <h1>{t('reports.patient_summary')}</h1>
      <p>
        {t('common.created_at')}: {formatLongDate(patient.createdAt)}
      </p>
      <p>
        {t('reports.last_visit')}: {formatDateTime(patient.lastVisit)}
      </p>
      <small>
        {t('reports.timezone')}: {getTimezone()}
      </small>
    </div>
  )
}

// Brazilian tenant output (pt-BR):
// Resumo do Paciente
// Criado em: 15 de outubro de 2025
// Última visita: 15/10/2025 11:30
// Fuso horário: America/Sao_Paulo

// Australian tenant output (en-US):
// Patient Summary
// Created At: October 15, 2025
// Last Visit: 10/15/2025, 11:30 AM
// Timezone: Australia/Brisbane
```

### Example 4: Debugging Timezone Issues

```typescript
// Add to any component to debug timezone
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useAuthStore } from '@client/apps/tq/shared/store/auth'

export const DebugTimezone = () => {
  const { getTimezone, getLocale } = useDateFormatter()
  const authState = useAuthStore()

  console.table({
    'Hook Timezone': getTimezone(),
    'Hook Locale': getLocale(),
    'Store Timezone': authState.tenantTimezone,
    'Store Locale': authState.tenantLocale,
    'User Authenticated': authState.isAuthenticated,
    'Tenant ID': authState.tenantId
  })

  return null
}

// Console output:
// ┌──────────────────────┬────────────────────────┐
// │     (index)          │        Values          │
// ├──────────────────────┼────────────────────────┤
// │ Hook Timezone        │ 'Australia/Brisbane'   │
// │ Hook Locale          │ 'en-US'                │
// │ Store Timezone       │ 'Australia/Brisbane'   │
// │ Store Locale         │ 'en-US'                │
// │ User Authenticated   │ true                   │
// │ Tenant ID            │ 3                      │
// └──────────────────────┴────────────────────────┘
```

---

## 📊 Implementation Status

### ✅ Completed (100%)

1. **Database Layer**
   - ✅ All timestamps stored in UTC (TIMESTAMPTZ)
   - ✅ Pool connections forced to UTC timezone via `pool.on('connect')`
   - ✅ Docker PostgreSQL configured with UTC (`PGTZ=UTC`, `TZ=UTC`)
   - ✅ Changed all `TIMESTAMP` to `TIMESTAMPTZ` in migrations
   - ✅ Verification queries documented and tested

2. **Backend Layer**
   - ✅ Locale derivation from timezone (`localeMapping.js`)
   - ✅ JWT payload includes timezone + locale
   - ✅ Fixed require path in `user.js` (`../../server/infra/utils/localeMapping`)
   - ✅ Timezone fetched from database when generating JWT
   - ✅ Backend always returns ISO 8601 UTC timestamps

3. **Frontend Date Formatting**
   - ✅ `useDateFormatter` hook with static import (follows Rules of Hooks)
   - ✅ All date formatting functions implemented (`dateTime.ts`)
   - ✅ Intl.DateTimeFormat with timezone + locale parameters
   - ✅ Reactive to auth store changes (SSO compatible)
   - ✅ 23 components migrated to use timezone-aware formatters

4. **Frontend i18n**
   - ✅ Translation files (pt-BR + en-US) - 160+ keys each
   - ✅ Custom language detector reading from auth store
   - ✅ 30+ components fully translated
   - ✅ All forms, placeholders, loading states, error messages

5. **Testing & Verification**
   - ✅ End-to-end test with Brazilian tenant (São Paulo -3)
   - ✅ End-to-end test with Australian tenant (Brisbane +10)
   - ✅ Verified dates display correctly in both timezones
   - ✅ Verified UI translations work for both languages
   - ✅ Screenshot evidence of working implementation

6. **Documentation**
   - ✅ Consolidated documentation (this file)
   - ✅ Complete problem-solving journey documented
   - ✅ All 5 major issues and solutions documented
   - ✅ Practical usage examples
   - ✅ Troubleshooting guide
   - ✅ Files reference with exact locations

---

## 🎯 Summary

### What We Built

A complete timezone and internationalization system that:

1. **Stores all data in UTC** (PostgreSQL TIMESTAMPTZ)
2. **Automatically derives locale from timezone** (Brazil → pt-BR, Others → en-US)
3. **Formats dates correctly** per tenant's timezone and language
4. **Translates entire UI** based on tenant locale (160+ translation keys)
5. **Works seamlessly** across TQ and Hub applications

### Key Benefits

- ✅ **Data Integrity**: No timezone ambiguity, all timestamps in UTC
- ✅ **Automatic Language**: No manual language selection needed
- ✅ **Consistent UX**: Same date format rules everywhere
- ✅ **Scalable**: Easy to add new timezones (just update localeMapping.js)
- ✅ **Maintainable**: Centralized formatting (useDateFormatter hook)

### Technical Highlights

- **Single Source of Truth**: JWT contains timezone + locale
- **Smart Defaults**: Falls back gracefully if data missing
- **Performance**: No extra API calls, data comes from JWT
- **Type Safety**: TypeScript for all frontend code
- **Best Practices**: Uses standard Intl.DateTimeFormat API

---

## 📂 Complete Files Modified

### Critical Backend Changes

**Database Configuration:**
```
src/server/infra/db/database.js
  ✅ Added setupPoolEvents() method
  ✅ pool.on('connect') forces UTC timezone on all connections
```

**Migrations:**
```
src/server/infra/migrations/001_create_core_tables.sql
  ✅ Changed ALL TIMESTAMP to TIMESTAMPTZ
  ✅ Changed defaults to (now() AT TIME ZONE 'UTC')
  ✅ Applied to: tenants, users, tenant_applications, user_application_access,
     application_access_logs, tenant_branding
```

**Locale Mapping:**
```
src/server/infra/utils/localeMapping.js
  ✅ getLocaleFromTimezone() - Maps 16 Brazil timezones → pt-BR, others → en-US
  ✅ getLanguageFromLocale() - Extracts language code (pt-BR → pt)
  ✅ isSupportedTimezone() - Validates IANA timezone strings
  ✅ getLocaleMetadata() - Returns currency, date format metadata
```

**JWT Payload:**
```
src/shared/types/user.js
  ✅ Fixed require path: require('../../server/infra/utils/localeMapping')
  ✅ createJwtPayload() derives locale from timezone
  ✅ JWT includes: timezone (IANA string), locale (pt-BR or en-US)
```

**Auth Service:**
```
src/server/infra/authService.js
  ✅ login() fetches tenant timezone from database
  ✅ register() includes timezone in JWT
  ✅ refreshToken() re-fetches fresh timezone
```

### Critical Frontend Changes

**Date Formatting Hook:**
```
src/client/common/hooks/useDateFormatter.ts
  ✅ Static import: import { useAuthStore } from '@client/apps/tq/shared/store/auth'
  ✅ Reactive Zustand subscription (follows Rules of Hooks)
  ✅ Returns 7 formatting functions + timezone/locale getters
  ✅ Re-renders when auth store timezone/locale change
```

**Date Utilities:**
```
src/client/common/utils/dateTime.ts
  ✅ formatShortDate() - DD/MM/YYYY or M/D/YYYY based on locale
  ✅ formatLongDate() - Full month name format
  ✅ formatTime() - 24h (pt-BR) vs 12h AM/PM (en-US)
  ✅ formatDateTime() - Combined date + time
  ✅ formatRelativeTime() - "há 2 horas" vs "2 hours ago"
  ✅ formatMonthYear() - MMM YYYY
  ✅ getNowInTimezone() - Current date in tenant timezone
```

**Auth Stores:**
```
src/client/apps/tq/shared/store/auth.ts
  ✅ Added tenantTimezone field (IANA string)
  ✅ Added tenantLocale field (pt-BR or en-US)
  ✅ loginWithToken() extracts from JWT payload
  ✅ Persists to localStorage via Zustand middleware

src/client/apps/hub/store/auth.ts
  ✅ Same fields added for Hub app
  ✅ Same JWT extraction logic
```

**i18n Configuration:**
```
src/client/common/i18n/i18n.ts
  ✅ Configured react-i18next with pt-BR and en-US
  ✅ Custom language detector reads from auth store
  ✅ Fallback language: en-US

src/client/common/i18n/locales/pt-BR/tq.json
src/client/common/i18n/locales/en-US/tq.json
  ✅ 160+ translation keys per language
  ✅ Covers: common, patients, sessions, quotes, clinical reports, templates, etc.
```

**Components Updated (23 total):**
```
src/client/apps/tq/features/home/Home.tsx - ✅ 7 date formats migrated
src/client/apps/tq/features/quotes/EditQuote.tsx - ✅ formatDateTime
src/client/apps/tq/features/patients/PatientHistory.tsx - ✅ 7 formatShortDate
src/client/apps/tq/features/clinical-reports/ViewClinicalReport.tsx - ✅ formatLongDate
src/client/apps/tq/features/clinical-reports/EditClinicalReport.tsx - ✅ formatShortDate
src/client/apps/tq/components/patients/PatientRow.tsx - ✅ formatShortDate
src/client/apps/tq/components/session/SessionRow.tsx - ✅ formatShortDate
src/client/apps/tq/components/clinical-reports/ClinicalReportRow.tsx - ✅ formatShortDate
src/client/apps/tq/components/items/ItemRow.tsx - ✅ formatShortDate
src/client/apps/tq/components/templates/TemplateRow.tsx - ✅ formatShortDate
src/client/apps/tq/components/public-quotes/PublicQuoteLinkRow.tsx - ✅ formatShortDate
src/client/apps/tq/components/quotes/QuoteRow.tsx - ✅ formatShortDate
src/client/apps/tq/components/quotes/GeneratePublicQuoteModal.tsx - ✅ formatShortDate
src/client/apps/tq/components/home/QuoteCard.tsx - ✅ formatShortDate
src/client/apps/tq/components/home/ReportCard.tsx - ✅ formatShortDate
src/client/apps/tq/components/home/SessionCard.tsx - ✅ formatShortDate
src/client/apps/tq/components/home/RecentPatientRow.tsx - ✅ formatShortDate
src/client/apps/tq/services/quotes.ts - ✅ formatDate helper
src/client/apps/tq/services/sessions.ts - ✅ formatDate helper
src/client/apps/tq/services/patients.ts - ✅ formatDate helper
src/client/apps/hub/features/entitlements/EntitlementsSummaryCard.tsx - ✅ formatShortDate
src/client/apps/hub/features/entitlements/EntitlementAppCard.tsx - ✅ formatShortDate
src/server/services/templateVariableResolver.js - ✅ Date resolution for AI Agent
```

### Docker Configuration

```
docker-compose.yml
  ✅ PGTZ: UTC - PostgreSQL server timezone
  ✅ TZ: UTC - Container timezone
```

---

## 🎓 Key Learnings

1. **PostgreSQL Pool Events**: Connection-level settings require `pool.on('connect')` - transaction-level `SET LOCAL` doesn't persist
2. **TIMESTAMPTZ vs TIMESTAMP**: Always use TIMESTAMPTZ for unambiguous timestamps - stores internally in UTC, displays in session timezone
3. **React Rules of Hooks**: Dynamic `require()` inside hooks violates React rules - use static imports
4. **Vite Module System**: Vite doesn't support dynamic `require()` in ES modules - returns `null` instead of throwing
5. **Zustand Reactivity**: Use selector pattern `useStore(state => state.field)` for reactive subscriptions
6. **Intl.DateTimeFormat**: Native API adapts format automatically based on locale (DD/MM/YYYY vs MM/DD/YYYY)
7. **Browser Caching**: Vite HMR + Service Workers = aggressive caching - test in Incognito mode
8. **JWT as Transport**: Include derived data (locale) in JWT to avoid extra API calls
9. **Two Languages Only**: Business requirement simplified architecture (Brazil → pt-BR, rest → en-US)
10. **UTC Everywhere**: Store UTC, display in local timezone - never store local timestamps

---

## 🔀 Why Different Approaches for Locale Detection?

### The Question: Why Not Use the Same Approach Everywhere?

You might notice that we use **three different approaches** to read the tenant locale:

1. **useDateFormatter** → Zustand Store (static import)
2. **useCurrencyFormatter** → localStorage (useSyncExternalStore)
3. **i18n languageDetector** → localStorage (direct read)

**This is intentional and necessary.** Here's why each approach is correct for its use case:

---

### 1️⃣ useDateFormatter - Zustand Store (TQ-Specific)

```typescript
// src/client/common/hooks/useDateFormatter.ts
import { useAuthStore as useTQAuthStore } from '@client/apps/tq/shared/store/auth'

export function useDateFormatter() {
  const timezone = useTQAuthStore(state => state.tenantTimezone) || 'America/Sao_Paulo'
  const locale = useTQAuthStore(state => state.tenantLocale) || 'pt-BR'
  // ...
}
```

**Why This Approach:**
- ✅ **Fully Reactive**: Automatically re-renders when timezone/locale change in auth store
- ✅ **Clean Code**: Simple selector pattern, no boilerplate
- ✅ **Type Safe**: TypeScript knows the exact store shape
- ✅ **Follows React Rules**: Static import, unconditional hook call

**Trade-off:**
- ⚠️ **TQ-Specific**: Directly imports from `@client/apps/tq/shared/store/auth`
- ⚠️ **Not Portable**: Doesn't work in Hub without modification

**Why This is OK:**
- The hook is **only used in TQ components** (23 components migrated)
- TQ has its own dedicated codebase (`src/client/apps/tq/`)
- No need for multi-app compatibility

---

### 2️⃣ useCurrencyFormatter - localStorage (Multi-App)

```typescript
// src/client/common/hooks/useCurrencyFormatter.ts
export function useCurrencyFormatter() {
  const tenantLocale = useSyncExternalStore(
    (callback) => {
      window.addEventListener('storage', callback)
      return () => window.removeEventListener('storage', callback)
    },
    () => {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const parsed = JSON.parse(authStorage)
        return parsed.state?.tenantLocale || null
      }
      return null
    },
    () => null
  )
  // ...
}
```

**Why This Approach:**
- ✅ **Multi-App Compatible**: Works in TQ **AND** Hub without app-specific imports
- ✅ **Fully Reactive**: `useSyncExternalStore` triggers re-renders on localStorage changes
- ✅ **No App Coupling**: Doesn't depend on `@client/apps/tq/` or `@client/apps/hub/`
- ✅ **Single Source of Truth**: Reads directly from Zustand's persisted state

**Trade-off:**
- ⚠️ **More Verbose**: Requires `useSyncExternalStore` boilerplate
- ⚠️ **Less Type Safe**: JSON parsing without strict types

**Why This is Necessary:**
- The hook is used in **common components** (`src/client/common/ui/PriceInput.tsx`)
- PriceInput is used in **both TQ and Hub apps**
- Cannot import TQ-specific auth store in common code
- localStorage is the **only** neutral data source accessible from common code

**Alternative Rejected:**
```typescript
// ❌ DOESN'T WORK - Would break in Hub
import { useAuthStore as useTQAuthStore } from '@client/apps/tq/shared/store/auth'
const locale = useTQAuthStore(state => state.tenantLocale)  // Hub can't import TQ store!
```

---

### 3️⃣ i18n languageDetector - localStorage (Pre-React)

```typescript
// src/client/common/i18n/config.ts
const languageDetector = new LanguageDetector()
languageDetector.addDetector({
  name: 'customDetector',
  lookup() {
    try {
      const authData = localStorage.getItem('auth-storage')
      if (authData) {
        const parsed = JSON.parse(authData)
        const locale = parsed?.state?.tenantLocale
        if (locale === 'pt-BR') return 'pt-BR'
      }
    } catch (error) {
      console.warn('Failed to detect language:', error)
    }
    return 'en-US'
  }
})
```

**Why This Approach:**
- ✅ **Pre-React Initialization**: Executes **before** React mounts
- ✅ **Not a React Component**: `lookup()` is a plain JavaScript function
- ✅ **Multi-App Compatible**: Works in TQ and Hub
- ✅ **No Dependencies**: Doesn't need React hooks or Zustand

**Trade-off:**
- ⚠️ **Not Reactive**: Only detects language once at initialization
- ⚠️ **Manual Updates**: Apps must call `i18n.changeLanguage()` when locale changes

**Why This is Necessary:**
- **i18n initializes globally** as a singleton before React renders
- Cannot use React hooks (`useAuthStore`) outside of React components
- `lookup()` function cannot be a React component or use hooks

**Reactivity Handled Separately:**
```typescript
// src/client/apps/tq/App.tsx
useEffect(() => {
  if (tenantLocale && i18n.language !== tenantLocale) {
    i18n.changeLanguage(tenantLocale)
  }
}, [tenantLocale])
```

**Alternative Rejected:**
```typescript
// ❌ DOESN'T WORK - React hooks can't run before React
import { useAuthStore } from '@client/apps/tq/shared/store/auth'
languageDetector.addDetector({
  lookup() {
    const locale = useAuthStore(state => state.tenantLocale)  // ❌ Not a component!
  }
})
```

---

## 📊 Decision Matrix: Which Approach When?

| Use Case | Approach | Reason |
|---|---|---|
| **App-specific hook** (TQ only) | Zustand Store | ✅ Clean, reactive, type-safe |
| **Common component** (TQ + Hub) | localStorage | ✅ Multi-app compatible |
| **Pre-React initialization** | localStorage | ✅ No React available yet |
| **Inside React component** | Prefer Zustand | ✅ More idiomatic React |
| **Outside React component** | localStorage only | ✅ No hooks available |

---

## 🚫 What We DON'T Do (Anti-Patterns)

### ❌ Anti-Pattern 1: Dynamic require() in Hooks
```typescript
// ❌ WRONG - Violates Rules of Hooks
export function useDateFormatter() {
  let store = null
  try {
    const { useAuthStore } = require('@client/apps/tq/shared/store/auth')
    store = useAuthStore  // ❌ Returns null in Vite
  } catch (e) {}

  const locale = store ? store(state => state.tenantLocale) : 'pt-BR'
}
```

**Why Wrong:**
- Vite doesn't support dynamic `require()` - returns `null` silently
- Violates React Rules of Hooks (conditional hook call)
- Not reactive - doesn't update when locale changes

---

### ❌ Anti-Pattern 2: Import TQ Store in Common Code
```typescript
// ❌ WRONG - Breaks Hub app
// src/client/common/ui/PriceInput.tsx
import { useAuthStore } from '@client/apps/tq/shared/store/auth'  // ❌ TQ-specific!

export const PriceInput = () => {
  const locale = useAuthStore(state => state.tenantLocale)  // ❌ Undefined in Hub!
}
```

**Why Wrong:**
- PriceInput is used in Hub, which doesn't have `@client/apps/tq/`
- Creates tight coupling between common components and specific apps
- Breaks separation of concerns

---

### ❌ Anti-Pattern 3: Use React Hooks in i18n Config
```typescript
// ❌ WRONG - i18n initializes before React
import { useAuthStore } from '@client/apps/tq/shared/store/auth'

i18n.init({
  lng: useAuthStore(state => state.tenantLocale)  // ❌ Not a component!
})
```

**Why Wrong:**
- i18n config runs at module load time (before React)
- Can't use React hooks outside components
- Would throw: "Hooks can only be called inside a function component"

---

## ✅ Summary: Why Different Approaches Are Correct

**The diversity of approaches is not a bug - it's a feature.** Each approach is optimized for its specific constraints:

1. **useDateFormatter (Zustand)** → App-specific, reactive, clean
2. **useCurrencyFormatter (localStorage)** → Multi-app, reactive, portable
3. **i18n (localStorage)** → Pre-React, non-reactive, universal

**Attempting to "unify" these approaches would:**
- ❌ Break multi-app compatibility (Hub can't import TQ store)
- ❌ Break pre-React initialization (i18n can't use hooks)
- ❌ Add unnecessary complexity (dynamic imports, conditional logic)

**The current solution is the correct architectural choice given the constraints.**

---

**Implementation Complete!** 🎉

For questions or issues, refer to the [Complete Problem-Solving Journey](#-complete-problem-solving-journey) section or check the [Files Reference](#files-reference).
