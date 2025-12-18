# TQ - Tabela de Preços

## Custos Base

| Item | Valor |
|------|-------|
| Custo transcrição (Deepgram) | R$ 1,60/hora |

## Licenças (Lucro Puro)

| Tipo | Preço | Descrição |
|------|-------|-----------|
| Admin | R$ 50 | Acesso total ao sistema e configurações |
| Manager | R$ 20 | Edição de registros e transcrição |
| Operations | R$ 10 | Acesso de leitura aos registros |

## Planos

| Plano | Público-alvo | Horas/mês | Usuários Inclusos | Preço |
|-------|--------------|-----------|-------------------|-------|
| **Starter** | Perfeito para começar | 40h | 1 Admin | R$ 119 |
| **Solo** | Profissional individual | 80h | 1 Admin + 1 Operations | R$ 189 |
| **Practice** | Clínicas em crescimento | 240h | 1 Admin + 1 Manager + 1 Operations | R$ 469 |
| **VIP** | Clínicas com equipes maiores | Personalizado | Personalizado | Sob consulta |

## Composição de Custos por Plano

### Starter (40h/mês)
| Item | Valor |
|------|-------|
| Transcrição (40h × R$ 1,60) | R$ 64 |
| Licença (1 Admin) | R$ 50 |
| **Custo Total** | R$ 114 |
| **Preço Final** | R$ 119 |

### Solo (80h/mês)
| Item | Valor |
|------|-------|
| Transcrição (80h × R$ 1,60) | R$ 128 |
| Licenças (1 Admin + 1 Operations) | R$ 60 |
| **Custo Total** | R$ 188 |
| **Preço Final** | R$ 189 |

### Practice (240h/mês)
| Item | Valor |
|------|-------|
| Transcrição (240h × R$ 1,60) | R$ 384 |
| Licenças (1 Admin + 1 Manager + 1 Operations) | R$ 80 |
| **Custo Total** | R$ 464 |
| **Preço Final** | R$ 469 |

## Análise de Lucro

| Plano | Preço | Lucro Mínimo | Lucro se usar 50% | Lucro se usar 25% |
|-------|-------|--------------|-------------------|-------------------|
| Starter | R$ 119 | R$ 5 (4%) | R$ 37 (31%) | R$ 53 (45%) |
| Solo | R$ 189 | R$ 1 (1%) | R$ 65 (34%) | R$ 97 (51%) |
| Practice | R$ 469 | R$ 5 (1%) | R$ 197 (42%) | R$ 293 (62%) |

> **Nota:** O lucro real depende do uso efetivo. Clientes raramente usam 100% da cota.

## Funcionalidades por Plano

### Starter
- 1 licença de usuário Admin inclusa
- 40 horas de transcrição/mês
- Transcrição monolíngue
- Máximo de 3 templates no Construtor de Landing Pages
- Setup inicial incluso
- Suporte padrão

### Solo
- 1 licença Admin + 1 Operations inclusa
- 80 horas de transcrição/mês
- Transcrição monolíngue
- Máximo de 3 templates no Construtor de Landing Pages
- Setup inicial incluso
- Suporte para criação de templates
- Suporte padrão

### Practice
- 1 Admin + 1 Manager + 1 Operations inclusos
- Licenças adicionais disponíveis (veja preços acima)
- 240 horas de transcrição/mês
- Permite exceder limite mensal
- Transcrição multilíngue com detecção automática
- Máximo de 3 templates no Construtor de Landing Pages
- Setup inicial incluso
- Suporte para criação de templates
- Suporte prioritário

### VIP
- Sem limite de licenças contratáveis
- Limite mensal de transcrição personalizado
- Permite exceder limite mensal de transcrição
- Transcrição multilíngue com detecção automática
- Sem limites de templates no Construtor de Landing Pages
- Setup inicial incluso
- Suporte para criação de templates
- Suporte prioritário

---

## Simulação de Faturamento e Capacidade

### Limites do Deepgram (Fornecedor)

| Parâmetro | Valor |
|-----------|-------|
| Concorrência máxima (REST API) | 100 conexões simultâneas |
| Processamento | Tempo real (1 min áudio = ~1 min processo) |

### Cálculo de Capacidade Máxima

**Premissas:**
- Duração média de consulta: 30 minutos
- Horas de operação pico: 8h/dia
- Dias úteis/mês: 22

| Métrica | Cálculo | Resultado |
|---------|---------|-----------|
| Transcrições simultâneas | 100 conexões | 100 |
| Transcrições/hora | 100 × 2 (30min cada) | 200/hora |
| Transcrições/dia | 200 × 8h | 1.600/dia |
| Transcrições/mês | 1.600 × 22 dias | 35.200/mês |
| **Horas de áudio/mês** | 35.200 × 0,5h | **17.600 horas** |

### Cenários de Faturamento

#### Cenário 1: Fase Inicial (Foco em Pequenas Clínicas)

| Plano | Qtd Tenants | Horas Contratadas | Receita Mensal |
|-------|-------------|-------------------|----------------|
| Starter | 100 | 4.000h | R$ 11.900 |
| Solo | 50 | 4.000h | R$ 9.450 |
| Practice | 10 | 2.400h | R$ 4.690 |
| **Total** | **160** | **10.400h** | **R$ 26.040** |

- Uso real estimado (50%): **5.200h** ✅ Bem dentro da capacidade
- Custo Deepgram (50% uso): R$ 8.320
- Custos fixos: R$ 400
- **Lucro líquido estimado:** R$ 17.320/mês

#### Cenário 2: Crescimento (Mix Balanceado)

| Plano | Qtd Tenants | Horas Contratadas | Receita Mensal |
|-------|-------------|-------------------|----------------|
| Starter | 200 | 8.000h | R$ 23.800 |
| Solo | 100 | 8.000h | R$ 18.900 |
| Practice | 50 | 12.000h | R$ 23.450 |
| **Total** | **350** | **28.000h** | **R$ 66.150** |

- Uso real estimado (50%): **14.000h** ✅ Dentro da capacidade
- Custo Deepgram (50% uso): R$ 22.400
- Custos fixos: R$ 400
- **Lucro líquido estimado:** R$ 43.350/mês

#### Cenário 3: Escala (Operação Madura)

| Plano | Qtd Tenants | Horas Contratadas | Receita Mensal |
|-------|-------------|-------------------|----------------|
| Starter | 500 | 20.000h | R$ 59.500 |
| Solo | 200 | 16.000h | R$ 37.800 |
| Practice | 100 | 24.000h | R$ 46.900 |
| VIP | 20 | 10.000h | R$ 20.000 (est.) |
| **Total** | **820** | **70.000h** | **R$ 164.200** |

- Uso real estimado (30%): **21.000h** ⚠️ Próximo do limite (17.600h)
- **Ação necessária:** Solicitar aumento de concorrência ao Deepgram
- Custo Deepgram (30% uso): R$ 33.600
- Custos fixos: R$ 400
- **Lucro líquido estimado:** R$ 130.200/mês

### Alertas de Capacidade

| Uso Real Mensal | Status | Ação |
|-----------------|--------|------|
| < 10.000h | 🟢 Normal | Operação tranquila |
| 10.000h - 15.000h | 🟡 Atenção | Monitorar picos de horário |
| 15.000h - 17.000h | 🟠 Alerta | Planejar aumento de capacidade |
| > 17.000h | 🔴 Crítico | Solicitar aumento de concorrência |

### Estratégias de Mitigação

1. **Processamento fora do pico:** Incentivar uploads de áudio para processamento noturno
2. **Fila de prioridade:** VIP e Practice processam primeiro
3. **Cache de transcrições:** Evitar reprocessamento de áudios já transcritos
4. **Aumento de concorrência:** Deepgram oferece planos enterprise com limites maiores

---

## Custos Fixos Mensais (Infraestrutura)

| Serviço | Fornecedor | Valor |
|---------|------------|-------|
| Domínio E-mail | NameCheap | ~R$ 7/mês (2 anos) |
| Cloud/Hospedagem | Railway | ~R$ 100/mês |
| Workspace | Google | R$ 98/mês |
| Transcrição | Deepgram | Variável (~R$ 0,027/min) |
| Buckets | Supabase | ~R$ 175/mês |
| Canva Pro | Canva | R$ 17,50/mês |
| **Total Estimado** | | **~R$ 400/mês** |
