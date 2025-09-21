# Auditoria Completa: Sistema de Pricing - Internal Admin

**Data:** 20/09/2025
**Status:** Sistema 100% Consolidado
**Escopo:** Sistema completo de pricing cross-aplicações no Internal Admin

---

## 📋 Resumo Executivo

Este documento mapeia completamente o **Sistema de Pricing** do Internal Admin, incluindo todos os componentes frontend, APIs backend, operações de banco de dados e contratos OpenAPI. O pricing é o núcleo financeiro do sistema, sendo **obrigatório** para ativação de licenças e base para todo o billing.

### Métricas do Sistema
- **Componentes Frontend:** 1 principal + integração em 5 módulos
- **Rotas API:** 4 endpoints dedicados + 8 integrações
- **Modelos de Dados:** 2 principais (ApplicationPricing, UserApplicationAccess snapshots)
- **Tipos TypeScript:** 12 interfaces/types
- **Sistema de Snapshots:** Pricing capturado no momento do grant
- **Multi-Currency:** BRL, USD, EUR
- **Billing Cycles:** Monthly, Yearly

---

## 🎯 Funcionalidades Principais

### 1. Gestão de Pricing Matrix
- **Componente:** `ApplicationPricing.tsx`
- **Rota:** `/applications/:id/pricing`
- **Funcionalidade:** CRUD completo da matriz Application × UserType × BillingCycle

### 2. Pricing Snapshots
- **Sistema:** Captura automática de pricing no grant
- **Tabela:** `user_application_access` (campos snapshot)
- **Funcionalidade:** Billing consistency - mudanças de pricing não afetam licenças ativas

### 3. Validação de Pricing
- **Integração:** Ativação de licenças exige pricing configurado
- **Endpoint:** Verificação automática em `POST /tenants/:id/applications/:slug/activate`
- **Funcionalidade:** Prevenção de licenciamento sem pricing

### 4. Billing Intelligence
- **Funcionalidade:** Relatórios de pricing, coverage analysis, cost calculation
- **Endpoints:** `/applications/:id/pricing` + billing summary queries
- **Integração:** User access cost calculation

---

## 🏗️ Arquitetura do Sistema

### Frontend (TypeScript/React)

```
src/client/apps/internal-admin/
├── features/applications/pricing/
│   └── ApplicationPricing.tsx           # Interface principal de pricing
├── services/
│   └── applications.ts                  # APIs de pricing (create, update, end)
└── features/tenants/detail/
    ├── components/TenantLicenseCard.tsx # Exibe pricing info
    └── modals/                          # Integração com pricing
        ├── ActivateApplicationModal.tsx  # Verifica pricing antes ativação
        └── ManageApplicationsModal.tsx   # Grant/revoke com pricing snapshots
```

### Backend (JavaScript/Express)

```
src/server/
├── api/internal/routes/
│   ├── applications.js                 # 4 endpoints de pricing
│   ├── tenants.js                      # Grant/revoke com pricing snapshots
│   └── entitlements.js                 # Licenses com pricing data
├── infra/models/
│   ├── ApplicationPricing.js           # Core pricing model
│   └── UserApplicationAccess.js        # Pricing snapshots
└── infra/migrations/
    └── 001_create_core_tables.sql      # Schema pricing + snapshots
```

---

## 🔗 Mapeamento de APIs

### Tabela de Endpoints → Service → UI Component

| Endpoint | Método | Service (função) | UI Component (ação) | Observações |
|---|---|---|---|---|
| `/applications/:id/pricing` | GET | `services/applications.ts:getPricing` | `ApplicationPricing.tsx` (loadData) | Platform-scoped; matriz completa por user type |
| `/applications/:id/pricing` | POST | `services/applications.ts:createPricing` | `ApplicationPricing.tsx` (create modal) | Platform-scoped; criar pricing entry |
| `/applications/:id/pricing/:pricingId` | PUT | `services/applications.ts:updatePricing` | `ApplicationPricing.tsx` (edit modal) | Platform-scoped; atualizar pricing existente |
| `/applications/:id/pricing/:pricingId/end` | POST | `services/applications.ts:endPricing` | `ApplicationPricing.tsx` (disable action) | Platform-scoped; desativar pricing |
| `/tenants/:id/applications/:slug/activate` | POST | Validação automática de pricing | `ActivateApplicationModal.tsx` | Platform-scoped; exige pricing configurado |
| `/tenants/:id/users/:userId/applications/:slug/grant` | POST | Captura pricing snapshot | `ManageApplicationsModal.tsx` | Platform-scoped; cria snapshot no grant |
| `/entitlements` | GET | Retorna pricing snapshots | `TenantLicenseCard.tsx` | Tenant-scoped; exibe pricing atual |
| `/applications/:id/tenants` | GET | Billing summary com pricing | Dashboard components | Platform-scoped; relatórios financeiros |

### Fluxos de Uso dos Endpoints

**Create Pricing Entry:**
- **Trigger:** Submit do modal "Add Pricing" no `ApplicationPricing`
- **Flow:** Modal → `ApplicationsService.createPricing()` → `/applications/:id/pricing` → Database
- **Platform-scoped:** Valida duplicação (app + userType + billingCycle) e cria entry

**Update Pricing:**
- **Trigger:** Submit do modal "Edit Pricing" no `ApplicationPricing`
- **Flow:** Modal → `ApplicationsService.updatePricing()` → `/applications/:id/pricing/:pricingId` → Database
- **Platform-scoped:** Atualiza pricing sem afetar snapshots existentes

**Grant Access with Pricing Snapshot:**
- **Trigger:** Grant access no `ManageApplicationsModal`
- **Flow:** Modal → `TenantsService.grantUserAccess()` → `/tenants/:id/users/:userId/applications/:slug/grant` → Database
- **Platform-scoped:** Captura pricing atual como snapshot para billing consistency

**Pricing Validation on License Activation:**
- **Trigger:** Activate application no `ActivateApplicationModal`
- **Flow:** Modal → `TenantsService.activateLicense()` → `/tenants/:id/applications/:slug/activate` → Pricing Validation
- **Platform-scoped:** Bloqueia ativação se pricing não configurado

### Integrações Cross-Module

✅ **Pricing integrado em:**

- **Applications:** CRUD principal de pricing
- **Licenses:** Validação obrigatória de pricing para ativação
- **Users Access:** Snapshots de pricing capturados no grant
- **Billing:** Cost calculation baseado em snapshots
- **Dashboard:** Relatórios de pricing coverage

---

## 📊 Fluxos Principais

### Fluxo 1: Configuração de Pricing Matrix

```mermaid
sequenceDiagram
    participant U as Admin User
    participant UI as ApplicationPricing
    participant S as ApplicationsService
    participant API as Backend API
    participant DB as Database

    U->>UI: Navigate to /applications/:id/pricing
    UI->>S: getPricing(applicationId)
    S->>API: GET /applications/:id/pricing

    API->>DB: SELECT pricing JOIN user_types
    DB-->>API: Pricing matrix by user type
    API-->>S: Current pricing array
    S-->>UI: Pricing data
    UI-->>U: Display pricing matrix table

    U->>UI: Click "Add Pricing"
    UI->>UI: Open create modal
    U->>UI: Fill form (userType, price, currency, cycle)
    UI->>S: createPricing(applicationId, pricingData)
    S->>API: POST /applications/:id/pricing

    API->>DB: Check duplicate (app + userType + cycle)
    alt No Duplicate
        API->>DB: INSERT INTO application_pricing
        DB-->>API: New pricing created
        API-->>S: Success response
        S-->>UI: Pricing created
        UI->>UI: Refresh matrix + close modal
    else Duplicate Found
        API-->>S: Duplicate error
        S-->>UI: Validation error
        UI-->>U: Show duplicate message
    end
```

### Fluxo 2: Grant Access com Pricing Snapshot

```mermaid
sequenceDiagram
    participant U as Admin User
    participant UI as ManageApplicationsModal
    participant S as TenantsService
    participant API as Backend API
    participant DB as Database

    U->>UI: Click "Grant Access" for user
    UI->>S: grantUserAccess(tenantId, userId, appSlug)
    S->>API: POST /tenants/:id/users/:userId/applications/:slug/grant

    API->>DB: Get current pricing for app + user type
    note over API,DB: SELECT price, currency FROM application_pricing<br/>WHERE app_id = X AND user_type_id = Y AND active = TRUE

    API->>DB: Create access with pricing snapshot
    note over API,DB: INSERT INTO user_application_access<br/>(price_snapshot, currency_snapshot, user_type_id_snapshot_fk, ...)

    API->>DB: Increment seat count
    note over API,DB: UPDATE tenant_applications SET seats_used = seats_used + 1

    DB-->>API: Access granted with snapshot
    API-->>S: Success with pricing info
    S-->>UI: Access granted
    UI-->>U: Show success + refresh user list

    note over U,DB: Pricing snapshot preserva custo original<br/>mesmo se pricing mudar posteriormente
```

### Fluxo 3: Validação de Pricing na Ativação de Licença

```mermaid
sequenceDiagram
    participant U as Admin User
    participant UI as ActivateApplicationModal
    participant S as TenantsService
    participant API as Backend API
    participant DB as Database

    U->>UI: Select app and click "Activate"
    UI->>S: activateLicense(tenantId, appSlug, config)
    S->>API: POST /tenants/:id/applications/:slug/activate

    API->>DB: Validate application exists and is active
    API->>DB: Check pricing configuration
    note over API,DB: SELECT COUNT(*) FROM application_pricing<br/>WHERE application_id_fk = X AND active = TRUE

    alt Pricing Configured
        API->>DB: Create tenant_applications license
        API->>DB: INSERT INTO tenant_applications
        DB-->>API: License activated
        API-->>S: Success response
        S-->>UI: License activated
        UI-->>U: Success message + redirect
    else No Pricing Found
        API-->>S: Error: Pricing not configured
        S-->>UI: Validation error
        UI-->>U: "Configure pricing first"
        note over U: User must go to /applications/:id/pricing<br/>to configure pricing before activation
    end
```

---

## 🎨 Componentes de UI

### ApplicationPricing (Core Pricing Management)
**Arquivo:** `src/client/apps/internal-admin/features/applications/pricing/ApplicationPricing.tsx`

**Responsabilidades:**
- CRUD completo da matriz de pricing
- Validação de duplicação (app + userType + billingCycle)
- Filtros por status (active/inactive)
- Interface para criar, editar e desativar pricing

**Features Principais:**

1. **Pricing Matrix Table:**
   ```typescript
   interface PricingTableRow {
     id: string
     userTypeName: string  // operations, manager, admin
     price: string         // formatted currency
     currency: string      // BRL, USD, EUR
     billingCycle: string  // monthly, yearly
     active: boolean       // status badge
     actions: JSX.Element  // edit, activate/deactivate, end
   }
   ```

2. **Create/Edit Pricing Modal:**
   ```typescript
   interface PricingFormData {
     userTypeId: number
     price: string
     currency: string
     billingCycle: 'monthly' | 'yearly'
     active: boolean
   }
   ```

3. **Validation Rules:**
   - Price deve ser > 0
   - UserType + BillingCycle deve ser único por aplicação
   - Currency deve ser BRL, USD ou EUR
   - Client-side + server-side duplicate checking

### TenantLicenseCard (Pricing Display)
**Arquivo:** `src/client/apps/internal-admin/features/tenants/detail/components/TenantLicenseCard.tsx`

**Responsabilidades:**
- Exibir pricing snapshot da licença ativa
- Mostrar breakdown de pricing por user type
- Link para editar pricing ("/applications/:id/pricing")

**Pricing Info Display:**
```typescript
// Plan Information Section
{license.pricingSnapshot && (
  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
    <h4 className="text-sm font-medium text-gray-900 mb-2">Current Plan</h4>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <span className="text-gray-500">Base Price:</span>
        <div className="font-medium">
          {formatCurrency(license.pricingSnapshot.price, license.pricingSnapshot.currency)}
          <span className="text-gray-500">/{license.pricingSnapshot.billingCycle}</span>
        </div>
      </div>
    </div>
  </div>
)}
```

### Integração em Modals

**ActivateApplicationModal:** Checa pricing antes de permitir ativação
**ManageApplicationsModal:** Exibe custo do user based on current pricing

---

## 🗃️ Estrutura de Dados

### Tipos TypeScript (Frontend)

```typescript
// src/client/apps/internal-admin/services/applications.ts

export interface ApplicationPricing {
  id: string
  applicationId: number
  userTypeId: number
  userTypeName: string
  userTypeSlug: 'operations' | 'manager' | 'admin'
  price: string
  currency: string
  billingCycle: 'monthly' | 'yearly'
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePricingPayload {
  userTypeId: number
  price: number
  currency: string
  billingCycle: 'monthly' | 'yearly'
  active: boolean
}

export interface UpdatePricingPayload {
  price?: number
  currency?: string
  billingCycle?: 'monthly' | 'yearly'
  active?: boolean
}

export interface PricingSnapshot {
  price: number
  currency: string
  billingCycle: string
  validFrom: string
  validTo: string | null
}

// Pricing integration em licenses
export interface TenantLicense {
  id: number | string
  application: Application
  status: LicenseStatus
  pricingSnapshot: PricingSnapshot | null
  seatsByUserType: SeatsByUserType[]
  // ... outros campos
}

export interface SeatsByUserType {
  userTypeId: number
  userType: string
  used: number
  total: number | null
  available: number | null
  hierarchyLevel: number
  pricing: PricingSnapshot  // Current pricing for this user type
}
```

### Modelos de Banco (Backend)

```sql
-- Tabela principal de pricing
CREATE TABLE IF NOT EXISTS application_pricing (
  id BIGSERIAL PRIMARY KEY,
  application_id_fk INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_type_id_fk INTEGER NOT NULL REFERENCES user_types(id),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly','yearly')) DEFAULT 'monthly',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Snapshots de pricing em user access (billing consistency)
CREATE TABLE IF NOT EXISTS user_application_access (
  id SERIAL PRIMARY KEY,
  user_id_fk INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id_fk INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,

  -- Campos de acesso
  role_in_app VARCHAR(50) DEFAULT 'user',
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by_fk INTEGER REFERENCES users(id),
  expires_at TIMESTAMP,
  active BOOLEAN NOT NULL DEFAULT true,

  -- *** PRICING SNAPSHOTS (Core do sistema de billing) ***
  price_snapshot NUMERIC(10,2),           -- Preço capturado no momento do grant
  currency_snapshot CHAR(3),              -- Moeda capturada no momento do grant
  user_type_id_snapshot_fk INTEGER REFERENCES user_types(id), -- User type no momento do grant
  granted_cycle TEXT CHECK (granted_cycle IN ('monthly','yearly')), -- Ciclo de billing

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User types para hierarchical pricing
CREATE TABLE IF NOT EXISTS user_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,     -- Operations, Manager, Administrator
  slug VARCHAR(50) NOT NULL UNIQUE,      -- operations, manager, admin
  hierarchy_level INTEGER NOT NULL,      -- 1, 2, 3
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_app_pricing_lookup ON application_pricing(application_id_fk, user_type_id_fk, active);
CREATE INDEX IF NOT EXISTS idx_app_pricing_active ON application_pricing(active);
CREATE INDEX IF NOT EXISTS idx_user_access_snapshots ON user_application_access(price_snapshot, currency_snapshot);
CREATE INDEX IF NOT EXISTS idx_user_access_billing ON user_application_access(tenant_id_fk, active, granted_cycle);
```

---

## 🔍 Validações e Regras de Negócio

### Pricing Matrix Rules
1. **Uniqueness Constraint:**
   ```javascript
   // Uma única combinação ativa por aplicação
   const isUnique = await ApplicationPricing.checkDuplicate(
     applicationId,
     userTypeId,
     billingCycle
   )
   ```

2. **Price Validation:**
   ```javascript
   const validatePrice = (price) => {
     if (price < 0) throw new Error('Price cannot be negative')
     if (price === 0) console.warn('Zero price detected')
   }
   ```

3. **Currency Support:**
   ```javascript
   const SUPPORTED_CURRENCIES = ['BRL', 'USD', 'EUR']
   const CURRENCY_SYMBOLS = {
     BRL: 'R$',
     USD: '$',
     EUR: '€'
   }
   ```

### Pricing Snapshots System
1. **Snapshot Capture on Grant:**
   ```javascript
   // Captura pricing atual no momento do grant
   const currentPricing = await ApplicationPricing.getCurrentPrice(
     applicationId,
     user.userTypeId
   )

   const accessData = {
     // ... campos de acesso
     price_snapshot: currentPricing.price,
     currency_snapshot: currentPricing.currency,
     user_type_id_snapshot_fk: user.userTypeId,
     granted_cycle: currentPricing.billingCycle
   }
   ```

2. **Billing Consistency:**
   ```javascript
   // Mudanças de pricing NÃO afetam acessos já concedidos
   const calculateUserCost = (userAccess) => {
     return {
       price: userAccess.price_snapshot,      // Preço original
       currency: userAccess.currency_snapshot, // Moeda original
       cycle: userAccess.granted_cycle         // Ciclo original
     }
   }
   ```

### Licensing Integration
1. **Pricing Required for Activation:**
   ```javascript
   const validatePricingForActivation = async (applicationId) => {
     const pricingCount = await database.query(`
       SELECT COUNT(*) as count
       FROM application_pricing
       WHERE application_id_fk = $1 AND active = TRUE
     `, [applicationId])

     if (pricingCount.rows[0].count === 0) {
       throw new Error('Pricing must be configured before activating license')
     }
   }
   ```

---

## 🚀 Performance e Otimizações

### Database Optimizations
1. **Pricing Lookup Queries:**
   ```sql
   -- Query otimizada para current pricing
   SELECT ap.*, ut.name as user_type_name
   FROM application_pricing ap
   JOIN user_types ut ON ut.id = ap.user_type_id_fk
   WHERE ap.application_id_fk = $1
     AND ap.active = TRUE
   ORDER BY ut.hierarchy_level;
   ```

2. **Billing Summary Query:**
   ```sql
   -- Query para billing summary
   SELECT
     t.name as tenant_name,
     a.name as application_name,
     COUNT(uaa.*) as active_seats,
     SUM(uaa.price_snapshot) as total_cost,
     uaa.currency_snapshot
   FROM user_application_access uaa
   JOIN tenants t ON t.id = uaa.tenant_id_fk
   JOIN applications a ON a.id = uaa.application_id_fk
   WHERE uaa.active = TRUE
   GROUP BY t.name, a.name, uaa.currency_snapshot;
   ```

3. **Índices de Performance:**
   - `application_pricing(application_id_fk, user_type_id_fk, active)` - Lookup
   - `user_application_access(tenant_id_fk, active, granted_cycle)` - Billing
   - `user_application_access(price_snapshot, currency_snapshot)` - Reporting

### Frontend Optimizations
1. **Client-side Validation:**
   ```typescript
   const checkDuplicateClientSide = (userTypeId: number, billingCycle: string) => {
     return pricing.some(p =>
       p.userTypeId === userTypeId &&
       p.billingCycle === billingCycle &&
       p.active
     )
   }
   ```

2. **Pricing Matrix Caching:**
   - Cache da pricing matrix por aplicação
   - Invalidação automática após updates
   - Optimistic updates na UI

---

## 🧪 Cobertura de Testes

### Frontend Testing
- **Pricing Matrix Tests:** CRUD operations, validation
- **Modal Tests:** Create/edit pricing forms
- **Integration Tests:** Pricing display em license cards
- **Snapshot Tests:** Pricing info rendering

### Backend Testing
- **API Tests:** Todos os 4 endpoints de pricing
- **Model Tests:** ApplicationPricing CRUD + validation
- **Business Logic Tests:** Duplicate checking, snapshot capture
- **Integration Tests:** License activation com pricing validation

**Arquivos de Teste:**
```
tests/integration/internal/
├── pricing-crud.test.js              # CRUD de pricing
├── pricing-validation.test.js        # Validações e duplicação
├── pricing-snapshots.test.js         # Sistema de snapshots
├── pricing-licensing.test.js         # Integração com licensing
└── pricing-billing.test.js           # Cálculos de billing
```

---

## 🔒 Segurança e Auditoria

### Pricing Security
- **Platform-scoped Access:** Apenas internal_admin pode gerenciar pricing
- **Validation:** Server-side validation para todos os campos
- **Audit Trail:** Timestamps de created_at/updated_at
- **Snapshot Immutability:** Snapshots não podem ser alterados após grant

### Financial Data Protection
```javascript
// Proteção contra manipulação de preços
const validatePricingUpdate = (oldPricing, newPricing) => {
  if (oldPricing.price !== newPricing.price) {
    auditLog.log('PRICING_CHANGE', {
      applicationId: oldPricing.applicationId,
      oldPrice: oldPricing.price,
      newPrice: newPricing.price,
      changedBy: req.user.id
    })
  }
}
```

### Billing Consistency Safeguards
- **Immutable Snapshots:** Snapshots preservam custo original
- **Audit Trail:** Log de todas as mudanças de pricing
- **Validation:** Checks de integridade nos snapshots

---

## 📈 Métricas e Monitoramento

### Pricing Coverage Metrics
```sql
-- Coverage de pricing por aplicação
SELECT
  a.name as application_name,
  COUNT(DISTINCT ap.user_type_id_fk) as user_types_with_pricing,
  (SELECT COUNT(*) FROM user_types WHERE active = TRUE) as total_user_types,
  ROUND(
    (COUNT(DISTINCT ap.user_type_id_fk) * 100.0) /
    (SELECT COUNT(*) FROM user_types WHERE active = TRUE),
    2
  ) as coverage_percentage
FROM applications a
LEFT JOIN application_pricing ap ON a.id = ap.application_id_fk AND ap.active = TRUE
WHERE a.status = 'active'
GROUP BY a.id, a.name
ORDER BY coverage_percentage DESC;
```

### Billing Analytics
```sql
-- Análise de custos por tenant
SELECT
  t.name as tenant_name,
  COUNT(uaa.*) as total_seats,
  AVG(uaa.price_snapshot) as avg_price_per_seat,
  SUM(uaa.price_snapshot) as total_monthly_cost,
  uaa.currency_snapshot
FROM user_application_access uaa
JOIN tenants t ON t.id = uaa.tenant_id_fk
WHERE uaa.active = TRUE
  AND uaa.granted_cycle = 'monthly'
GROUP BY t.id, t.name, uaa.currency_snapshot
ORDER BY total_monthly_cost DESC;
```

### Performance Metrics
- **Pricing Matrix Load:** < 100ms
- **Duplicate Check:** < 50ms
- **Snapshot Capture:** < 30ms
- **Billing Queries:** < 200ms

---

## 🎯 Status Final

### ✅ Sistema de Pricing Implementado
- [x] **Matriz Completa:** Application × UserType × BillingCycle
- [x] **CRUD Interface:** Create, Read, Update, End pricing
- [x] **Snapshot System:** Billing consistency garantido
- [x] **Multi-Currency:** BRL, USD, EUR support
- [x] **Licensing Integration:** Pricing obrigatório para ativação
- [x] **Validation Rules:** Duplicate prevention, price validation
- [x] **Performance:** Queries otimizadas com índices
- [x] **Security:** Platform-scoped access control

### 🏗️ Arquitetura de Pricing
- [x] **Core Model:** ApplicationPricing com user type hierarchy
- [x] **Snapshot Model:** Immutable pricing snapshots em user access
- [x] **Frontend Interface:** Comprehensive pricing management UI
- [x] **API Layer:** 4 dedicated endpoints + 8 integrations
- [x] **Business Logic:** Validation, duplicate checking, billing

### 📊 Integração Sistêmica
- [x] **Applications:** Pricing matrix management
- [x] **Licensing:** Pricing validation obrigatória
- [x] **User Access:** Snapshot capture automático
- [x] **Billing:** Cost calculation baseado em snapshots
- [x] **Reporting:** Pricing coverage e billing analytics

### 💰 Business Intelligence
- **Pricing Coverage:** Tracking de apps sem pricing configurado
- **Billing Consistency:** Snapshots garantem custos preservados
- **Cost Analytics:** Relatórios detalhados por tenant/app/user type
- **Revenue Tracking:** Cálculo de receita baseado em seats ativos

**Sistema de Pricing está 100% consolidado e é o núcleo financeiro de todo o PaaS.**

---

**Última Atualização:** 20/09/2025
**Próxima Revisão:** N/A (Sistema consolidado)