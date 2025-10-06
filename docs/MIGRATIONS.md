# Database Migrations - Simplia PaaS

## Overview

Este documento detalha a estrutura completa do banco de dados PostgreSQL do Simplia PaaS, incluindo todas as tabelas, relacionamentos, índices e estratégias de performance. O sistema utiliza uma arquitetura multi-tenant com isolamento por schema.

## Migration System

### Estrutura das Migrações

As migrações estão organizadas em arquivos SQL numerados executados sequencialmente:

- **001_create_core_tables.sql** - Tabelas principais e relacionamentos
- **002_create_indexes.sql** - Índices otimizados para performance  
- **003_seed_initial_data.sql** - Dados essenciais iniciais

### Execução

```bash
npm run migrate
```

**Localização:** `src/server/infra/migrations/`  
**Script de execução:** `src/server/infra/scripts/runMigrations.js`

## Estratégia de Migrations

- **Core (global):** migrations padrão operando sobre `public` (tabelas de plataforma).
- **Tenant (opcional):** quando existirem tabelas de produto por-tenant, manter scripts idempotentes e um runner per-tenant que:
  1) aplica `SET LOCAL search_path TO tenant_<slug>, public`;
  2) executa `CREATE TABLE IF NOT EXISTS ...`;
  3) controla versão em `public.tenant_schema_migrations`.

## Database Schema

### Core Tables (10 total)

#### 1. **tenants** - Multi-tenancy Registry
```sql
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  schema_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Propósito**: Registry central de tenants com mapeamento de schemas  
**Multi-tenancy**: Cada tenant possui seu próprio schema PostgreSQL (`tenant_default`, `tenant_xyz`)  
**Isolamento**: `SET search_path TO tenant_schema, public` para isolação de dados

#### 2. **users** - Users with 1:1 Tenant Relationship
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  tenant_name VARCHAR(255), -- Denormalized for performance
  role VARCHAR(50) DEFAULT 'operations', -- operations, manager, admin
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
  user_type_id_fk INTEGER NOT NULL REFERENCES user_types(id),
  platform_role VARCHAR(50) NULL, -- internal_admin for Simplia team
  last_login TIMESTAMP,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**1:1 Tenant Model**: Cada usuário pertence a exatamente um tenant  
**FK Naming**: `tenant_id_fk` - padrão `_fk` para todas as foreign keys  
**Role Hierarchy**: operations < manager < admin  
**Platform Roles**: `internal_admin` para equipe Simplia

#### 3. **user_types** - User Type Hierarchy
```sql
CREATE TABLE user_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  base_price DECIMAL(10,2) DEFAULT 0.00,
  description TEXT,
  hierarchy_level INTEGER DEFAULT 0, -- 0=operations, 1=manager, 2=admin
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Hierarchy**: 0=operations, 1=manager, 2=admin  
**Pricing Tiers**: Base price por tipo de usuário  
**Slugs**: operations, manager, admin

#### 4. **applications** - Product Catalog
```sql
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  price_per_user DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, deprecated
  version VARCHAR(20) DEFAULT '1.0.0',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Standard Slugs**: tq, pm, billing, reports  
**JWT Integration**: Slugs usados nos tokens em vez de IDs para performance

#### 5. **tenant_applications** - Tenant License Management
```sql
CREATE TABLE tenant_applications (
  id SERIAL PRIMARY KEY,
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  application_id_fk INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, expired
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- NULL for perpetual licenses
  user_limit INTEGER DEFAULT 999999, -- Seat limit per application
  seats_used INTEGER DEFAULT 0, -- Current seats used
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id_fk, application_id_fk)
);
```

**Seat-Based Licensing**: Controle de limite de usuários por aplicação  
**Seat Tracking**: `seats_used` é incrementado/decrementado automaticamente  
**Expiration Support**: NULL = perpétua, valor = data de expiração

#### 6. **user_application_access** - Granular User Permissions
```sql
CREATE TABLE user_application_access (
  id SERIAL PRIMARY KEY,
  user_id_fk INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id_fk INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  role_in_app VARCHAR(50) DEFAULT 'user', -- user, admin, viewer
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by_fk INTEGER REFERENCES users(id),
  expires_at TIMESTAMP, -- NULL for permanent access
  active BOOLEAN DEFAULT true,
  -- Price Snapshots (billing consistency)
  price_snapshot NUMERIC(10,2),
  currency_snapshot CHAR(3),
  user_type_id_snapshot_fk INTEGER REFERENCES user_types(id),
  granted_cycle TEXT CHECK (granted_cycle IN ('monthly','yearly')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id_fk, user_id_fk, application_id_fk)
);
```

**Tenant Consistency**: `tenant_id_fk` deve ser igual ao tenant do usuário  
**Price Snapshots**: Preços capturados no momento da concessão para consistência de billing  
**Granular Permissions**: Controle fino de acesso por usuário por aplicação

#### 7. **application_access_logs** - Audit Trail
```sql
CREATE TABLE application_access_logs (
  id SERIAL PRIMARY KEY,
  user_id_fk INTEGER REFERENCES users(id),
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id),
  application_id_fk INTEGER REFERENCES applications(id),
  decision VARCHAR(20) NOT NULL DEFAULT 'granted', -- granted, denied
  reason VARCHAR(255), -- why access was denied
  api_path VARCHAR(500), -- API endpoint accessed
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Compliance**: Log completo de todas as tentativas de acesso  
**Security Monitoring**: IP, User-Agent, API path, razão da negação  
**Audit Ready**: Suporte a relatórios de compliance

#### 8. **application_pricing** - Pricing Matrix
```sql
CREATE TABLE application_pricing (
  id BIGSERIAL PRIMARY KEY,
  application_id_fk INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_type_id_fk INTEGER NOT NULL REFERENCES user_types(id),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly','yearly')) DEFAULT 'monthly',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id_fk, user_type_id_fk, valid_from)
);
```

**Pricing Matrix**: App × UserType com versionamento  
**Price Versioning**: `valid_from/valid_to` para mudanças agendadas  
**Multi-Currency**: Suporte a múltiplas moedas

#### 9. **tenant_addresses** - Multi-Address Support
```sql
CREATE TABLE tenant_addresses (
  id BIGSERIAL PRIMARY KEY,
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('HQ','BILLING','SHIPPING','BRANCH','OTHER')),
  label TEXT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT NULL,
  city TEXT NULL,
  state TEXT NULL,
  postal_code TEXT NULL,
  country_code CHAR(2) NOT NULL, -- ISO-3166-1 alpha-2
  is_primary BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

**Address Types**: HQ, BILLING, SHIPPING, BRANCH, OTHER  
**Primary Constraint**: Máximo 1 endereço primário por tipo por tenant  
**ISO Standards**: Country codes em ISO-3166-1 alpha-2

#### 10. **tenant_contacts** - Contact Management
```sql
CREATE TABLE tenant_contacts (
  id BIGSERIAL PRIMARY KEY,
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ADMIN','BILLING','TECH','LEGAL','OTHER')),
  full_name TEXT NOT NULL,
  email TEXT NULL,
  phone_e164 TEXT NULL, -- E.164 format
  title TEXT NULL,
  department TEXT NULL,
  notes TEXT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

**Contact Types**: ADMIN, BILLING, TECH, LEGAL, OTHER  
**E.164 Format**: Números de telefone em formato internacional  
**Department Field**: Departamento/área organizacional

### Views

#### v_tenant_app_seats_by_type
```sql
CREATE OR REPLACE VIEW v_tenant_app_seats_by_type AS
SELECT
  uaa.tenant_id_fk,
  uaa.application_id_fk,
  COALESCE(uaa.user_type_id_snapshot_fk, u.user_type_id_fk) AS user_type_id,
  COUNT(*)::INT AS seats_count,
  SUM(COALESCE(uaa.price_snapshot, 0))::NUMERIC(10,2) AS total_price
FROM user_application_access uaa
JOIN users u ON u.id = uaa.user_id_fk
WHERE uaa.active = TRUE
GROUP BY 1,2,3;
```

**Propósito**: Agregação de seats por tenant, app e user type com pricing

## Foreign Key Relationships

### FK Naming Convention

**Padrão**: `_fk` suffix para todas as foreign keys  
**Tipo**: `INTEGER NOT NULL REFERENCES parent_table(id)`  
**Política**: IDs numéricos exclusivamente - sem string FKs

### Key Relationships

```
tenants (1) ←→ (N) users [tenant_id_fk]
tenants (1) ←→ (N) tenant_applications [tenant_id_fk]  
tenants (1) ←→ (N) user_application_access [tenant_id_fk]
tenants (1) ←→ (N) application_access_logs [tenant_id_fk]
tenants (1) ←→ (N) tenant_addresses [tenant_id_fk]
tenants (1) ←→ (N) tenant_contacts [tenant_id_fk]

users (1) ←→ (N) user_application_access [user_id_fk]
users (1) ←→ (N) application_access_logs [user_id_fk]
users (N) ←→ (1) user_types [user_type_id_fk]

applications (1) ←→ (N) tenant_applications [application_id_fk]
applications (1) ←→ (N) user_application_access [application_id_fk]
applications (1) ←→ (N) application_access_logs [application_id_fk]
applications (1) ←→ (N) application_pricing [application_id_fk]

user_types (1) ←→ (N) users [user_type_id_fk]
user_types (1) ←→ (N) application_pricing [user_type_id_fk]
```

### Constraint Rules

- **ON DELETE RESTRICT**: Para tenants (não pode deletar tenant com dados)
- **ON DELETE CASCADE**: Para aplicações e dependências
- **UNIQUE Constraints**: Prevent duplicate relationships

## Index Strategy

### Categories

1. **Primary Lookup Indexes** - Single column lookups
2. **Performance Indexes** - Multi-column for common queries  
3. **Audit Indexes** - Logging and compliance queries
4. **Business Logic Indexes** - Licensing and authorization
5. **Partial Indexes** - Active records optimization

### Key Performance Indexes

#### Authentication & Authorization
```sql
-- User authentication
idx_users_email_tenant_fk ON users(email, tenant_id_fk)
idx_users_tenant_fk_active ON users(tenant_id_fk, active)

-- 5-layer authorization flow
idx_auth_flow_tenant_app ON tenant_applications(tenant_id_fk, application_id_fk, status, active, expires_at)
idx_auth_flow_user_app ON user_application_access(user_id_fk, application_id_fk, active, expires_at)
```

#### Seat Management
```sql
idx_tenant_apps_seats ON tenant_applications(tenant_id_fk, seats_used, user_limit)
idx_user_app_access_tenant_fk_app ON user_application_access(tenant_id_fk, application_id_fk)
```

#### Audit & Security
```sql
idx_access_logs_tenant_date ON application_access_logs(tenant_id_fk, created_at DESC)
idx_access_denied_only ON application_access_logs(tenant_id_fk, created_at DESC, user_id_fk) WHERE decision = 'denied'
```

#### Address & Contact Management
```sql
idx_tenant_addresses_tenant_type ON tenant_addresses(tenant_id_fk, type)
idx_tenant_contacts_email_lookup ON tenant_contacts(tenant_id_fk, lower(email)) WHERE email IS NOT NULL

-- Unique constraints for primary addresses/contacts
uq_tenant_addresses_primary_per_type ON tenant_addresses(tenant_id_fk, type) WHERE active = true AND is_primary = true
uq_tenant_contacts_primary_per_type ON tenant_contacts(tenant_id_fk, type) WHERE active = true AND is_primary = true
```

## Multi-Tenant Architecture

### Schema-Per-Tenant Model

```sql
-- Each tenant has dedicated schema
CREATE SCHEMA tenant_default;
CREATE SCHEMA tenant_xyz;

-- Runtime schema switching  
SET search_path TO tenant_schema, public;
```

### Tenant Resolution

1. **Header-based**: `x-tenant-id: 123` (numeric ID)
2. **Subdomain-based**: `xyz.simplia.com` → tenant lookup
3. **Context injection**: `req.tenant` middleware

### Data Isolation

- **Schema-level**: Complete data separation
- **Query-level**: All queries scoped to tenant schema
- **Application-level**: Tenant validation in all operations

## Authorization System

### 5-Layer Enterprise Authorization

1. **Tenant License Check**: Tenant has active license for app?
2. **Seat Availability**: Within user limits for application? 
3. **User Access Check**: User has permission for app?
4. **Role Validation**: User has required role within app?
5. **Audit Logging**: Log all access attempts with context

### Implementation

```javascript
// Middleware chain
tenant → auth → appAccess → routes

// JWT payload (optimized with slugs)
{
  userId: 123,
  tenantId: 456, 
  role: 'admin',
  allowedApps: ['tq', 'pm'], // slugs for performance
  userType: 'manager'
}
```

## Pricing System

### Seat-Based Model

- **Global Limits**: Per application per tenant (`tenant_applications.user_limit`)
- **Usage Tracking**: Current seats used (`seats_used`) 
- **Price Snapshots**: Captured at grant time for billing consistency
- **Billing Integration**: Automated cost calculation

### Pricing Matrix

```
Application × UserType pricing:
TQ:      operations($35), manager($55), admin($80)
PM:      operations($25), manager($40), admin($60)  
Billing: operations($30), manager($50), admin($70)
Reports: operations($20), manager($35), admin($50)
```

## Audit & Compliance

### Complete Audit Trail

- **Access Attempts**: All grant/deny with IP, User-Agent, API path
- **Seat Changes**: Grant/revoke with pricing snapshots
- **Administrative Actions**: License adjustments, user management
- **Security Events**: Failed access attempts, suspicious patterns

### Data Retention

- **Access Logs**: Configurable retention (default 90 days)
- **Price Snapshots**: Permanent for billing integrity
- **Audit Fields**: `created_at`, `updated_at` on all tables

## Performance Optimizations

### Query Optimizations

1. **Composite Indexes**: Multi-column for complex queries
2. **Partial Indexes**: Active records only for frequent queries  
3. **Functional Indexes**: Case-insensitive email lookups
4. **Covering Indexes**: Reduce table lookups

### Application-Level

1. **JWT with Slugs**: Application slugs instead of IDs in tokens
2. **Denormalized Fields**: `tenant_name` in users table
3. **Connection Pooling**: Singleton database instance
4. **Schema Caching**: Tenant schema resolution cache

## Seeded Data

### User Types
- **operations** (hierarchy: 0, base_price: $25.00)
- **manager** (hierarchy: 1, base_price: $75.00)  
- **admin** (hierarchy: 2, base_price: $150.00)

### Applications
- **Transcription Quote (tq)** - $50.00 base
- **Patient Management (pm)** - $30.00 base
- **Billing System (billing)** - $40.00 base
- **Reporting Dashboard (reports)** - $25.00 base

### Default Tenants
- **Default Clinic** (`default` subdomain, `tenant_default` schema)
- **Test Clinic** (`test_clinic` subdomain, `tenant_test_clinic` schema)

### Initial Pricing Matrix
Complete App × UserType pricing with differentiated rates per user type.

## Migration History

### 001_create_core_tables.sql
- ✅ All 10 core tables with proper FK relationships
- ✅ Users ↔ Tenants 1:1 model with numeric FKs
- ✅ Complete pricing system with snapshots
- ✅ Address and contact management
- ✅ **Tenant Branding** (`tenant_branding` table):
  - Color scheme (primary, secondary, tertiary)
  - Brand assets (logo, favicon, background video)
  - `background_video_url` field for Hero component background videos (MP4, max 20MB)
- ✅ Comprehensive comments and documentation

### 002_create_indexes.sql
- ✅ 40+ optimized indexes organized by purpose
- ✅ Authorization flow optimization
- ✅ Partial indexes for performance
- ✅ Unique constraints for business rules

### 003_seed_initial_data.sql
- ✅ Essential user types and application catalog
- ✅ Default tenants with schemas
- ✅ Initial licensing and pricing setup
- ✅ Sample data for development/testing

## Development Notes

### Local Setup
```bash
# Create development database
createdb simplia_paas

# Run migrations
npm run migrate

# Create test database (automatic)
npm test
```

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/simplia_paas
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=simplia_paas
DATABASE_USER=postgres
DATABASE_PASSWORD=yourpassword
TEST_DATABASE_NAME=simplia_paas_test
```

### Best Practices

1. **Always use numeric FKs** with `_fk` suffix
2. **Validate tenant consistency** at application level  
3. **Use price snapshots** for billing consistency
4. **Log all access attempts** for audit trail
5. **Check seat limits** before granting access
6. **Use SELECT FOR UPDATE** for seat management
7. **Include tenant context** in all queries

---

**Database Version**: PostgreSQL 12+  
**Migration System**: Custom SQL-based with sequential execution  
**Last Updated**: 2024-09-08  
**Total Tables**: 10  
**Total Indexes**: 40+  
**Schema Support**: Multi-tenant with schema isolation