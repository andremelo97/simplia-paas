# Sistema de Quotas de Transcrição (Speech-to-Text)

## 📋 Visão Geral

Sistema de controle de uso e cobrança de transcrição de áudio para texto (STT - Speech-to-Text), com quotas mensais configuráveis por tenant. Permite diferentes planos (Starter, Basic, VIP, Custom) com limites flexíveis e monitoramento de custos em tempo real.

---

## 🎯 Objetivos

1. **Controlar custos** - Evitar gastos excessivos com API de transcrição externa
2. **Flexibilidade** - Oferecer planos diferentes (Starter, Basic, VIP, Custom) com limites dinâmicos por plano
3. **Transparência** - Admin do tenant visualiza uso e custos no Hub
4. **Gestão centralizada** - Equipe interna configura planos via Internal Admin
5. **Escalabilidade** - Arquitetura preparada para trocar fornecedor STT sem reescrever código
6. **Self-Service** - Usuários VIP podem configurar seus próprios limites customizados no Hub

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

### **Sistema de Limites Dinâmicos**

O sistema **NÃO usa limites hardcoded**. Todos os limites são definidos dinamicamente pelos planos configurados na tabela `transcription_plans`:

**Planos Disponíveis (Seed Padrão):**
1. **Starter Plan**: 1.200 min/mês (20 horas) - Fixo, sem customização, sem overage
2. **Basic Plan**: 2.400 min/mês (40 horas) - Fixo, sem customização, sem overage
3. **VIP Plan**: Customizável (mínimo definido pelo plano) - Permite custom limits + overage

**Planos Custom (Criados via Internal Admin):**
- Podem ter **APENAS** `allows_custom_limits=true` (ex: Premium com 5.000 min customizáveis)
- Podem ter **APENAS** `allows_overage=true` (ex: Standard com overage mas limite fixo)
- Podem ter **AMBOS** (VIP completo)

### **Regra de Validação: Custom Limit >= Plan Limit**

**Planos com custom limits NÃO podem ter limites customizados abaixo do limite base do plano:**
- Se o plano define `monthly_minutes_limit=2400`, então custom >= 2.400
- Se o plano define `monthly_minutes_limit=1200`, então custom >= 1.200
- Evita que clientes "contratem mais para usar menos"
- Validação obrigatória no frontend e backend usando `plan.monthlyMinutesLimit`

**Exemplo:**
```
✅ Válido:
- Plano VIP (base: 2.400 min/mês)
- Custom limit: 5.000 min/mês

✅ Válido:
- Plano Starter (base: 1.200 min/mês)
- Sem custom limits (usa o fixo de 1.200)

❌ Inválido:
- Plano VIP (base: 2.400 min/mês)
- Custom limit: 1.500 min/mês ← NÃO PERMITIDO (abaixo do base)
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
| id | slug    | name         | monthly_limit | allows_custom | allows_overage | cost_per_min | active |
|----|---------|--------------|---------------|---------------|----------------|--------------|--------|
| 1  | starter | Starter Plan | 1200          | false         | false          | 0.0043       | true   |
| 2  | basic   | Basic Plan   | 2400          | false         | false          | 0.0043       | true   |
| 3  | vip     | VIP Plan     | 2400          | true          | true           | 0.0043       | true   |

**Lógica:**
- **Starter**: Limite fixo (1.200 min/mês ≈ 20h), sem customização, sem overage
- **Basic**: Limite fixo (2.400 min/mês ≈ 40h), sem customização, sem overage
- **VIP**: Limite base 2.400 min/mês, permite customização (mínimo 2.400) + overage
- **CRUD completo**: Internal Admin pode criar/editar/deletar/ativar/desativar planos
- **Custom Plans**: Admins podem criar planos com apenas custom limits OU apenas overage

---

### **2. Tabela: `tenant_transcription_config` (Global)**

Configuração por tenant (qual plano + limite customizado se VIP).

```sql
CREATE TABLE public.tenant_transcription_config (
  id SERIAL PRIMARY KEY,
  tenant_id_fk INTEGER NOT NULL UNIQUE REFERENCES public.tenants(id),
  plan_id_fk INTEGER NOT NULL REFERENCES public.transcription_plans(id),
  custom_monthly_limit INTEGER NULL,
  transcription_language VARCHAR(10) DEFAULT 'pt-BR',
  overage_allowed BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**IMPORTANTE:** O sistema **NÃO usa CHECK constraints hardcoded** no banco. A validação de limites é feita dinamicamente no backend usando `plan.monthlyMinutesLimit`:

```javascript
// Backend validation (tenant-transcription-usage.js)
const planMinLimit = config.plan?.monthlyMinutesLimit || 2400;

if (parseInt(customMonthlyLimit) < planMinLimit) {
  return res.status(400).json({
    error: {
      code: 'CUSTOM_LIMIT_BELOW_PLAN_MINIMUM',
      message: `Custom limit (${customMonthlyLimit}) cannot be below plan's minimum limit of ${planMinLimit} minutes`
    }
  });
}
```

**Exemplo de registros:**
| tenant_id | plan_id | custom_monthly | overage_allowed | enabled | transcription_language |
|-----------|---------|----------------|-----------------|---------|------------------------|
| 1         | 1       | NULL           | false           | true    | pt-BR                  |
| 2         | 3       | 10000          | true            | true    | pt-BR                  |
| 3         | 2       | NULL           | false           | true    | en-US                  |
| 4         | 1       | NULL           | false           | true    | pt-BR                  |

**Lógica:**
- Se `plan_id=1` (Starter): `custom_monthly_limit` deve ser NULL, usa 1.200 min do plano
- Se `plan_id=2` (Basic): `custom_monthly_limit` deve ser NULL, usa 2.400 min do plano
- Se `plan_id=3` (VIP): `custom_monthly_limit` >= 2.400 (validado no backend dinamicamente)
- `overage_allowed=true`: processa mesmo após exceder limite (mas registra alerta)
- `enabled=false`: desabilita transcrição completamente
- `transcription_language`: pt-BR ou en-US (usado no Deepgram para monolingual pricing)

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

**Importante:** O middleware **NÃO controla acesso** ao recurso de transcrição. O controle de acesso é feito via JWT `allowedApps` (se o usuário tem acesso ao app TQ, ele pode transcrever). O middleware **APENAS valida quotas de uso**.

```javascript
async function checkTranscriptionQuota(req, res, next) {
  try {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(401).json({
        error: { code: 401, message: 'Tenant authentication required' }
      });
    }

    // Tentar buscar configuração do tenant (opcional)
    let config = null;
    let monthlyLimitMinutes = 60; // Default: 60 minutes/month
    let overageAllowed = false; // Default: no overage

    try {
      config = await TenantTranscriptionConfig.findByTenantId(tenantId);
      monthlyLimitMinutes = config.getEffectiveMonthlyLimit();
      overageAllowed = config.plan?.allowsOverage || config.overageAllowed || false;
    } catch (error) {
      if (error instanceof TenantTranscriptionConfigNotFoundError) {
        // Sem configuração - usa limites default (60 min/mês, sem overage)
        console.log(`[Transcription Quota] No config for tenant ${tenantId}, using defaults (60 min/month, no overage)`);
      } else {
        throw error;
      }
    }

    // Buscar uso do mês atual
    const currentUsage = await TenantTranscriptionUsage.getCurrentMonthUsage(tenantId);

    // Verificar se quota foi excedida
    if (currentUsage.totalMinutes >= monthlyLimitMinutes) {
      // Verificar se overage é permitido
      if (!overageAllowed) {
        return res.status(429).json({
          error: {
            code: 429,
            message: 'Monthly transcription quota exceeded',
            details: {
              used: currentUsage.totalMinutes,
              limit: monthlyLimitMinutes,
              remaining: 0
            }
          }
        });
      }
      // Se overage permitido, loga warning mas continua
      console.warn(`[Transcription Quota] Tenant ${tenantId} exceeded quota but overage allowed (${currentUsage.totalMinutes}/${monthlyLimitMinutes} minutes)`);
    }

    // Anexa informações de quota ao request para uso downstream
    req.transcriptionQuota = {
      config: config,
      usage: currentUsage,
      limit: monthlyLimitMinutes,
      remaining: Math.max(0, monthlyLimitMinutes - currentUsage.totalMinutes),
      hasExceeded: currentUsage.totalMinutes >= monthlyLimitMinutes
    };

    next();
  } catch (error) {
    console.error('[Transcription Quota Middleware] Error:', error);
    return res.status(500).json({
      error: { code: 500, message: 'Failed to check transcription quota' }
    });
  }
}
```

**Exemplo de bloqueio (resposta 429):**
```json
{
  "error": {
    "code": 429,
    "message": "Monthly transcription quota exceeded",
    "details": {
      "used": 2400,
      "limit": 2400,
      "remaining": 0
    }
  }
}
```

---

## 📊 Registro de Uso (Webhook + Cron Job)

### **Fluxo de Registro de Custos:**

O sistema utiliza uma abordagem híbrida para garantir custos precisos:

1. **Webhook (Imediato)**: Calcula custo localmente baseado em detecção de idioma
2. **Cron Job (Diário)**: Atualiza com custo real da API de gerenciamento do Deepgram

### **1. Webhook Handler (Registro Imediato)**

Após transcrição completada, webhook registra uso com cálculo local:

```javascript
// Dentro do webhook handler (após salvar transcript)

// 1. Calcular custo local baseado em detecção de idioma
const audioDurationSeconds = Math.ceil(webhookData.metadata?.duration || 0);
const detectedLanguage = transcriptionData.detected_language || null;

// 2. Registrar na tabela de uso (fire and forget)
// Custo real será atualizado mais tarde pelo cron job diário
TenantTranscriptionUsage.create(parseInt(tenantId), {
  transcriptionId: transcriptionId,
  audioDurationSeconds: audioDurationSeconds,
  sttModel: DEFAULT_STT_MODEL, // 'nova-3'
  detectedLanguage: detectedLanguage, // 'pt', 'en', etc. (se multilingual)
  sttProviderRequestId: sttProviderRequestId, // request_id do Deepgram
  usageDate: new Date()
}).catch(error => {
  console.error(`[Transcription Usage] Failed to record usage for transcription ${transcriptionId}:`, error);
});

console.log(`[Webhook] ✅ Usage logged with local cost calculation`);
```

**Cálculo Local de Custo** (`TenantTranscriptionUsage.create()`):
```javascript
static async create(tenantId, data) {
  const {
    audioDurationSeconds,
    sttModel = DEFAULT_STT_MODEL,
    detectedLanguage = null,
    costUsd = null // Opcional: custo real do Deepgram
  } = data;

  // Usar custo fornecido OU calcular localmente
  let finalCostUsd;

  if (costUsd !== null) {
    // Usar custo real da API de gerenciamento do Deepgram
    finalCostUsd = costUsd;
  } else {
    // Calcular localmente baseado em detecção de idioma
    const durationMinutes = audioDurationSeconds / 60;

    const costPerMinute = detectedLanguage
      ? MULTILINGUAL_COST_PER_MINUTE  // $0.0052/min (multilingual)
      : (MODEL_COSTS[sttModel] || DEFAULT_COST_PER_MINUTE); // $0.0043/min (monolingual)

    finalCostUsd = durationMinutes * costPerMinute;
  }

  // INSERT com custo calculado
  await database.query(`
    INSERT INTO public.tenant_transcription_usage (
      tenant_id_fk, transcription_id, audio_duration_seconds,
      stt_model, detected_language, stt_provider_request_id,
      cost_usd, usage_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    tenantId, transcriptionId, audioDurationSeconds,
    sttModel, detectedLanguage, sttProviderRequestId,
    finalCostUsd.toFixed(4), usageDate
  ]);
}
```

### **2. Cron Job Diário (Atualização de Custos)**

**Objetivo**: Substituir cálculos locais por custos reais da API do Deepgram.

**Arquivo**: `src/server/jobs/updateTranscriptionCosts.js`

**Agendamento**: Todos os dias às 2 AM (0 2 * * *)

**Processo**:
```javascript
async function updateTranscriptionCosts() {
  console.log('[Cron] Starting transcription cost update job...');

  if (!DEEPGRAM_PROJECT_ID) {
    console.warn('[Cron] DEEPGRAM_PROJECT_ID not configured - skipping cost update');
    return;
  }

  // 1. Buscar registros das últimas 24 horas
  const query = `
    SELECT
      id, stt_provider_request_id, cost_usd as current_cost,
      audio_duration_seconds, detected_language
    FROM public.tenant_transcription_usage
    WHERE stt_provider_request_id IS NOT NULL
      AND usage_date >= NOW() - INTERVAL '24 hours'
    ORDER BY usage_date DESC
  `;

  const result = await database.query(query);

  // 2. Para cada registro, buscar custo real do Deepgram
  for (const row of result.rows) {
    const requestId = row.stt_provider_request_id;

    // Buscar custo via Deepgram Management API
    const costData = await deepgramService.getRequestCost(DEEPGRAM_PROJECT_ID, requestId);

    if (costData.usd !== null) {
      const realCost = costData.usd;
      const currentCost = parseFloat(row.current_cost);

      // 3. Atualizar APENAS se custo mudou significativamente (>$0.0001)
      if (Math.abs(realCost - currentCost) > 0.0001) {
        await database.query(`
          UPDATE public.tenant_transcription_usage
          SET cost_usd = $1, updated_at = NOW()
          WHERE id = $2
        `, [realCost.toFixed(4), row.id]);

        console.log(`[Cron] ✅ Updated cost for request ${requestId}: ${currentCost.toFixed(4)} → ${realCost.toFixed(4)}`);
      }
    } else {
      console.warn(`[Cron] ⚠️ Cost not available for request ${requestId} - keeping local calculation`);
    }

    // Delay de 50ms entre chamadas (evitar rate limit)
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`[Cron] Cost update complete: ${totalUpdated} updated, ${totalUnchanged} unchanged, ${totalFailed} failed`);
}
```

**Deepgram Management API** (`DeepgramService.getRequestCost()`):
```javascript
async getRequestCost(projectId, requestId) {
  const url = `https://api.deepgram.com/v1/projects/${projectId}/requests/${requestId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${this.apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();
  const costUsd = result.response?.details?.usd || null;

  return {
    usd: costUsd,
    details: result.response?.details || {}
  };
}
```

**Benefícios do Cron Job**:
- ✅ Não bloqueia webhook (resposta imediata)
- ✅ Dá 24h para Deepgram processar custos
- ✅ Processamento em lote (mais eficiente)
- ✅ Retry automático para falhas
- ✅ Fallback para cálculo local se API indisponível

**Variável de Ambiente**:
```bash
DEEPGRAM_PROJECT_ID=your-deepgram-project-id
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
║  Definido pelo seu plano                                     ║
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
║  │ • Monthly Limit: 2,400 minutes                          │ ║
║  │ • Overage: Not Allowed                                  │ ║
║  │                                                          │ ║
║  │ 🎯 Upgrade to VIP Plan to unlock:                       │ ║
║  │ • Set custom monthly limit                              │ ║
║  │ • Enable overage processing                             │ ║
║  │ • Priority support                                      │ ║
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
// Validação dinâmica baseada no plano selecionado
const planMinLimit = usage.plan.monthlyMinutesLimit; // Ex: 2400 para VIP

if (customMonthlyLimit < planMinLimit) {
  error = `Custom limit must be at least ${planMinLimit} minutes (defined by your plan)`;
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
    "code": "CUSTOM_LIMIT_BELOW_PLAN_MINIMUM",
    "message": "Custom limit (1500) cannot be below plan's minimum limit of 2400 minutes"
  },
  "meta": {
    "code": "CUSTOM_LIMIT_BELOW_PLAN_MINIMUM",
    "planMinLimit": 2400,
    "providedLimit": 1500
  }
}
```

**Validações Backend:**
```javascript
// 1. Verificar se o plano permite customização
const config = await TenantTranscriptionConfig.findByTenantId(tenantId);

if (!config.canCustomizeLimits()) {
  return res.status(403).json({
    error: {
      code: 403,
      message: 'Your current plan does not allow custom limits. Please upgrade to VIP plan.'
    }
  });
}

// 2. Validar limite mínimo dinamicamente baseado no plano
const planMinLimit = config.plan?.monthlyMinutesLimit || 2400;

if (parseInt(customMonthlyLimit) < planMinLimit) {
  return res.status(400).json({
    error: {
      code: 'CUSTOM_LIMIT_BELOW_PLAN_MINIMUM',
      message: `Custom limit (${customMonthlyLimit}) cannot be below plan's minimum limit of ${planMinLimit} minutes`
    },
    meta: {
      code: 'CUSTOM_LIMIT_BELOW_PLAN_MINIMUM',
      planMinLimit: planMinLimit,
      providedLimit: customMonthlyLimit
    }
  });
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
║  Only for plans with custom limits enabled. Minimum defined  ║
║  by selected plan.                                           ║
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
// Validação dinâmica baseada no plano selecionado
if (selectedPlan.allowsCustomLimits && !customMonthlyLimit) {
  error = "This plan requires a custom monthly limit to be set";
}

if (selectedPlan.allowsCustomLimits && customMonthlyLimit < selectedPlan.monthlyMinutesLimit) {
  error = `Custom limit must be at least ${selectedPlan.monthlyMinutesLimit} minutes (plan minimum)`;
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

### **Erro 2: Custom limit abaixo do mínimo do plano (400)**
```
Frontend mostra:
"❌ Invalid custom limit

Custom limit (1500) cannot be below plan's minimum limit of 2400 minutes.
Please increase your limit to match your plan's minimum."

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
- [x] Migration: criar `transcription_plans` (com updated_at, allows_custom_limits, allows_overage)
- [x] Migration: criar `tenant_transcription_config` (SEM constraints hardcoded)
- [x] Migration: criar `tenant_transcription_usage`
- [x] Seed: popular `transcription_plans` (Starter 1200, Basic 2400, VIP 2400+)
- [x] Model: `TranscriptionPlan.js` (CRUD completo)
- [x] Model: `TenantTranscriptionConfig.js` (com validação dinâmica via `plan.monthlyMinutesLimit`)
- [x] Middleware: `checkTranscriptionQuota.js` (usa `config.getEffectiveMonthlyLimit()` dinamicamente)
- [x] Modificar webhook: adicionar registro de uso
- [x] Rotas Hub: `GET /configurations/transcription-usage` (visualização de uso)
- [x] Rotas Hub: `PUT /configurations/transcription-config` (self-service VIP com validação dinâmica)
- [x] Rotas Internal Admin Plans: `GET /transcription-plans` (listar)
- [x] Rotas Internal Admin Plans: `POST /transcription-plans` (criar)
- [x] Rotas Internal Admin Plans: `PUT /transcription-plans/:id` (editar)
- [x] Rotas Internal Admin Plans: `DELETE /transcription-plans/:id` (deactivate)
- [x] Rotas Internal Admin Tenant: `GET /tenants/:id/transcription-config`
- [x] Rotas Internal Admin Tenant: `PUT /tenants/:id/transcription-config` (validação dinâmica)
- [x] Validações dinâmicas: Todas validações usam `plan.monthlyMinutesLimit`, não valores hardcoded

### **Frontend Hub**
- [x] Página: `TranscriptionUsageConfiguration.tsx` (visualização de uso + self-service)
- [x] Service: `transcriptionUsageService.ts`
- [x] Sidebar: item "Configurations" (admin-only)
- [x] Configurations Layout: Reutilizado para múltiplas configs
- [x] VIP Upgrade Card: Gradient styling com benefits list
- [x] Premium Features Card: Condicional baseado em `allowsCustomLimits` e `allowsOverage`
- [x] Alert Component: Variants `warning` e `gradient` com flex layout
- [x] Tradução i18n (pt-BR e en-US) - Removidas referências hardcoded "(40 horas)"

### **Frontend Internal Admin**
- [x] Página: `TranscriptionPlans.tsx` (CRUD completo de planos)
- [x] Página: `CreateTranscriptionPlan.tsx` / `EditTranscriptionPlan.tsx` (formulários de plano)
- [x] Service: `transcriptionPlansService.ts`
- [x] Seção: `TenantTranscriptionConfiguration.tsx` (em tenant edit)
- [x] Sidebar: item "Transcription Plans" (nova aba)
- [x] Validações de plano dinâmicas (usa `plan.monthlyMinutesLimit`)

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
- **Starter Plan**: Plano básico com limite fixo de 1.200 min/mês (20h), não customizável
- **Basic Plan**: Plano padrão com limite fixo de 2.400 min/mês (40h), não customizável
- **VIP Plan**: Plano premium com limite base de 2.400 min/mês, customizável (permite custom limits + overage)
- **Custom Plans**: Planos criados via Internal Admin com apenas `allows_custom_limits` OU apenas `allows_overage`
- **Dynamic Validation**: Sistema de validação que usa `plan.monthlyMinutesLimit` ao invés de valores hardcoded
- **Tenant**: Cliente/organização na plataforma multi-tenant
- **Internal Admin**: Interface administrativa para equipe interna (Simplia)
- **Hub**: Portal self-service para admins dos tenants

---

## 📞 Contato

Para dúvidas sobre implementação, contate o time de desenvolvimento.
