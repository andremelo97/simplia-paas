# Simplia PaaS - Análise Financeira 2025

**Versão:** 1.0 | **Data:** Janeiro 2025 | **Confidencial**

---

## 1. Storage: Supabase vs Cloudflare R2

### Comparação Direta (100 tenants)

| Métrica | Supabase | Cloudflare R2 | Vencedor |
|---------|----------|---------------|----------|
| **Custo/Mês** | $25 (fixo) | $1.90 | R2 (-92%) |
| **Custo/Ano** | $300 | $22.80 | R2 (-92%) |
| **Egress** | $0.09/GB (após 250GB) | $0 ilimitado | R2 |
| **Storage** | $0.021/GB | $0.015/GB | R2 |
| **Setup** | ⭐⭐⭐⭐⭐ Fácil | ⭐⭐⭐ Médio | Supabase |
| **Dashboard** | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐⭐ Básico | Supabase |

### Recomendação Final

✅ **Usar Supabase** (decisão tomada)
- Já implementado e funcionando
- Custo fixo previsível ($25/mês)
- Até 1000 tenants, diferença marginal vs R2
- Simplicidade > economia nesta fase

🔄 **Migrar para R2 em 6-12 meses** (quando escalar)

---

## 2. Planos de Transcrição

### Custos Base (Deepgram)

- **Custo Deepgram:** $0.0043/min (R$ 0.022/min)
- **Fornecedor:** Deepgram Nova-3 (pt-BR + en-US)
- **Modelo de cobrança:** Pay-as-you-go

### Planos Oferecidos

| Plano | Min/Mês | Horas/Mês | Custo Deepgram | Preço Venda | Margem | Incluso |
|-------|---------|-----------|----------------|-------------|--------|---------|
| **Basic** | 2.400 | 40h | R$ 53 | R$ 0 | -R$ 53 | ✅ Incluso na licença TQ |
| **Professional** | 6.000 | 100h | R$ 132 | R$ 149 | R$ 17 (11%) | ❌ Add-on |
| **Business** | 12.000 | 200h | R$ 264 | R$ 279 | R$ 15 (5%) | ❌ Add-on |
| **VIP** | Custom | Custom | Variável | R$ 0.025/min | 14% | ❌ Custom |

**Nota:** Basic (2.400 min) é incluso em cada licença TQ. Custo absorvido como CAC.

---

## 3. Preços de Licenças (Por Usuário/Mês)

| Aplicação | Preço | ARR/User | Status | Target |
|-----------|-------|----------|--------|--------|
| **Hub** | R$ 0 | R$ 0 | ✅ Ativo | Portal de acesso |
| **TQ** | R$ 89 | R$ 1.068 | ✅ Ativo | Profissionais da saúde |
| **CRM** | R$ 149 | R$ 1.788 | 🚧 2026 | Vendedores |
| **Automation** | R$ 199 | R$ 2.388 | 🚧 2027 | Analistas |

**Cada licença TQ inclui:** 2.400 min/mês de transcrição (valor R$ 53)

### Free Trial

🆓 **14 dias grátis** (sem cartão de crédito)
- Acesso completo a todas as features
- **600 min de transcrição** (10 horas total = 1h/dia × 5 dias úteis)
- Limite diário: 1 hora/dia
- Onboarding call com suporte
- Conversão esperada: 25-30%

**Custo trial:** R$ 13 (600 min × R$ 0.022) - absorvido como CAC

---

## 4. Pacotes Compostos (Bundles)

### Pacote Solo (Profissional Liberal)

**Composição:**
- 1 licença TQ (1 × R$ 89 = R$ 89)
- Basic incluso: 2.400 min/mês (R$ 53 de custo)

**Preço:**
- **R$ 79/mês** (12% desconto)
- **ARR: R$ 948**

**Target:** Psicólogos autônomos, consultórios individuais

**Diferencial:** Preço acessível para quem está começando

---

### Pacote Duo (2 Profissionais)

**Composição:**
- 2 licenças TQ (2 × R$ 89 = R$ 178)
- Basic incluso: 2 × 2.400 = 4.800 min/mês (R$ 106 de custo)

**Preço:**
- Individual: R$ 178/mês
- Bundle: **R$ 159/mês** (10% desconto)
- **ARR: R$ 1.908**

**Target:** Parcerias, consultórios compartilhados

---

### Pacote Starter

**Composição:**
- 3 licenças TQ (3 × R$ 89 = R$ 267)
- Basic incluso: 3 × 2.400 = 7.200 min/mês (R$ 159 de custo)

**Preço:**
- Individual: R$ 267/mês
- Bundle: **R$ 229/mês** (15% desconto)
- **ARR: R$ 2.748**

**Target:** Consultórios (1-3 profissionais)

---

### Pacote Growth

**Composição:**
- 10 licenças TQ (10 × R$ 89 = R$ 890)
- Basic incluso: 10 × 2.400 = 24.000 min/mês (R$ 528 de custo)
- Upgrade Professional: +6.000 min (R$ 149)

**Preço:**
- Individual: R$ 1.039/mês
- Bundle: **R$ 899/mês** (15% desconto)
- **ARR: R$ 10.788**

**Target:** Clínicas pequenas (6-15 profissionais)

---

### Pacote Scale

**Composição:**
- 25 licenças TQ (25 × R$ 89 = R$ 2.225)
- Basic incluso: 25 × 2.400 = 60.000 min/mês (R$ 1.320 de custo)
- Upgrade Business: +12.000 min (R$ 279)

**Preço:**
- Individual: R$ 2.504/mês
- Bundle: **R$ 1.999/mês** (20% desconto)
- **ARR: R$ 23.988**

**Target:** Clínicas médias/grandes (16-30 profissionais)

---

### Pacote Enterprise

**Composição:**
- 50+ licenças TQ
- VIP custom limits
- Overage permitido
- Account manager dedicado
- SLA 99.9%

**Preço:** **Custom (R$ 5.000-15.000/mês)**

**Target:** Hospitais, redes de clínicas

---

## 5. Composição de Receita e Custos

### Estrutura de Custos (Por Tenant Médio)

**Tenant Típico:** 8 usuários TQ (clínica pequena)

#### Receita
```
8 licenças TQ × R$ 89 = R$ 712/mês
Add-on transcrição:    R$ 0 (dentro do Basic)
────────────────────────────────────────
MRR:                   R$ 712
ARR:                   R$ 8.544
```

#### Custos Variáveis
```
Transcrição (19.2k min): R$ 422  (custo Deepgram)
AI Agent (OpenAI):       R$ 40   (50 requests/mês GPT-4o-mini)
Storage (Supabase):      R$ 3    (rateado, $25/50 tenants)
Database:                R$ 2    (rateado)
Emails:                  R$ 10   (200 emails/mês)
Compute:                 R$ 3    (rateado)
────────────────────────────────────────
Total Variável:         R$ 480/mês
```

#### Custos Fixos (Rateados)
```
Infra base:             R$ 11/tenant (R$ 1.100 / 100 tenants)
```

#### Margem
```
Receita:                R$ 712
Custos Variáveis:       R$ 480
Custos Fixos:           R$ 11
────────────────────────────────────────
Lucro Bruto:            R$ 221/mês
Margem Bruta:           31%
```

**Nota:** Margem aumenta com upsell (Professional/Business plans) para 50-60%.

---

## 6. Projeções 12 Meses (Cenário Moderado)

### Premissas
- 10 novos tenants/mês
- Churn: 5%/mês (Ano 1)
- ARPU médio: R$ 656/tenant
- 20% fazem upgrade para Professional/Business

### Tabela de Projeção

| Mês | Tenants | MRR | Custos | Lucro | Margem |
|-----|---------|-----|--------|-------|--------|
| M1 | 10 | R$ 6.6k | R$ 4.9k | R$ 1.7k | 26% |
| M3 | 28 | R$ 18.4k | R$ 13.5k | R$ 4.9k | 27% |
| M6 | 53 | R$ 34.8k | R$ 25.5k | R$ 9.3k | 27% |
| M9 | 74 | R$ 48.6k | R$ 35.6k | R$ 13.0k | 27% |
| M12 | 92 | R$ 60.4k | R$ 44.2k | R$ 16.2k | 27% |

### Acumulado Ano 1

```
Receita Total:          R$ 442k
Custos Total:           R$ 323k
────────────────────────────────────────
Lucro Bruto Ano 1:      R$ 119k
Margem Bruta:           27%
```

**ARR (final M12):** R$ 725k

---

## 7. Comparação de Cenários (M12)

| Métrica | Conservador | Moderado | Agressivo |
|---------|-------------|----------|-----------|
| **Tenants** | 48 | 92 | 192 |
| **MRR** | R$ 31k | R$ 60k | R$ 126k |
| **ARR** | R$ 378k | R$ 725k | R$ 1.5M |
| **Receita Ano 1** | R$ 207k | R$ 442k | R$ 889k |
| **Lucro Ano 1** | R$ 56k | R$ 119k | R$ 240k |
| **Margem** | 27% | 27% | 27% |

---

## 8. Análise de Pacotes (Comparativo)

### Receita e Margem por Pacote

| Pacote | Preço/Mês | Custo/Mês | Lucro/Mês | Margem | ARR |
|--------|-----------|-----------|-----------|--------|-----|
| **Solo** (1 user) | R$ 79 | R$ 64 | R$ 15 | 19% | R$ 948 |
| **Duo** (2 users) | R$ 159 | R$ 117 | R$ 42 | 26% | R$ 1.9k |
| **Starter** (3 users) | R$ 229 | R$ 177 | R$ 52 | 23% | R$ 2.7k |
| **Growth** (10 users) | R$ 899 | R$ 615 | R$ 284 | 32% | R$ 10.8k |
| **Scale** (25 users) | R$ 1.999 | R$ 1.452 | R$ 547 | 27% | R$ 24k |
| **Enterprise** (50 users) | R$ 8.000 | R$ 5.500 | R$ 2.500 | 31% | R$ 96k |

**Melhor Margem:** Growth (32%) - sweet spot entre volume e eficiência.

**Estratégia de Entrada:** Solo/Duo capturam profissionais liberais (margem menor, mas volume maior).

---

## 9. Unit Economics (Resumo)

### Métricas Chave

```
CAC (Custo Aquisição):      R$ 350
ARPU (Receita/Tenant):      R$ 656/mês
Churn (mensal):             5% (Ano 1) → 2% (Ano 2)
Customer Lifetime:          20 meses (5% churn)
Gross Margin:               27%
```

### Cálculo LTV

```
LTV = ARPU × Lifetime × Gross Margin
LTV = R$ 656 × 20 × 0.27
LTV = R$ 3.542
```

### LTV/CAC Ratio

```
LTV/CAC = R$ 3.542 / R$ 350 = 10.1x
```

✅ **Saudável** (>3x é bom para SaaS B2B)

### Payback Period

```
Payback = CAC / (ARPU × Gross Margin)
Payback = R$ 350 / (R$ 656 × 0.27)
Payback = 2 meses
```

✅ **Excelente** (<12 meses é saudável)

---

## 10. Projeção 3 Anos (Resumo)

| Métrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| **Tenants** | 92 | 350 | 850 |
| **Usuários** | 644 | 3.150 | 10.200 |
| **ARPU/Tenant** | R$ 656 | R$ 890 | R$ 1.180 |
| **MRR** | R$ 60k | R$ 312k | R$ 1.003k |
| **ARR** | R$ 725k | R$ 3.7M | R$ 12M |
| **Receita Acum.** | R$ 442k | R$ 2.1M | R$ 7.8M |
| **Lucro Bruto** | R$ 119k | R$ 630k | R$ 2.3M |
| **Margem** | 27% | 30% | 30% |

**Nota:** ARPU aumenta com lançamento CRM (2026) e Automation (2027).

---

## 11. Tabela de Preços Final (Simplificada)

### Licenças Base

| Produto | Preço/User/Mês | Inclui Transcrição | Status |
|---------|----------------|-------------------|--------|
| Hub | Grátis | - | ✅ Ativo |
| TQ | R$ 89 | 2.400 min/mês (40h) | ✅ Ativo |
| CRM | R$ 149 | - | 🚧 2026 |

### Add-ons Transcrição

| Plano | Min/Mês | Preço/Mês | Cenário |
|-------|---------|-----------|---------|
| Basic | 2.400 | Incluso | Padrão |
| Professional | +6.000 | +R$ 149 | Heavy users |
| Business | +12.000 | +R$ 279 | Muito heavy |
| VIP | Custom | Custom | Enterprise |

### Pacotes (Bundles)

| Pacote | Users | Min/Mês | Preço/Mês | Economia | ARR | Target |
|--------|-------|---------|-----------|----------|-----|--------|
| **Solo** | 1 | 2.4k | R$ 79 | 12% | R$ 948 | Profissional liberal |
| **Duo** | 2 | 4.8k | R$ 159 | 10% | R$ 1.9k | Parcerias |
| **Starter** | 3 | 7.2k | R$ 229 | 15% | R$ 2.7k | Consultórios |
| **Growth** | 10 | 24k | R$ 899 | 15% | R$ 10.8k | Clínicas pequenas |
| **Scale** | 25 | 60k | R$ 1.999 | 20% | R$ 24k | Clínicas médias |
| **Enterprise** | 50+ | Custom | Custom | 25% | R$ 96k+ | Hospitais |

---

## 12. Decisões e Recomendações

### Fornecedores (Final)

✅ **Storage:** Supabase ($25/mês fixo)
✅ **Transcrição:** Deepgram Nova-3 ($0.0043/min)
✅ **AI Agent:** OpenAI GPT-4o-mini ($0.15/1M tokens)
✅ **Database:** Supabase/Railway (Postgres)
✅ **Compute:** Railway/Fly.io (API servers)

### Pricing (Final)

✅ **Licença TQ:** R$ 89/user/mês (inclui 2.400 min)
✅ **Add-on Professional:** R$ 149/mês (+6k min)
✅ **Add-on Business:** R$ 279/mês (+12k min)
✅ **Bundles:** 10-20% desconto
✅ **Entrada:** Solo (R$ 79) e Duo (R$ 159) - baixa fricção
✅ **Volume:** Starter/Growth - clínicas pequenas/médias
✅ **Premium:** Scale/Enterprise - clínicas grandes/hospitais

### Go-to-Market

✅ **ICP Primário:** Clínicas de psicologia (3-20 profissionais)
✅ **ICP Secundário:** Profissionais liberais (1-2 profissionais) - maior volume, menor ticket
✅ **Canal:** LinkedIn outbound + SEO content
✅ **Trial:** 14 dias grátis (sem cartão) - 600 min (1h/dia × 5 dias úteis)
✅ **Conversão Trial:** 25-30% esperado
✅ **Planos Entrada:** Solo (R$ 79) e Duo (R$ 159) para captação
✅ **Upsell:** Starter/Growth para clínicas estabelecidas
✅ **Contratos Anuais:** 15% desconto

### Milestones 2025

**M3:** 20 tenants, MRR R$ 15k
**M6:** 50 tenants, MRR R$ 35k, contratar SDR
**M12:** 90 tenants, MRR R$ 60k, ARR R$ 725k

---

## 13. Resumo Executivo

### Viabilidade

✅ **Margem Bruta:** 27% (aumenta para 50-60% com upsells)
✅ **LTV/CAC:** 10x (saudável)
✅ **Payback:** 2 meses (excelente)
✅ **Break-even:** M2-M3 (rápido)

### Projeções

📈 **Ano 1:** R$ 725k ARR (92 tenants)
📈 **Ano 2:** R$ 3.7M ARR (350 tenants, lançamento CRM)
📈 **Ano 3:** R$ 12M ARR (850 tenants, expansão)

### Investimento Requerido

💰 **Infra Fixa:** R$ 1.100/mês
💰 **Time Inicial:** 3 pessoas (founders)
💰 **Marketing:** R$ 5k/mês (M3+)
💰 **Hiring:** SDR (M6), CSM (M9)

### ROI

🎯 **ARR Ano 1:** R$ 725k
🎯 **Lucro Ano 1:** R$ 119k
🎯 **Valuation (10x ARR):** R$ 7.2M

---

**Próximos Passos:**
1. Validar pricing com 10 beta customers (M1-M2)
2. Setup analytics e health scores (M1)
3. Implementar limite trial (600 min = 1h/dia × 5 dias úteis)
4. Contratar SDR (M6)
5. Planejar migração R2 (M9-M12)

**Documento:** Análise Financeira Simplia PaaS 2025
**Atualização:** Revisar após M3 (validação inicial)
