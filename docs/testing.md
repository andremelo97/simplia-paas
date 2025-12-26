# Testes Automatizados - Simplia PaaS

Este documento descreve a estrutura de testes automatizados do projeto, incluindo testes de API (Jest + Supertest) e testes E2E (Playwright).

## Visão Geral

| Tipo | Framework | Arquivos | Testes Estimados |
|------|-----------|----------|------------------|
| API - Hub | Jest + Supertest | 3 | ~42 |
| API - TQ | Jest + Supertest | 6 | ~90 |
| E2E | Playwright | 6 | ~52 |
| **Total** | - | **15** | **~184** |

## Comandos

### Testes de API (Jest)

```bash
# Rodar todos os testes
npm test

# Rodar apenas testes de API
npm run test:api

# Rodar apenas testes do Hub
npm run test:api:hub

# Rodar apenas testes do TQ
npm run test:api:tq

# Rodar testes em modo watch
npm run test:watch

# Rodar um arquivo específico
npx jest tests/api/hub/auth.test.js
```

### Testes E2E (Playwright)

```bash
# Rodar todos os testes E2E
npm run test:e2e

# Rodar apenas testes E2E do Hub
npm run test:e2e:hub

# Rodar apenas testes E2E do TQ
npm run test:e2e:tq

# Rodar com interface visual
npx playwright test --ui

# Rodar em modo debug
npx playwright test --debug

# Gerar relatório HTML
npx playwright show-report
```

**Importante:** Para testes E2E, os servidores devem estar rodando:
```bash
# Terminal 1: API Internal + Hub
npm run dev

# Terminal 2: TQ API
npm run dev:tq-api

# Terminal 3: TQ Frontend
npm run dev:tq-front
```

## Estrutura de Arquivos

```
tests/
├── setup.js                    # Setup global (DB, migrations)
├── auth-helper.js              # Helpers para JWT
├── test-data-helper.js         # Factories para dados de teste
│
├── mocks/                      # Mocks de serviços externos
│   ├── deepgram.mock.js        # Mock Deepgram (transcrição)
│   ├── openai.mock.js          # Mock OpenAI (AI Agent)
│   └── supabase.mock.js        # Mock Supabase Storage
│
├── api/                        # Testes de API (Jest + Supertest)
│   ├── hub/
│   │   ├── auth.test.js
│   │   ├── entitlements.test.js
│   │   └── transcription-quota.test.js
│   └── tq/
│       ├── patients.test.js
│       ├── sessions.test.js
│       ├── quotes.test.js
│       ├── templates.test.js
│       ├── clinical-reports.test.js
│       └── ai-agent.test.js
│
└── e2e/                        # Testes E2E (Playwright)
    ├── playwright.config.ts
    ├── hub/
    │   ├── login.spec.ts
    │   └── entitlements.spec.ts
    └── tq/
        ├── login.spec.ts
        ├── patients.spec.ts
        ├── session-flow.spec.ts
        └── quote-generation.spec.ts
```

## Testes de API

### Hub

#### auth.test.js (~15 testes)
- Login com credenciais válidas
- Login com senha errada (401)
- Login sem usuário (401)
- Token refresh com token válido
- Token refresh com token expirado (401)
- Alterar senha com sucesso
- Alterar senha com senha atual errada
- Alterar senha com senha nova muito curta
- GET /me retorna perfil com apps
- JWT contém tenantId numérico
- JWT contém timezone e locale

#### entitlements.test.js (~12 testes)
- GET /entitlements lista licenças
- Licenças incluem usuários
- Seats computados corretamente
- Summary com totais
- Status 'expired' computado quando expires_at < NOW()
- Isolamento de tenant (não vê dados de outro tenant)
- Falha sem autenticação (401)
- Falha sem x-tenant-id (400)

#### transcription-quota.test.js (~15 testes)
- GET /configurations/transcription-usage retorna dados
- Métricas do mês atual (minutesUsed, limit, remaining)
- Histórico dos últimos 6 meses
- Informações do plano
- PUT /configurations/transcription-config (VIP pode customizar)
- Basic plan não pode customizar limites (403)
- Limite custom abaixo do mínimo (400)
- Validação de idioma (pt-BR ou en-US)
- Tenant sem config retorna 403

### TQ

#### patients.test.js (~15 testes)
- CRUD completo (Create, Read, Update, Delete)
- Listagem paginada
- Busca por nome/email
- Falha ao deletar paciente com sessões
- Isolamento de tenant

#### sessions.test.js (~18 testes)
- CRUD completo
- Filtro por patientId
- Incluir dados do paciente (includePatient=true)
- Falha ao deletar sessão com quotes
- Falha ao deletar sessão com relatórios
- Atualização de status

#### quotes.test.js (~20 testes)
- CRUD completo
- Número auto-gerado (QUO000001)
- Adicionar items
- Cálculo de preço final (base - discount) * quantity
- Recálculo de total
- Transições de status (draft → sent → approved/rejected)

#### templates.test.js (~12 testes)
- CRUD completo
- Busca por título
- Filtro por active
- GET /most-used ordenado por usage_count
- Validação de campos obrigatórios

#### clinical-reports.test.js (~10 testes)
- CRUD completo
- Filtro por patientId
- Filtro por sessionId
- Vínculo obrigatório com session e patient

#### ai-agent.test.js (~15 testes)
- POST /ai-agent/chat retorna resposta
- Chat com sessionId carrega transcrição
- POST /ai-agent/fill-template preenche template
- GET /configurations/ai-agent retorna config
- PUT /configurations/ai-agent atualiza system message
- POST /configurations/ai-agent/reset restaura padrão
- Resolução de variáveis ($patient$, $me$, $date$)
- Tratamento de erros do OpenAI

## Testes E2E

### Hub

#### login.spec.ts
- Formulário de login visível
- Erro com credenciais inválidas
- Toggle de visibilidade de senha
- Seletor de idioma
- Validação de formato de email
- Campo de senha obrigatório
- Login com sucesso (requer usuário de teste)
- Redirect após login

#### entitlements.spec.ts
- Página de entitlements após login
- Cards de licença visíveis
- Informações de seats
- Navegação para TQ app
- Perfil do usuário
- Uso de transcrição (se configurado)
- Sidebar de navegação
- Menu mobile responsivo

### TQ

#### login.spec.ts
- Formulário de login visível
- Erro com credenciais inválidas
- SSO com token via URL
- Redirect para login sem autenticação
- Persistência de login após refresh
- Logout

#### patients.spec.ts
- Lista de pacientes
- Botão de criar paciente
- Criar novo paciente
- Buscar pacientes
- Editar paciente
- Ver histórico do paciente
- Deletar paciente

#### session-flow.spec.ts
- Lista de sessões
- Botão de nova sessão
- Criar sessão com paciente
- Ver detalhes da sessão
- Atualizar status
- Controles de áudio
- Upload de áudio

#### quote-generation.spec.ts
- Lista de quotes
- Número do quote (QUO000001)
- Ver detalhes do quote
- Adicionar item
- Atualizar status
- Modal de template AI
- Cálculo de total
- Workflow de status (draft → sent)

## Configuração

### Variáveis de Ambiente

```bash
# Database de teste (criada automaticamente)
TEST_DATABASE_NAME=simplia_paas_test
TEST_TENANT_SCHEMA=tenant_test_clinic

# Credenciais de teste (para E2E)
TEST_USER_EMAIL=test@test.com
TEST_USER_PASSWORD=password
```

### Database de Teste

O script `pretest` cria automaticamente a database de teste:

```bash
npm run db:create   # Criar database de teste
npm run db:drop     # Dropar database de teste
npm run db:reset    # Resetar (drop + create + migrate)
```

## Mocks de Serviços Externos

### Deepgram Mock
```javascript
const { setupDeepgramMock } = require('./mocks/deepgram.mock');

// No beforeAll do teste
const mockService = setupDeepgramMock();

// Simular webhook
const webhookPayload = mockService.simulateWebhook(requestId);
```

### OpenAI Mock
```javascript
const {
  setupOpenAIMock,
  queueMockResponse,
  restoreOpenAIMock
} = require('./mocks/openai.mock');

// No beforeEach
const { originalFetch } = setupOpenAIMock();

// No afterEach
restoreOpenAIMock(originalFetch);

// Resposta customizada
queueMockResponse({
  output: [{ type: 'message', content: [{ text: 'Custom response' }] }]
});
```

### Supabase Mock
```javascript
const { MockSupabaseStorageService } = require('./mocks/supabase.mock');

const storage = new MockSupabaseStorageService('test-bucket');
const result = await storage.uploadFile(buffer, 'file.png', 'id', 'folder', 'image/png');
```

## Helpers

### auth-helper.js

```javascript
const {
  generateTestToken,
  generateExpiredToken,
  generatePlatformAdminToken,
  generateTokenForUserType
} = require('./auth-helper');

// Token padrão
const token = generateTestToken({
  userId: 1,
  tenantId: 1,  // SEMPRE numérico
  email: 'test@test.com',
  schema: 'tenant_test_clinic',
  role: 'admin'
});

// Token expirado (para testar 401)
const expiredToken = generateExpiredToken({ userId: 1, tenantId: 1 });

// Token de admin da plataforma
const adminToken = generatePlatformAdminToken();

// Token por tipo de usuário
const opsToken = generateTokenForUserType('operations');
const managerToken = generateTokenForUserType('manager');
```

### test-data-helper.js

```javascript
const {
  // Hub/Platform
  createTestTenant,
  createTestUser,
  createTestApplication,
  createTestLicense,
  createTestUserAccess,
  cleanupTestTenant,

  // TQ
  createTestPatient,
  createTestSession,
  createTestQuote,
  createTestQuoteItem,
  createTestTemplate,
  createTestClinicalReport,
  createTQSchema,
  cleanupTQSchema
} = require('./test-data-helper');

// Criar tenant completo
const tenant = await createTestTenant({ name: 'Test Clinic' });
await createTQSchema(tenant.schema_name);

// Criar dados TQ
const patient = await createTestPatient(tenant.schema_name, { firstName: 'John' });
const session = await createTestSession(tenant.schema_name, patient.id);
const quote = await createTestQuote(tenant.schema_name, session.id);

// Limpar após testes
await cleanupTQSchema(tenant.schema_name);
await cleanupTestTenant(tenant.id, tenant.schema_name);
```

## Boas Práticas

1. **Isolamento de Testes**
   - Cada teste deve criar seus próprios dados
   - Limpar dados no `afterAll` ou `afterEach`
   - Usar timestamps únicos em subdomains/emails

2. **Tenant ID Numérico**
   - SEMPRE usar `tenantId: 1` (número), nunca string
   - Header `x-tenant-id` como string do número

3. **Mocks**
   - Sempre mockar serviços externos (Deepgram, OpenAI, Supabase)
   - Restaurar mocks no `afterEach`

4. **Testes E2E**
   - Usar `test.skip` para testes que requerem auth real
   - Configurar `storageState` para autenticação persistente
   - Evitar timeouts fixos, usar `waitForURL` ou `waitForSelector`

5. **Assertions**
   - Verificar status HTTP
   - Verificar estrutura do response (`data`, `meta`)
   - Verificar `meta.code` para feedback automático

## Troubleshooting

### Testes de API falhando

```bash
# Limpar database de teste
npm run db:drop
npm run db:create
npm run migrate
```

### Testes E2E falhando

```bash
# Reinstalar browsers
npx playwright install chromium

# Verificar se servidores estão rodando
curl http://localhost:3001/health
curl http://localhost:3003
curl http://localhost:3005
```

### Erro de porta em uso

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```
