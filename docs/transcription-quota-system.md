# Sistema de Quotas de Transcrição (Speech-to-Text)

## 📋 Visão Geral

Sistema de controle de uso e cobrança de transcrição de áudio para texto (STT - Speech-to-Text), com quotas mensais configuráveis por tenant. Permite diferentes planos (Basic, VIP) com limites flexíveis e monitoramento de custos em tempo real.

---

## 🎯 Objetivos

1. **Controlar custos** - Evitar gastos excessivos com API de transcrição externa
2. **Flexibilidade** - Oferecer planos diferentes (Basic com limite fixo, VIP customizável)
3. **Transparência** - Admin do tenant visualiza uso e custos no Hub
4. **Gestão centralizada** - Equipe interna configura planos via Internal Admin
5. **Escalabilidade** - Arquitetura preparada para trocar fornecedor STT sem reescrever código

---

## 💳 Separação de Precificação (IMPORTANTE)

Este sistema de quotas de transcrição é **arquiteturalmente separado** do sistema de precificação de assinaturas.

### **Tabela `application_pricing` (NÃO AFETADA)**

**O que é:**
- Tabela CORE que armazena o preço da assinatura do aplicativo TQ por tipo de usuário
- Exemplo: Admin TQ = R$50/mês, Manager TQ = R$30/mês, Operations TQ = R$20/mês

**Onde fica o snapshot:**
- Quando acesso é concedido via Internal Admin, valores são "congelados" em `user_application_access`:
  - `price_snapshot NUMERIC(10,2)` - Valor no momento da concessão
  - `currency_snapshot VARCHAR(3)` - Moeda (BRL, USD, etc.)
  - `granted_cycle pricing_cycle_enum` - Ciclo (monthly/yearly)

**Por que não é afetado:**
- O sistema de quotas não altera preços de assinatura
- Assinatura TQ ≠ Quota de transcrição
- São cobranças separadas e independentes

### **Sistema de Quotas de Transcrição (NOVO)**

**O que é:**
- Sistema adicional de controle de uso e custos de transcrição (STT)
- Pacotes Basic e VIP com limites diferentes
- Não está conectado ao `application_pricing`

**Estrutura:**
```
Tenant tem:
├── 1 Assinatura TQ (via application_pricing)
│   └── Preço fixo por user type (Admin/Manager/Operations)
│
└── 1 Quota de Transcrição (via transcription_plans)
    └── Limite de uso mensal (Basic/VIP)
```

**Exemplo Prático:**
```
Clínica Odontológica XYZ:

Assinatura TQ:
- 1 Admin: R$50/mês (application_pricing)
- 2 Managers: R$60/mês (2 × R$30)
- Total assinatura: R$110/mês

Quota de Transcrição (separada):
- Plano Basic: 2.400 min/mês (40 horas)
- Custo estimado: $10.32/mês (uso de STT)
- Sem relação com os R$110 da assinatura
```

**Resultado:** A mudança deste sistema **NÃO afeta** `application_pricing` ou snapshots existentes.

---

## ⚙️ Configuração e Limites do Sistema

### **Variável de Ambiente e Constante**

O limite mínimo do plano Basic é configurável via variável de ambiente:

```bash
# .env
TRANSCRIPTION_BASIC_MONTHLY_LIMIT=2400  # Minutos (40 horas)
```

**Backend Constant:**
```javascript
// src/server/infra/constants/transcription.js
const TRANSCRIPTION_BASIC_MONTHLY_LIMIT = parseInt(
  process.env.TRANSCRIPTION_BASIC_MONTHLY_LIMIT || '2400'
);

module.exports = {
  TRANSCRIPTION_BASIC_MONTHLY_LIMIT
};
```

### **Regra Crítica: VIP >= Basic**

**Plano VIP NÃO pode ter limite customizado abaixo do Basic:**
- Se Basic = 2.400 min/mês, então VIP >= 2.400 min/mês
- Evita que clientes "paguem mais para usar menos"
- Validação obrigatória no frontend e backend

**Exemplo:**
```
✅ Válido:
- Basic: 2.400 min/mês (fixo)
- VIP: 5.000 min/mês (custom)

❌ Inválido:
- Basic: 2.400 min/mês (fixo)
- VIP: 1.500 min/mês (custom) ← NÃO PERMITIDO
```

---

## 💡 Exemplos Práticos

### **Exemplo 1: Clínica Odontológica Pequena (Plano Basic)**

**Perfil:**
- 1 dentista
- 4 consultas/dia em média
- 30 minutos por consulta
- 20 dias úteis/mês

**Configuração:**
- Plano: **Basic**
- Limite mensal: **2.400 minutos** (40 horas)
- Overage: **Não permitido**

**Cenário Real:**
```
Mês completo:
- 20 dias × 4 consultas × 30 min = 2.400 minutos
- Limite mensal: 2.400 minutos
- Resultado: 100% do limite utilizado, sem bloqueio

Custo:
- 2.400 min × $0.0052 = $12.48/mês
- Uso controlado e previsível
```

**Benefício:**
- Flexibilidade diária (pode fazer 10 consultas num dia, 2 no outro)
- Custo controlado em ~$12.50/mês
- Sem bloqueios no meio do mês (se usar dentro do limite mensal)

---

### **Exemplo 2: Clínica Médica Grande (Plano VIP)**

**Perfil:**
- 3 médicos
- 15 consultas/dia total
- 30 minutos por consulta em média
- 22 dias úteis/mês

**Configuração:**
- Plano: **VIP**
- Limite mensal customizado: **10.000 minutos** (166.7 horas)
- Overage: **Permitido** (com alerta)

**Cenário Real:**
```
Mês típico:
- 22 dias × 15 consultas × 30 min = 9.900 minutos
- Limite mensal: 10.000 minutos
- Resultado: 99% utilizado, dentro do limite
- Custo: $51.48/mês (9900 min × $0.0052)

Mês atípico (alta demanda):
- 25 dias × 18 consultas × 30 min = 13.500 minutos
- Limite mensal: 10.000 minutos
- Overage: 3.500 minutos (35% acima do limite)
- Sistema processa normalmente (overage_allowed=true)
- Custo do mês: $70.20 (13500 min × $0.0052)
- Alerta enviado: "⚠️ Você ultrapassou 135% da quota mensal"
```

**Benefício:**
- Flexibilidade total (sem bloqueios)
- Overage permite picos sazonais
- Admin monitorado via alertas

---

### **Exemplo 3: Upgrade de Basic para VIP**

**Situação:**
Uma clínica começa pequena e cresce:

**Mês 1-3 (Basic):**
```
Configuração inicial:
- Plano Basic (2.400 min/mês)
- 1 médico, baixo volume
- Uso: ~1.800 min/mês
- Custo médio: $7.74/mês
```

**Mês 4 (Crescimento - ainda Basic):**
```
Novo cenário:
- Contratou 2º médico
- Tentam usar 4.500 min no mês
- Limite mensal: 2.400 min
- Resultado: Sistema bloqueia após 2.400 min (dia 15 do mês)

Mensagem na tela:
"❌ Monthly transcription quota exceeded

Used: 2,400/2,400 minutes (40h 0min)
Your Basic plan allows 2,400 minutes per month.

Quota resets on March 1st.
Contact support to upgrade to VIP for custom limits."
```

**Ação tomada:**
```
Internal Admin acessa:
/transcription-plans → Verifica planos disponíveis
/tenants/123/edit → Transcription Configuration

Antes:
- Plan: Basic (2400 min/mês fixo)
- Allow Overage: No

Depois:
- Plan: VIP
- Custom Monthly Limit: 6000 min (100h) ← Mínimo 2400
- Allow Overage: Yes

Resultado imediato:
- Clínica pode processar todas consultas
- Custo estimado: $25.80/mês
- Admin monitora uso no Hub
```

---

## 🏗️ Arquitetura de Dados

### **1. Tabela: `transcription_plans` (Global)**

Armazena os planos disponíveis no sistema (gerenciados via Internal Admin).

```sql
CREATE TABLE public.transcription_plans (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  monthly_minutes_limit INTEGER,
  allows_custom_limits BOOLEAN DEFAULT false,
  cost_per_minute_usd NUMERIC(6,4) NOT NULL,
  active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Dados iniciais (seed):**
| id | slug  | name       | monthly_limit | allows_custom | cost_per_min | active |
|----|-------|------------|---------------|---------------|--------------|--------|
| 1  | basic | Basic Plan | 2400          | false         | 0.0052       | true   |
| 2  | vip   | VIP Plan   | NULL          | true          | 0.0052       | true   |

**Lógica:**
- **Basic**: Limite fixo (2.400 min/mês ≈ 40h), sem customização
- **VIP**: Sem limite padrão, admin define valor personalizado (mínimo 2.400)
- **CRUD completo**: Internal Admin pode criar/editar/deletar/ativar/desativar planos

---

### **2. Tabela: `tenant_transcription_config` (Global)**

Configuração por tenant (qual plano + limite customizado se VIP).

```sql
CREATE TABLE public.tenant_transcription_config (
  id SERIAL PRIMARY KEY,
  tenant_id_fk INTEGER NOT NULL UNIQUE REFERENCES public.tenants(id),
  plan_id_fk INTEGER NOT NULL REFERENCES public.transcription_plans(id),
  custom_monthly_limit INTEGER,
  overage_allowed BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  -- Constraint: custom_monthly_limit >= TRANSCRIPTION_BASIC_MONTHLY_LIMIT
  CONSTRAINT custom_limit_min_basic CHECK (
    custom_monthly_limit IS NULL
    OR custom_monthly_limit >= 2400
  ),

  -- Constraint: custom limits only for VIP
  CONSTRAINT custom_limits_only_if_allowed CHECK (
    (SELECT allows_custom_limits FROM transcription_plans WHERE id = plan_id_fk) = true
    OR custom_monthly_limit IS NULL
  )
);
```

**Exemplo de registros:**
| tenant_id | plan_id | custom_monthly | overage_allowed | enabled |
|-----------|---------|----------------|-----------------|---------|
| 1         | 1       | NULL           | false           | true    |
| 2         | 2       | 10000          | true            | true    |
| 3         | 1       | NULL           | false           | true    |

**Lógica:**
- Se `plan_id=1` (Basic): `custom_monthly_limit` deve ser NULL (constraint)
- Se `plan_id=2` (VIP): `custom_monthly_limit` >= 2400 (constraint)
- `overage_allowed=true`: processa mesmo após exceder limite (mas registra alerta)
- `enabled=false`: desabilita transcrição completamente

---

### **3. Tabela: `tenant_transcription_usage` (Global)**

Rastreamento de cada transcrição processada.

```sql
CREATE TABLE public.tenant_transcription_usage (
  id SERIAL PRIMARY KEY,
  tenant_id_fk INTEGER NOT NULL REFERENCES public.tenants(id),
  transcription_id UUID,
  audio_duration_seconds INTEGER NOT NULL,
  stt_model VARCHAR(50) NOT NULL,
  stt_provider_request_id TEXT,
  cost_usd NUMERIC(10,4) NOT NULL,
  usage_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenant_transcription_usage_tenant_date
  ON tenant_transcription_usage(tenant_id_fk, usage_date DESC);

CREATE INDEX idx_tenant_transcription_usage_month
  ON tenant_transcription_usage(tenant_id_fk, DATE_TRUNC('month', usage_date));
```

**Exemplo de registros:**
| tenant_id | transcription_id | duration_sec | stt_model | cost_usd | usage_date |
|-----------|------------------|--------------|-----------|----------|------------|
| 2         | uuid-123         | 2700         | nova-2    | 0.1935   | 2025-01-15 |
| 2         | uuid-456         | 1800         | nova-2    | 0.1290   | 2025-01-15 |
| 2         | uuid-789         | 3600         | nova-3    | 0.3120   | 2025-01-16 |

**Agregações:**
```sql
-- Uso mensal
SELECT SUM(audio_duration_seconds) / 60 as minutes_used
FROM tenant_transcription_usage
WHERE tenant_id_fk = 2
  AND usage_date >= DATE_TRUNC('month', CURRENT_DATE);
-- Resultado: 3.245 minutos (54h)
```

---

## 🔒 Fluxo de Bloqueio de Quota

### **Middleware: checkTranscriptionQuota**

Executado ANTES de iniciar transcrição (`POST /api/tq/v1/transcriptions/:id/transcribe`).

```javascript
const { TRANSCRIPTION_BASIC_MONTHLY_LIMIT } = require('../infra/constants/transcription');

async function checkTranscriptionQuota(req, res, next) {
  const tenantId = req.tenant.id;

  // 1. Buscar configuração do tenant
  const config = await TenantTranscriptionConfig.findByTenant(tenantId);

  if (!config || !config.enabled) {
    return res.status(403).json({
      error: 'Transcription service not available',
      message: 'Contact support to enable transcription.'
    });
  }

  // 2. Buscar uso do MÊS (agregação de usage_date >= início do mês)
  const monthlyUsage = await TenantTranscriptionConfig.getUsage(tenantId, 'current_month');

  // 3. Verificar limite MENSAL
  if (config.monthlyLimit && monthlyUsage.minutesUsed >= config.monthlyLimit && !config.overageAllowed) {
    return res.status(429).json({
      error: 'Monthly transcription quota exceeded',
      usage: {
        used: monthlyUsage.minutesUsed,
        limit: config.monthlyLimit,
        plan: config.planName
      },
      message: `Monthly limit of ${config.monthlyLimit} minutes reached. Resets on ${getNextMonthDate()}.`
    });
  }

  // 4. OK: permite transcrição
  next();
}
```

**Exemplo de bloqueio (resposta 429):**
```json
{
  "error": "Monthly transcription quota exceeded",
  "usage": {
    "used": 2400,
    "limit": 2400,
    "plan": "Basic Plan"
  },
  "message": "Monthly limit of 2400 minutes reached. Resets on February 1st."
}
```

---

## 📊 Registro de Uso (Webhook)

Após transcrição completada, webhook registra uso:

```javascript
// Dentro do webhook handler (após salvar transcript)

// 1. Extrair modelo usado do provider
const modelCosts = {
  'nova-3': 0.0052,      // Multilingual
  'nova-3-mono': 0.0043, // Monolingual
  'nova-2': 0.0043,
  'nova': 0.0043,
  'enhanced': 0.0059,
  'base': 0.0043
};

const model = transcriptionData.model_used || 'nova-3'; // System default: Nova-3 Multilingual
const costPerMinute = modelCosts[model] || 0.0052;

// 2. Calcular custo real
const durationMinutes = transcriptionData.processing_duration_seconds / 60;
const costUsd = durationMinutes * costPerMinute;

// 3. Registrar na tabela de uso
await client.query(`
  INSERT INTO public.tenant_transcription_usage (
    tenant_id_fk,
    transcription_id,
    audio_duration_seconds,
    stt_model,
    stt_provider_request_id,
    cost_usd,
    usage_date
  ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
`, [
  tenantId,
  transcriptionId,
  transcriptionData.processing_duration_seconds,
  model,
  transcriptionData.request_id,
  costUsd
]);

console.log(`Usage logged: Tenant ${tenantId} - ${durationMinutes.toFixed(2)} min - $${costUsd.toFixed(4)}`);
```

---

## 🖥️ Interface - Hub (Admin do Tenant)

### **Página: Transcription Usage**

Rota: `/transcription-usage` (sidebar: "Transcription Usage", admin-only)

**Layout:**

```
╔═══════════════════════════════════════════════════════════════╗
║  Transcription Usage                                          ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌─────────────────┐  ┌─────────────────┐                    ║
║  │ Monthly Usage   │  │ Monthly Cost    │                    ║
║  │                 │  │                 │                    ║
║  │ 1,850 / 2,400  │  │ $7.96           │                    ║
║  │ ██████░░░░ 77% │  │                 │                    ║
║  │                 │  │ Basic Plan      │                    ║
║  └─────────────────┘  └─────────────────┘                    ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Plan Information                                         │ ║
║  ├─────────────────────────────────────────────────────────┤ ║
║  │ Current Plan: Basic Plan                                │ ║
║  │ Monthly Limit: 2,400 minutes (40 hours)                 │ ║
║  │ Remaining: 550 minutes (9.2 hours)                      │ ║
║  │ Overage: Not Allowed                                    │ ║
║  │ Resets: February 1st                                    │ ║
║  │                                                          │ ║
║  │ ℹ️  Contact support to upgrade to VIP plan for custom   │ ║
║  │    limits and overage allowance.                        │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Usage History (Last 30 Days)                            │ ║
║  ├──────────┬────────────┬──────────┬─────────────────────┤ ║
║  │ Date     │ Minutes    │ Cost     │ Transcriptions      │ ║
║  ├──────────┼────────────┼──────────┼─────────────────────┤ ║
║  │ Jan 15   │ 118.5      │ $0.5096  │ 4                   │ ║
║  │ Jan 14   │ 95.2       │ $0.4094  │ 3                   │ ║
║  │ Jan 13   │ 0          │ $0.0000  │ 0 (Weekend)         │ ║
║  │ Jan 12   │ 110.8      │ $0.4764  │ 5                   │ ║
║  │ ...      │ ...        │ ...      │ ...                 │ ║
║  └──────────┴────────────┴──────────┴─────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════╝
```

**API:**
```
GET /internal/api/v1/me/transcription-usage
Authorization: Bearer <token>

Response:
{
  "config": {
    "plan": "Basic Plan",
    "monthlyLimit": 2400,
    "overageAllowed": false,
    "allowsCustomLimits": false
  },
  "usage": {
    "currentMonth": {
      "minutesUsed": 1850,
      "limit": 2400,
      "remaining": 550,
      "percentage": 77,
      "costUsd": 7.955,
      "resetDate": "2025-02-01"
    }
  },
  "history": [
    { "date": "2025-01-15", "minutesUsed": "118.5", "costUsd": "0.5096", "transcriptionCount": 4 },
    ...
  ]
}
```

---

## ⚙️ Interface - Hub Self-Service (VIP Users)

### **Seção: Transcription Settings (dentro de Configurations)**

Rota: `/configurations` → Drawer item: "Transcription" (admin-only)

**Localização:** Dentro do drawer de Configurations do Hub (mesmo padrão que Branding)

**Objetivo:** Permitir que usuários VIP configurem seus próprios limites sem depender do Internal Admin

**Layout (VIP User):**

```
╔═══════════════════════════════════════════════════════════════╗
║  Transcription Settings                                       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Current Plan: VIP Plan                            ✅ VIP │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
║  Custom Monthly Limit (minutes) *                            ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 10000                                                    │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  Minimum: 2,400 minutes (40 hours)                           ║
║  Maximum: 50,000 minutes (833 hours)                         ║
║                                                               ║
║  ☑ Allow Overage Processing                                  ║
║  Continue processing transcriptions even after quota limit   ║
║  is reached (you will be billed for overage usage).          ║
║                                                               ║
║  ┌──────────────┐                                            ║
║  │ Save Changes │                                            ║
║  └──────────────┘                                            ║
║                                                               ║
║  ℹ️  VIP plan allows you to customize your transcription     ║
║     limits based on your business needs.                     ║
╚═══════════════════════════════════════════════════════════════╝
```

**Layout (Basic User - Locked State):**

```
╔═══════════════════════════════════════════════════════════════╗
║  Transcription Settings                                       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Current Plan: Basic Plan                                │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 🔒 Custom Limits Not Available                          │ ║
║  │                                                          │ ║
║  │ Your Basic plan includes:                               │ ║
║  │ • Monthly Limit: 2,400 minutes (40 hours)               │ ║
║  │ • Overage: Not Allowed                                  │ ║
║  │                                                          │ ║
║  │ 🎯 Upgrade to VIP Plan to unlock:                       │ ║
║  │ • Set custom monthly limit (min 2,400)                  │ ║
║  │ • Enable overage processing                             │ ║
║  │ • Flexible quota management                             │ ║
║  │                                                          │ ║
║  │ ┌───────────────────┐                                   │ ║
║  │ │ Contact Support   │                                   │ ║
║  │ └───────────────────┘                                   │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
║  ℹ️  Contact support to upgrade to VIP plan and unlock       ║
║     custom transcription limits.                             ║
╚═══════════════════════════════════════════════════════════════╝
```

**Validações Frontend:**
```javascript
const TRANSCRIPTION_BASIC_MONTHLY_LIMIT = 2400; // From constants

if (customMonthlyLimit < TRANSCRIPTION_BASIC_MONTHLY_LIMIT) {
  error = `VIP plan limit must be at least ${TRANSCRIPTION_BASIC_MONTHLY_LIMIT} minutes (same as Basic plan)`;
}

if (customMonthlyLimit > 50000) {
  error = "Monthly limit cannot exceed 50,000 minutes";
}
```

**API (VIP Self-Service):**
```
PUT /internal/api/v1/me/transcription-config
Authorization: Bearer <token>
x-tenant-id: 123

Request (VIP user):
{
  "customMonthlyLimit": 10000,
  "overageAllowed": true
}

Response (Success):
{
  "data": {
    "config": {
      "planName": "VIP Plan",
      "customMonthlyLimit": 10000,
      "overageAllowed": true
    }
  },
  "meta": {
    "code": "TRANSCRIPTION_CONFIG_UPDATED",
    "message": "Transcription settings updated successfully"
  }
}

Response (Error - Below minimum):
{
  "error": {
    "code": 400,
    "message": "VIP plan limit must be at least 2400 minutes (same as Basic plan)"
  }
}
```

**Validações Backend:**
```javascript
const { TRANSCRIPTION_BASIC_MONTHLY_LIMIT } = require('../constants/transcription');

// Validar se é VIP
const config = await TenantTranscriptionConfig.findByTenant(req.tenant.id);

if (!config.allowsCustomLimits) {
  return res.status(403).json({
    error: {
      code: 403,
      message: "Custom limits are only available for VIP plan. Contact support to upgrade."
    }
  });
}

// Validar limites razoáveis
if (customMonthlyLimit < TRANSCRIPTION_BASIC_MONTHLY_LIMIT) {
  return res.status(400).json({
    error: `VIP plan limit must be at least ${TRANSCRIPTION_BASIC_MONTHLY_LIMIT} minutes (same as Basic plan)`
  });
}

if (customMonthlyLimit > 50000) {
  return res.status(400).json({ error: "Monthly limit cannot exceed 50,000 minutes" });
}
```

---

## 🛠️ Interface - Internal Admin

### **Nova Página: Transcription Plans (CRUD)**

Rota: `/transcription-plans` (sidebar: "Transcription Plans")

**Objetivo:** Gerenciar planos de transcrição disponíveis no sistema.

**Layout (Listagem):**

```
╔═══════════════════════════════════════════════════════════════╗
║  Transcription Plans                                          ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌──────────────────┐                                        ║
║  │ + Create Plan    │                                        ║
║  └──────────────────┘                                        ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Plans List                                               │ ║
║  ├──────┬────────┬─────────┬────────┬────────┬────────────┤ ║
║  │ Name │ Slug   │ Limit   │ Custom │ Cost   │ Actions    │ ║
║  ├──────┼────────┼─────────┼────────┼────────┼────────────┤ ║
║  │ Basic│ basic  │ 2400    │ No     │ $0.0052│ Edit Delet │ ║
║  │ Plan │        │ min/mo  │        │        │            │ ║
║  ├──────┼────────┼─────────┼────────┼────────┼────────────┤ ║
║  │ VIP  │ vip    │ Custom  │ Yes    │ $0.0052│ Edit Delet │ ║
║  │ Plan │        │         │        │        │            │ ║
║  └──────┴────────┴─────────┴────────┴────────┴────────────┘ ║
╚═══════════════════════════════════════════════════════════════╝
```

**Layout (Criar/Editar Plano):**

```
╔═══════════════════════════════════════════════════════════════╗
║  Create Transcription Plan                                    ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Plan Name *                                                  ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Premium Plan                                             │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
║  Slug *                                                       ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ premium                                                  │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  URL-friendly identifier (lowercase, no spaces)              ║
║                                                               ║
║  Monthly Minutes Limit                                       ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 5000                                                     │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  Leave empty if plan allows custom limits                    ║
║                                                               ║
║  ☑ Allows Custom Limits                                      ║
║  Users can set their own monthly limits (VIP feature)        ║
║                                                               ║
║  Cost Per Minute (USD) *                                     ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ $0.0052 (Nova-3 Multilingual - System Standard)        │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  (Read-only - System uses Nova-3 Multilingual model)        ║
║                                                               ║
║  Description                                                 ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Mid-tier plan with fixed 5,000 min/month limit          │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
║  ☑ Active                                                     ║
║  Plan is available for assignment to tenants                 ║
║                                                               ║
║  ┌──────────────┐  ┌────────┐                               ║
║  │ Save Plan    │  │ Cancel │                               ║
║  └──────────────┘  └────────┘                               ║
╚═══════════════════════════════════════════════════════════════╝
```

**API (CRUD Plans):**
```
# Listar planos
GET /internal/api/v1/transcription-plans
Response: { data: [{ id, slug, name, monthlyLimit, allowsCustomLimits, ... }] }

# Criar plano
POST /internal/api/v1/transcription-plans
Request: { name, slug, monthlyMinutesLimit, allowsCustomLimits, costPerMinuteUsd, description }
Response: { data: { id, ... }, meta: { code: 'PLAN_CREATED' } }

# Editar plano
PUT /internal/api/v1/transcription-plans/:id
Request: { name, monthlyMinutesLimit, allowsCustomLimits, costPerMinuteUsd, description, active }
Response: { data: { id, ... }, meta: { code: 'PLAN_UPDATED' } }

# Deletar plano (soft delete via active=false)
DELETE /internal/api/v1/transcription-plans/:id
Response: { meta: { code: 'PLAN_DELETED' } }
```

---

### **Seção: Transcription Configuration (Tenant Edit)**

Localização: `/tenants/:id/edit` → Nova seção após "Entitlements"

**Objetivo:** Selecionar plano existente e configurar overage (não cria planos aqui).

**Layout (Simplificado):**

```
╔═══════════════════════════════════════════════════════════════╗
║  Transcription Configuration                                  ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Select Plan *                                                ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ VIP Plan ▼                                               │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  Options: Basic Plan (2400 min/mo), VIP Plan (custom)        ║
║                                                               ║
║  Custom Monthly Limit (minutes)                              ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 10000                                                    │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  Only for VIP plan. Minimum: 2,400 minutes.                  ║
║                                                               ║
║  ☑ Allow Overage                                             ║
║  Process transcriptions even after exceeding quota.          ║
║                                                               ║
║  ☑ Enabled                                                    ║
║  Enable transcription service for this tenant.               ║
║                                                               ║
║  ┌──────────────┐                                            ║
║  │ Save Changes │                                            ║
║  └──────────────┘                                            ║
║                                                               ║
║  Current Usage (January 2025)                                ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Total: 8,245 minutes (137.4 hours)                      │ ║
║  │ Cost: $35.45                                             │ ║
║  │ Transcriptions: 327                                      │ ║
║  └─────────────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════╝
```

**Validações Frontend:**
```javascript
const TRANSCRIPTION_BASIC_MONTHLY_LIMIT = 2400;

if (selectedPlan.allowsCustomLimits && !customMonthlyLimit) {
  error = "VIP plan requires custom monthly limit to be set";
}

if (selectedPlan.allowsCustomLimits && customMonthlyLimit < TRANSCRIPTION_BASIC_MONTHLY_LIMIT) {
  error = `Custom limit must be at least ${TRANSCRIPTION_BASIC_MONTHLY_LIMIT} minutes`;
}

if (!selectedPlan.allowsCustomLimits && customMonthlyLimit) {
  error = "This plan does not allow custom limits";
}
```

**API:**
```
GET /internal/api/v1/tenants/:id/transcription-config
Response: {
  data: {
    planId, planName, customMonthlyLimit, overageAllowed, enabled
  }
}

PUT /internal/api/v1/tenants/:id/transcription-config
Request: { planId, customMonthlyLimit, overageAllowed, enabled }
Response: { meta: { code: 'TRANSCRIPTION_CONFIG_UPDATED' } }
```

---

## 📈 Métricas e Monitoramento

### **Queries úteis para análise:**

```sql
-- Top 10 tenants por uso mensal
SELECT
  t.name as tenant_name,
  SUM(ttu.audio_duration_seconds) / 60 as minutes_used,
  SUM(ttu.cost_usd) as total_cost,
  COUNT(*) as transcription_count
FROM public.tenant_transcription_usage ttu
JOIN public.tenants t ON ttu.tenant_id_fk = t.id
WHERE ttu.usage_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY t.name
ORDER BY minutes_used DESC
LIMIT 10;

-- Tenants próximos do limite (> 80%)
SELECT
  t.name,
  COALESCE(ttc.custom_monthly_limit, tp.monthly_minutes_limit) as limit_minutes,
  SUM(ttu.audio_duration_seconds) / 60 as used_minutes,
  ROUND((SUM(ttu.audio_duration_seconds) / 60.0) / COALESCE(ttc.custom_monthly_limit, tp.monthly_minutes_limit) * 100, 2) as percentage
FROM public.tenant_transcription_usage ttu
JOIN public.tenants t ON ttu.tenant_id_fk = t.id
JOIN public.tenant_transcription_config ttc ON ttu.tenant_id_fk = ttc.tenant_id_fk
JOIN public.transcription_plans tp ON ttc.plan_id_fk = tp.id
WHERE ttu.usage_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY t.name, ttc.custom_monthly_limit, tp.monthly_minutes_limit
HAVING (SUM(ttu.audio_duration_seconds) / 60.0) / COALESCE(ttc.custom_monthly_limit, tp.monthly_minutes_limit) > 0.8
ORDER BY percentage DESC;

-- Custo total da plataforma (mês atual)
SELECT
  SUM(ttu.audio_duration_seconds) / 60 as total_minutes,
  SUM(ttu.cost_usd) as total_cost,
  COUNT(DISTINCT ttu.tenant_id_fk) as active_tenants
FROM public.tenant_transcription_usage ttu
WHERE ttu.usage_date >= DATE_TRUNC('month', CURRENT_DATE);
```

---

## 🔄 Migração e Rollout

### **Fase 1: Backend**
1. Criar migration com 3 tabelas
2. Criar constante `TRANSCRIPTION_BASIC_MONTHLY_LIMIT`
3. Seed com planos Basic e VIP
4. Implementar models (TranscriptionPlan, TenantTranscriptionConfig)
5. Implementar middleware `checkTranscriptionQuota`
6. Testar em ambiente de dev

### **Fase 2: Internal Admin**
1. Criar página CRUD de planos (`/transcription-plans`)
2. Criar seção de configuração em tenant edit
3. Configurar todos tenants existentes com plano Basic
4. Treinar equipe interna

### **Fase 3: Hub**
1. Criar página de visualização de uso
2. Criar página de configuração (VIP self-service)
3. Adicionar itens no sidebar (admin-only)
4. Comunicar tenants sobre novo recurso

### **Fase 4: TQ**
1. Ativar middleware de quota
2. Monitorar logs de bloqueio
3. Suporte reativo para tenants que excederem

---

## 🚨 Cenários de Erro

### **Erro 1: Quota mensal excedida (429)**
```
Frontend mostra:
"❌ Monthly transcription quota exceeded

Your Basic plan allows 2,400 minutes (40 hours) per month.
Used this month: 2,400/2,400 minutes

Quota resets on February 1st.
Contact support to upgrade to VIP plan for higher limits."

[Contact Support] [OK]
```

### **Erro 2: VIP limite abaixo do mínimo (400)**
```
Frontend mostra:
"❌ Invalid custom limit

VIP plan requires a minimum of 2,400 minutes per month (same as Basic plan).
Please increase your limit to at least 2,400 minutes."

[OK]
```

### **Erro 3: Serviço não configurado (403)**
```
Frontend mostra:
"⚠️ Transcription service not available

Your account does not have transcription enabled.
Contact support to activate this feature."

[Contact Support]
```

---

## 💰 Cálculo de ROI

### **Cenário: 10 tenants no primeiro mês**

| Tenant | Plano | Uso (min/mês) | Custo STT | Plano cobrado | Margem |
|--------|-------|---------------|-----------|---------------|--------|
| 1      | Basic | 2.400         | $10.32    | $29           | $18.68 |
| 2      | Basic | 2.100         | $9.03     | $29           | $19.97 |
| 3      | VIP   | 8.000         | $34.40    | $99           | $64.60 |
| 4      | Basic | 1.800         | $7.74     | $29           | $21.26 |
| 5      | Basic | 2.300         | $9.89     | $29           | $19.11 |
| 6      | VIP   | 12.000        | $51.60    | $149          | $97.40 |
| 7      | Basic | 2.200         | $9.46     | $29           | $19.54 |
| 8      | Basic | 2.000         | $8.60     | $29           | $20.40 |
| 9      | VIP   | 15.000        | $64.50    | $199          | $134.50|
| 10     | Basic | 2.400         | $10.32    | $29           | $18.68 |

**Total:**
- Custo STT: $215.86
- Receita planos: $649
- **Margem bruta: $433.14 (67%)**

---

## 📝 Checklist de Implementação

### **Backend**
- [ ] Constant: criar `src/server/infra/constants/transcription.js` com `TRANSCRIPTION_BASIC_MONTHLY_LIMIT`
- [ ] Migration: criar `transcription_plans` (com updated_at)
- [ ] Migration: criar `tenant_transcription_config` (com constraint >= 2400)
- [ ] Migration: criar `tenant_transcription_usage`
- [ ] Seed: popular `transcription_plans` (Basic, VIP)
- [ ] Model: `TranscriptionPlan.js` (CRUD completo)
- [ ] Model: `TenantTranscriptionConfig.js` (com validação de limite mínimo)
- [ ] Middleware: `checkTranscriptionQuota.js`
- [ ] Modificar webhook: adicionar registro de uso
- [ ] Rotas Hub: `GET /me/transcription-usage` (visualização de uso)
- [ ] Rotas Hub: `PUT /me/transcription-config` (self-service VIP com validação >= 2400)
- [ ] Rotas Internal Admin Plans: `GET /transcription-plans` (listar)
- [ ] Rotas Internal Admin Plans: `POST /transcription-plans` (criar)
- [ ] Rotas Internal Admin Plans: `PUT /transcription-plans/:id` (editar)
- [ ] Rotas Internal Admin Plans: `DELETE /transcription-plans/:id` (soft delete)
- [ ] Rotas Internal Admin Tenant: `GET /tenants/:id/transcription-config`
- [ ] Rotas Internal Admin Tenant: `PUT /tenants/:id/transcription-config` (validação >= 2400)

### **Frontend Hub**
- [ ] Página: `TranscriptionUsage.tsx` (visualização de uso)
- [ ] Componente: `TranscriptionConfiguration.tsx` (self-service VIP dentro de /configurations)
- [ ] Service: `transcriptionUsageService.ts`
- [ ] Service: `transcriptionConfigService.ts` (self-service)
- [ ] Sidebar: item "Transcription Usage" (admin-only)
- [ ] Configurations Drawer: item "Transcription" (admin-only, visível para todos)
- [ ] Component: `LockedFeatureCard.tsx` (visual indicator para Basic users)
- [ ] Tradução i18n (pt-BR e en-US)

### **Frontend Internal Admin**
- [ ] Página: `TranscriptionPlans.tsx` (CRUD completo de planos)
- [ ] Página: `CreatePlan.tsx` / `EditPlan.tsx` (formulários de plano)
- [ ] Service: `transcriptionPlansService.ts`
- [ ] Seção: `TranscriptionConfigSection.tsx` (em tenant edit - apenas seleciona plano)
- [ ] Sidebar: item "Transcription Plans" (nova aba)
- [ ] Validações de plano (Basic vs VIP, limite >= 2400)

### **Testes**
- [ ] Teste unitário: cálculo de custos por modelo
- [ ] Teste integração: bloqueio de quota mensal
- [ ] Teste integração: overage allowed
- [ ] Teste integração: VIP limite < 2400 bloqueado
- [ ] Teste E2E: fluxo completo (upload → bloqueio → visualização Hub)
- [ ] Teste E2E: CRUD de planos no Internal Admin

---

## 🎓 Glossário

- **STT (Speech-to-Text)**: Tecnologia de conversão de áudio em texto
- **Quota**: Limite de uso mensal
- **Overage**: Uso além do limite configurado
- **Basic Plan**: Plano com limite fixo de 2.400 min/mês, não customizável
- **VIP Plan**: Plano premium com limite customizável (mínimo 2.400 min/mês)
- **TRANSCRIPTION_BASIC_MONTHLY_LIMIT**: Constante que define limite mínimo (2.400)
- **Tenant**: Cliente/organização na plataforma multi-tenant
- **Internal Admin**: Interface administrativa para equipe interna (Simplia)
- **Hub**: Portal self-service para admins dos tenants

---

## 📞 Contato

Para dúvidas sobre implementação, contate o time de desenvolvimento.
