# LivoCare - Multi-Tenant Healthcare Platform

**Plataforma PaaS multi-tenant com sistema de licenciamento enterprise para clínicas de estética e beleza**

## 📋 Visão Geral

Monorepo Node.js fullstack com:
- **Backend**: Express.js + PostgreSQL multi-tenant
- **Frontend**: React 18 + TypeScript + Vite
- **Multi-tenancy**: Isolamento por schema PostgreSQL
- **Licenciamento**: Arquitetura enterprise de 5 camadas
- **Compliance**: Auditoria completa para área médica

## 🏗️ Estrutura de Pastas

```
livocare/
├── src/
│   ├── client/
│   │   ├── apps/
│   │   │   ├── internal-admin/     # Painel administrativo
│   │   │   ├── hub/                # Portal de usuários
│   │   │   └── tq/                 # App Transcription Quote
│   │   ├── common/                 # Componentes e utils compartilhados
│   │   └── config/                 # Configurações globais
│   │
│   ├── server/
│   │   ├── api/
│   │   │   ├── internal/           # API administrativa
│   │   │   └── tq/                 # API do produto TQ
│   │   ├── infra/
│   │   │   ├── db/                 # Conexão PostgreSQL
│   │   │   ├── middleware/         # Auth, tenant, appAccess
│   │   │   ├── models/             # Models de banco
│   │   │   ├── migrations/         # Migrações SQL
│   │   │   ├── provisioners/       # Schemas de produtos por tenant
│   │   │   └── scripts/            # Scripts de DB
│   │   ├── services/               # Serviços de negócio
│   │   └── index.js                # Entry point
│   │
│   └── shared/                     # Tipos compartilhados
│
├── tests/
│   ├── integration/                # Testes de API
│   └── unit/                       # Testes unitários
│
└── docs/                           # Documentação técnica
```

## 🚀 Comandos Principais

### Desenvolvimento
```bash
npm install                         # Instalar dependências
npm run dev                         # Servidor + clientes
npm run dev:server                  # Apenas servidor (porta 3001)
npm run dev:client                  # Internal-admin (porta 3002)
npm run dev:hub                     # Hub app (porta 3003)
npm run dev:tq                      # TQ app (porta 3005)
```

### Database
```bash
npm run migrate                     # Executar migrações
npm run db:create:test              # Criar DB de teste
npm run db:drop:test                # Limpar DB de teste
```

### Testes
```bash
npm test                            # Todos os testes
npm run test:watch                  # Modo watch
```

### Build
```bash
npm run build                       # Build completo
npm start                           # Produção
```

## 📊 Stack Tecnológico

### Backend
- Node.js + Express.js
- PostgreSQL (multi-tenant)
- JWT + bcrypt
- Swagger (docs)

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (estado)
- React Router
- Framer Motion

### Testes
- Jest + Supertest

## 🔐 Multi-Tenancy e Segurança

### Arquitetura Híbrida
- **Schema `public`**: Core da plataforma (tenants, users, applications, licenses)
- **Schema `tenant_<slug>`**: Dados específicos do produto (tq_*, crm_*)
- **Isolamento**: `SET LOCAL search_path TO tenant_<slug>, public`

### Sistema de Licenciamento (5 Camadas)
1. **Tenant License**: Tenant possui licença ativa?
2. **Seat Availability**: Dentro do limite de assentos?
3. **User Access**: Usuário tem permissão?
4. **Role Validation**: Role suficiente?
5. **Audit Logging**: Registro completo

### Autenticação
- JWT com `allowedApps[]` e `userType`
- Header `x-tenant-id` (numérico)
- Password hash com bcrypt

## 💵 Sistema de Pricing

### Matriz de Preços (App × UserType)
- **Preço por seat** baseado em aplicação e tipo de usuário
- **Snapshots automáticos** no grant de acesso
- **Versionamento** com vigências (`valid_from`/`valid_to`)
- **Seat limits globais** por aplicação por tenant

### Exemplo de Pricing
```
TQ: operations($35), manager($55), admin($80)
PM: operations($25), manager($40), admin($60)
```

## ⚙️ Configuração (.env)

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=livocare
DATABASE_USER=seu_usuario
DATABASE_PASSWORD=sua_senha

# JWT
JWT_SECRET=sua-chave-secreta-super-segura
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=development

# API URLs
INTERNAL_API_PREFIX=/internal/api/v1
TQ_ORIGIN=http://localhost:3005

# Supabase Storage (TQ)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=tq-audio-files

# OpenAI (TQ AI Agent)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# Deepgram (TQ Transcription)
DEEPGRAM_API_KEY=your-deepgram-api-key
```

## 🌍 Timezone & Internacionalização

### Suporte Multi-Região
- **Brasil**: `America/Sao_Paulo` (UTC-3) + Português (pt-BR)
- **Austrália**: `Australia/Brisbane` (UTC+10) + Inglês (en-US)
- **Outros**: Automático via detecção de timezone

### Arquitetura
- **Database**: Todos os timestamps em UTC (TIMESTAMPTZ)
- **Backend**: JWT inclui `timezone` e `locale` derivados do tenant
- **Frontend**: Conversão automática UTC → timezone local via `Intl.DateTimeFormat`
- **i18n**: react-i18next com 160+ traduções (pt-BR + en-US)

### Implementação
```typescript
// Datas timezone-aware
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
const { formatShortDate } = useDateFormatter()
<span>{formatShortDate(patient.createdAt)}</span>

// Traduções automáticas
import { useTranslation } from 'react-i18next'
const { t } = useTranslation('tq')
<h1>{t('patients.title')}</h1>

// Moeda por locale
import { useCurrencyFormatter } from '@client/common/hooks/useCurrencyFormatter'
const { formatCurrency } = useCurrencyFormatter()
<span>{formatCurrency(quote.total)}</span> // R$ 1.000,00 ou $1,000.00
```

**Ver documentação completa:** [docs/timezone-internationalization.md](./docs/timezone-internationalization.md)

---

## 📖 Documentação Detalhada

- **[INTERNAL-API.md](./docs/INTERNAL-API.md)** - API administrativa completa
- **[tq-api.md](./docs/tq-api.md)** - API do produto TQ
- **[tq-public-quotes-puck.md](./docs/tq-public-quotes-puck.md)** - Sistema de public quotes com Puck
- **[tq-templates.md](./docs/tq-templates.md)** - Sistema de templates clínicos
- **[timezone-internationalization.md](./docs/timezone-internationalization.md)** - Sistema completo de timezone/i18n ⭐
- **[CLAUDE.md](./CLAUDE.md)** - Guia para Claude Code
- **[CLAUDE2.md](./CLAUDE2.md)** - Documentação técnica completa

## 🎯 Apps Implementados

### Internal Admin (`/internal-admin`)
- Dashboard com métricas
- Gestão de tenants, usuários, aplicações
- Sistema de pricing e licenciamento
- Endereços e contatos

### Hub (`/hub`)
- Portal de acesso às aplicações
- Visualização de licenças (admin)
- SSO integration

### TQ - Transcription Quote (`/tq`)
- Dashboard com quick actions
- Gestão de sessões e transcrições
- AI Agent para sumários médicos
- Sistema de templates clínicos
- Cotações (quotes) com pricing
- Clinical reports com impressão/PDF
- Public quotes com Puck editor visual
- Histórico completo de pacientes

## 📄 Licença

Desenvolvimento interno - LivoCare

---

**Desenvolvido com ❤️ para revolucionar a gestão de clínicas de estética e beleza**
