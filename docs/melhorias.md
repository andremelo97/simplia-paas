  ---
  🎯 Recomendação: Arquitetura Evolucionária

  Estratégia: "Refatorar Progressivamente, Não Reescrever"

  Não recomendo reescrever tudo agora. Em vez disso, introduza         
  camadas gradualmente onde a dor é maior:

  Fase 1: Adicionar Service Layer (Prioridade ALTA)

  Quando usar Services:
  - ✅ Lógica de negócio com múltiplos steps
  - ✅ Operações que envolvem múltiplos models
  - ✅ Transações complexas
  - ✅ Side effects (emails, webhooks, provisioning)

  Exemplo de Refatoração:

  // ❌ ANTES: Lógica no Model
  // src/server/infra/models/TenantApplication.js
  static async grantLicense(licenseData) {
    // 224 linhas de validação + insert + provisioning + logs
  }

  // ✅ DEPOIS: Service Layer
  // src/server/services/LicenseService.js
  class LicenseService {
    async grantLicense(tenantId, applicationId, options) {
      // 1. Validações
      await this.validateLicenseData(tenantId, applicationId,
  options)

      // 2. Business logic
      const license = await TenantApplication.create({
        tenantId,
        applicationId,
        ...options
      })

      // 3. Side effects (provisioning)
      await this.provisionApplicationSchema(tenantId,
  applicationId)

      // 4. Audit/Logging
      await this.logLicenseGrant(license)

      return license
    }

    private async validateLicenseData(tenantId, applicationId,
  options) {
      const application = await Application.findById(applicationId)    
      if (!application) throw new ApplicationNotFoundError()

      const existing = await
  TenantApplication.findByTenantAndApplication(tenantId,
  applicationId)
      if (existing) throw new Error('License already exists')
    }

    private async provisionApplicationSchema(tenantId,
  applicationId) {
      const tenant = await Tenant.findById(tenantId)
      const application = await Application.findById(applicationId)    

      if (application.slug === 'tq') {
        const client = await database.getClient()
        try {
          await provisionTQAppSchema(client, tenant.schemaName,        
  tenant.timezone)
        } finally {
          client.release()
        }
      }
    }

    private async logLicenseGrant(license) {
      console.log('✅ License granted:', license.id)
    }
  }

  // Route agora fica simples:
  // src/server/api/internal/routes/tenant-applications.js
  router.post('/', async (req, res) => {
    try {
      const licenseService = new LicenseService()
      const license = await licenseService.grantLicense(
        req.body.tenantId,
        req.body.applicationId,
        req.body
      )

      res.status(201).json({ data: license.toJSON() })
    } catch (error) {
      handleError(res, error)
    }
  })

  Benefícios:
  - ✅ Route handler agora tem 10 linhas (era 50+)
  - ✅ Lógica de negócio testável sem Express
  - ✅ Service pode ser reutilizado (API, CLI, background jobs)        
  - ✅ Model volta a ser "só dados + queries simples"

  ---
  Fase 2: Adicionar Input Validation Layer (Prioridade MÉDIA)

  Use Zod ou Joi para validação declarativa:

  // src/server/api/tq/validation/quote.schema.js
  const { z } = require('zod')

  const createQuoteSchema = z.object({
    sessionId: z.string().uuid(),
    content: z.string().optional(),
    status: z.enum(['draft', 'sent', 'approved',
  'rejected']).default('draft'),
    expiresAt: z.string().datetime().optional()
  })

  // Middleware de validação
  const validateBody = (schema) => (req, res, next) => {
    try {
      req.validatedBody = schema.parse(req.body)
      next()
    } catch (error) {
      res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      })
    }
  }

  // Route usa middleware
  router.post('/', validateBody(createQuoteSchema), async (req,        
  res) => {
    const quote = await Quote.create(req.validatedBody,
  req.tenant.schema)
    res.status(201).json({ data: quote.toJSON() })
  })

  ---
  Fase 3: Controllers Opcionais (Prioridade BAIXA)

  Só adicione se:
  - Routes começarem a ter muita lógica de formatação de resposta      
  - Precisar de múltiplos formatos de output (JSON, XML, CSV)
  - Time crescer e precisar de separação clara de responsabilidades    

  // src/server/api/tq/controllers/QuoteController.js
  class QuoteController {
    async create(req, res) {
      const { sessionId, content, status } = req.validatedBody
      const schema = req.tenant.schema

      const quote = await Quote.create({ sessionId, content, status    
   }, schema)

      return this.sendCreated(res, quote.toJSON(), 'QUOTE_CREATED')    
    }

    sendCreated(res, data, code) {
      res.status(201).json({
        data,
        meta: { code, message: 'Created successfully' }
      })
    }
  }

  // Route vira uma linha
  router.post('/', validateBody(createQuoteSchema), (req, res) =>      
    new QuoteController().create(req, res)
  )

  ---
  📊 Arquitetura Recomendada para Este Projeto

  Estrutura Proposta (Gradual)

  src/server/
  ├── api/
  │   ├── tq/
  │   │   ├── routes/           # Express routes (thin handlers)       
  │   │   ├── validation/       # Zod schemas
  │   │   └── index.js
  │   └── public/
  │       └── routes/
  ├── services/                 # ⭐ NOVO: Business logic
  │   ├── LicenseService.js
  │   ├── QuoteService.js
  │   └── PublicQuoteService.js
  ├── infra/
  │   ├── models/              # Data access only (queries)
  │   ├── middleware/
  │   ├── provisioners/
  │   └── db/
  └── shared/
      └── errors/              # Custom error classes

  Responsabilidades Claras

  | Camada       | Responsabilidade                          |
  Exemplo                                            |
  |--------------|-------------------------------------------|-----    
  -----------------------------------------------|
  | Routes       | HTTP layer (req/res), routing, middleware |
  Validar headers, chamar service, formatar response |
  | Services     | Business logic, orchestration             |
  Validar regras, coordenar models, side effects     |
  | Models       | Data access, queries simples              | CRUD    
   no banco, relacionamentos                     |
  | Provisioners | Schema setup, migrations                  |
  Criar tabelas, índices                             |

  ---
  🎬 Plano de Ação para Public Quote Pages

  Opção A: Seguir Padrão Atual (Rápido, Técnico Debt)

  // Routes fazem tudo diretamente
  router.post('/tq/public-quotes', async (req, res) => {
    // Validação inline
    // Chamada direta ao Model
    // Resposta inline
  })

  Vantagens: Rápido, consistente com codebase atualDesvantagens:       
  Adiciona mais debt técnico

  ---
  Opção B: Introduzir Service Layer (Recomendado)

  // src/server/services/PublicQuoteService.js
  class PublicQuoteService {
    async publishQuote(quoteId, options, schema) {
      // 1. Validar quote existe
      const quote = await Quote.findById(quoteId, schema, true,        
  true)

      // 2. Criar link público
      const publicQuote = await PublicQuote.create({
        quoteId,
        password: options.password,
        expiresAt: options.expiresAt || this.getDefaultExpiry(),       
        puckSchema: options.puckSchema
      }, schema)

      // 3. Log/Audit
      await this.logPublicQuoteCreation(publicQuote)

      return publicQuote
    }

    async viewPublicQuote(tenantSlug, token, password) {
      // 1. Resolver tenant
      const tenant = await this.resolveTenant(tenantSlug)

      // 2. Validar token + senha
      const publicQuote = await this.validateAccess(token,
  password, tenant.schema)

      // 3. Incrementar views
      await publicQuote.incrementViews(tenant.schema)

      // 4. Buscar dados completos
      const quote = await Quote.findById(publicQuote.quoteId,
  tenant.schema, true, true)
      const branding = await TenantBranding.findByTenant(tenant.id)    

      return { quote, branding, publicQuote }
    }
  }

  // Route agora é limpa:
  router.post('/tq/public-quotes',
  validateBody(publishQuoteSchema), async (req, res) => {
    const service = new PublicQuoteService()
    const publicQuote = await service.publishQuote(
      req.body.quoteId,
      req.body,
      req.tenant.schema
    )

    res.status(201).json({ data: publicQuote.toJSON() })
  })

  Vantagens:✅ Lógica testável✅ Reutilizável✅ Prepara o projeto      
  para escalar✅ Consistente com projetos enterprise

  Desvantagens:⚠️ Mais código inicial⚠️ Time precisa aprender novo     
  padrão
 ---
  🎯 Recomendação: Arquitetura Evolucionária

  Estratégia: "Refatorar Progressivamente, Não Reescrever"

  Não recomendo reescrever tudo agora. Em vez disso, introduza         
  camadas gradualmente onde a dor é maior:

  Fase 1: Adicionar Service Layer (Prioridade ALTA)

  Quando usar Services:
  - ✅ Lógica de negócio com múltiplos steps
  - ✅ Operações que envolvem múltiplos models
  - ✅ Transações complexas
  - ✅ Side effects (emails, webhooks, provisioning)

  Exemplo de Refatoração:

  // ❌ ANTES: Lógica no Model
  // src/server/infra/models/TenantApplication.js
  static async grantLicense(licenseData) {
    // 224 linhas de validação + insert + provisioning + logs
  }

  // ✅ DEPOIS: Service Layer
  // src/server/services/LicenseService.js
  class LicenseService {
    async grantLicense(tenantId, applicationId, options) {
      // 1. Validações
      await this.validateLicenseData(tenantId, applicationId,
  options)

      // 2. Business logic
      const license = await TenantApplication.create({
        tenantId,
        applicationId,
        ...options
      })

      // 3. Side effects (provisioning)
      await this.provisionApplicationSchema(tenantId,
  applicationId)

      // 4. Audit/Logging
      await this.logLicenseGrant(license)

      return license
    }

    private async validateLicenseData(tenantId, applicationId,
  options) {
      const application = await Application.findById(applicationId)    
      if (!application) throw new ApplicationNotFoundError()

      const existing = await
  TenantApplication.findByTenantAndApplication(tenantId,
  applicationId)
      if (existing) throw new Error('License already exists')
    }

    private async provisionApplicationSchema(tenantId,
  applicationId) {
      const tenant = await Tenant.findById(tenantId)
      const application = await Application.findById(applicationId)    

      if (application.slug === 'tq') {
        const client = await database.getClient()
        try {
          await provisionTQAppSchema(client, tenant.schemaName,        
  tenant.timezone)
        } finally {
          client.release()
        }
      }
    }

    private async logLicenseGrant(license) {
      console.log('✅ License granted:', license.id)
    }
  }

  // Route agora fica simples:
  // src/server/api/internal/routes/tenant-applications.js
  router.post('/', async (req, res) => {
    try {
      const licenseService = new LicenseService()
      const license = await licenseService.grantLicense(
        req.body.tenantId,
        req.body.applicationId,
        req.body
      )

      res.status(201).json({ data: license.toJSON() })
    } catch (error) {
      handleError(res, error)
    }
  })

  Benefícios:
  - ✅ Route handler agora tem 10 linhas (era 50+)
  - ✅ Lógica de negócio testável sem Express
  - ✅ Service pode ser reutilizado (API, CLI, background jobs)        
  - ✅ Model volta a ser "só dados + queries simples"

  ---
  Fase 2: Adicionar Input Validation Layer (Prioridade MÉDIA)

  Use Zod ou Joi para validação declarativa:

  // src/server/api/tq/validation/quote.schema.js
  const { z } = require('zod')

  const createQuoteSchema = z.object({
    sessionId: z.string().uuid(),
    content: z.string().optional(),
    status: z.enum(['draft', 'sent', 'approved',
  'rejected']).default('draft'),
    expiresAt: z.string().datetime().optional()
  })

  // Middleware de validação
  const validateBody = (schema) => (req, res, next) => {
    try {
      req.validatedBody = schema.parse(req.body)
      next()
    } catch (error) {
      res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      })
    }
  }

  // Route usa middleware
  router.post('/', validateBody(createQuoteSchema), async (req,        
  res) => {
    const quote = await Quote.create(req.validatedBody,
  req.tenant.schema)
    res.status(201).json({ data: quote.toJSON() })
  })

  ---
  Fase 3: Controllers Opcionais (Prioridade BAIXA)

  Só adicione se:
  - Routes começarem a ter muita lógica de formatação de resposta      
  - Precisar de múltiplos formatos de output (JSON, XML, CSV)
  - Time crescer e precisar de separação clara de responsabilidades    

  // src/server/api/tq/controllers/QuoteController.js
  class QuoteController {
    async create(req, res) {
      const { sessionId, content, status } = req.validatedBody
      const schema = req.tenant.schema

      const quote = await Quote.create({ sessionId, content, status    
   }, schema)

      return this.sendCreated(res, quote.toJSON(), 'QUOTE_CREATED')    
    }

    sendCreated(res, data, code) {
      res.status(201).json({
        data,
        meta: { code, message: 'Created successfully' }
      })
    }
  }

  // Route vira uma linha
  router.post('/', validateBody(createQuoteSchema), (req, res) =>      
    new QuoteController().create(req, res)
  )

  ---
  📊 Arquitetura Recomendada para Este Projeto

  Estrutura Proposta (Gradual)

  src/server/
  ├── api/
  │   ├── tq/
  │   │   ├── routes/           # Express routes (thin handlers)       
  │   │   ├── validation/       # Zod schemas
  │   │   └── index.js
  │   └── public/
  │       └── routes/
  ├── services/                 # ⭐ NOVO: Business logic
  │   ├── LicenseService.js
  │   ├── QuoteService.js
  │   └── PublicQuoteService.js
  ├── infra/
  │   ├── models/              # Data access only (queries)
  │   ├── middleware/
  │   ├── provisioners/
  │   └── db/
  └── shared/
      └── errors/              # Custom error classes

  Responsabilidades Claras

  | Camada       | Responsabilidade                          |
  Exemplo                                            |
  |--------------|-------------------------------------------|-----    
  -----------------------------------------------|
  | Routes       | HTTP layer (req/res), routing, middleware |
  Validar headers, chamar service, formatar response |
  | Services     | Business logic, orchestration             |
  Validar regras, coordenar models, side effects     |
  | Models       | Data access, queries simples              | CRUD    
   no banco, relacionamentos                     |
  | Provisioners | Schema setup, migrations                  |
  Criar tabelas, índices                             |

  ---
  🎬 Plano de Ação para Public Quote Pages

  Opção A: Seguir Padrão Atual (Rápido, Técnico Debt)

  // Routes fazem tudo diretamente
  router.post('/tq/public-quotes', async (req, res) => {
    // Validação inline
    // Chamada direta ao Model
    // Resposta inline
  })

  Vantagens: Rápido, consistente com codebase atualDesvantagens:       
  Adiciona mais debt técnico

  ---
  Opção B: Introduzir Service Layer (Recomendado)

  // src/server/services/PublicQuoteService.js
  class PublicQuoteService {
    async publishQuote(quoteId, options, schema) {
      // 1. Validar quote existe
      const quote = await Quote.findById(quoteId, schema, true,        
  true)

      // 2. Criar link público
      const publicQuote = await PublicQuote.create({
        quoteId,
        password: options.password,
        expiresAt: options.expiresAt || this.getDefaultExpiry(),       
        puckSchema: options.puckSchema
      }, schema)

      // 3. Log/Audit
      await this.logPublicQuoteCreation(publicQuote)

      return publicQuote
    }

    async viewPublicQuote(tenantSlug, token, password) {
      // 1. Resolver tenant
      const tenant = await this.resolveTenant(tenantSlug)

      // 2. Validar token + senha
      const publicQuote = await this.validateAccess(token,
  password, tenant.schema)

      // 3. Incrementar views
      await publicQuote.incrementViews(tenant.schema)

      // 4. Buscar dados completos
      const quote = await Quote.findById(publicQuote.quoteId,
  tenant.schema, true, true)
      const branding = await TenantBranding.findByTenant(tenant.id)    

      return { quote, branding, publicQuote }
    }
  }

  // Route agora é limpa:
  router.post('/tq/public-quotes',
  validateBody(publishQuoteSchema), async (req, res) => {
    const service = new PublicQuoteService()
    const publicQuote = await service.publishQuote(
      req.body.quoteId,
      req.body,
      req.tenant.schema
    )

    res.status(201).json({ data: publicQuote.toJSON() })
  })

  Vantagens:✅ Lógica testável✅ Reutilizável✅ Prepara o projeto      
  para escalar✅ Consistente com projetos enterprise

  Desvantagens:⚠️ Mais código inicial⚠️ Time precisa aprender novo     
  padrão

    📊 Comparação: Com vs Sem Service Layer

  | Aspecto          | Sem Service Layer (Atual)      | Com Service    
   Layer      |
  |------------------|--------------------------------|------------    
  ------------|
  | Linhas de código | ~800                           | ~1200
              |
  | Arquivos         | 8                              | 12
              |
  | Complexidade     | Baixa                          | Média
              |
  | Testabilidade    | Boa (integration tests)        | Excelente      
  (unit tests) |
  | Velocidade dev   | ⚡ Rápida                       | 🐢 Mais       
  lenta          |
  | Manutenção       | Fácil (time conhece)           | Requer
  onboarding      |
  | Escalabilidade   | Suficiente para 100-1000 users | Melhor para    
   10k+ users |
  | Consistência     | ✅ Consistente com codebase     | ❌ Novo       
  padrão          |

  Veredito: Para este projeto, Sem Service Layer vence.

  CONFIGURATIONS ENTITIES

    Opção 2: Tabelas Especializadas por Domínio

  -- Branding (visual identity)
  CREATE TABLE tenant_branding (
    id SERIAL PRIMARY KEY,
    tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) UNIQUE,       
    primary_color VARCHAR(7) DEFAULT '#B725B7',
    secondary_color VARCHAR(7) DEFAULT '#E91E63',
    tertiary_color VARCHAR(7) DEFAULT '#5ED6CE',
    logo_url TEXT,
    favicon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- Email settings
  CREATE TABLE tenant_email_settings (
    id SERIAL PRIMARY KEY,
    tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) UNIQUE,       
    from_name VARCHAR(255),
    from_email VARCHAR(255),
    reply_to VARCHAR(255),
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- Workflow preferences
  CREATE TABLE tenant_workflow_settings (
    id SERIAL PRIMARY KEY,
    tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) UNIQUE,       
    auto_approve_quotes BOOLEAN DEFAULT false,
    default_quote_expiry_days INTEGER DEFAULT 30,
    require_approval_above_amount NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- Integrations (sensitive data)
  CREATE TABLE tenant_integrations (
    id SERIAL PRIMARY KEY,
    tenant_id_fk INTEGER NOT NULL REFERENCES tenants(id) UNIQUE,       
    stripe_api_key_encrypted TEXT,
    twilio_account_sid_encrypted TEXT,
    aws_s3_bucket VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  ✅ Vantagens:
  - Schema fortemente tipado (validação no banco)
  - Queries simples e rápidas
  - JOINs eficientes
  - Código type-safe (branding.primaryColor)
  - Fácil aplicar constraints (CHECK, NOT NULL, etc)
  - Clara separação de concerns
  - Migrations documentam evolução

  ❌ Desvantagens:
  - Precisa migration para cada novo domínio
  - Mais tabelas no banco
  - Menos "flexível" (mas isso é bom!)