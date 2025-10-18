# Requisitos de Infraestrutura - Simplia PaaS

## 📋 Visão Geral

Este documento detalha os requisitos de infraestrutura necessários para deployment do Simplia PaaS em produção. O sistema é uma plataforma multi-tenant SaaS com aplicações integradas (Hub + TQ) que requer alta disponibilidade, escalabilidade e segurança.

---

## 🏗️ Arquitetura da Aplicação

### Componentes Principais

1. **Backend API (Node.js + Express)**
   - Internal API Server (porta 3001)
   - TQ API Server (porta 3004)
   - Servidor de aplicação stateless
   - Suporta múltiplos workers/instâncias

2. **Frontend (React + Vite)**
   - Internal-Admin (porta 3002)
   - Hub Frontend (porta 3003)
   - TQ Frontend (porta 3005)
   - Static files servidos via CDN ou servidor web

3. **Banco de Dados (PostgreSQL)**
   - Versão recomendada: PostgreSQL 14+
   - Multi-tenant com schemas isolados por tenant
   - Requer suporte a JSONB, UUID, triggers
   - Timezone padrão: UTC

4. **Object Storage**
   - Audio files (TQ - gravações de sessões)
   - Branding assets (logos, favicons, vídeos)
   - Provedor atual: Supabase Storage
   - Alternativas: AWS S3, Google Cloud Storage, Azure Blob

5. **Serviços Externos (APIs de Terceiros)**
   - **Deepgram API**: Transcrição de áudio (requer domínio público para webhooks)
   - **OpenAI API**: Geração de summaries médicos via GPT-4o-mini

---

## 💾 Requisitos de Banco de Dados

### PostgreSQL

**Especificações Mínimas:**
- **CPU**: 2 vCPUs
- **RAM**: 4 GB
- **Storage**: 50 GB SSD (crescimento estimado: 10-20 GB/mês para ~100 tenants)
- **Conexões simultâneas**: Mínimo 100 conexões (pool configurado com max: 20 por instância)
- **Backup**: Diário com retenção de 7 dias (mínimo)

**Recomendações:**
- **Managed Service**: Usar serviço gerenciado (AWS RDS, Google Cloud SQL, Azure Database, DigitalOcean Managed Postgres)
- **High Availability**: Multi-AZ deployment para produção
- **Replicação**: Read replicas para queries de leitura pesada (relatórios, analytics)
- **Monitoring**: Habilitar logs de slow queries, monitoramento de conexões
- **Extensions necessárias**: `uuid-ossp`, `pg_trgm` (para buscas full-text)

**Estimativa de Crescimento:**
- 100 tenants = ~50 GB
- 500 tenants = ~150-200 GB
- 1000 tenants = ~300-400 GB

**Conexão:**
- Protocolo: TCP/IP via SSL/TLS (obrigatório)
- Autenticação: User/Password (variáveis de ambiente)
- Network: Acesso privado via VPC (não expor publicamente)

---

## 🖥️ Requisitos de Compute (Backend)

### Node.js API Servers

**Especificações por Instância:**
- **CPU**: 2 vCPUs (mínimo), 4 vCPUs (recomendado)
- **RAM**: 2 GB (mínimo), 4 GB (recomendado)
- **Storage**: 20 GB SSD (principalmente para logs e temp files)
- **Network**: 1 Gbps bandwidth

**Escalabilidade:**
- **Horizontal scaling**: Stateless - suporta múltiplas instâncias atrás de load balancer
- **Load Balancer**: Necessário para distribuir tráfego entre instâncias
- **Auto-scaling**: Configurar baseado em CPU > 70% ou Memory > 80%
- **Mínimo**: 2 instâncias para HA (availability zones diferentes)
- **Recomendado**: 3-5 instâncias para produção

**Ambiente de Execução:**
- **Node.js**: Versão 18+ LTS
- **Process Manager**: PM2 ou equivalente (para restart automático)
- **Logs**: Centralizar via stdout/stderr (integrar com CloudWatch, Stackdriver, etc.)

**Portas Necessárias:**
- 3001 (Internal API)
- 3004 (TQ API)
- Healthcheck endpoint: `/health` (para load balancer)

---

## 🌐 Requisitos de Frontend

### Static Files Hosting

**Opção 1: CDN + Object Storage (Recomendado)**
- Build assets servidos via S3 + CloudFront (AWS)
- Build assets servidos via Cloud Storage + Cloud CDN (GCP)
- Build assets servidos via Blob Storage + Azure CDN (Azure)
- **Vantagens**: Baixa latência, cache global, custo reduzido

**Opção 2: Servidor Web Dedicado**
- Nginx ou Apache servindo static files
- **Especificações**: 1 vCPU, 1 GB RAM (suficiente)
- Configurar cache headers, gzip/brotli compression

**Build Process:**
- Gerar bundles via `npm run build`
- Deploy via CI/CD (GitHub Actions, GitLab CI, etc.)
- Invalidar cache do CDN após deploy

**Domínios:**
- Admin: `admin.simplia.com.br` ou similar
- Hub: `hub.simplia.com.br` ou `app.simplia.com.br`
- TQ: `tq.simplia.com.br` ou subdomain por tenant

---

## 📦 Object Storage (Arquivos)

### Armazenamento de Assets

**Tipos de Arquivos:**
1. **Audio files** (TQ Sessions)
   - Formato: MP3, WAV, M4A
   - Tamanho médio: 5-20 MB por sessão
   - Retenção: Indefinida (até exclusão manual)

2. **Branding assets**
   - Logos: PNG, JPEG, SVG (< 5 MB)
   - Favicons: ICO, PNG (< 1 MB)
   - Background videos: MP4 (< 20 MB)
   - Retenção: Indefinida

**Provedores Recomendados:**
- **AWS S3**: Alta disponibilidade, integração com CloudFront CDN
- **Google Cloud Storage**: Boa performance, integração com Cloud CDN
- **Supabase Storage**: Atual (se manter, requer upgrade para produção)
- **Azure Blob Storage**: Integração com Azure CDN

**Configurações:**
- **Buckets/Containers**: Separar por tipo (tq-audio-files, branding-assets)
- **Access**: Público para branding, privado para áudios (signed URLs)
- **Backup**: Versionamento habilitado
- **Lifecycle**: Arquivar áudios antigos (> 1 ano) para storage tier mais barato

**Estimativa de Uso:**
- 100 tenants × 100 sessions/mês = 10,000 sessions × 10 MB = ~100 GB/mês
- Crescimento anual: ~1.2 TB

---

## 🔐 Segurança e Compliance

### Certificados SSL/TLS

- **Necessário**: Certificados válidos para todos os domínios
- **Provedor**: Let's Encrypt (gratuito) via Certbot ou ACM (AWS)
- **Auto-renovação**: Configurar renovação automática

### Firewall e Network Security

- **Backend**: Apenas portas 80 (HTTP) e 443 (HTTPS) expostas publicamente
- **Database**: Acesso apenas via VPC privada (não expor porta 5432)
- **Object Storage**: CORS configurado para domínios específicos
- **Rate Limiting**: Implementar limitação de taxa no load balancer (ex: 100 req/min por IP)

### Variáveis de Ambiente Sensíveis

**Gerenciar via Secret Manager:**
- `DATABASE_PASSWORD`
- `JWT_SECRET`
- `DEEPGRAM_API_KEY`
- `DEEPGRAM_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Provedores:**
- AWS Secrets Manager
- Google Cloud Secret Manager
- Azure Key Vault
- HashiCorp Vault

### Compliance (Dados Médicos - TQ App)

⚠️ **ATENÇÃO**: TQ App lida com dados médicos (transcrições de consultas)

- **LGPD (Brasil)**: Implementar políticas de privacidade, consentimento, direito ao esquecimento
- **HIPAA (se expandir para EUA)**: Requer infraestrutura compliance (AWS HIPAA eligible, Google Cloud Healthcare API)
- **Criptografia**: Dados em repouso (database encryption) e em trânsito (TLS)
- **Audit Logs**: Registrar acesso a dados sensíveis (já implementado via `application_access_logs`)

---

## 🌍 Integração com APIs Externas

### 1. Deepgram (Transcrição de Áudio)

**Requisitos:**
- **Webhook público**: Deepgram envia callbacks para `https://seu-dominio.com/api/tq/v1/transcription/webhook`
- **Domínio válido**: IP público NÃO funciona, precisa ser HTTPS com domínio
- **Firewall**: Whitelist de IPs do Deepgram (se disponível)
- **Retry logic**: Implementar retry caso webhook falhe

**Custo Estimado:**
- ~$0.0125/min de áudio (modelo base)
- 10,000 sessões × 10 min/sessão = 100,000 min × $0.0125 = **~$1,250/mês**

### 2. OpenAI (Geração de Summaries)

**Requisitos:**
- **API Key**: Gerenciar via Secret Manager
- **Rate Limits**: Monitorar limites de requisições (Tier 1: 500 req/min)
- **Fallback**: Implementar retry com backoff exponencial

**Custo Estimado:**
- GPT-4o-mini: ~$0.00015/1K tokens (input), ~$0.0006/1K tokens (output)
- Prompt médio: 2K tokens input + 500 tokens output = ~$0.0006/summary
- 10,000 summaries/mês = **~$6/mês**

### 3. Supabase Storage (Atual)

**Se manter:**
- **Upgrade para plano pago**: Free tier limita a 1 GB storage
- **Pricing**: ~$0.021/GB/mês + $0.09/GB bandwidth
- **Alternativa**: Migrar para S3/GCS (custo similar, mais controle)

---

## 🚀 Opções de Deployment

### Opção 1: AWS (Amazon Web Services)

**Serviços Recomendados:**
- **Compute**: EC2 (t3.medium × 2) ou ECS Fargate (containerizado)
- **Database**: RDS PostgreSQL (db.t3.medium, Multi-AZ)
- **Storage**: S3 (Standard tier)
- **CDN**: CloudFront
- **Load Balancer**: Application Load Balancer (ALB)
- **DNS**: Route 53
- **Secrets**: Secrets Manager
- **Monitoring**: CloudWatch

**Custo Estimado Mensal:**
- EC2 (2× t3.medium): ~$60
- RDS PostgreSQL (db.t3.medium, Multi-AZ): ~$120
- S3 (200 GB): ~$5
- CloudFront (1 TB bandwidth): ~$85
- ALB: ~$25
- **Total**: **~$300-400/mês** (sem APIs externas)

**Prós:**
- ✅ Ecossistema completo e maduro
- ✅ Documentação extensa
- ✅ HIPAA compliance disponível
- ✅ Melhor para escala global

**Contras:**
- ❌ Curva de aprendizado íngreme
- ❌ Custo pode crescer rapidamente
- ❌ Suporte pago para produção

---

### Opção 2: Google Cloud Platform (GCP)

**Serviços Recomendados:**
- **Compute**: Cloud Run (serverless) ou GKE (Kubernetes)
- **Database**: Cloud SQL PostgreSQL (db-custom-2-4096, HA)
- **Storage**: Cloud Storage (Standard)
- **CDN**: Cloud CDN
- **Load Balancer**: Cloud Load Balancing
- **DNS**: Cloud DNS
- **Secrets**: Secret Manager
- **Monitoring**: Cloud Monitoring (Stackdriver)

**Custo Estimado Mensal:**
- Cloud Run (2 services): ~$50
- Cloud SQL (HA): ~$100
- Cloud Storage (200 GB): ~$5
- Cloud CDN (1 TB): ~$80
- **Total**: **~$250-350/mês**

**Prós:**
- ✅ Pricing competitivo
- ✅ Cloud Run (serverless) simplifica deployment
- ✅ Integração com BigQuery para analytics
- ✅ Suporte bom para machine learning (futuro)

**Contras:**
- ❌ Ecossistema menor que AWS
- ❌ Documentação às vezes menos completa

---

### Opção 3: Microsoft Azure

**Serviços Recomendados:**
- **Compute**: Azure App Service (P1v2 × 2)
- **Database**: Azure Database for PostgreSQL (General Purpose, 2 vCores)
- **Storage**: Azure Blob Storage (Hot tier)
- **CDN**: Azure CDN
- **Load Balancer**: Azure Load Balancer
- **DNS**: Azure DNS
- **Secrets**: Azure Key Vault
- **Monitoring**: Azure Monitor

**Custo Estimado Mensal:**
- App Service (2× P1v2): ~$140
- PostgreSQL (2 vCores, HA): ~$110
- Blob Storage (200 GB): ~$5
- Azure CDN (1 TB): ~$80
- **Total**: **~$350-450/mês**

**Prós:**
- ✅ Boa integração com Microsoft ecosystem
- ✅ Forte presença no Brasil
- ✅ Suporte empresarial excelente

**Contras:**
- ❌ Custo geralmente mais alto
- ❌ UI/UX do portal pode ser confusa

---

### Opção 4: DigitalOcean (Simplicidade + Custo)

**Serviços Recomendados:**
- **Compute**: Droplets (2× Basic, 2 vCPU / 4 GB RAM)
- **Database**: Managed PostgreSQL (2 vCPU / 4 GB RAM)
- **Storage**: Spaces (S3-compatible)
- **CDN**: Spaces CDN (incluído)
- **Load Balancer**: DigitalOcean Load Balancer
- **DNS**: DigitalOcean DNS (gratuito)
- **Monitoring**: Built-in monitoring

**Custo Estimado Mensal:**
- Droplets (2× $24): ~$48
- Managed PostgreSQL (Standby): ~$60
- Spaces (250 GB): ~$5
- Load Balancer: ~$12
- **Total**: **~$125-150/mês**

**Prós:**
- ✅ **Custo muito competitivo**
- ✅ UI/UX simples e intuitiva
- ✅ Documentação excelente para iniciantes
- ✅ Suporte via tickets (planos pagos)
- ✅ Ideal para startups

**Contras:**
- ❌ Menos serviços que AWS/GCP/Azure
- ❌ Escalabilidade limitada para cenários enterprise
- ❌ Sem compliance HIPAA/SOC2 nativo

---

### Opção 5: Vercel + Supabase (Serverless/JAMstack)

**Serviços Recomendados:**
- **Frontend**: Vercel (Next.js ou static)
- **Backend**: Vercel Serverless Functions OU manter EC2/Droplet separado
- **Database**: Supabase (Managed PostgreSQL)
- **Storage**: Supabase Storage
- **CDN**: Vercel Edge Network (incluído)

**Custo Estimado Mensal:**
- Vercel Pro: ~$20
- Supabase Pro: ~$25 (inclui 8 GB database, 100 GB storage)
- Backend separado (Droplet): ~$24
- **Total**: **~$70-100/mês**

**Prós:**
- ✅ **Custo muito baixo**
- ✅ Deploy simplificado (git push)
- ✅ CDN global automático
- ✅ Ideal para MVP/early stage

**Contras:**
- ❌ Vercel Serverless Functions limitado (10s timeout)
- ❌ Supabase: menos controle que database self-managed
- ❌ Não recomendado para compliance HIPAA

---

## 📊 Comparação de Provedores

| Critério | AWS | GCP | Azure | DigitalOcean | Vercel+Supabase |
|----------|-----|-----|-------|--------------|-----------------|
| **Custo Mensal** | $300-400 | $250-350 | $350-450 | $125-150 | $70-100 |
| **Facilidade de Setup** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Escalabilidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Compliance (HIPAA)** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Suporte** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Documentação** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Presença Brasil** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

---

## 🎯 Recomendação por Estágio

### 🧪 MVP / Testes com Usuários (Atual)

**Recomendação: DigitalOcean**

**Setup:**
- 2× Droplets (Backend API)
- 1× Managed PostgreSQL (Standby)
- 1× Spaces + CDN (Storage)
- 1× Load Balancer

**Custo**: ~$150/mês + APIs externas (~$1,300/mês)

**Vantagens:**
- Setup rápido (1-2 dias)
- Custo previsível
- Fácil de gerenciar
- Suficiente para 50-100 tenants

---

### 🚀 Lançamento / Primeiros Clientes (3-6 meses)

**Recomendação: AWS ou GCP**

**Setup:**
- ECS Fargate (AWS) ou Cloud Run (GCP)
- RDS/Cloud SQL (HA)
- S3/Cloud Storage + CloudFront/Cloud CDN
- Auto-scaling configurado

**Custo**: ~$300-400/mês + APIs externas

**Vantagens:**
- Auto-scaling para picos de uso
- Alta disponibilidade (99.95%+)
- Backup automatizado
- Compliance ready (HIPAA se necessário)

---

### 🏢 Escala Empresarial (1+ ano)

**Recomendação: AWS (líder de mercado)**

**Setup:**
- Multi-region deployment (Brasil + EUA/Europa)
- Kubernetes (EKS) para orquestração
- Aurora PostgreSQL (serverless v2)
- CloudFront com edge caching
- WAF para segurança
- Monitoring avançado (Datadog, New Relic)

**Custo**: $1,000+/mês (varia com uso)

---

## 🛠️ Checklist de Deploy em Produção

### Pré-Deploy

- [ ] Registrar domínio(s) (ex: `simplia.com.br`, `app.simplia.com.br`)
- [ ] Configurar DNS (apontar para load balancer)
- [ ] Obter certificados SSL/TLS (Let's Encrypt ou ACM)
- [ ] Criar accounts nos provedores escolhidos (Cloud, Deepgram, OpenAI)
- [ ] Configurar CI/CD pipeline (GitHub Actions, GitLab CI)

### Infraestrutura

- [ ] Provisionar compute instances (mínimo 2 para HA)
- [ ] Configurar load balancer com health checks
- [ ] Provisionar PostgreSQL managed database (HA habilitado)
- [ ] Configurar backups automáticos (diários, retenção 7+ dias)
- [ ] Configurar object storage (buckets públicos + privados)
- [ ] Configurar VPC/firewall (database acessível apenas via VPC privada)
- [ ] Configurar Secret Manager para variáveis sensíveis

### Aplicação

- [ ] Build frontend assets (`npm run build`)
- [ ] Deploy frontend para CDN/static hosting
- [ ] Deploy backend APIs (PM2 ou container orchestration)
- [ ] Rodar migrations (`npm run migrate`)
- [ ] Seed database inicial (tenants demo, aplicações padrão)
- [ ] Testar health endpoints (`/health`)
- [ ] Configurar logs centralizados (CloudWatch, Stackdriver)

### Segurança

- [ ] Habilitar SSL/TLS em todos os domínios
- [ ] Configurar CORS adequadamente (domínios específicos, não `*`)
- [ ] Implementar rate limiting (100-500 req/min por IP)
- [ ] Configurar WAF (Web Application Firewall) se disponível
- [ ] Testar vulnerabilidades (OWASP Top 10)
- [ ] Documentar políticas de privacidade (LGPD)

### Monitoring

- [ ] Configurar alertas de uptime (UptimeRobot, Pingdom)
- [ ] Configurar alertas de erro (>5% error rate)
- [ ] Configurar alertas de performance (API latency >500ms)
- [ ] Monitorar uso de recursos (CPU >80%, Memory >90%)
- [ ] Dashboard de métricas (requisições, erros, latência)

### APIs Externas

- [ ] Testar webhooks do Deepgram em produção
- [ ] Configurar retry logic para APIs externas
- [ ] Monitorar custos de APIs (Deepgram, OpenAI)
- [ ] Implementar fallback para falhas de API

### Testes Finais

- [ ] Smoke tests em produção (cadastro, login, navegação)
- [ ] Teste de carga (LoadView, k6.io) - 100 usuários simultâneos
- [ ] Teste de failover (desligar 1 instância, sistema continua)
- [ ] Teste de backup/restore (restaurar snapshot do database)
- [ ] Validar timezones (Brasil -3, Austrália +10)
- [ ] Validar internacionalização (pt-BR, en-US)

---

## 📈 Custos Totais Estimados (Primeiro Ano)

### Cenário: 100 Tenants, 10,000 Sessões/Mês

**Infraestrutura (DigitalOcean - MVP):**
- Compute + Database + Storage: **$150/mês** → $1,800/ano

**APIs Externas:**
- Deepgram (transcrições): **$1,250/mês** → $15,000/ano
- OpenAI (summaries): **$6/mês** → $72/ano

**Outros:**
- Domínios: $20/ano
- Monitoramento (UptimeRobot Pro): $10/mês → $120/ano
- Backups offsite: $20/mês → $240/ano

**Total Primeiro Ano**: **~$17,250** (~R$ 86,000 @ R$5.00/USD)

---

### Cenário: 500 Tenants, 50,000 Sessões/Mês

**Infraestrutura (AWS/GCP - Escala):**
- Compute + Database + Storage: **$400/mês** → $4,800/ano

**APIs Externas:**
- Deepgram: **$6,250/mês** → $75,000/ano
- OpenAI: **$30/mês** → $360/ano

**Total Primeiro Ano**: **~$80,000** (~R$ 400,000 @ R$5.00/USD)

---

## 📞 Próximos Passos

1. **Definir budget mensal** para infraestrutura + APIs
2. **Escolher provedor cloud** baseado em orçamento e expertise
3. **Criar conta trial** no provedor escolhido (AWS/GCP/Azure/DO)
4. **Registrar domínio** (recomendado: `.com.br` para Brasil)
5. **Setup CI/CD pipeline** (GitHub Actions recomendado)
6. **Provisionar ambiente staging** (réplica de produção para testes)
7. **Executar deploy piloto** com 5-10 usuários beta
8. **Iterar baseado em feedback** (performance, bugs, UX)
9. **Lançamento público** após validação

---

## 📚 Recursos Adicionais

### Documentação dos Provedores

- **AWS**: https://aws.amazon.com/getting-started/
- **GCP**: https://cloud.google.com/docs
- **Azure**: https://learn.microsoft.com/azure
- **DigitalOcean**: https://docs.digitalocean.com/

### Ferramentas de Monitoramento

- **UptimeRobot**: https://uptimerobot.com (uptime monitoring)
- **Datadog**: https://www.datadoghq.com (APM completo)
- **Sentry**: https://sentry.io (error tracking)

### Compliance & Segurança

- **LGPD**: https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/

---

**Documento gerado em**: 2025-10-15
**Versão**: 1.0
**Contato**: Atualizar conforme necessário
