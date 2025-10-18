# 🚀 Guia de Deploy no Railway

## ✅ O que já foi configurado no código

1. Scripts de build para todos os frontends (package.json)
2. Express configurado para servir arquivos estáticos em produção
3. Vite configs com base path correto (/admin, /hub, /tq)
4. Variáveis de ambiente preparadas

---

## 📋 Passo a Passo para Deploy

### FASE 1: Configurar o Railway

#### 1. Criar Serviço

Acesse railway.app e vá no seu projeto:
- New → GitHub Repo → Selecione seu repositório simplia-paas
- Nome do serviço: **"simplia-api"**

#### 2. Configurar Build Settings

```
Build Command: npm run build
Start Command: npm run start:production
Root Directory: / (deixe vazio)
```

#### 3. Adicionar Variáveis de Ambiente

Vá em "Variables" tab → "Raw Editor" → Cole o JSON abaixo:

**⚠️ IMPORTANTE:** Substitua os placeholders `YOUR_*_HERE` pelas suas chaves reais do arquivo `.env` local!

```json
{
  "DATABASE_URL": "postgresql://postgres:vTclcujiOQzszHTKrcFpQGMGjZceMyKo@ballast.proxy.rlwy.net:36685/railway",
  "DATABASE_HOST": "ballast.proxy.rlwy.net",
  "DATABASE_PORT": "36685",
  "DATABASE_NAME": "railway",
  "DATABASE_USER": "postgres",
  "DATABASE_PASSWORD": "vTclcujiOQzszHTKrcFpQGMGjZceMyKo",
  "PORT": "3001",
  "NODE_ENV": "production",
  "JWT_SECRET": "be1ec376a3c7f3b238a713302faf9f63ddd82e51ba34c829a6625103b793a09f899035474ab8fceec96a33ae1b24967f5bd838e8760f9cc6b540ad57dc1ade2b",
  "JWT_EXPIRES_IN": "24h",
  "BCRYPT_SALT_ROUNDS": "10",
  "DEFAULT_TENANT": "default",
  "TENANT_HEADER_NAME": "x-tenant-id",
  "INTERNAL_API_PREFIX": "/internal/api/v1",
  "ENABLE_INTERNAL_DOCS": "true",
  "INTERNAL_DOCS_PATH": "/docs/internal",
  "ADMIN_PANEL_ORIGIN": "https://simplia-paas-production.up.railway.app",
  "HUB_ORIGIN": "https://simplia-paas-production.up.railway.app",
  "TQ_ORIGIN": "https://simplia-paas-production.up.railway.app",
  "VITE_API_BASE_URL": "https://simplia-paas-production.up.railway.app",
  "ENABLE_HELMET": "true",
  "DEEPGRAM_API_KEY": "YOUR_DEEPGRAM_API_KEY_HERE",
  "DEEPGRAM_WEBHOOK_SECRET": "YOUR_WEBHOOK_SECRET_HERE",
  "API_BASE_URL": "https://simplia-paas-production.up.railway.app",
  "SUPABASE_URL": "YOUR_SUPABASE_URL_HERE",
  "SUPABASE_ANON_KEY": "YOUR_SUPABASE_ANON_KEY_HERE",
  "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE",
  "SUPABASE_STORAGE_PUBLIC_URL": "YOUR_SUPABASE_STORAGE_PUBLIC_URL_HERE",
  "OPENAI_API_KEY": "YOUR_OPENAI_API_KEY_HERE",
  "OPENAI_MODEL": "gpt-4o-mini"
}
```

#### 4. Obter URL do Railway

- Vá em "Settings" tab → "Domains"
- Copie a URL gerada (ex: `simplia-api-production.up.railway.app`)

#### 5. ATUALIZAR Variáveis com URL Real

Volte em "Variables" e substitua **TODOS** os `simplia-paas-production.up.railway.app` pela URL real do passo anterior.

**Variáveis a atualizar:**
- `ADMIN_PANEL_ORIGIN`
- `HUB_ORIGIN`
- `TQ_ORIGIN`
- `VITE_API_BASE_URL`
- `API_BASE_URL`

#### 6. Fazer Deploy

- Clique em "Deploy" ou faça push no GitHub
- Aguarde o build terminar (~5-10 minutos na primeira vez)

---

## 🔍 Testar o Deploy

Acesse as URLs (substitua `sua-url` pela URL real do Railway):

```
✅ API Health Check:
https://sua-url.up.railway.app/health

✅ Internal-Admin:
https://sua-url.up.railway.app/admin

✅ Hub:
https://sua-url.up.railway.app/hub

✅ TQ:
https://sua-url.up.railway.app/tq

✅ API Docs:
https://sua-url.up.railway.app/docs/internal
```

---

## 🌐 FASE 2: Subdomínios Customizados (simplialabs.co)

### 1. Adicionar Domínios no Railway

Settings → Domains → Adicione:
- `internal.simplialabs.co`
- `hub.simplialabs.co`
- `tq.simplialabs.co`

Railway vai mostrar os registros CNAME necessários.

### 2. Configurar DNS

No seu provedor de DNS (onde comprou simplialabs.co):

```
Type    Name        Value
────────────────────────────────────────────
CNAME   internal    sua-url.up.railway.app
CNAME   hub         sua-url.up.railway.app
CNAME   tq          sua-url.up.railway.app
```

### 3. Aguardar Propagação DNS

Pode levar de 5 minutos a 1 hora.

### 4. Atualizar Variáveis de Ambiente

Depois que os domínios estiverem funcionando, atualize:

```json
{
  "ADMIN_PANEL_ORIGIN": "https://internal.simplialabs.co",
  "HUB_ORIGIN": "https://hub.simplialabs.co",
  "TQ_ORIGIN": "https://tq.simplialabs.co",
  "VITE_API_BASE_URL": "https://internal.simplialabs.co",
  "API_BASE_URL": "https://tq.simplialabs.co"
}
```

### 5. Modificar Express para Subdomínios

**⚠️ IMPORTANTE:** Com subdomínios, você precisa atualizar `src/server/app.js` para rotear baseado no hostname:

```javascript
// Substituir a seção de static serving por:
if (isProduction) {
  const hostname = req.hostname;

  if (hostname === 'internal.simplialabs.co') {
    // Servir internal-admin na raiz
    app.use('/', express.static(pathModule.join(__dirname, '../../dist/client')));
    app.get('/*', (req, res) => {
      res.sendFile(pathModule.join(__dirname, '../../dist/client/index.html'));
    });
  } else if (hostname === 'hub.simplialabs.co') {
    // Servir hub na raiz
    app.use('/', express.static(pathModule.join(__dirname, '../../dist/hub')));
    app.get('/*', (req, res) => {
      res.sendFile(pathModule.join(__dirname, '../../dist/hub/index.html'));
    });
  } else if (hostname === 'tq.simplialabs.co') {
    // Servir TQ na raiz
    app.use('/', express.static(pathModule.join(__dirname, '../../dist/tq')));
    app.get('/*', (req, res) => {
      res.sendFile(pathModule.join(__dirname, '../../dist/tq/index.html'));
    });
  }
}
```

**NÃO FAÇA ISSO AGORA!** Apenas depois que testar com a URL básica do Railway.

---

## 🐛 Troubleshooting

### Build Falhou
- Verifique os logs no Railway
- Certifique-se que `NODE_ENV=production` está configurado
- Verifique se todas as dependências estão no package.json

### Página em Branco
- Abra DevTools (F12) e veja erros no console
- Verifique se `VITE_API_BASE_URL` está correto
- Verifique se os arquivos estão em `dist/client`, `dist/hub`, `dist/tq`

### Erro 404 nas APIs
- Verifique CORS no app.js (origins)
- Verifique se as rotas estão montadas corretamente

### Erro de Banco de Dados
- Verifique se `DATABASE_URL` está correto
- Teste conexão: `railway run npm run migrate`

---

## 📊 Estrutura Final

```
Railway Service: simplia-api
│
├── PostgreSQL (já configurado)
│   ├── Schema: public (core tables)
│   ├── Schema: tenant_acme_clinic
│   └── Schema: tenant_artsmiles_dental
│
└── Node.js Server (porta 3001)
    ├── APIs:
    │   ├── /internal/api/v1/*     (Internal-Admin API)
    │   └── /api/tq/v1/*           (TQ API)
    │
    └── Frontends (builds estáticos):
        ├── /admin/*               (Internal-Admin)
        ├── /hub/*                 (Hub)
        └── /tq/*                  (TQ)
```

---

## ✅ Checklist

- [ ] Criar serviço no Railway
- [ ] Configurar build/start commands
- [ ] Adicionar variáveis de ambiente
- [ ] Obter URL do Railway e atualizar variáveis
- [ ] Fazer deploy
- [ ] Testar /health
- [ ] Testar /admin
- [ ] Testar /hub
- [ ] Testar /tq
- [ ] Configurar domínios customizados (opcional)
- [ ] Atualizar DNS (opcional)
- [ ] Atualizar variáveis com domínios customizados (opcional)
- [ ] Modificar Express para subdomínios (opcional)

---

## 🎯 Resultado Final Esperado

### Com URL do Railway (AGORA)
```
https://sua-url.up.railway.app/admin    → Internal-Admin
https://sua-url.up.railway.app/hub      → Hub
https://sua-url.up.railway.app/tq       → TQ
```

### Com Domínios Customizados (DEPOIS)
```
https://internal.simplialabs.co         → Internal-Admin
https://hub.simplialabs.co              → Hub
https://tq.simplialabs.co               → TQ
```

---

**Criado em:** 2025-10-18
**Última atualização:** 2025-10-18
