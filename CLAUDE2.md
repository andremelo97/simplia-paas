# CLAUDE2.md - Contexto Técnico Detalhado

Este arquivo contém documentação técnica detalhada e histórico de implementações do projeto Simplia PaaS.

## 📊 Detalhamento de Pastas e Arquivos

### 📁 `src/server/` - Backend Express.js

#### 🌐 `api/` - Camada de API
- **`internal/routes/`**: API administrativa interna
  - **`auth.js`**: Login, registro, gestão de sessões
  - **`users.js`**: CRUD administrativo de usuários com bulk operations
  - **`tenant-users.js`**: **NOVO** - API tenant-scoped para operações de usuários por tenant
  - **`applications.js`**: Catálogo de aplicações e gestão
  - **`entitlements.js`**: Gestão de licenças tenant e acesso de usuários
  - **`audit.js`**: Logs de auditoria e relatórios de compliance
  - **`platform-auth.js`**: Autenticação de plataforma
  - **`tenants.js`**: Gestão administrativa de tenants

#### 🏗️ `infra/` - Camada de Infraestrutura
- **`db/database.js`**: Singleton de conexão PostgreSQL com pool, suporte a multi-tenancy via `search_path`
- **`middleware/`**: Processamento de requisições
  - **`auth.js`**: Middleware de autenticação JWT com validação de tokens, verificação de status, injeção de contexto `req.user` com `allowedApps[]`
  - **`tenant.js`**: Resolução de tenant via header `x-tenant-id` ou subdomínio, validação e injeção de contexto `req.tenant`  
  - **`appAccess.js`**: Autorização enterprise em 5 camadas (License→Seat→User→Role→Audit) com logging detalhado
  - **`platformRole.js`**: Validação de roles de plataforma para APIs internas
- **`models/`**: Abstrações de banco com CRUD tenant-aware
  - **`User.js`**: **ATUALIZADO** - CRUD com `tenant_id_fk` numérico, modelo 1:1, string legacy deprecated
  - **`TenantUser.js`**: Relacionamento many-to-many entre tenants e usuários (não usado no modelo 1:1)
  - **`Application.js`**: Catálogo de aplicações/produtos disponíveis na plataforma
  - **`Tenant.js`**: Gestão completa de tenants com validação e isolamento de schema
  - **`TenantApplication.js`**: Licenças por tenant com controle de vigência, limites de usuários e assentos
  - **`UserApplicationAccess.js`**: Acesso granular - quais usuários podem usar quais apps
  - **`UserType.js`**: Hierarquia de usuários (operations < manager < admin) com permissões
  - **`AccessLog.js`**: Logs de auditoria com IP, User-Agent, contexto completo para compliance
- **`migrations/`**: Evolução do schema de banco
  - **`001_create_core_tables.sql`**: Todas as tabelas core com relacionamentos, campos de auditoria e modelo 1:1 Users↔Tenants
  - **`002_create_indexes.sql`**: Estratégia completa de indexação + documentação de consistency constraints
  - **`003_seed_initial_data.sql`**: Dados essenciais com `tenant_id_fk` populado e schemas de tenant
  - **`_backup/`**: Migrações antigas preservadas
- **`scripts/`**: Utilitários de banco
  - **`runMigrations.js`**: Executor de migrações SQL em ordem alfabética
  - **`db-create-test.js`**: Criação automática de database de teste
  - **`db-drop-test.js`**: Limpeza completa de database de teste
- **`authService.js`**: Hash de senhas (bcrypt), geração/validação JWT, lógica de entitlements
- **`userService.js`**: Regras de negócio para gestão de usuários

#### 🎯 `core/` - Lógica de Negócio (Futuro)
Reservado para regras de negócio puras sem dependências de HTTP/Database

#### 🚀 Arquivos Raiz
- **`app.js`**: Configuração Express (separado para testes)
- **`index.js`**: Entry point do servidor Express

### 📁 `src/client/` - Frontend React + TypeScript

#### 🌐 `apps/` - Arquitetura Multi-Aplicação
- **`internal-admin/`**: Painel administrativo para internal.simplia.com
  - **`routes/`**: Rotas específicas (dashboard, tenants, users, applications, entitlements, audit)
  - **`features/`**: Funcionalidades de negócio (licensing, user management, etc.)
  - **`components/`**: Componentes específicos do painel administrativo
  - **`layouts/`**: Layouts e estruturas de página do admin
  - **`services/`**: Cliente HTTP para `/internal/api/v1`
  - **`store/`**: Estado global (autenticação platformRole, tenant selecionado)
  - **`assets/`**: Assets específicos do painel
  - **`app.tsx`**: Componente principal (placeholder)

- **`tq-client/`**: Aplicação do produto Transcription Quote
  - **`routes/`**: Rotas específicas do produto TQ
  - **`features/`**: Funcionalidades específicas do TQ
  - **`components/`**: Componentes específicos do TQ
  - **`services/`**: Cliente HTTP para `/api/v1/tq`
  - **`app.tsx`**: Componente principal (placeholder)

- **`crm-client/`** e **`automation-client/`**: Estrutura similar para produtos CRM e Automation (placeholders)

#### 🔗 `common/` - Componentes e Utilitários Compartilhados
- **`ui/`**: Design system e componentes visuais base
- **`components/`**: Componentes de negócio reutilizáveis entre apps
- **`hooks/`**: React hooks compartilhados
- **`utils/`**: Funções utilitárias e helpers
- **`constants/`**: Constantes e configurações globais

#### ⚙️ `config/` - Configuração Global
- **`env.ts`**: Gerenciamento de variáveis de ambiente (placeholder)
- **`http.ts`**: Configuração de clientes HTTP e interceptors (placeholder)

#### 🚀 `main.tsx`
Entry point principal da aplicação React com roteamento global (placeholder)

### 📁 `src/shared/` - Código Compartilhado
#### 📝 `types/`
- **`tenant.js`**: Utilitários e validadores para multi-tenancy
- **`user.js`**: Tipos, validadores, factory functions para usuários e JWT

## 🔐 Sistema de Licenciamento Multi-Camadas

### Tabelas do Sistema Enterprise (10 tabelas)

| Tabela | Colunas | Propósito |
|--------|---------|-----------|
| `tenants` | 8 | Registry de tenants com schema mapping e audit fields |
| `users` | 14 | Usuários com **1:1 tenant relationship** via `tenant_id_fk` (FK numérica) |
| `user_types` | 9 | Hierarquia de usuários com pricing (operations < manager < admin) |
| `applications` | 10 | Catálogo com slugs padronizados (tq, pm, billing, reports) |
| **`application_pricing`** | **10** | **🆕 Matriz App × UserType com versionamento e vigências** |
| `tenant_applications` | 14 | Licenças por tenant com vigência, limites globais de seats (`user_limit`/`seats_used`) |
| `user_application_access` | 16 | **Snapshots de pricing** (`price_snapshot`, `currency_snapshot`, `user_type_id_snapshot`) |
| `application_access_logs` | 13 | Auditoria completa com IP, User-Agent, API path, decision reason |
| `tenant_addresses` | 13 | Endereços institucionais com constraints primários por tipo |
| `tenant_contacts` | 13 | Contatos organizacionais com campo `department` e validação E.164 |
| `v_tenant_app_seats_by_type` | View | Agregação de assentos por tenant/app/user_type com totais de preço |

**Performance**: 20+ índices otimizados • 9 relacionamentos FK • Campos de auditoria completos

## 💵 Pricing por Seat (App × UserType) - Sistema Implementado

### Estrutura de Dados

#### Tabela `application_pricing`
```sql
CREATE TABLE application_pricing (
  id BIGSERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_type_id  INTEGER NOT NULL REFERENCES user_types(id),
  price NUMERIC(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly','yearly')) DEFAULT 'monthly',
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to   TIMESTAMPTZ NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, user_type_id, valid_from)
);
```

#### Alterações em `user_application_access` (snapshots de preço)
```sql
ALTER TABLE user_application_access
  ADD COLUMN price_snapshot NUMERIC(10,2),
  ADD COLUMN currency_snapshot CHAR(3),
  ADD COLUMN user_type_id_snapshot INTEGER REFERENCES user_types(id),
  ADD COLUMN granted_cycle TEXT CHECK (granted_cycle IN ('monthly','yearly'));
```

#### View de apoio `v_tenant_app_seats_by_type`
```sql
CREATE OR REPLACE VIEW v_tenant_app_seats_by_type AS
SELECT
  uaa.tenant_id_fk,
  uaa.application_id,
  COALESCE(uaa.user_type_id_snapshot, u.user_type_id) AS user_type_id,
  COUNT(*)::INT AS seats_count,
  SUM(COALESCE(uaa.price_snapshot, 0))::NUMERIC(10,2) AS total_price
FROM user_application_access uaa
JOIN users u ON u.id = uaa.user_id
WHERE uaa.is_active = TRUE
GROUP BY 1,2,3;
```

### Matriz de Preços Implementada (Exemplo)
```
TQ (Transcription Quote):    operations($35), manager($55), admin($80)
PM (Patient Management):     operations($25), manager($40), admin($60)  
Billing System:              operations($30), manager($50), admin($70)
Reports Dashboard:           operations($20), manager($35), admin($50)
```

### Fluxo Grant/Revoke com Snapshots

#### Grant (Concessão de Acesso)
1. **Validação de Licença**: Tenant possui licença ativa para a aplicação?
2. **Verificação de Assentos**: `seats_used < user_limit` (limite global por app)?
3. **Lookup de Preço**: Busca preço vigente na matriz App × UserType
4. **Captura de Snapshot**: Salva `price_snapshot`, `currency_snapshot`, `user_type_id_snapshot`, `granted_cycle`
5. **Incremento de Seat**: `TenantApplication.incrementSeat()` → `seats_used += 1`
6. **Auditoria**: Log com decisão e contexto completo

#### Revoke (Revogação de Acesso)  
1. **Inativação**: `is_active = false` no registro `user_application_access`
2. **Liberação de Seat**: `TenantApplication.decrementSeat()` → `seats_used -= 1`
3. **Auditoria**: Log da revogação

### ⚠️ Deprecações Importantes
- **`applications.price_per_user`**: **NÃO USAR** para leitura de preço. Toda precificação deve consultar a matriz `application_pricing`

## 🔗 Endpoints de Pricing e Grant/Revoke - Implementados

### Pricing (Applications) - Platform Scoped
Requer autenticação + `platform_role: internal_admin`

```http
GET    /internal/api/v1/applications/:id/pricing
POST   /internal/api/v1/applications/:id/pricing  
PUT    /internal/api/v1/applications/:id/pricing/:pricingId
```

**Exemplos:**
```bash
# Listar pricing vigente para aplicação TQ
GET /internal/api/v1/applications/1/pricing?current=true

# Agendar novo preço (versionamento)
POST /internal/api/v1/applications/1/pricing
{
  "userTypeId": 2,
  "price": 65.00,
  "currency": "BRL", 
  "billingCycle": "monthly",
  "validFrom": "2025-02-01T00:00:00Z"
}

# Encerrar preço vigente (definir valid_to)
PUT /internal/api/v1/applications/1/pricing/123
{
  "validTo": "2025-01-31T23:59:59Z"
}
```

### Grant/Revoke (Users) - Tenant Scoped
Requer autenticação + header `x-tenant-id` + role `admin`

```http
POST   /internal/api/v1/users/:userId/apps/grant
DELETE /internal/api/v1/users/:userId/apps/revoke
```

**Fluxo Grant com Snapshot:**
```bash
POST /internal/api/v1/users/456/apps/grant
Headers: x-tenant-id: tenant_default
{
  "applicationSlug": "tq",
  "roleInApp": "user"
}

# Sistema automaticamente:
# 1. Valida tenant_applications.user_limit vs seats_used  
# 2. Busca pricing vigente (App × UserType do usuário)
# 3. Captura snapshot: price_snapshot, currency_snapshot, user_type_id_snapshot
# 4. Incrementa seats_used += 1
# 5. Log de auditoria com contexto completo
```

**Fluxo Revoke:**
```bash
DELETE /internal/api/v1/users/456/apps/revoke  
Headers: x-tenant-id: tenant_default
{
  "applicationSlug": "tq"
}

# Sistema automaticamente:
# 1. Inativa registro: is_active = false
# 2. Decrementa seats_used -= 1  
# 3. Log de auditoria da revogação
```

### Regras de Negócio Implementadas
- **Seat Limit Global**: `tenant_applications.user_limit=NULL` → ilimitado; caso contrário, `seats_used < user_limit` obrigatório
- **Pricing Obrigatório**: Falta de pricing vigente para App × UserType → **HTTP 422** "pricing not configured"
- **Auditoria Completa**: Todos grants/revokes registram IP, User-Agent, `api_path`, e `reason` detalhado
- **Snapshots**: Preços capturados no grant garantem consistência de faturamento mesmo com mudanças futuras

## 📊 Faturamento (Visão Operacional)

### Sistema de Billing Implementado
- **Cobrança mensal** com base em grants **ativos** no período de faturamento
- **Snapshots preservam consistência** - preços capturados no grant, não atuais
- **View `v_tenant_app_seats_by_type`** para relatórios financeiros por tenant/app/user_type
- **Método `ApplicationPricing.getBillingSummary(tenantId, forDate)`** para cálculos automáticos

### Políticas de Cobrança
- **Mudanças de user_type no meio do ciclo**: Recomendação de refletir no próximo ciclo ou revogar+conceder novo grant
- **Tenants inativos**: Seats ativos continuam sendo cobrados até revogação explícita
- **Histórico preservado**: Snapshots mantêm rastreabilidade completa para auditoria

### Exemplo de Relatório de Faturamento
```sql
-- Faturamento por tenant para janeiro 2025
SELECT 
  t.name as tenant_name,
  v.application_id,
  a.name as app_name,
  v.user_type_id,
  ut.name as user_type_name,
  v.seats_count,
  v.total_price
FROM v_tenant_app_seats_by_type v
JOIN tenants t ON t.id = v.tenant_id_fk  
JOIN applications a ON a.id = v.application_id
JOIN user_types ut ON ut.id = v.user_type_id
WHERE v.seats_count > 0
ORDER BY t.name, a.name, ut.hierarchy_level;
```

## 🧪 Testes e Qualidade - Sistema de Pricing

### Casos de Teste Implementados

#### **Pricing Matrix Tests** (`tests/integration/internal/pricing-system.test.js`)
- ✅ **Grant com Snapshot e Seat Limit Global** - Valida captura de preço e incremento de seats_used
- ✅ **Pricing Matrix Lookup** - Testa busca de preços vigentes por App × UserType  
- ✅ **Revoke libera Seat** - Confirma decremento correto de seats_used
- ✅ **Seat Limit Enforcement** - Valida negação quando excede user_limit
- ✅ **Pricing Not Configured** - HTTP 422 quando falta pricing para combinação
- ✅ **Audit Logs Completos** - Verifica logs com pricing context e decision reason

#### **Authorization Tests** (`tests/integration/internal/critical-validation.test.js`)  
- ✅ **Layer 1: Tenant License Check** - Tenant possui licença ativa?
- ✅ **Layer 2: Seat Availability** - Dentro do limite global de assentos?  
- ✅ **Layer 3: User Access Check** - Usuário tem permissão individual?
- ✅ **Layer 4: Role Validation** - Role suficiente para o recurso?
- ✅ **Layer 5: Audit Logging** - Registra tentativa com contexto completo

#### **API Validation Tests** (`tests/integration/internal/internal-api-validation.test.js`)
- ✅ **Pricing CRUD Operations** - GET/POST/PUT para application pricing
- ✅ **Grant/Revoke Endpoints** - Validação completa dos fluxos
- ✅ **Authentication & Authorization** - platform_role + tenant headers
- ✅ **Error Handling** - Códigos HTTP corretos e mensagens estruturadas

### Executar Testes de Pricing
```bash
# Testes específicos do sistema de pricing
npx jest tests/integration/internal/pricing-system.test.js

# Testes de validação das 5 camadas de autorização
npx jest tests/integration/internal/critical-validation.test.js

# Todos os testes da API interna
npx jest tests/integration/internal/

# Padrão específico de testes
npx jest --testNamePattern="Grant.*snapshot.*seat"
```

### Cobertura de Testes
- **Pricing System**: 6/8 testes passando (75% de cobertura core)
- **Authorization Layers**: 9/10 testes passando (90% de cobertura crítica)  
- **API Endpoints**: 18/21 testes passando (85% de cobertura endpoints)
- **Edge Cases**: Validação de limites, pricing ausente, tenant inexistente

## Enterprise Features Implementados

- **Audit Trail**: Todas database tables com campos `active`, `created_at`, `updated_at` e triggers automáticos PostgreSQL
- **Performance Optimizada**: 20+ indexes para queries críticas, JWT com app slugs (substituindo IDs) para autorização baseada em strings
- **Compliance Ready**: Logs de acesso completos com IP, User-Agent, API path, e razões detalhadas de negação
- **Seat Management**: Limites de usuários e tracking de assentos por tenant por aplicação com verificações de disponibilidade
- **Foreign Key Integrity**: 9 relacionamentos FK garantem integridade referencial em todas entidades (incluindo FKs numéricas de tenant)
- **Multi-Status Support**: Aplicações e tenants suportam múltiplos estados (active, trial, expired, suspended)
- **Automatic Timestamps**: Triggers PostgreSQL atualizam automaticamente `updated_at` em qualquer modificação de registro
- **Friendly Error Handling**: Mensagens de erro user-facing com acessibilidade adequada e telemetria
- **Tenant Consistency**: Validação no nível de aplicação previne corrupção de dados cross-tenant nas tabelas de acesso de usuários

## Detalhes Técnicos de Implementações

### Users ↔ Tenants 1:1 Model (Latest Implementation)

#### Key Changes
- **Numeric FK Primary**: `users.tenant_id_fk` references `tenants(id)` - eliminates fragile string coupling
- **Legacy Compatibility**: `users.tenant_id` string field deprecated but kept for transition
- **Application-Level Validation**: Code ensures `user_application_access.tenant_id_fk` matches user's tenant
- **Unique Constraints**: `UNIQUE(tenant_id_fk, user_id, application_id)` in user_application_access
- **Performance**: Indexes optimized for numeric FK lookups instead of string comparisons

### Database Migrations

#### Migration Structure (Reorganized)
The migration system has been reorganized from 5 fragmented files into 3 well-organized migrations:

#### **001_create_core_tables.sql** - Foundation
- **All 10 core tables**: tenants, users, user_types, applications, tenant_applications, user_application_access, application_access_logs, application_pricing, tenant_addresses, tenant_contacts
- **Users ↔ Tenants 1:1**: `users.tenant_id_fk` numeric FK + `user_application_access.tenant_id_fk`
- **Pricing System**: `application_pricing` table with App × UserType matrix and price snapshots in `user_application_access`
- **Complete relationships**: All foreign keys and constraints with numeric FKs
- **Legacy Compatibility**: `tenant_id` string fields deprecated but kept for compatibility
- **Audit fields**: `active`, `created_at`, `updated_at` on all tables  
- **Comprehensive comments**: Full documentation on tables and columns
- **Tenant Extensions**: Address and contact management with type-based primary constraints

#### **002_create_indexes.sql** - Performance
- **Organized by purpose**: Primary lookup, performance, audit, business logic
- **20+ optimized indexes**: Including composite and partial indexes for numeric FKs
- **Authorization optimization**: Specific indexes for 5-layer auth flow with `tenant_id_fk`
- **Tenant Consistency**: Documentation for application-level validation constraints
- **Audit performance**: Indexes for compliance and security queries

#### **003_seed_initial_data.sql** - Essential Data
- **User types hierarchy**: operations (0) < manager (1) < admin (2)  
- **Application catalog**: tq, pm, billing, reports with standardized slugs
- **Default tenants**: Development and testing tenants
- **Sample users**: Admin and manager users for testing
- **Initial licenses**: TQ application licensed for default tenants
- **Pricing matrix**: Complete App × UserType pricing with differentiated rates
- **Sample tenant data**: Includes sample addresses and contacts with department field

#### **004_fix_default_tenant.sql** - Default Tenant Schema Fix
- **Schema Creation**: Creates `tenant_default` schema for proper tenant isolation
- **Tenant Update**: Updates default tenant to use `tenant_default` instead of `public` schema

#### **005_fix_admin_password.sql** - Admin Password Fix
- **Password Hash**: Updates admin user password hash to work correctly with bcrypt
- **Admin User**: Fixes authentication for `consultoriasimplia@gmail.com` admin user

### Migration Benefits
- ✅ **Organized structure**: 5 logical migrations (3 core + 2 fixes) with clear purposes
- ✅ **Better organization**: Tables → Indexes → Seeds → Schema Fixes → Admin Setup
- ✅ **Complete documentation**: Every table and field documented
- ✅ **Atomic operations**: Each migration has single clear purpose
- ✅ **Backup preserved**: Old migrations saved in `_backup/` folder

## Development Notes Detalhados

- **Server Entry Point**: `src/server/index.js` - Express app bootstrap, `src/server/app.js` - Express configuration (separated for testing)
- **Health Check**: `GET /health` endpoint available for monitoring
- **Example Routes**: Transcription Quote routes (`/internal/api/v1/tq/*`) demonstrate the full 5-layer authorization flow
- **Application Slugs**: Use standardized slugs (`tq`, `pm`, `billing`, `reports`) not full names
- **Database Password**: Must be converted to string in database config (common PostgreSQL connection issue)
- **Migration Dependencies**: `infra/scripts/runMigrations.js` requires `dotenv` loading to access environment variables
- **Test Database Scripts**: `src/server/infra/scripts/db-create-test.js` and `db-drop-test.js` handle automatic test DB lifecycle
- **Testing Architecture**: Server app separated from bootstrap for testability, test DB creation is gracefully handled when PostgreSQL unavailable locally
- **Client Entry Point**: `src/client/main.tsx` - React app bootstrap with React Router configured for internal-admin app
- **Frontend Environment Variables**: Use `VITE_` prefix for client-side environment variables  
- **Multi-App Structure**: Each client app (`internal-admin`, `tq-client`, etc.) has its own routes, features, components, and services
- **Vite Configuration**: Root set to `src/client`, requires `index.html` to be in `src/client/` directory
- **Frontend Dependencies**: React Router DOM, Tailwind CSS, Framer Motion, Lucide React, Zustand state management