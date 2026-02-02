# Scaling & Capacity Analysis

**Versão:** 1.0 | **Data:** Janeiro 2025

---

## 1. Infraestrutura Atual

### Stack de Tecnologia

| Componente | Fornecedor | Função | Plano |
|------------|------------|--------|-------|
| **Compute** | Railway | API servers (Node.js) | Pro |
| **Database** | Railway | PostgreSQL | Pro |
| **Frontend** | Vercel | Website | Pro |
| **Storage** | Supabase | Áudios, branding, assets | Pro ($25/mês) |
| **Transcrição** | Deepgram | Speech-to-text | Pay-as-you-go |
| **AI Agent** | OpenAI | Geração de quotes/reports | GPT-4o-mini |
| **Pagamentos** | Stripe | Billing | Standard |
| **Email** | Gmail SMTP | Notificações | App Password |

### Railway Pro - Recursos Disponíveis

```
┌─────────────────────────────────────────────────────┐
│  RAILWAY PRO PLAN                                   │
├─────────────────────────────────────────────────────┤
│  • Até 1,000 vCPU / 1 TB RAM por serviço           │
│  • Até 50 replicas (32 vCPU / 32 GB RAM cada)      │
│  • Multi-region concurrent                          │
│  • SOC2 compliance                                  │
│  • 30-day log history                               │
└─────────────────────────────────────────────────────┘
```

**Capacidade Total Disponível:**
- 50 replicas × 32 vCPU = **1,600 vCPU**
- 50 replicas × 32 GB = **1,600 GB RAM**

---

## 2. Análise de Capacidade por Componente

### 2.1 Node.js (API Server)

**Característica:** I/O-bound (ideal para Node.js)

| Operação | Tipo | Processamento |
|----------|------|---------------|
| Upload de áudio | I/O | Supabase |
| Transcrição | I/O | Deepgram |
| Geração AI | I/O | OpenAI |
| Database queries | I/O | PostgreSQL |
| Servir API | I/O | Node.js |

**Capacidade por Instância:**
```
1 instância Node.js (1 vCPU, 512MB RAM):
├── ~10,000 conexões simultâneas (HTTP keep-alive)
├── ~1,000-5,000 requests/segundo (API simples)
└── ~100-500 requests/segundo (com DB queries)
```

**Com Railway Pro (50 replicas):**
```
50 instâncias × 1,000 req/s = 50,000 requests/segundo
```

✅ **Node.js NÃO é gargalo** - aguenta facilmente 10,000+ usuários

---

### 2.2 PostgreSQL

**Configuração Atual:** Railway PostgreSQL (sem connection pooling)

| Cenário | Conexões | Usuários Suportados |
|---------|----------|---------------------|
| Sem pooling | ~100-500 | 500-2,000 |
| Com PgBouncer | ~5,000-10,000 | 10,000-50,000 |

**Recomendação:** Adicionar PgBouncer quando atingir 500+ usuários ativos

---

### 2.3 Deepgram (Transcrição)

**Este é o principal gargalo para escala.**

| Tier | Concurrent Streams | Usuários Estimados |
|------|-------------------|-------------------|
| Growth | ~100 | 500-1,000 |
| Enterprise | ~500-1,000+ | 5,000-10,000+ |

**Por que 100 concurrent ≠ 100 usuários?**

Nem todos os usuários transcrevem ao mesmo tempo:
- Apenas Admin e Manager fazem transcrição (~75% dos usuários)
- Desses, ~80% estão ativos
- No horário de pico, ~10-15% transcrevem simultaneamente

```
Cálculo de concurrent streams por escala:

500 usuários:
├── ~375 podem transcrever (Admin + Manager)
├── ~300 ativos (80%)
├── Peak concurrent: ~30-45 streams ✅ OK
└── Margem: 55-70% do limite

1,000 usuários:
├── ~750 podem transcrever
├── ~600 ativos
├── Peak concurrent: ~60-90 streams ⚠️ PRÓXIMO DO LIMITE
└── Margem: 10-40% do limite

5,000 usuários:
├── ~3,750 podem transcrever
├── ~3,000 ativos
├── Peak concurrent: ~300-450 streams 🔴 ACIMA DO LIMITE
└── Requer: Deepgram Enterprise
```

**Soluções quando atingir o limite:**

| Solução | Complexidade | Custo |
|---------|--------------|-------|
| **1. Deepgram Enterprise** | Baixa | $$ (negociar) |
| **2. Queue system (Bull)** | Média | Desenvolvimento |
| **3. Processar off-peak** | Baixa | UX impactada |
| **4. Rate limit por tenant** | Média | UX impactada |

**Recomendação:** Contatar Deepgram para Enterprise quando atingir 70+ concurrent streams (~800 usuários)

---

### 2.4 OpenAI (AI Agent)

| Tier | Rate Limit | Suficiente Para |
|------|------------|-----------------|
| Tier 1 | 500 RPM | 1,000 usuários |
| Tier 2 | 5,000 RPM | 10,000 usuários |
| Tier 3+ | 10,000+ RPM | 50,000+ usuários |

✅ **OpenAI não é gargalo** - rate limits gerenciáveis com upgrade de tier

---

### 2.5 Supabase Storage

| Métrica | Plano Pro |
|---------|-----------|
| Storage | 100 GB |
| Bandwidth | 200 GB/mês |
| CDN | Incluído |

✅ **Storage não é gargalo** - CDN-backed, altamente escalável

---

## 3. Matriz de Capacidade

| Componente | Limite Atual | Gargalo? | Solução |
|------------|--------------|----------|---------|
| Railway Compute | 10,000+ users | ✅ Não | - |
| Node.js | 50,000 req/s | ✅ Não | - |
| PostgreSQL | ~500 conexões | ⚠️ Médio | PgBouncer |
| Deepgram | ~100 concurrent | 🔴 **Sim** | Enterprise tier |
| OpenAI | 500 RPM | 🟡 Leve | Upgrade tier |
| Supabase | 100 GB | ✅ Não | - |

---

## 4. Cenários de Escala

### Cenário 1: Atual (Sem Otimização)

```
Usuários ativos: 500-1,000
Transcrições simultâneas: ~50
Gargalo: PostgreSQL connections
Ação: Monitorar conexões
```

### Cenário 2: Com PgBouncer

```
Usuários ativos: 2,000-5,000
Transcrições simultâneas: ~100
Gargalo: Deepgram concurrent streams
Ação: Planejar upgrade Deepgram
```

### Cenário 3: Com Deepgram Enterprise

```
Usuários ativos: 10,000-20,000
Transcrições simultâneas: ~500-1,000
Gargalo: $ custo operacional
Ação: Negociar volume discount
```

---

## 5. Alertas de Capacidade

| Métrica | 🟢 Normal | 🟡 Atenção | 🔴 Crítico |
|---------|-----------|------------|------------|
| DB Connections | < 50 | 50-80 | > 80 |
| Concurrent Transcriptions | < 50 | 50-80 | > 80 |
| API Latency (p95) | < 200ms | 200-500ms | > 500ms |
| Error Rate | < 0.1% | 0.1-1% | > 1% |

---

## 6. Modelo de Preços Atual

### Plano Único: Early Access

| Item | Valor |
|------|-------|
| **Preço** | R$ 119/mês |
| **Trial** | 7 dias grátis |
| **Transcrição** | 60 horas/mês |
| **Licença inclusa** | 1 Admin |
| **Overage** | Permitido (cobrança extra) |

### Licenças Adicionais

| Tipo | Preço/Mês | Permissões | Atividade |
|------|-----------|------------|-----------|
| **Admin** | R$ 50 | Acesso total + config | 🔴 Alta |
| **Manager** | R$ 20 | Edição + transcrição | 🟡 Média |
| **Operations** | R$ 10 | Apenas leitura | 🟢 Baixa |

### Custo de Transcrição (Deepgram)

| Tipo | Custo |
|------|-------|
| Por hora | R$ 1,60 |
| Por minuto | ~R$ 0,027 |

---

## 7. Projeções de Faturamento

### Premissas

```
Composição típica de um tenant:
- 1 plano Early Access (R$ 119) com 1 Admin incluso
- Licenças adicionais conforme tamanho

Mix de usuários por tenant (média):
- Admins: 40% dos usuários (transcrevem, configuram)
- Managers: 35% dos usuários (editam, transcrevem)
- Operations: 25% dos usuários (apenas leitura)

Taxa de atividade:
- Admin: 90% ativos (fazem transcrição diariamente)
- Manager: 70% ativos (editam frequentemente)
- Operations: 40% ativos (consultam esporadicamente)
```

---

### Projeção: 50 Usuários Ativos (Early Stage)

**Composição:**
| Tipo Tenant | Qtd | Usuários | Licenças Extras |
|-------------|-----|----------|-----------------|
| Solo (1 user) | 15 | 15 | 0 |
| Pequeno (3 users) | 10 | 30 | 20 |
| Médio (5 users) | 1 | 5 | 4 |
| **Total** | **26** | **50** | **24** |

**Receita:**
```
Planos Early Access:    26 × R$ 119  = R$ 3.094
Licenças Admin:          5 × R$ 50   = R$ 250
Licenças Manager:       10 × R$ 20   = R$ 200
Licenças Operations:     9 × R$ 10   = R$ 90
────────────────────────────────────────────────
MRR Total:                             R$ 3.634
ARR:                                   R$ 43.608
```

**Custos (uso estimado 50%):**
```
Transcrição (780h uso):               R$ 1.248
Custos fixos infra:                   R$ 400
────────────────────────────────────────────────
Custo Total:                          R$ 1.648
Lucro Bruto:                          R$ 1.986 (55%)
```

---

### Projeção: 100 Usuários Ativos

**Composição:**
| Tipo Tenant | Qtd | Usuários | Licenças Extras |
|-------------|-----|----------|-----------------|
| Solo (1 user) | 25 | 25 | 0 |
| Pequeno (3 users) | 18 | 54 | 36 |
| Médio (5 users) | 4 | 20 | 16 |
| Grande (10 users) | 1 | 10 | 9 |
| **Total** | **48** | **109** | **61** |

**Receita:**
```
Planos Early Access:    48 × R$ 119  = R$ 5.712
Licenças Admin:         15 × R$ 50   = R$ 750
Licenças Manager:       25 × R$ 20   = R$ 500
Licenças Operations:    21 × R$ 10   = R$ 210
────────────────────────────────────────────────
MRR Total:                             R$ 7.172
ARR:                                   R$ 86.064
```

**Custos (uso estimado 50%):**
```
Transcrição (1.440h uso):             R$ 2.304
Custos fixos infra:                   R$ 450
────────────────────────────────────────────────
Custo Total:                          R$ 2.754
Lucro Bruto:                          R$ 4.418 (62%)
```

---

### Projeção: 200 Usuários Ativos

**Composição:**
| Tipo Tenant | Qtd | Usuários | Licenças Extras |
|-------------|-----|----------|-----------------|
| Solo (1 user) | 40 | 40 | 0 |
| Pequeno (3 users) | 30 | 90 | 60 |
| Médio (5 users) | 10 | 50 | 40 |
| Grande (10 users) | 2 | 20 | 18 |
| **Total** | **82** | **200** | **118** |

**Receita:**
```
Planos Early Access:    82 × R$ 119  = R$ 9.758
Licenças Admin:         30 × R$ 50   = R$ 1.500
Licenças Manager:       50 × R$ 20   = R$ 1.000
Licenças Operations:    38 × R$ 10   = R$ 380
────────────────────────────────────────────────
MRR Total:                             R$ 12.638
ARR:                                   R$ 151.656
```

**Custos (uso estimado 50%):**
```
Transcrição (2.460h uso):             R$ 3.936
Custos fixos infra:                   R$ 500
────────────────────────────────────────────────
Custo Total:                          R$ 4.436
Lucro Bruto:                          R$ 8.202 (65%)
```

---

### Projeção: 500 Usuários Ativos

**Composição:**
| Tipo Tenant | Qtd | Usuários | Licenças Extras |
|-------------|-----|----------|-----------------|
| Solo (1 user) | 80 | 80 | 0 |
| Pequeno (3 users) | 60 | 180 | 120 |
| Médio (5 users) | 30 | 150 | 120 |
| Grande (10 users) | 9 | 90 | 81 |
| **Total** | **179** | **500** | **321** |

**Receita:**
```
Planos Early Access:   179 × R$ 119  = R$ 21.301
Licenças Admin:         80 × R$ 50   = R$ 4.000
Licenças Manager:      130 × R$ 20   = R$ 2.600
Licenças Operations:   111 × R$ 10   = R$ 1.110
────────────────────────────────────────────────
MRR Total:                             R$ 29.011
ARR:                                   R$ 348.132
```

**Custos (uso estimado 45%):**
```
Transcrição (4.833h uso):             R$ 7.733
Custos fixos infra:                   R$ 800
────────────────────────────────────────────────
Custo Total:                          R$ 8.533
Lucro Bruto:                          R$ 20.478 (71%)
```

---

### Projeção: 1,000 Usuários Ativos

**Composição:**
| Tipo Tenant | Qtd | Usuários | Licenças Extras |
|-------------|-----|----------|-----------------|
| Solo (1 user) | 120 | 120 | 0 |
| Pequeno (3 users) | 100 | 300 | 200 |
| Médio (5 users) | 60 | 300 | 240 |
| Grande (10 users) | 20 | 200 | 180 |
| VIP (20 users) | 4 | 80 | 76 |
| **Total** | **304** | **1,000** | **696** |

**Receita:**
```
Planos Early Access:   304 × R$ 119  = R$ 36.176
Licenças Admin:        180 × R$ 50   = R$ 9.000
Licenças Manager:      280 × R$ 20   = R$ 5.600
Licenças Operations:   236 × R$ 10   = R$ 2.360
────────────────────────────────────────────────
MRR Total:                             R$ 53.136
ARR:                                   R$ 637.632
```

**Custos (uso estimado 40%):**
```
Transcrição (7.296h uso):             R$ 11.674
Custos fixos infra:                   R$ 1.200
────────────────────────────────────────────────
Custo Total:                          R$ 12.874
Lucro Bruto:                          R$ 40.262 (76%)
```

⚠️ **Atenção:** Neste ponto, precisamos monitorar Deepgram concurrent streams.

---

### Projeção: 5,000 Usuários Ativos

**Composição:**
| Tipo Tenant | Qtd | Usuários | Licenças Extras |
|-------------|-----|----------|-----------------|
| Solo (1 user) | 300 | 300 | 0 |
| Pequeno (3 users) | 400 | 1,200 | 800 |
| Médio (5 users) | 300 | 1,500 | 1,200 |
| Grande (10 users) | 120 | 1,200 | 1,080 |
| VIP (20 users) | 40 | 800 | 760 |
| **Total** | **1,160** | **5,000** | **3,840** |

**Receita:**
```
Planos Early Access: 1,160 × R$ 119  = R$ 138.040
Licenças Admin:        1,000 × R$ 50 = R$ 50.000
Licenças Manager:      1,500 × R$ 20 = R$ 30.000
Licenças Operations:   1,340 × R$ 10 = R$ 13.400
────────────────────────────────────────────────
MRR Total:                             R$ 231.440
ARR:                                   R$ 2.777.280
```

**Custos (uso estimado 35%):**
```
Transcrição (24.360h uso):            R$ 38.976
Custos fixos infra:                   R$ 3.000
────────────────────────────────────────────────
Custo Total:                          R$ 41.976
Lucro Bruto:                          R$ 189.464 (82%)
```

🔴 **Requisitos:**
- Deepgram Enterprise (negociar desconto volume 20-30%)
- PgBouncer obrigatório
- Considerar multi-region

---

### Projeção: 10,000 Usuários Ativos

**Composição:**
| Tipo Tenant | Qtd | Usuários | Licenças Extras |
|-------------|-----|----------|-----------------|
| Solo (1 user) | 500 | 500 | 0 |
| Pequeno (3 users) | 700 | 2,100 | 1,400 |
| Médio (5 users) | 550 | 2,750 | 2,200 |
| Grande (10 users) | 250 | 2,500 | 2,250 |
| VIP (20 users) | 80 | 1,600 | 1,520 |
| Enterprise (30+ users) | 18 | 550 | 532 |
| **Total** | **2,098** | **10,000** | **7,902** |

**Receita:**
```
Planos Early Access: 2,098 × R$ 119  = R$ 249.662
Licenças Admin:        2,100 × R$ 50 = R$ 105.000
Licenças Manager:      3,100 × R$ 20 = R$ 62.000
Licenças Operations:   2,702 × R$ 10 = R$ 27.020
────────────────────────────────────────────────
MRR Total:                             R$ 443.682
ARR:                                   R$ 5.324.184
```

**Custos (uso estimado 30%):**
```
Transcrição (37.764h uso):            R$ 60.422
Custos fixos infra:                   R$ 5.000
────────────────────────────────────────────────
Custo Total:                          R$ 65.422
Lucro Bruto:                          R$ 378.260 (85%)
```

🔴 **Requisitos críticos:**
- Deepgram Enterprise com volume discount (30-40%)
- PostgreSQL dedicado com réplicas
- Multi-region obrigatório
- Equipe de SRE dedicada
- Redis para caching
- Queue system (Bull/BullMQ)

---

## 8. Resumo: Capacidade vs Faturamento

| Usuários Ativos | Tenants | MRR | ARR | Margem | Gargalo | Concurrent Streams |
|-----------------|---------|-----|-----|--------|---------|-------------------|
| 50 | 26 | R$ 3.6k | R$ 44k | 55% | Nenhum | ~5-8 |
| 100 | 48 | R$ 7.2k | R$ 86k | 62% | Nenhum | ~10-15 |
| 200 | 82 | R$ 12.6k | R$ 152k | 65% | Nenhum | ~20-30 |
| 500 | 179 | R$ 29k | R$ 348k | 71% | Monitorar DB | ~40-55 |
| 1,000 | 304 | R$ 53k | R$ 638k | 76% | ⚠️ Deepgram ~80 | ~60-90 |
| 5,000 | 1,160 | R$ 231k | R$ 2.8M | 82% | 🔴 Enterprise | ~300-450 |
| 10,000 | 2,098 | R$ 444k | R$ 5.3M | 85% | 🔴 Enterprise+ | ~600-900 |

---

## 9. Receita por Tipo de Licença

### Distribuição Típica de Receita (1,000 usuários)

```
┌─────────────────────────────────────────────────────┐
│  COMPOSIÇÃO DO MRR: R$ 53.136                       │
├─────────────────────────────────────────────────────┤
│  Planos Early Access     R$ 36.176    (68%)        │
│  Licenças Admin          R$ 9.000     (17%)        │
│  Licenças Manager        R$ 5.600     (11%)        │
│  Licenças Operations     R$ 2.360     (4%)         │
└─────────────────────────────────────────────────────┘
```

**Observações:**
- **68% da receita** vem do plano base (previsível)
- **17% Admin** - usuários mais valiosos (R$ 50/user)
- **11% Manager** - segundo mais valioso
- **4% Operations** - volume alto, ticket baixo

### ARPU por Tipo de Tenant

| Tipo | Usuários | MRR/Tenant | Transcrição/Mês |
|------|----------|------------|-----------------|
| Solo | 1 | R$ 119 | 60h |
| Pequeno | 3 | R$ 159 | 60h |
| Médio | 5 | R$ 219 | 60h |
| Grande | 10 | R$ 359 | 60h (+overage) |
| VIP | 20+ | R$ 600+ | Custom |

---

## 10. Roadmap de Escala

### Fase 1: 0-500 Usuários (Atual)
- [x] Railway Pro
- [x] Supabase Storage
- [ ] Monitoramento de conexões DB
- [ ] Alertas de capacidade

### Fase 2: 500-2,000 Usuários
- [ ] Implementar PgBouncer
- [ ] Upgrade OpenAI tier
- [ ] Dashboard de métricas

### Fase 3: 2,000-5,000 Usuários
- [ ] Deepgram Enterprise
- [ ] Redis para caching/sessions
- [ ] CDN para assets estáticos

### Fase 4: 5,000+ Usuários
- [ ] PostgreSQL dedicado
- [ ] Multi-region deployment
- [ ] Negociar volume discounts

---

## 11. Custos de Infraestrutura por Escala

| Usuários | Railway | Supabase | Deepgram* | OpenAI | Total/Mês |
|----------|---------|----------|-----------|--------|-----------|
| 50 | R$ 100 | R$ 175 | R$ 1.248 | R$ 50 | R$ 1.573 |
| 200 | R$ 150 | R$ 175 | R$ 3.936 | R$ 150 | R$ 4.411 |
| 500 | R$ 300 | R$ 250 | R$ 7.733 | R$ 300 | R$ 8.583 |
| 1,000 | R$ 500 | R$ 350 | R$ 11.674 | R$ 500 | R$ 13.024 |
| 5,000 | R$ 1.500 | R$ 500 | R$ 38.976 | R$ 1.500 | R$ 42.476 |
| 10,000 | R$ 3.000 | R$ 1.000 | R$ 60.422 | R$ 2.500 | R$ 66.922 |

*Deepgram é ~80-90% do custo variável em escala

---

## 12. Conclusão

### Capacidade Atual
O sistema **aguenta 5,000+ usuários ativos** com a infraestrutura do Railway Pro, desde que:
1. PostgreSQL tenha connection pooling (PgBouncer)
2. Deepgram seja escalado para Enterprise tier

### Gargalo Real
**Deepgram (transcrição)** é o único gargalo técnico real. O limite de 100 conexões simultâneas restringe a ~17,600 horas de transcrição/mês.

### Unit Economics

| Métrica | Valor |
|---------|-------|
| **ARPU (tenant médio)** | R$ 175/mês |
| **Custo variável/tenant** | R$ 45/mês |
| **Margem bruta** | 70-80% |
| **CAC estimado** | R$ 300-500 |
| **LTV (24 meses)** | R$ 4.200 |
| **LTV/CAC** | 8-14x |

### Quando Escalar

| Trigger | Ação |
|---------|------|
| 500+ usuários | Implementar PgBouncer |
| 80+ transcrições simultâneas | Contatar Deepgram Enterprise |
| R$ 100k MRR | Multi-region + equipe dedicada |

---

**Documento:** Scaling & Capacity Analysis
**Próxima revisão:** Quando atingir 200 usuários ativos
