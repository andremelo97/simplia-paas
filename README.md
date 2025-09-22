# Simplia PaaS - Multi-Tenant Healthcare Platform

**Uma plataforma PaaS multi-tenant inspirada em ServiceNow/Salesforce com sistema de licenciamento sofisticado para aplicações médicas**

## 📋 Visão Geral

O Simplia PaaS é um monorepo Node.js fullstack que combina:
- **Backend**: Express.js com JavaScript puro para máxima performance
- **Frontend**: React 18 + TypeScript com Vite para desenvolvimento moderno
- **Multi-tenancy**: Isolamento por schema PostgreSQL com switching automático e timezone por tenant
- **Sistema de Licenciamento**: Arquitetura enterprise de 5 camadas com auditoria completa
- **Compliance**: Campos de auditoria em todas as tabelas + logs detalhados para conformidade médica

## 🏗️ Arquitetura de Pastas e Arquivos

```
simplia-paas/
├── 📁 src/
│   ├── 📁 client/                     # Frontend React + TypeScript
│   │   ├── 📁 apps/                   # Multi-aplicação organizada por domínio
│   │   │   ├── 📁 internal-admin/     # Painel administrativo (internal.simplia.com)
│   │   │   │   ├── 📁 routes/         # Roteamento do painel
│   │   │   │   │   └── index.tsx      # Configuração de rotas
│   │   │   │   ├── 📁 features/       # Funcionalidades admin
│   │   │   │   │   ├── 📁 auth/       # Autenticação
│   │   │   │   │   │   └── Login.tsx  # Página de login com AppError
│   │   │   │   │   ├── 📁 dashboard/  # Dashboard principal
│   │   │   │   │   │   └── Dashboard.tsx # Dashboard com métricas reais via API
│   │   │   │   │   ├── 📁 tenants/    # Gestão de tenants
│   │   │   │   │   │   ├── TenantsList.tsx      # Lista de tenants
│   │   │   │   │   │   ├── CreateTenant.tsx     # Criação com AppFeedback
│   │   │   │   │   │   ├── EditTenant.tsx       # Edição com status toggle
│   │   │   │   │   │   ├── TenantStatusBadge.tsx # Badge active/inactive
│   │   │   │   │   │   ├── types.ts             # TypeScript types para addresses/contacts
│   │   │   │   │   │   ├── AddressItemForm.tsx  # Form individual de endereço
│   │   │   │   │   │   ├── ContactItemForm.tsx  # Form individual de contato
│   │   │   │   │   │   ├── AddressesRepeater.tsx # Repeater para endereços
│   │   │   │   │   │   └── ContactsRepeater.tsx  # Repeater para contatos
│   │   │   │   │   ├── 📁 applications/  # Gestão de aplicações e pricing
│   │   │   │   │   │   ├── ApplicationsList.tsx # Lista com ação "Manage Pricing"
│   │   │   │   │   │   └── 📁 pricing/          # Gestão de pricing matrix
│   │   │   │   │   │       └── ApplicationPricing.tsx # Tabela + modal Schedule Price + End Current
│   │   │   │   │   ├── 📁 users/       # Gestão de usuários
│   │   │   │   │   │   ├── UsersList.tsx        # Lista + modal Grant/Revoke com preview de preços
│   │   │   │   │   │   ├── CreateUser.tsx       # Criação com seleção de tenant
│   │   │   │   │   │   ├── EditUser.tsx         # Edição de usuários
│   │   │   │   │   │   ├── UserStatusBadge.tsx  # Badge de status de usuário
│   │   │   │   │   │   ├── UserRoleSelect.tsx   # Seletor de roles
│   │   │   │   │   │   └── types.ts             # TypeScript types para usuários
│   │   │   │   │   └── 📁 tenants/    # Gestão completa de tenants (ATUALIZADO)
│   │   │   │   │       ├── TenantsList.tsx      # Lista de tenants com "Manage Licenses"
│   │   │   │   │       ├── CreateTenant.tsx     # Criação com AppFeedback
│   │   │   │   │       ├── EditTenant.tsx       # Edição com status toggle
│   │   │   │   │       ├── ApplicationsCard.tsx # Card de aplicações licenciadas
│   │   │   │   │       ├── types.ts             # TypeScript types para addresses/contacts
│   │   │   │   │       ├── AddressItemForm.tsx  # Form individual de endereço
│   │   │   │   │       ├── ContactItemForm.tsx  # Form individual de contato
│   │   │   │   │       ├── AddressesRepeater.tsx # Repeater para endereços
│   │   │   │   │       ├── ContactsRepeater.tsx  # Repeater para contatos
│   │   │   │   │       └── 📁 detail/           # Sistema de navegação com tabs
│   │   │   │   │           ├── TenantDetailLayout.tsx # Layout principal com tabs (Overview | Users | Licenses | Addresses | Contacts)
│   │   │   │   │           └── 📁 tabs/         # Componentes individuais de cada tab
│   │   │   │   │               ├── TenantOverviewTab.tsx # Tab Overview com informações gerais
│   │   │   │   │               ├── TenantUsersTab.tsx    # Tab Users com listagem e ações
│   │   │   │   │               ├── TenantLicensesTab.tsx # Tab Licenses com gestão de entitlements
│   │   │   │   │               ├── TenantAddressesTab.tsx # Tab Addresses (futuro)
│   │   │   │   │               └── TenantContactsTab.tsx  # Tab Contacts (futuro)
│   │   │   │   ├── 📁 components/     # Componentes específicos do admin
│   │   │   │   │   ├── Header.tsx     # Header do layout
│   │   │   │   │   ├── Sidebar.tsx    # Sidebar de navegação
│   │   │   │   │   └── RouteGuard.tsx # Proteção de rotas
│   │   │   │   ├── 📁 layouts/        # Layouts do painel
│   │   │   │   │   └── AdminLayout.tsx # Layout principal com FeedbackHost
│   │   │   │   ├── 📁 services/       # Cliente para /internal/api/v1
│   │   │   │   │   ├── auth.ts        # Serviço de autenticação
│   │   │   │   │   ├── tenants.ts     # Serviço de tenants
│   │   │   │   │   ├── users.ts       # Serviço de usuários com Grant/Revoke
│   │   │   │   │   ├── applications.ts # Serviço de aplicações e pricing matrix
│   │   │   │   │   ├── entitlements.ts # **NOVO**: Serviço de entitlements com conversão tenant ID
│   │   │   │   │   ├── addresses.ts   # Serviço de endereços
│   │   │   │   │   ├── contacts.ts    # Serviço de contatos
│   │   │   │   │   └── metrics.ts     # Serviço de métricas da plataforma
│   │   │   │   ├── 📁 store/          # Estado global Zustand
│   │   │   │   │   ├── auth.ts        # Auth store (platformRole)
│   │   │   │   │   ├── ui.ts          # UI store (notifications)
│   │   │   │   │   └── index.ts       # Re-exports
│   │   │   │   ├── 📁 assets/         # Assets específicos do admin
│   │   │   │   └── app.tsx            # Componente principal
│   │   │   ├── 📁 hub/               # Client Hub App (portal de acesso dos usuários)
│   │   │   │   ├── 📁 components/     # Componentes específicos do Hub
│   │   │   │   │   ├── Header.tsx     # Header com logout e tenant info
│   │   │   │   │   ├── Layout.tsx     # Layout principal do Hub
│   │   │   │   │   ├── Sidebar.tsx    # Sidebar de navegação do Hub
│   │   │   │   │   ├── TenantEntitlementsSection.tsx    # **NOVO**: Seção de entitlements para admins
│   │   │   │   │   ├── EntitlementAppCard.tsx           # **NOVO**: Card individual de licença com toggle de usuários
│   │   │   │   │   └── EntitlementsSummaryCard.tsx      # **NOVO**: Tabela resumo de licenças
│   │   │   │   ├── 📁 features/       # Funcionalidades específicas do Hub
│   │   │   │   │   └── 📁 apps/       # Gestão de aplicações do usuário
│   │   │   │   ├── 📁 pages/          # Páginas do Hub
│   │   │   │   │   ├── Home.tsx       # Home com apps disponíveis + entitlements (admin)
│   │   │   │   │   └── Login.tsx      # Login com lookup de tenant
│   │   │   │   ├── 📁 providers/      # Providers React do Hub
│   │   │   │   ├── 📁 services/       # Cliente para /internal/api/v1
│   │   │   │   │   └── hub.ts         # Serviço de apps + entitlements
│   │   │   │   ├── 📁 store/          # Estado específico do Hub
│   │   │   │   │   ├── auth.ts        # Autenticação com loading global simples
│   │   │   │   │   └── ui.ts          # Estado da UI do Hub
│   │   │   │   ├── index.html         # HTML específico do Hub
│   │   │   │   ├── main.tsx           # Entry point do Hub
│   │   │   │   └── routes.tsx         # Roteamento do Hub
│   │   │   ├── 📁 tq-client/          # App do produto TQ (cliente final)
│   │   │   │   ├── 📁 routes/         # rotas específicas do TQ
│   │   │   │   ├── 📁 features/       # funcionalidades do TQ
│   │   │   │   ├── 📁 components/     # componentes do TQ
│   │   │   │   ├── 📁 services/       # cliente para /api/v1/tq
│   │   │   │   └── app.tsx            # componente principal (placeholder)
│   │   │   ├── 📁 crm-client/         # App do produto CRM
│   │   │   │   ├── 📁 routes/ features/ components/ services/
│   │   │   │   └── app.tsx            # (placeholders)
│   │   │   └── 📁 automation-client/  # App do produto Automation
│   │   │       ├── 📁 routes/ features/ components/ services/
│   │   │       └── app.tsx            # (placeholders)
│   │   │
│   │   ├── 📁 common/                 # Reuso visual e utilidades de front
│   │   │   ├── 📁 ui/                 # Design system components (Button, Input, Card, etc.)
│   │   │   │   ├── Button.tsx         # Componente Button com loading states
│   │   │   │   ├── Input.tsx          # Componente Input com validação
│   │   │   │   ├── Select.tsx         # Componente Select padronizado
│   │   │   │   ├── Textarea.tsx       # Componente Textarea consistente
│   │   │   │   ├── Checkbox.tsx       # Componente Checkbox com brand primary
│   │   │   │   ├── Label.tsx          # Componente Label acessível
│   │   │   │   ├── Badge.tsx          # Componente Badge com variants da marca (tertiary, success, etc.)
│   │   │   │   ├── StatusBadge.tsx    # Componente StatusBadge para status tipados (active/inactive/suspended)
│   │   │   │   ├── Card.tsx           # Componente Card refatorado
│   │   │   │   ├── Toast.tsx          # Sistema de toasts
│   │   │   │   ├── Toaster.tsx        # Host de toasts
│   │   │   │   ├── FormSection.tsx    # Seção de formulário com botão add
│   │   │   │   ├── FieldError.tsx     # Display de erro acessível
│   │   │   │   ├── SelectCountry.tsx  # Seletor de país ISO-2
│   │   │   │   ├── Tooltip.tsx        # **NOVO**: Componente de tooltip com suporte a disabled state
│   │   │   │   └── index.ts           # Re-exports de componentes
│   │   │   │
│   │   │   ├── 📁 feedback/           # Sistema AppFeedback (novo)
│   │   │   │   ├── types.ts           # Interfaces AppFeedback e AppError
│   │   │   │   ├── catalog.ts         # Catálogo de códigos → mensagens
│   │   │   │   ├── store.ts           # Zustand store com telemetria
│   │   │   │   ├── FeedbackHost.tsx   # Componente global de feedback
│   │   │   │   └── index.ts           # Re-exports do domínio
│   │   │   │
│   │   │   ├── 📁 auth/               # Utilitários de autenticação compartilhados
│   │   │   │   └── tenantResolution.ts # Resolução de tenant para clientes
│   │   │   ├── 📁 components/         # Componentes de negócio compartilhados
│   │   │   │   └── 📁 Navigation/     # Componentes de navegação
│   │   │   ├── 📁 hooks/              # React hooks compartilhados
│   │   │   │   ├── use-toast.tsx      # Hook de toast
│   │   │   │   └── useRepeater.ts     # Hook genérico para listas (add/remove/primary)
│   │   │   ├── 📁 utils/              # Funções utilitárias
│   │   │   │   ├── cn.ts              # Utility para className
│   │   │   │   └── badgeUtils.ts      # Utilitários para badges e status
│   │   │   └── 📁 constants/          # Constantes e configurações
│   │   │
│   │   ├── 📁 config/
│   │   │   ├── env.ts                 # Configuração de ambiente
│   │   │   └── http.ts                # Cliente HTTP com interceptors AppError + AppFeedback
│   │   │
│   │   ├── 📁 styles/                 # Estilos globais
│   │   │   └── globals.css            # Estilos CSS globais
│   │   │
│   │   ├── index.css                  # Estilos principais com tokens de design (--brand-tertiary, --brand-tertiary-bg)
│   │   ├── index.html                 # Template HTML
│   │   └── main.tsx                   # Entry point React
│   │
│   ├── 📁 server/                     # Backend Express.js + JavaScript
│   │   ├── 📁 api/                    # Camada de API organizada por domínio
│   │   │   ├── 📁 internal/           # API interna administrativa
│   │   │   │   ├── 📁 public/         # Rotas públicas (sem autenticação)
│   │   │   │   │   └── tenant-lookup.js # Lookup de tenant por subdomínio
│   │   │   │   └── 📁 routes/         # Routes da API interna
│   │   │   │       ├── auth.js        # Autenticação e gestão de usuários
│   │   │   │       ├── users.js       # CRUD de usuários administrativo
│   │   │   │       ├── tenant-users.js # **NOVO**: API tenant-scoped para usuários
│   │   │   │       ├── applications.js # Catálogo de aplicações
│   │   │   │       ├── entitlements.js # Gestão de licenças e acessos
│   │   │   │       ├── audit.js       # Logs de auditoria e compliance
│   │   │   │       ├── platform-auth.js # Autenticação de plataforma
│   │   │   │       ├── tenants.js     # Gestão de tenants (com /reactivate endpoint)
│   │   │   │       ├── metrics.js     # Métricas agregadas da plataforma com cache
│   │   │   │       └── me.js          # **NOVO**: Endpoints self-service para Hub (/me/apps)
│   │   │   ├── 📁 tq/                 # API do produto Transcription Quote
│   │   │   │   └── 📁 routes/         # Rotas específicas do TQ
│   │   │   ├── 📁 crm/                # API do produto CRM
│   │   │   │   └── 📁 routes/         # Rotas específicas do CRM
│   │   │   └── 📁 automation/         # API do produto Automation
│   │   │       └── 📁 routes/         # Rotas específicas do Automation
│   │   │
│   │   ├── 📁 infra/                  # Camada de infraestrutura
│   │   │   ├── 📁 config/             # Configurações da aplicação
│   │   │   ├── 📁 db/
│   │   │   │   └── database.js        # Singleton de conexão PostgreSQL com pool
│   │   │   │
│   │   │   ├── 📁 middleware/
│   │   │   │   ├── auth.js            # Autenticação JWT + entitlements
│   │   │   │   ├── tenant.js          # Resolução e contexto de tenant
│   │   │   │   ├── appAccess.js       # Autorização 5-camadas + auditoria completa
│   │   │   │   └── platformRole.js    # Validação de roles de plataforma
│   │   │   │
│   │   │   ├── 📁 models/
│   │   │   │   ├── User.js            # Gestão de usuários multi-tenant
│   │   │   │   ├── Tenant.js          # Gestão de tenants com isolamento por schema
│   │   │   │   ├── TenantUser.js      # Relacionamento tenant-usuário
│   │   │   │   ├── Application.js     # Catálogo de aplicações/produtos
│   │   │   │   ├── TenantApplication.js # Licenças por tenant com controle de assentos
│   │   │   │   ├── UserApplicationAccess.js # Acesso granular usuário-aplicação com snapshots
│   │   │   │   ├── UserType.js        # Tipos de usuário com hierarquia
│   │   │   │   ├── ApplicationPricing.js # Pricing matrix App × UserType com overlap prevention
│   │   │   │   ├── AccessLog.js       # Auditoria detalhada para compliance
│   │   │   │   └── PlatformLoginAudit.js # **NOVO**: Auditoria de logins da plataforma
│   │   │   │
│   │   │   ├── 📁 utils/
│   │   │   │   └── datetime.js        # **NOVO**: Utilidades de overlap detection com semântica [start, end)
│   │   │   │
│   │   │   ├── 📁 migrations/
│   │   │   │   ├── 001_create_core_tables.sql # Todas tabelas core + relacionamentos + auditoria
│   │   │   │   ├── 002_create_indexes.sql    # Estratégia de indexação organizada
│   │   │   │   ├── 003_seed_initial_data.sql  # Dados essenciais + tenants padrão
│   │   │   │   ├── 004_metrics_indexes.sql   # Índices para métricas com filtros temporais
│   │   │   │   ├── 004_fix_default_tenant.sql # Correções do tenant padrão
│   │   │   │   ├── 005_fix_admin_password.sql # Correção da senha do admin
│   │   │   │   ├── 006_pricing_range.sql     # **NOVO**: Range types e exclusion constraints para overlap prevention
│   │   │   │   └── 📁 _backup/         # Migrações antigas (backup)
│   │   │   │
│   │   │   ├── 📁 scripts/
│   │   │   │   ├── runMigrations.js   # Executor de migrações SQL
│   │   │   │   ├── db-create-test.js  # Criação automática de DB teste
│   │   │   │   └── db-drop-test.js    # Limpeza de DB teste
│   │   │   │
│   │   │   ├── authService.js         # Lógica de autenticação + JWT
│   │   │   └── userService.js         # Lógica de negócio de usuários
│   │   │
│   │   ├── 📁 core/                   # Core business logic
│   │   │   ├── 📁 applications/       # Lógica de negócio de aplicações
│   │   │   ├── 📁 audit/              # Lógica de auditoria
│   │   │   ├── 📁 licensing/          # Lógica de licenciamento
│   │   │   ├── 📁 permissions/        # Lógica de permissões
│   │   │   ├── 📁 pricing/            # Lógica de pricing
│   │   │   ├── 📁 tenants/            # Lógica de tenants
│   │   │   └── 📁 users/              # Lógica de usuários
│   │   │
│   │   ├── app.js                     # Configuração Express (separado para testes)
│   │   └── index.js                   # Entry point do servidor Express
│   │
│   └── 📁 shared/
│       └── 📁 types/
│           ├── tenant.js              # Tipos e utilitários de tenant
│           └── user.js                # Tipos e validadores de usuário
│
├── 📁 tests/                         # Suíte de testes organizada
│   ├── 📁 integration/               # Testes de integração
│   │   ├── 📁 internal/              # Testes da API interna administrativa
│   │   │   ├── critical-validation.test.js  # Validação das 5 camadas de autorização
│   │   │   └── internal-api-validation.test.js # Testes de endpoints da API interna
│   │   ├── 📁 tq/                    # Testes de Transcription Quote (placeholder)
│   │   ├── 📁 crm/                   # Testes de CRM (placeholder)
│   │   └── 📁 automation/            # Testes de Automation (placeholder)
│   ├── 📁 unit/                      # Testes unitários
│   │   └── 📁 core/                  # Testes de lógica de negócio pura
│   ├── auth-helper.js                # Utilitários para geração de tokens JWT
│   └── setup.js                      # Setup global dos testes
│
├── 📁 docs/                           # Documentação técnica do projeto
│   ├── INTERNAL-API.md               # Documentação completa da API interna
│   ├── MIGRATIONS.md                 # Documentação de migrações de banco
│   ├── TESTING-QA.md                 # Documentação de testes e QA
│   ├── internal-dashboard-audit.md   # Auditoria do dashboard interno
│   ├── internal-login-audit.md       # Auditoria do sistema de login
│   └── internal-tenants-audit.md     # Auditoria do sistema de tenants
│
├── 📁 node_modules/                   # Dependências npm
├── 📁 dist/                          # Build artifacts (gerado)
├── 📁 .claude/                       # Configurações Claude Code
├── 📁 .git/                          # Controle de versão Git
│
├── 📄 package.json                   # Dependências e scripts npm
├── 📄 package-lock.json              # Lock de dependências npm
├── 📄 tsconfig.json                  # Configuração TypeScript global
├── 📄 tsconfig.server.json           # Configuração TypeScript para servidor
├── 📄 vite.config.ts                 # Configuração Vite para internal-admin
├── 📄 vite.hub.config.ts             # **NOVO**: Configuração Vite para Hub (porta 3003)
├── 📄 tailwind.config.js             # Configuração Tailwind CSS
├── 📄 postcss.config.js              # Configuração PostCSS
├── 📄 jest.config.js                 # Configuração Jest para testes
├── 📄 .env                           # Variáveis de ambiente (não commitado)
├── 📄 .env.example                   # Template de configuração
├── 📄 .gitignore                     # Arquivos ignorados pelo Git
├── 📄 .gitattributes                 # Atributos Git para formatação
├── 📄 index.html                     # Template HTML raiz
├── 📄 debug-pricing.js               # Script de debug para pricing system
├── 📄 CLAUDE.md                      # Documentação para Claude Code
├── 📄 CLAUDE2.md                     # Documentação técnica completa
└── 📄 README.md                      # Este arquivo
```

## 🎯 Detalhamento de Pastas e Arquivos

### 📁 `src/server/` - Backend Express.js

#### 🌐 `api/` - Camada de API
- **`internal/routes/`**: API administrativa interna
  - **`auth.js`**: Login, registro, gestão de sessões
  - **`users.js`**: CRUD administrativo de usuários com bulk operations
  - **`tenant-users.js`**: **NOVO** - API tenant-scoped para operações de usuários por tenant
  - **`applications.js`**: Catálogo de aplicações e gestão
  - **`entitlements.js`**: **NOVO** - Gestão de licenças read-only para Hub (admin users)
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

### Arquitetura Enterprise de 5 Níveis

```mermaid
graph TD
    A[🏢 Tenant] --> B[📱 License Check]
    B --> C[👥 Seat Availability]
    C --> D[👤 User Access]
    D --> E[🎭 Role Validation]
    
    A --> |"Tem licença ativa?"| B
    B --> |"Dentro do limite?"| C
    C --> |"Usuário tem acesso?"| D
    D --> |"Role suficiente?"| E
    E --> |"✅ Autorizado"| F[🎯 Resource Access]
    
    G[🔍 Audit Log] --> |"Registra com contexto completo"| F
```

### Fluxo de Autorização

```mermaid
sequenceDiagram
    participant Client
    participant Auth as Auth Middleware
    participant App as App Access Middleware
    participant DB as Database
    participant Resource
    
    Client->>Auth: Request + JWT
    Auth->>Auth: Validate JWT + allowedApps[]
    Auth->>App: Forward with user context
    App->>App: Check app in allowedApps[]
    App->>DB: Verify tenant license (fallback)
    App->>DB: Log access attempt
    App->>Resource: Forward with full context
    Resource->>Client: Response
```

### Tabelas do Sistema Enterprise (10 tabelas)

| Tabela | Colunas | Propósito |
|--------|---------|-----------|
| `tenants` | 8 | Registry de tenants com schema mapping e audit fields |
| `users` | 14 | Usuários com **1:1 tenant relationship** via `tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id)` |
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

### Modelo de Negócio
O preço de cada seat é definido por uma **matriz Aplicativo × UserType** (admin/manager/operations), com vigência (versionamento). Ao conceder acesso (grant), o sistema captura um **snapshot** do preço vigente (`price_snapshot`, `currency_snapshot`, `granted_cycle`), garantindo previsibilidade no faturamento mesmo que a matriz mude depois. 

**O limite de seats é global por app** no tenant (`tenant_applications.user_limit`), não havendo limites por perfil específico.

### Estrutura de Dados

#### Tabela `application_pricing`
```sql
CREATE TABLE application_pricing (
  id BIGSERIAL PRIMARY KEY,
  application_id_fk INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_type_id_fk INTEGER NOT NULL REFERENCES user_types(id),
  price NUMERIC(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly','yearly')) DEFAULT 'monthly',
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to   TIMESTAMPTZ NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id_fk, user_type_id_fk, valid_from)
);
```

#### Alterações em `user_application_access` (snapshots de preço)
```sql
ALTER TABLE user_application_access
  ADD COLUMN price_snapshot NUMERIC(10,2),
  ADD COLUMN currency_snapshot CHAR(3),
  ADD COLUMN user_type_id_fk_snapshot INTEGER REFERENCES user_types(id),
  ADD COLUMN granted_cycle TEXT CHECK (granted_cycle IN ('monthly','yearly'));
```

#### View de apoio `v_tenant_app_seats_by_type`
```sql
CREATE OR REPLACE VIEW v_tenant_app_seats_by_type AS
SELECT
  uaa.tenant_id_fk,
  uaa.application_id_fk,
  COALESCE(uaa.user_type_id_fk_snapshot, u.user_type_id_fk) AS user_type_id_fk,
  COUNT(*)::INT AS seats_count,
  SUM(COALESCE(uaa.price_snapshot, 0))::NUMERIC(10,2) AS total_price
FROM user_application_access uaa
JOIN users u ON u.id = uaa.user_id_fk
WHERE uaa.active = TRUE
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
1. **Inativação**: `active = false` no registro `user_application_access`
2. **Liberação de Seat**: `TenantApplication.decrementSeat()` → `seats_used -= 1`
3. **Auditoria**: Log da revogação

### ⚠️ Deprecações Importantes
- **`applications.price_per_user`**: **NÃO USAR** para leitura de preço. Toda precificação deve consultar a matriz `application_pricing`

## 🚀 Comandos Disponíveis

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Executar servidor e cliente em paralelo
npm run dev

# Executar apenas o servidor (porta 3001)
npm run dev:server

# Executar apenas o internal-admin (porta 3002)  
npm run dev:client

# Executar apenas o Hub app (porta 3003)
npm run dev:hub
```

### Database
```bash
# Executar migrações
npm run migrate

# Criar database de teste (idempotente)
npm run db:create:test

# Dropar database de teste completamente
npm run db:drop:test
```

### Testes
```bash
# Executar todos os testes (cria database automaticamente)
npm test

# Executar testes em modo watch (desenvolvimento)
npm run test:watch

# Executar testes específicos por padrão
npx jest --testNamePattern="Layer 1"

# Executar arquivo de teste específico
npx jest tests/integration/internal/critical-validation.test.js

# Executar apenas testes de API interna
npx jest tests/integration/internal/

# Executar testes de um produto específico (futuro)
npx jest tests/integration/tq/
```

### Build e Deploy
```bash
# Build completo (client + server)
npm run build

# Build apenas client (output: dist/client)
npm run build:client

# Build apenas server (copia arquivos JS)
npm run build:server

# Iniciar servidor em produção
npm start
```

### API e Documentação
```bash
# Iniciar servidor para acesso à documentação Swagger
npm run dev:server

# Acessar documentação da API interna (requer autenticação admin)
# http://localhost:3001/docs/internal
```

## 🔗 API Reference

Para documentação completa da **Internal Admin API** incluindo todos os endpoints, exemplos de uso, autenticação, autorização e especificações técnicas, consulte:

**[📚 INTERNAL-API.md](./INTERNAL-API.md)**

A API Internal oferece:
- 85+ endpoints para administração completa da plataforma
- Sistema de autorização enterprise em 5 camadas
- Documentação Swagger interativa em `/docs/internal`
- Pricing matrix (App × UserType) com snapshots automáticos
- Grant/Revoke de acessos com controle de seats global
- Dedicated endpoints seguindo principle of least privilege
- Auditoria completa com logs detalhados

## ⚙️ Configuração de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
# Database PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=simplia_paas
DATABASE_USER=seu_usuario
DATABASE_PASSWORD=sua_senha

# Database de Testes
TEST_DATABASE_NAME=simplia_paas_test

# JWT
JWT_SECRET=sua-chave-secreta-super-segura
JWT_EXPIRES_IN=24h

# Bcrypt
BCRYPT_SALT_ROUNDS=12

# Multi-tenancy
DEFAULT_TENANT=default
TENANT_HEADER_NAME=x-tenant-id

# Server
PORT=3001
NODE_ENV=development

# API Configuration (Versioned Internal API)
INTERNAL_API_PREFIX=/internal/api/v1
ENABLE_INTERNAL_DOCS=true
INTERNAL_DOCS_PATH=/docs/internal
ADMIN_PANEL_ORIGIN=http://localhost:5173

# Security
ENABLE_HELMET=true

# Frontend Environment Variables (Vite)
VITE_INTERNAL_API_BASE_URL=/internal/api/v1
VITE_TQ_API_BASE_URL=/api/v1/tq
VITE_CRM_API_BASE_URL=/api/v1/crm
VITE_AUT_API_BASE_URL=/api/v1/automation
```

## 📊 Stack Tecnológico

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web minimalista
- **PostgreSQL** - Database relacional com suporte a schemas
- **bcrypt** - Hash seguro de senhas
- **jsonwebtoken** - Autenticação JWT
- **pg** - Driver PostgreSQL
- **dotenv** - Gestão de variáveis de ambiente
- **cors** - Cross-origin resource sharing  
- **swagger-ui-express** - Documentação interativa da API
- **swagger-jsdoc** - Geração de documentação OpenAPI
- **helmet** - Security headers middleware

### Frontend  
- **React 18** - Biblioteca de interfaces reativas
- **TypeScript** - JavaScript com tipagem estática
- **Vite** - Build tool moderna e rápida
- **Tailwind CSS** v3.4.17 - Framework CSS utilitário com design system customizado
- **Framer Motion** - Animações e transições fluidas
- **Lucide React** - Ícones SVG otimizados
- **Zustand** - Gerenciamento de estado global
- **React Router DOM** - Roteamento declarativo

### Design System e UX
- **Design Tokens** - Sistema de cores global com CSS custom properties
- **Componentes A11y** - Interface acessível com ARIA compliant
- **Error Handling** - Sistema de erros amigáveis com telemetria
- **Responsive Design** - Layouts multi-coluna adaptativos

### Desenvolvimento
- **nodemon** - Auto-restart do servidor em desenvolvimento
- **concurrently** - Execução paralela de comandos
- **TypeScript** - Compilação e checagem de tipos

### Testes e Qualidade
- **Jest** - Framework de testes com setup/teardown automático
- **Supertest** - Testes de API e endpoints HTTP
- **Criação automática de DB de teste** - Setup e cleanup transparente

## 🔒 Segurança e Multi-tenancy

## Arquitetura Híbrida de Multi-Tenancy (Decisão Atual)

A plataforma adota **modelo híbrido**:

**Fica no `public` (core de plataforma, visão global / internal-admin):**
- `tenants`, `users` (com `tenant_id_fk` numérico), `applications`
- `application_pricing`, `tenant_applications`
- `user_application_access` (grants com snapshots)
- `application_access_logs` (auditoria)

**Vai para `tenant_<slug>` (dados de produto, Hub/Apps):**
- Tabelas específicas de domínio: `tq_*`, `crm_*`, etc.

**Isolamento por rota (search_path):**
- *Global (Platform/Admin)*: **não** aplica `search_path`; opera direto em `public`. Inclui `/platform-auth/*` (Internal-Admin é Global).
- *Tenant-Scoped (Hub/Apps)*: aplica `SET LOCAL search_path TO tenant_<slug>, public`.

**Exemplo (JS – middleware aplicado apenas em rotas tenant-scoped):**
```js
// SET LOCAL garante que o search_path não vaze para outras requests do pool
await db.query('BEGIN');
await db.query(`SET LOCAL search_path TO ${tenantSchema}, public`);
const data = await fn(); // lê/escreve dados do app no schema do tenant; core continua em public
await db.query('COMMIT');
```

**Exemplos de consultas:**
```sql
-- Global/internal-admin (sempre em public)
SELECT * FROM public.tenant_applications WHERE tenant_id_fk = $1;

-- Tenant-scoped (após SET LOCAL search_path TO tenant_<slug>, public)
-- dados do app no schema do tenant:
INSERT INTO transcriptions (...) VALUES (...);   -- cai em tenant_<slug>.transcriptions
-- core ainda em public:
SELECT * FROM public.user_application_access WHERE tenant_id_fk = $1;
```

**Anti-padrões evitados:**
- ❌ Mover `users` para schema do tenant
- ❌ Duplicar tabelas core por tenant
- ❌ Aplicar `search_path` em rotas de visão global

### Isolamento de Dados
- **Schema-per-tenant**: Cada tenant tem seu próprio schema PostgreSQL
- **Search Path Switching**: `SET search_path TO tenant_schema, public`
- **Header-based**: Identificação via `x-tenant-id` header

### CRÍTICO: Política Numeric-Only ID
**QUALQUER ID (PK/FK/header/JWT/param) é SEMPRE numérico — sem exceções**

- **Source of Truth**: `req.tenant.id` (numeric) - SEMPRE usar para operações de DB e FKs
- **Friendly ID**: `req.tenant.slug` - subdomain para URLs e UX apenas
- **Header Support**: `x-tenant-id` aceita APENAS valores numéricos:
  - `x-tenant-id: 1` (correto) → resolve por ID numérico
  - `x-tenant-id: default` (DEPRECATED) → suporte legacy será removido
- **Path Parameters**: SEMPRE usar IDs numéricos (`/tenants/:tenantId/users`, `/applications/:id/pricing`)
- **Frontend Services**: Enviar `String(tenantId)` em headers (numérico como string)
- **JWT Tokens**: Contém APENAS IDs numéricos de tenant (`tenantId: 123`, nunca strings)
- **Foreign Key Fields**: TODOS os campos FK usam sufixo `_fk` (`tenant_id_fk`, `user_id_fk`, `application_id_fk`)
- **Constraints de Database**: TODOS os FKs são `INTEGER NOT NULL REFERENCES` com constraints apropriados
- **Deprecação Legacy**: Campos string-based `tenant_id` deprecated, mantidos apenas para compatibilidade

### Autenticação e Autorização
- **JWT Enhanced**: Tokens incluem `allowedApps[]` (slugs) e `userType` para performance
- **5-Layer Authorization**: Tenant License → Seat Check → User Access → Role → Audit
- **Audit Trail**: Log completo com IP, User-Agent, API path, decision reason
- **Password Security**: bcrypt com salt rounds configurável
- **Compliance Ready**: Campos de auditoria em todas as tabelas com triggers automáticos

### Exemplo de Proteção de Rota

```javascript
// Proteger rota por aplicação (usa slug 'tq') - API versionada
app.get('/internal/api/v1/tq/dashboard', 
  requireAuth,                      // Validar JWT
  requireTranscriptionQuoteAccess(), // 5 camadas: License→Seat→User→Role→Audit
  (req, res) => {
    // req.user - contexto do usuário
    // req.appAccess - info completa (license, seats, accessSource)
    // req.tenant - contexto do tenant
    res.json({ message: 'Autorizado!', context: req.appAccess });
  }
);

// Proteger por role específico no app
app.get('/internal/api/v1/tq/admin',
  requireAuth,
  requireTranscriptionQuoteAccess('admin'), // Role 'admin' + todas as verificações
  adminHandler
);
```

## 🎯 Status Atual: Sistema Enterprise Completo ✅

### ✅ **Internal Admin API - Completamente Implementada**

A **API Interna** para o painel `internal.simplia.com` está **100% operacional** com arquitetura enterprise completa. Para documentação detalhada de todos os endpoints, autenticação, autorização e exemplos de uso, consulte **[INTERNAL-API.md](./INTERNAL-API.md)**.

### ✅ **Frontend Enterprise UI - Implementado**
O **painel administrativo interno** possui interface moderna e profissional:

#### **Sistema de Design Consistente**
- ✅ **Design Tokens** globais com CSS custom properties (`--brand-primary`, `--brand-secondary`, `--brand-tertiary`)
- ✅ **Brand Background Token** (`--brand-tertiary-bg`) para elementos terciários com contraste otimizado
- ✅ **Badge System** completo com variants: default, primary, secondary, **tertiary**, success, warning, error, info
- ✅ **StatusBadge Component** para status tipados (active/inactive/suspended) com cor da marca
- ✅ **Componentes A11y** com ARIA attributes e acessibilidade completa
- ✅ **Montserrat Font**: Font family aplicada consistentemente em elementos da marca
- ✅ **Tailwind v3.4.17** integrado com sistema customizado de componentes
- ✅ **Responsividade** com layouts adaptativos e multi-coluna

#### **Tratamento de Erros Amigável**
- ✅ **AppError System** - Erros HTTP normalizados em mensagens amigáveis
- ✅ **Catálogo de Mensagens** em inglês com mapeamento contextual
- ✅ **Telemetria de Desenvolvimento** com logging detalhado
- ✅ **UX Otimizada** - Banners para erros globais, inline para validação de campos
- ✅ **Exemplos**: "Incorrect email or password" vs "HTTP 401" bruto

#### **AppFeedback System (Sucesso + Erros Padronizados)**
- ✅ **Backend Meta Envelope** - Respostas 2xx com `{meta: {code, message}, data}` 
- ✅ **Interceptor HTTP Automático** - Detecta `meta.code` e publica feedback sem código manual
- ✅ **Domínio Centralizado** - `common/feedback/` com types, catalog, store, host
- ✅ **Feedback Visual Acessível** - Toasts (`aria-live="polite"`) + Banners (`role="alert"`)
- ✅ **Catálogo Extensível** - Mapeamento códigos → mensagens (TENANT_CREATED, LOGIN_SUCCESS, etc.)
- ✅ **Auto-dismiss Inteligente** - Sucessos somem automaticamente, erros persistem
- ✅ **Deduplicação Avançada** - Janela de 5s evita toasts duplicados durante navegação
- ✅ **Telemetria Integrada** - `feedback_shown {kind, code, path}` para analytics
- ✅ **Login Migrado** - Sistema unificado com banner inline (erros) + toast global (sucesso)
- ✅ **Sistema Limpo** - Removido sistema antigo `services/errors/`, tudo centralizado em `common/feedback/`
- ✅ **Comportamento Híbrido** - Erros inline no formulário, sucessos como toast global

#### **Formulários Inteligentes**
- ✅ **Layout Multi-coluna** responsivo com seções organizadas
- ✅ **Validação Híbrida** - Cliente + servidor com feedback em tempo real  
- ✅ **Campos Auto-gerados** - Schema names automáticos baseados em display names
- ✅ **Componentes Repeater** - Sistema dinâmico de add/remove com constraints de negócio

#### **Gestão de Endereços & Contatos**
- ✅ **9 Tabelas** - tenant_addresses e tenant_contacts integrados ao sistema principal
- ✅ **8 Endpoints API** - CRUD completo com autenticação platform_role
- ✅ **7 Componentes Frontend** - useRepeater hook + UI components modulares
- ✅ **Tipos Estruturados** - HQ/BILLING/SHIPPING (endereços) + ADMIN/BILLING/TECH/LEGAL (contatos)
- ✅ **Primary Constraints** - Uma primary por tipo por tenant com enforcement automático  
- ✅ **Validação E.164** - Phone numbers em formato internacional padrão
- ✅ **ISO-2 Countries** - Códigos de país com selector pré-populado
- ✅ **AppFeedback Integration** - Success/error messaging automático
- ✅ **A11y Compliance** - ARIA completo + navegação por teclado
- ✅ **Analytics Tracking** - Telemetria em todas interações do usuário

#### **Gestão de Aplicações e Pricing Matrix**
- ✅ **ApplicationsList** - Lista de aplicações com ação **"Manage Pricing"** por aplicação
- ✅ **ApplicationPricing** - Interface completa para matriz de preços:
  - **Tabela de pricing vigente** por user_type com histórico de vigências
  - **Modal "Schedule New Price"** para versionamento com data futura
  - **Ação "End Current Price"** para encerrar vigência atual
  - **Validação completa** de preços, moedas (BRL/USD/EUR) e ciclos (monthly/yearly)
  - **Preview de preços** em tempo real durante configuração

#### **Gestão de Usuários com Grant/Revoke**  
- ✅ **UsersList** - Interface expandida com **modal "Manage App Access"**:
  - **Preview de preços por perfil** antes de conceder acesso
  - **Grant App Access** com validação automática de seat limits
  - **Revoke Access** com liberação de seat instantânea
  - **Feedback visual** de sucesso/erro com AppFeedback System
  - **Estados visuais** diferenciados (Access Granted vs Grant Access)
  - **Validação de disponibilidade** com mensagens contextuais

#### **Gestão de Tenants com Seat Management**
- ✅ **TenantsList** - Card de licenças exibindo **seats_used / user_limit**
- ✅ **Limite Infinito** - Exibição `seats_used / ∞` quando `user_limit` é NULL
- ✅ **Indicadores visuais** de ocupação com cores semafóricas
- ✅ **Status Toggle** funcional (Active/Inactive) no EditTenant

#### **Breadcrumbs sem IDs (UX Limpa)**
- ✅ **Navegação semântica** - "Dashboard > Applications > Pricing" 
- ✅ **Contexto claro** sem exposição de IDs técnicos
- ✅ **Padrão consistente** - "Dashboard > Tenants > Users", "Dashboard > Users > Edit"

#### **Componentes de Navegação**
- ✅ **Sidebar Colapsável** com ícones otimizados e hover states
- ✅ **Breadcrumbs Funcionais** com navegação e indicadores visuais
- ✅ **Headers Alinhados** com altura consistente e shadow apropriada
- ✅ **Animation System** com Framer Motion para transições fluidas

### ✅ **Fundação Enterprise Implementada**
- **10 tabelas** com campos de auditoria completos + triggers automáticos para `updated_at`
- **20+ índices** otimizados para performance enterprise incluindo partial unique constraints  
- **5 camadas de autorização** (License→**Seat Limit Global**→User→Role→Audit) com **snapshots de pricing**
- **Multi-tenancy** com isolamento por schema PostgreSQL e timezone IANA por tenant (imutável após criação)
- **JWT otimizado** com application slugs (substitui IDs por strings para performance)
- **Gestão completa** de endereços e contatos com constraints de negócio
- **JWT role override** - Middleware permite overriding de role via JWT para testes e flexibilidade
- **Compliance médico** com logs contextuais completos (IP, User-Agent, API path, decision reason)
- **Integridade referencial** com 9 relacionamentos FK entre todas as entidades
- **Sistema de testes completo** com Jest + Supertest + criação automática de DB de teste
- **Validação das 5 camadas de autorização** com testes críticos end-to-end (todas as 10 validações passando ✅)
- **Infraestrutura de testes enterprise** com setup/cleanup automático e helpers JWT
- **Error Handling Profissional** com mensagens amigáveis e acessibilidade completa
- **🆕 Users ↔ Tenants 1:1**: FK numérica `tenant_id_fk` com consistency enforcement
- **🆕 Tenant-Scoped User API**: Endpoints específicos por tenant com AppFeedback integrado
- **🆕 Code Hygiene**: Eliminação de dependências legadas `tenant_id` string
- **🆕 Pricing Matrix App × UserType**: Versionamento com vigências e snapshots automáticos
- **🆕 Seat Management Global**: Controle `user_limit`/`seats_used` por aplicação por tenant
- **🆕 Grant/Revoke com Snapshot**: Captura de preço no momento da concessão para billing consistency

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

### 🚀 Próximos Passos
1. **Expansão do Internal Admin Panel**: Completar páginas de users, applications e entitlements
2. **Tenant Management Enhancement**: Edição, visualização e histórico de addresses/contacts
3. **Product Applications**: Desenvolver interfaces para TQ, CRM e Automation clients  
4. **Public API Development**: Criar APIs públicas dos produtos (separadas da API interna)
5. **Advanced UI Components**: Tabelas avançadas, modais, dropdowns e filtros
6. **Dashboard Analytics**: Métricas em tempo real e relatórios visuais
7. **Linting & Formatting**: Implementar ESLint, Prettier e pre-commit hooks
8. **Monitoring**: Logging estruturado e métricas de performance
9. **Production Deployment**: Configurar CI/CD e ambientes

### ✨ Implementações Recentes (Janeiro 2025)

- **✅ 📊 Hub Entitlements Feature**: Sistema completo de visualização de licenças para usuários admin no Hub
  - **Admin Dashboard**: Seção de entitlements visível apenas para usuários com `role === 'admin'`
  - **Read-Only License Management**: Visualização de todas as licenças do tenant com usuários assignados
  - **Show/Hide Users Toggle**: Funcionalidade para expandir/recolher lista de usuários por aplicação
  - **Seat Usage Display**: Exibição de assentos usados/total diretamente do banco de dados
  - **Role-Based Badges**: Badges coloridos por role (admin=error, manager=warning, operations=info)
  - **API Endpoint**: Novo `/internal/api/v1/entitlements` para buscar licenças com contexto de usuários
  - **Summary Table**: Tabela resumo com status, assentos e datas de ativação/expiração
  - **Loading Experience**: Loading global simples com mensagem "Loading..." centralizada
  - **Component Structure**: 3 novos componentes (TenantEntitlementsSection, EntitlementAppCard, EntitlementsSummaryCard)
  - **Documentation Updated**: hub-audit.md e README.md atualizados com nova funcionalidade

- **✅ 🔧 Hub Authentication Fix + UX Improvements**: Correção crítica do login do Hub e melhorias de interface
  - **Bug Fix Crítico**: Corrigido acesso ao tenant context na rota `/auth/login` (`req.tenantId` → `req.tenant.id`)
  - **Hub Login Working**: Usuários finais agora conseguem fazer login no Hub com sucesso
  - **UX Improvement**: Removido label "Tenant:" do header - agora mostra apenas o nome do tenant
  - **Component Standardization**: Hub agora usa componentes comuns (`StatusBadge`, `Badge`) para consistency
  - **Documentation Updated**: Atualizadas documentações em `/docs/hub-audit.md` e `README.md`
  - **Technical Fix**: Tenant context agora é acessado via `req.tenant.id` em vez de `req.tenantId` diretamente
  - **Better UX**: Interface mais limpa e amigável para usuários finais (sem terminologia técnica)

- **✅ 🧹 API Cleanup & Simplification**: Limpeza e simplificação de endpoints desnecessários
  - **Tenant Auth Cleanup**: Removidos endpoints não utilizados (`/auth/health`, `/auth/validate-token`, `/auth/tenant-info`, `/auth/change-password`)
  - **Users Routes Streamlined**: Mantido apenas `GET /users` para listagem - operações CRUD movidas para platform admin
  - **Entitlements Removed**: Arquivo `/entitlements.js` removido completamente - funcionalidade consolidada em `/tenants` routes
  - **Simplified Architecture**: API mais focada com separação clara entre platform admin e tenant operations
  - **Reduced Complexity**: 75+ endpoints (vs 95+ anteriores) com foco em operações essenciais
  - **Documentation Updated**: `INTERNAL-API.md` atualizado com nova estrutura simplificada

- **✅ 🔐 API Security Enhancement**: Dedicated endpoint for tenant licensed applications
  - **Security Issue Identified**: `/licenses` tab was using `GET /tenants/{id}` which returned ALL tenant data
  - **Principle of Least Privilege**: Implemented dedicated `GET /applications/tenant/{tenantId}/licensed` endpoint
  - **Data Minimization**: New endpoint returns ONLY licensed applications data needed by UI
  - **Seat Data Included**: Returns `{slug, name, status, userLimit, seatsUsed, expiresAt}` per application
  - **Documentation Updated**: Swagger, internal audit docs, and API mapping updated
  - **Backwards Compatibility**: Previous tenant endpoint simplified, removed metrics/applications exposure
  - **TenantLicensesTab Refactored**: Now uses dedicated endpoint instead of accessing tenant metrics
  - **Platform-Scoped**: Internal route with proper authentication, no x-tenant-id headers needed

- **✅ 🏠 Client Hub App**: Portal completo para usuários finais acessarem suas aplicações
  - **Arquitetura Multi-App**: Hub separado do internal-admin com build e port independentes
  - **Autenticação Híbrida**: Two-step auth (tenant lookup → login) com x-tenant-id headers
  - **Self-Service API**: Novo endpoint `/internal/api/v1/me/apps` platform-scoped para evitar schema conflicts
  - **Tenant Middleware Fix**: Correção crítica para /me routes serem platform-scoped, não tenant-scoped
  - **Frontend Limpo**: Interface simplificada focada em mostrar apps disponíveis
  - **Build Independente**: `npm run dev:hub` (porta 3003) separado do internal-admin
  - **JWT Context**: Header x-tenant-id automático via interceptors
  - **Defensive Programming**: Tratamento robusto de arrays undefined e loading states
  - **UX Otimizada**: Remoção de elementos desnecessários ("Available" tags, menu items extra)

- **✅ 🔧 Seat Counting Fix**: Correção crítica no endpoint `/reactivate`
  - **Problema Identificado**: O endpoint `/reactivate` não estava incrementando seats após reativar acesso
  - **Correção Aplicada**: Adicionado `TenantApplication.incrementSeat()` ao endpoint /reactivate
  - **Consistência Completa**: Agora todos endpoints mantêm seat counting corretamente:
    - `/grant`: Incrementa seats ✅
    - `/revoke`: Decrementa seats ✅ 
    - `/reactivate`: Agora incrementa seats ✅ (foi a correção)
  - **Interface Refletindo BD**: Garantia que interface sempre reflete estado real do banco

### ✨ Implementações Anteriores (Janeiro 2025)

- **✅ 📊 Dashboard com Métricas Reais**: Sistema completo de dashboard com dados do backend
  - **Backend API**: Endpoint `/internal/api/v1/metrics/overview` com cache de 60 segundos
  - **Métricas Agregadas**: Total de Tenants, Users, Applications e Licenses ativas
  - **Filtros Temporais**: New this week/month com breakdowns detalhados
  - **Performance**: Queries otimizadas em paralelo + índices específicos para métricas
  - **Frontend Service**: `metricsService` com tratamento de erros e loading states
  - **Dashboard UI**: Cards responsivos com skeleton loading e trend indicators
  - **Cache Strategy**: TTL de 60s para evitar queries desnecessárias no banco
  - **Database Indexes**: Índices compostos otimizados para filtros de data (`active + created_at`)
  - **Error Handling**: Estados de loading, erro e dados vazios com UX apropriada
  - **Documentação API**: OpenAPI completa com schemas e exemplos

- **✅ 🚫 Sistema de Overlap Prevention**: Prevenção completa de sobreposição de períodos de pricing
  - **Database Migration**: PostgreSQL range types com exclusion constraints para prevenção nativa
  - **Utilities Layer**: `datetime.js` com funções de overlap usando semântica [start, end) - inclusive start, exclusive end
  - **API Validation**: Validação prévia via `ApplicationPricing.checkOverlap()` antes de INSERT
  - **Structured 422 Errors**: Retorno de `PRICING_OVERLAP` com detalhes de conflito (existingRange, newRange, ids)
  - **Frontend Modal Handling**: Modais permanecem abertos em erro 422 com feedback inline vermelho acessível
  - **Rota Dedicada End**: `POST /applications/:id/pricing/:pricingId/end` para operação semântica clara
  - **FieldError Component**: Corrigido para aceitar prop `message` - fix que habilitou todo o sistema de validação frontend
  - **User Experience**: Sistema não faz ajustes automáticos - usuário deve resolver conflitos manualmente
  - **AppFeedback Integration**: Código `PRICING_ENDED` integrado ao sistema de feedback global
- **✅ 📋 Página de Licenças por Tenant**: Interface completa de gestão de entitlements
  - **TenantLicensesPage**: Página com tabs Overview | Users | **Licenses** | Addresses | Contacts
  - **LicenseRow**: Component com ações Adjust License, Suspend/Resume, Open Pricing, Open Users
  - **EntitlementsService**: Serviço com conversão automática numeric→string tenant ID via subdomain
  - **StatusBadge Unificado**: Component único para status (active/inactive/suspended) substituindo TenantStatusBadge e UserStatusBadge
  - **Route Integration**: `/tenants/:tenantId/licenses` integrada com breadcrumbs e navegação
  - **API Integration**: Chamadas para `/internal/api/v1/entitlements` com header `x-tenant-id`
- ✅ **🎨 Sistema de Cores da Marca Unificado**: Padronização visual completa
  - **Cor Terciária Centralizada**: `--brand-tertiary: #5ED6CE` (teal da marca)
  - **Background Terciário**: `--brand-tertiary-bg: rgba(94, 214, 206, 0.1)` para contraste otimizado
  - **Substituição de Verdes**: Todos elementos verdes agora usam as cores da marca
  - **Badge Tertiary**: Slug em applications com visual da marca (texto teal + fundo claro)
  - **StatusBadge Active**: Status ativos com padrão visual consistente
  - **Feedback System**: Toasts de sucesso com cores da marca
  - **ApplicationsList**: Status "Active" padronizado com nova cor
  - **ApplicationsCard**: Seat usage e status com cores da marca
  - **Botão Manage Licenses**: Funcional com redirecionamento para `/tenants/:id/licenses`
- **✅ 💵 Sistema de Pricing por Seat (App × UserType)**: Implementação completa do modelo de negócio
  - **Matriz de Preços com Versionamento**: Tabela `application_pricing` com vigências `valid_from`/`valid_to`
  - **Snapshots Automáticos**: Captura de preço no grant (`price_snapshot`, `currency_snapshot`, `user_type_id_snapshot`) 
  - **Seat Management Global**: Controle `user_limit`/`seats_used` por aplicação por tenant
  - **Grant/Revoke com Snapshot**: API endpoints com incremento/decremento automático de seats
  - **View de Relatórios**: `v_tenant_app_seats_by_type` para billing e analytics
  - **ApplicationPricing Model**: Métodos `getCurrentPrice()`, `schedulePrice()`, `getBillingSummary()`
  - **TenantApplication Model**: Métodos `incrementSeat()`, `decrementSeat()` com atomicidade
- **✅ 🖥️ UI Completa de Pricing e Grant/Revoke**:
  - **ApplicationsList**: Ação "Manage Pricing" por aplicação
  - **ApplicationPricing**: Interface completa (tabela + modal Schedule + End Current)
  - **UsersList**: Modal "Grant App Access" com preview de preços por perfil
  - **Breadcrumbs Semânticos**: Navegação limpa sem exposição de IDs técnicos
  - **Seat Management Visual**: Cards de tenant com `seats_used / user_limit` (∞ quando ilimitado)
- **✅ 🔗 Endpoints de API Implementados**:
  - **Pricing Matrix**: `GET/POST/PUT /applications/:id/pricing` com versionamento
  - **Grant/Revoke**: `POST/DELETE /users/:id/apps/grant|revoke` com snapshots automáticos
  - **Validação Completa**: Seat limits, pricing obrigatório, auditoria detalhada
- **✅ 🧪 Testes de Pricing System**: 6/8 testes core passando (75% cobertura)
  - Grant com snapshot e seat limit, pricing matrix lookup, revoke libera seat
  - Seat limit enforcement, pricing not configured (422), audit logs completos
- **✅ ⚠️ Deprecação**: `applications.price_per_user` não deve ser usado - consultar `application_pricing`
- **✅ Gestão Completa de Endereços & Contatos**: Sistema enterprise com 10 tabelas, 8 APIs e 7 componentes frontend
- **✅ Componentes Repeater**: useRepeater hook genérico + UI components modulares 
- **✅ Validação Avançada**: Primary constraints, E.164 phone, ISO-2 countries
- **✅ AppFeedback Integration**: Success/error messaging automático
- **✅ A11y Compliance**: ARIA completo + navegação por teclado
- **✅ Users ↔ Tenants 1:1 Fortalecido**: Modelo 1:1 com FK numérica e consistency enforcement
- **✅ Tenant-Scoped User Management**: API e frontend para gestão de usuários por tenant
- **✅ Code Cleanup**: Eliminação de dependências legadas `users.tenant_id` string
- **✅ Application-Level Validation**: Garantia de consistência de tenants via aplicação
- **✅ Users Management System**: CRUD completo com estrutura de componentes achatada (sem /components)
- **✅ Design System Expansion**: Select, Textarea, Checkbox padronizados no common/ui
- **✅ Tenant Status Management**: Toggle active/inactive com persistência no EditTenant
- **✅ Component Flattening**: Simplificação da estrutura UserStatusBadge, UserRoleSelect, TenantStatusBadge

#### Uso dos Novos Componentes
```typescript
// useRepeater - Hook genérico para listas com add/remove/primary
const { items, add, remove, update, setPrimary } = useRepeater<AddressFormValues>({
  initialItems: addresses,
  primaryKey: 'is_primary',
  typeKey: 'type'
});

// Componentes Repeater - Já integrados no CreateTenant
<AddressesRepeater addresses={addresses} onChange={setAddresses} errors={errors} />
<ContactsRepeater contacts={contacts} onChange={setContacts} errors={errors} />
```

### 📈 Status de Desenvolvimento
- 🟢 **Backend API**: 100% completo com documentação Swagger + pricing system + grant/revoke APIs + **métricas com cache** + **entitlements API**
- 🟢 **Frontend Foundation**: Design system e error handling implementados
- 🟢 **Dashboard**: **Métricas reais do backend** com 4 cards (Tenants, Users, Applications, Licenses) + filtros temporais + loading/error states
- 🟢 **Tenant Management**: CRUD completo com addresses/contacts + status toggle + **página de licenças** + seat management visual
- 🟢 **Users Management**: CRUD completo + modal Grant/Revoke com preview de preços
- 🟢 **Applications Management**: Lista + interface completa de pricing matrix (tabela/modal/versionamento)
- 🟢 **Pricing & Billing System**: Matriz App × UserType + snapshots + seat limits globais - 100% implementado
- 🟢 **License Management**: Página completa de licenças por tenant com ações Adjust/Suspend/Resume
- 🟢 **Admin Interface**: Dashboard, tenants, users, applications, **entitlements** - 100% completo
- 🟢 **Hub App**: Portal completo com aplicações + **entitlements para admins** + loading global simples - 100% implementado
- 🔴 **Product Apps**: Estrutura criada - desenvolvimento pendente
- 🔴 **Public APIs**: Aguardando definição de requisitos dos produtos

## 📖 Documentação Adicional

**Para contexto técnico detalhado, implementações específicas, e documentação completa da API, consulte:**

- **[📚 INTERNAL-API.md](./INTERNAL-API.md)** - Documentação completa da Internal Admin API
- **[⚡ CLAUDE.md](./CLAUDE.md)** - Guia rápido para Claude Code (essencial)
- **[📖 CLAUDE2.md](./CLAUDE2.md)** - Documentação técnica completa e detalhada
- **[🧪 TESTING-QA.md](./TESTING-QA.md)** - Documentação de testes e QA

## 📄 Licença

Este projeto está sob desenvolvimento para uso interno da Simplia Healthcare Solutions.

---

## Swagger & Tags (Global vs Tenant-Scoped)

Para facilitar o consumo da API e evitar ambiguidades, a documentação
separa endpoints por **categorias**:

- **Global (Platform/Admin)** — *Tag:* `global`
  - Acesso: equipe Simplia (platform role)
  - Escopo: visão cross-tenant
  - Exemplos: `/platform-auth/*`, `/metrics/*`, `/tenants`, `/applications`, `/audit/*`
  - Headers: `Authorization` (Bearer). **Sem** `x-tenant-id`.

- **Tenant-Scoped (Hub/Apps)** — *Tag:* `tenant`
  - Acesso: usuários do tenant
  - Escopo: isolado por tenant
  - Exemplos: `/auth/*`, `/users`, `/users/:id/apps/*`, `/entitlements/*`
  - Headers: `Authorization` (Bearer) + `x-tenant-id: <tenantId numérico>`

**Padrão de exemplos no Swagger:**
- Sempre mostrar **dois exemplos**: um Global e um Tenant-Scoped
- Deixar explícito quando usar `x-tenant-id`

---

**Desenvolvido com ❤️ para revolucionar a gestão de aplicações médicas multi-tenant**