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

- **Custo Deepgram (Monolingual):** $0.0043/min (R$ 0.022/min)
- **Custo Deepgram (Multilingual):** $0.0052/min (R$ 0.027/min)
- **Fornecedor:** Deepgram Nova-3
- **Modelo de cobrança:** Pay-as-you-go
- **Cálculo de custos:** Híbrido (local + cron job diário com custos reais da API Deepgram)

### Planos Oferecidos

**Nota importante sobre custos:**
- Custos baseados em **modo multilingual** ($0.0052/min) para cenário conservador
- Custos reais podem ser menores se maioria usar modo monolingual ($0.0043/min)
- Sistema calcula automaticamente baseado em detecção de idioma

| Plano | Min/Mês | Horas/Mês | Custo Deepgram (Multilingual) | Preço Venda | Margem | Incluso |
|-------|---------|-----------|-------------------------------|-------------|--------|---------|
| **Basic** | 2.400 | 40h | R$ 65 | R$ 0 | -R$ 65 | ✅ Incluso na licença TQ |
| **Professional** | 6.000 | 100h | R$ 162 | R$ 179 | R$ 17 (9%) | ❌ Add-on |
| **Business** | 12.000 | 200h | R$ 324 | R$ 349 | R$ 25 (7%) | ❌ Add-on |
| **VIP** | Custom | Custom | Variável | R$ 0.030/min | 11% | ❌ Custom |

**Nota:** Basic (2.400 min) é incluso em cada licença TQ. Custo absorvido como CAC.

**Otimização de custos:**
- Clientes monolingual (apenas pt-BR ou apenas en-US): -17% custo vs multilingual
- Cron job diário atualiza custos com valores reais da API Deepgram (precisão de centavos)

---

## 3. Preços de Licenças (Por Usuário/Mês)

| Aplicação | Preço | ARR/User | Status | Target |
|-----------|-------|----------|--------|--------|
| **Hub** | R$ 0 | R$ 0 | ✅ Ativo | Portal de acesso |
| **TQ** | R$ 89 | R$ 1.068 | ✅ Ativo | Profissionais da saúde |
| **CRM** | R$ 149 | R$ 1.788 | 🚧 2026 | Vendedores |
| **Automation** | R$ 199 | R$ 2.388 | 🚧 2027 | Analistas |

**Cada licença TQ inclui:** 2.400 min/mês de transcrição (valor R$ 53-65 dependendo de monolingual vs multilingual)

### Free Trial

🆓 **14 dias grátis** (sem cartão de crédito)
- Acesso completo a todas as features
- **600 min de transcrição** (10 horas total = 1h/dia × 5 dias úteis)
- Limite diário: 1 hora/dia
- Onboarding call com suporte
- Conversão esperada: 25-30%

**Custo trial:** R$ 13-16 (600 min × R$ 0.022-0.027, depende de mono/multi) - absorvido como CAC

---

## 4. Pacotes Compostos (Bundles)

### Pacote Solo (Profissional Liberal)

**Composição:**
- 1 licença TQ (1 × R$ 89 = R$ 89)
- Basic incluso: 2.400 min/mês (R$ 53-65 de custo)

**Preço:**
- **R$ 79/mês** (12% desconto)
- **ARR: R$ 948**

**Target:** Psicólogos autônomos, terapeutas individuais (geralmente monolingual pt-BR)

**Diferencial:** Preço acessível para quem está começando

**Cenário de uso:**
- 1 profissional atendendo 4-5 pacientes/dia
- 30-40 min por sessão
- 20 dias úteis/mês
- Total: ~2.000-2.400 min/mês (dentro do Basic)
- Idioma: 100% pt-BR (monolingual) - custo real ~R$ 44-53/mês

---

### Pacote Duo (2 Profissionais)

**Composição:**
- 2 licenças TQ (2 × R$ 89 = R$ 178)
- Basic incluso: 2 × 2.400 = 4.800 min/mês (R$ 106-130 de custo)

**Preço:**
- Individual: R$ 178/mês
- Bundle: **R$ 159/mês** (10% desconto)
- **ARR: R$ 1.908**

**Target:** Parcerias, consultórios compartilhados (psicoterapia, nutrição)

**Cenário de uso:**
- 2 profissionais compartilhando espaço
- ~3-4 pacientes/dia cada
- Total: ~3.600-4.800 min/mês (dentro do Basic)
- Idioma: 100% pt-BR (monolingual) - custo real ~R$ 80-106/mês

---

### Pacote Starter

**Composição:**
- 3 licenças TQ (3 × R$ 89 = R$ 267)
- Basic incluso: 3 × 2.400 = 7.200 min/mês (R$ 159-195 de custo)

**Preço:**
- Individual: R$ 267/mês
- Bundle: **R$ 229/mês** (15% desconto)
- **ARR: R$ 2.748**

**Target:** Consultórios pequenos (1-3 profissionais, psicologia/nutrição)

**Cenário de uso:**
- 3 profissionais em consultório
- ~3-4 pacientes/dia cada
- Total: ~5.400-7.200 min/mês (dentro do Basic)
- Idioma: Predominantemente pt-BR (85% monolingual, 15% multilingual)
- Custo real estimado: ~R$ 130-160/mês (mix de mono/multi)

---

### Pacote Growth

**Composição:**
- 10 licenças TQ (10 × R$ 89 = R$ 890)
- Basic incluso: 10 × 2.400 = 24.000 min/mês (R$ 528-650 de custo)
- Upgrade Professional: +6.000 min (R$ 179)

**Preço:**
- Individual: R$ 1.069/mês
- Bundle: **R$ 899/mês** (16% desconto)
- **ARR: R$ 10.788**

**Target:** Clínicas pequenas (6-15 profissionais, multidisciplinar)

**Cenário de uso:**
- 10 profissionais (psicólogos, psiquiatras, terapeutas)
- ~4 pacientes/dia cada (alta demanda)
- Total: ~24.000 min/mês (Basic) + 6.000 min (Professional) = 30.000 min/mês
- Idioma: 70% pt-BR (monolingual), 30% multilingual (pacientes estrangeiros)
- Custo real estimado: ~R$ 680-750/mês (mix pesado de mono/multi)

---

### Pacote Scale

**Composição:**
- 25 licenças TQ (25 × R$ 89 = R$ 2.225)
- Basic incluso: 25 × 2.400 = 60.000 min/mês (R$ 1.320-1.620 de custo)
- Upgrade Business: +12.000 min (R$ 349)

**Preço:**
- Individual: R$ 2.574/mês
- Bundle: **R$ 1.999/mês** (22% desconto)
- **ARR: R$ 23.988**

**Target:** Clínicas médias/grandes (16-30 profissionais, alta diversidade)

**Cenário de uso:**
- 25 profissionais (equipe multidisciplinar com médicos, psicólogos, terapeutas)
- ~5 pacientes/dia por profissional (volume alto)
- Total: ~60.000 min/mês (Basic) + 12.000 min (Business) = 72.000 min/mês
- Idioma: 50% pt-BR (monolingual), 50% multilingual (clínica internacional/turismo médico)
- Custo real estimado: ~R$ 1.620-1.950/mês (mix equilibrado mono/multi)

---

### Pacote Enterprise

**Composição:**
- 50+ licenças TQ
- VIP custom limits (ex: 200.000 min/mês base)
- Overage permitido (ilimitado)
- Account manager dedicado
- SLA 99.9%
- Treinamento on-site

**Preço:** **Custom (R$ 5.000-15.000/mês)**

**Target:** Hospitais, redes de clínicas, grupos internacionais

**Cenário de uso:**
- 50-100+ profissionais (hospital com múltiplas especialidades)
- ~8-10 pacientes/dia por profissional (volume hospitalar)
- Total: ~240.000-480.000 min/mês (4.000-8.000 horas)
- Idioma: 40% pt-BR (monolingual), 60% multilingual (hospital internacional, turismo médico)
- Custo real estimado: ~R$ 5.400-11.000/mês (mix pesado multilingual)
- **Margem:** 45-55% (volume compensa custo alto de multilingual)

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
Transcrição (19.2k min): R$ 422-520  (custo Deepgram, depende de mono/multi)
                                      Assumindo 70% mono + 30% multi: ~R$ 465
AI Agent (OpenAI):       R$ 40        (50 requests/mês GPT-4o-mini)
Storage (Supabase):      R$ 3         (rateado, $25/50 tenants)
Database:                R$ 2         (rateado)
Emails:                  R$ 10        (200 emails/mês)
Compute:                 R$ 3         (rateado)
────────────────────────────────────────
Total Variável:         R$ 523/mês    (conservador, 70% mono + 30% multi)
```

#### Custos Fixos (Rateados)
```
Infra base:             R$ 11/tenant (R$ 1.100 / 100 tenants)
```

#### Margem
```
Receita:                R$ 712
Custos Variáveis:       R$ 523  (cenário conservador: 70% mono + 30% multi)
Custos Fixos:           R$ 11
────────────────────────────────────────
Lucro Bruto:            R$ 178/mês
Margem Bruta:           25%
```

**Notas:**
- Margem aumenta com upsell (Professional/Business plans) para 40-50%
- Margem real pode ser 30-35% se maioria dos tenants usar modo monolingual
- Sistema calcula custos reais via cron job diário (precisão de centavos)

---

## 6. Projeções 12 Meses (Cenário Moderado)

### Premissas
- 10 novos tenants/mês
- Churn: 5%/mês (Ano 1)
- ARPU médio: R$ 656/tenant
- 20% fazem upgrade para Professional/Business
- Mix idiomas: 70% monolingual, 30% multilingual (conservador)

### Tabela de Projeção

| Mês | Tenants | MRR | Custos | Lucro | Margem |
|-----|---------|-----|--------|-------|--------|
| M1 | 10 | R$ 6.6k | R$ 5.3k | R$ 1.3k | 20% |
| M3 | 28 | R$ 18.4k | R$ 14.6k | R$ 3.8k | 21% |
| M6 | 53 | R$ 34.8k | R$ 27.5k | R$ 7.3k | 21% |
| M9 | 74 | R$ 48.6k | R$ 38.4k | R$ 10.2k | 21% |
| M12 | 92 | R$ 60.4k | R$ 47.7k | R$ 12.7k | 21% |

### Acumulado Ano 1

```
Receita Total:          R$ 442k
Custos Total:           R$ 349k
────────────────────────────────────────
Lucro Bruto Ano 1:      R$ 93k
Margem Bruta:           21%
```

**ARR (final M12):** R$ 725k

**Nota:** Margem conservadora (assume 70% mono + 30% multi). Margem real pode chegar a 30-35% se maioria for monolingual.

---

## 7. Comparação de Cenários (M12)

| Métrica | Conservador | Moderado | Agressivo |
|---------|-------------|----------|-----------|
| **Tenants** | 48 | 92 | 192 |
| **MRR** | R$ 31k | R$ 60k | R$ 126k |
| **ARR** | R$ 378k | R$ 725k | R$ 1.5M |
| **Receita Ano 1** | R$ 207k | R$ 442k | R$ 889k |
| **Lucro Ano 1** | R$ 43k | R$ 93k | R$ 187k |
| **Margem** | 21% | 21% | 21% |

**Nota:** Margens conservadoras (70% mono + 30% multi). Com perfil 100% monolingual, margens sobem para 30-35%.

---

## 8. Análise de Pacotes (Comparativo)

### Receita e Margem por Pacote

| Pacote | Preço/Mês | Custo/Mês (Conservador) | Lucro/Mês | Margem | ARR | Mix Idiomas Típico |
|--------|-----------|-------------------------|-----------|--------|-----|--------------------|
| **Solo** (1 user) | R$ 79 | R$ 75 | R$ 4 | 5% | R$ 948 | 95% mono (psicólogos BR) |
| **Duo** (2 users) | R$ 159 | R$ 139 | R$ 20 | 13% | R$ 1.9k | 90% mono |
| **Starter** (3 users) | R$ 229 | R$ 208 | R$ 21 | 9% | R$ 2.7k | 85% mono, 15% multi |
| **Growth** (10 users) | R$ 899 | R$ 738 | R$ 161 | 18% | R$ 10.8k | 70% mono, 30% multi |
| **Scale** (25 users) | R$ 1.999 | R$ 1.679 | R$ 320 | 16% | R$ 24k | 50% mono, 50% multi |
| **Enterprise** (50 users) | R$ 8.000 | R$ 4.400 | R$ 3.600 | 45% | R$ 96k | 40% mono, 60% multi |

**Melhor Margem:** Enterprise (45%) - volume alto compensa custo multilingual.

**Pior Margem:** Solo (5%) - preço de entrada, custo absorvido como CAC.

**Estratégia:**
- Solo/Duo: Captura profissionais liberais (margem baixa, mas alto volume + upsell)
- Growth: Sweet spot operacional (margem 18%, volume médio)
- Enterprise: Alto valor (margem 45%, contratos anuais)

---

## 9. Unit Economics (Resumo)

### Métricas Chave

```
CAC (Custo Aquisição):      R$ 350
ARPU (Receita/Tenant):      R$ 656/mês
Churn (mensal):             5% (Ano 1) → 2% (Ano 2)
Customer Lifetime:          20 meses (5% churn)
Gross Margin:               21% (conservador, 70% mono + 30% multi)
                            até 35% (otimista, 100% monolingual)
```

### Cálculo LTV

```
LTV = ARPU × Lifetime × Gross Margin
LTV (Conservador) = R$ 656 × 20 × 0.21 = R$ 2.755
LTV (Otimista)    = R$ 656 × 20 × 0.35 = R$ 4.592
```

### LTV/CAC Ratio

```
LTV/CAC (Conservador) = R$ 2.755 / R$ 350 = 7.9x
LTV/CAC (Otimista)    = R$ 4.592 / R$ 350 = 13.1x
```

✅ **Excelente** (>3x é bom para SaaS B2B, estamos em 7.9-13.1x)

### Payback Period

```
Payback = CAC / (ARPU × Gross Margin)
Payback (Conservador) = R$ 350 / (R$ 656 × 0.21) = 2.5 meses
Payback (Otimista)    = R$ 350 / (R$ 656 × 0.35) = 1.5 meses
```

✅ **Excelente** (<12 meses é saudável, estamos em 1.5-2.5 meses)

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
| **Lucro Bruto** | R$ 93k | R$ 630k | R$ 2.3M |
| **Margem** | 21% | 30% | 30% |

**Notas:**
- ARPU aumenta com lançamento CRM (2026) e Automation (2027)
- Margem Ano 1 conservadora (21%) por mix mono/multi
- Margem Ano 2-3 melhora (30%) com escala e otimização de custos

---

## 11. Tabela de Preços Final (Simplificada)

### Licenças Base

| Produto | Preço/User/Mês | Inclui Transcrição | Status |
|---------|----------------|-------------------|--------|
| Hub | Grátis | - | ✅ Ativo |
| TQ | R$ 89 | 2.400 min/mês (40h) | ✅ Ativo |
| CRM | R$ 149 | - | 🚧 2026 |

### Add-ons Transcrição

| Plano | Min/Mês | Preço/Mês | Cenário | Custo Estimado (Mix) |
|-------|---------|-----------|---------|---------------------|
| Basic | 2.400 | Incluso | Padrão | R$ 53-65 |
| Professional | +6.000 | +R$ 179 | Heavy users | +R$ 132-162 |
| Business | +12.000 | +R$ 349 | Muito heavy | +R$ 264-324 |
| VIP | Custom | Custom | Enterprise | Variável |

**Nota:** Custos dependem do mix monolingual vs multilingual por tenant.

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
✅ **Transcrição:** Deepgram Nova-3
   - Monolingual: $0.0043/min (pt-BR ou en-US isolado)
   - Multilingual: $0.0052/min (detecção automática de idioma)
   - Cron job diário atualiza custos reais via Management API
✅ **AI Agent:** OpenAI GPT-4o-mini ($0.15/1M tokens)
✅ **Database:** Supabase/Railway (Postgres)
✅ **Compute:** Railway/Fly.io (API servers)

### Pricing (Final)

✅ **Licença TQ:** R$ 89/user/mês (inclui 2.400 min mono/multi)
✅ **Add-on Professional:** R$ 179/mês (+6k min)
✅ **Add-on Business:** R$ 349/mês (+12k min)
✅ **Bundles:** 10-22% desconto
✅ **Entrada:** Solo (R$ 79) e Duo (R$ 159) - baixa fricção
✅ **Volume:** Starter/Growth - clínicas pequenas/médias
✅ **Premium:** Scale/Enterprise - clínicas grandes/hospitais

**Estratégia de custos:**
- Sistema calcula automaticamente mono vs multilingual por transcrição
- Cron job diário substitui custos locais por valores reais do Deepgram
- Precisão de centavos para análise financeira mensal

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

✅ **Margem Bruta:** 21-35% (depende de mix mono/multi, aumenta para 40-50% com upsells)
✅ **LTV/CAC:** 7.9-13.1x (excelente, depende de mix)
✅ **Payback:** 1.5-2.5 meses (excelente)
✅ **Break-even:** M2-M3 (rápido)

### Projeções

📈 **Ano 1:** R$ 725k ARR (92 tenants) - Margem 21% (conservadora)
📈 **Ano 2:** R$ 3.7M ARR (350 tenants, lançamento CRM) - Margem 30%
📈 **Ano 3:** R$ 12M ARR (850 tenants, expansão) - Margem 30%

**Nota:** Margens melhoram com escala e otimização mono/multi

### Investimento Requerido

💰 **Infra Fixa:** R$ 1.100/mês
💰 **Time Inicial:** 3 pessoas (founders)
💰 **Marketing:** R$ 5k/mês (M3+)
💰 **Hiring:** SDR (M6), CSM (M9)

### ROI

🎯 **ARR Ano 1:** R$ 725k
🎯 **Lucro Ano 1:** R$ 93k (conservador, mix 70/30 mono/multi)
🎯 **Valuation (10x ARR):** R$ 7.2M

**Upside:** Lucro pode chegar a R$ 130-150k se maioria dos tenants for monolingual (cenário realista para Brasil)

---

**Próximos Passos:**
1. Validar pricing com 10 beta customers (M1-M2)
2. Setup analytics e health scores (M1)
3. Implementar limite trial (600 min = 1h/dia × 5 dias úteis)
4. Contratar SDR (M6)
5. Planejar migração R2 (M9-M12)

**Documento:** Análise Financeira Simplia PaaS 2025
**Atualização:** Revisar após M3 (validação inicial)
