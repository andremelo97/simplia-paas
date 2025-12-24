# Simplia PaaS Internal API Documentation

**Docs: Multi-Tenancy Híbrido (Global vs Tenant-Scoped) — Setembro/2025**

**Version**: 1.2.0  
**Base URL**: `http://localhost:3001/internal/api/v1`  
**Documentation**: `http://localhost:3001/docs/internal` (Swagger UI - Platform Admin Only)

## Overview

A Simplia Internal API é uma API RESTful completa para administração da plataforma SaaS multi-tenant. Projetada para equipes internas da Simplia e administradores de tenant, oferece gerenciamento completo de usuários, aplicações, licenças, preços e auditoria.

## Categorias de Escopo

- **Global (Platform/Admin)** *(tag: `global`)*  
  Visão cross-tenant. Não utiliza `x-tenant-id`. Opera sobre o core em `public`.
- **Tenant-Scoped (Hub/Apps)** *(tag: `tenant`)*  
  Isolado por tenant. Requer `x-tenant-id`. Pode aplicar `search_path` no backend.

### Tabela de Referência Rápida
| Tag    | Exemplos de Endpoints                                  | Headers                           |
|--------|--------------------------------------------------------|-----------------------------------|
| global | `/platform-auth/*`, `/metrics/overview`, `/tenants/*`, `/applications/*`, `/audit/*` | `Authorization`                   |
| tenant | `/auth/*`, `/users/*`, `/users/:id/apps/*`, `/entitlements/*`         | `Authorization`, `x-tenant-id`    |

## 🔐 Autenticação e Autorização

### Sistema de Autenticação Dual

#### 1. **Platform Authentication** (Equipe Simplia)
- **Endpoint**: `POST /internal/api/v1/platform-auth/login`
- **Escopo**: Global, sem contexto de tenant
- **Privilégio**: `platform_role: internal_admin`
- **Uso**: Administração da plataforma, gestão de tenants, aplicações globais

#### 2. **Tenant Authentication** (Administradores de Tenant)
- **Endpoint**: `POST /internal/api/v1/auth/login`
- **Escopo**: Limitado ao tenant específico
- **Header Obrigatório**: `x-tenant-id`
- **Uso**: Gerenciamento dentro do tenant (usuários, licenças)

> **🔧 Bug Fix (Janeiro 2025)**: Corrigido acesso ao tenant context na rota `/auth/login`. O middleware de tenant agora é acessado via `req.tenant.id` em vez de `req.tenantId` diretamente. Esta correção resolve falhas de autenticação no Hub e garante que o contexto do tenant seja passado corretamente para o `authService.login()`.

### Hierarquia de Roles

#### Platform Roles
- `internal_admin`: Acesso total à plataforma (equipe Simplia)

#### Tenant Roles (em ordem hierárquica)
- `admin`: Administração completa do tenant
- `manager`: Gerenciamento de usuários e visualização de licenças
- `operations`: Operações básicas

### Headers de Autenticação

```bash
# Platform Admin
Authorization: Bearer <jwt_token>

# Tenant Admin
Authorization: Bearer <jwt_token>
x-tenant-id: <tenant_id_numeric>
```

## 🏢 Multi-tenancy

### Identificação de Tenants
- **ID Numérico**: Fonte da verdade (`tenant_id_fk`)
- **Slug**: Identificador amigável para URLs (`subdomain`)
- **Header**: `x-tenant-id` aceita ambos (numérico preferível)

### Isolamento de Dados
- **Schema-per-tenant**: PostgreSQL schemas isolados
- **Switching automático**: `SET search_path TO tenant_schema, public`
- **Timezone por tenant**: `SET LOCAL TIME ZONE` aplicado por transação para operações tenant-scoped
- **Validação**: Application-level para consistência de dados

## 📊 Rate Limiting

- **Authentication**: 10 requests/15min
- **General API**: 100 requests/15min
- **IP + User based**: Rastreamento por IP e usuário autenticado

## 🔄 AppFeedback System

Sistema de notificações padronizadas para operações bem-sucedidas:

```json
{
  "meta": {
    "code": "TENANT_CREATED",
    "message": "Tenant criado com sucesso"
  },
  "data": { ... }
}
```

**Códigos Principais**:
- `TENANT_CREATED`, `TENANT_UPDATED`, `TENANT_DELETED`
- `USER_CREATED`, `USER_UPDATED`, `USER_DEACTIVATED`
- `LICENSE_ACTIVATED`, `LICENSE_ADJUSTED`
- `PRICING_CREATED`, `PRICING_UPDATED`
- `BRANDING_UPDATED`, `BRANDING_RESET`, `LOGO_UPLOADED`, `FAVICON_UPLOADED`, `VIDEO_UPLOADED`

---

# 📚 API Endpoints Reference

## 🔍 1. Audit & Security

**Tag:** `global`

> **Acesso**: Platform Admin (`internal_admin`) apenas

### GET `/audit/access-logs`
Lista logs de acesso com filtros avançados.

**Headers:**
- `Authorization: Bearer <jwt>`

**Parâmetros**:
- `tenantId`, `applicationSlug`, `decision`, `userId`
- `ipAddress`, `startDate`, `endDate`
- `limit`, `offset`, `sortBy`, `sortOrder`

**Resposta**:
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "pagination": {...},
    "summary": {
      "totalLogs": 1250,
      "granted": 1180,
      "denied": 70
    }
  }
}
```

### GET `/audit/access-summary`
Estatísticas agregadas de acessos.

**Parâmetros**: `period`, `tenantId`, `startDate`, `endDate`

### GET `/audit/security-alerts`
Alertas de segurança e anomalias.

**Parâmetros**: `severity`, `hours`, `limit`

---

## 📊 2. Platform Metrics

**Tag:** `global`

> **Acesso**: Platform Admin (`internal_admin`) apenas

### GET `/metrics/overview`
Retorna métricas agregadas da plataforma para dashboard administrativo.

**Headers:**
- `Authorization: Bearer <jwt>`

**Resposta 200**:
```json
{
  "success": true,
  "data": {
    "tenants": {
      "total": 45,
      "newThisWeek": 3,
      "newThisMonth": 8
    },
    "users": {
      "total": 234,
      "newThisWeek": 12,
      "newThisMonth": 35
    },
    "applications": {
      "active": 4
    },
    "licenses": {
      "active": 67
    }
  },
  "meta": {
    "cachedAt": "2025-01-10T15:30:00Z",
    "executionTime": "45ms"
  }
}
```

**Cache**: 60 segundos TTL para otimizar performance  
**Performance**: Queries executadas em paralelo com índices otimizados

---

## 🔑 3. Platform Authentication

**Tag:** `global`

> **Escopo**: Global (sem tenant context)

### Rate Limiting (Configurável via ENV)
- **Variáveis**: `PLATFORM_LOGIN_MAX` (default: 10), `PLATFORM_LOGIN_WINDOW_MS` (default: 900000)
- **Rate Limit**: 10 requests por 15 minutos (padrão)

### POST `/platform-auth/login`
Login para equipe Simplia.

**Headers:**
- `Content-Type: application/json`

**Body**:
```json
{
  "email": "admin@simplia.com",
  "password": "secure_password"
}
```

**Resposta de Sucesso**:
```json
{
  "meta": {
    "code": "LOGIN_SUCCESS",
    "message": "Signed in successfully."
  },
  "data": {
    "token": "jwt_token_here",
    "user": {
      "userId": 1,
      "email": "admin@simplia.com",
      "platformRole": "internal_admin"
    },
    "expiresIn": "24h"
  }
}
```

**Efeitos Colaterais**:
- Atualiza `users.last_login` para o usuário autenticado
- Cria registro de auditoria em `platform_login_audit` com sucesso

**Códigos de Erro**:
| Status | Código | Descrição |
|--------|--------|-----------|
| 400 | `LOGIN_MISSING_CREDENTIALS` | Email/password ausentes |
| 401 | `INVALID_CREDENTIALS` | Credenciais inválidas |
| 403 | `PLATFORM_ROLE_REQUIRED` | Não possui platform_role = 'internal_admin' |
| 403 | `ACCOUNT_INACTIVE` | Conta inativa/suspensa |
| 429 | `RATE_LIMITED` | Excedeu limite de tentativas |

**Exemplo de Erro**:
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid email or password",
  "meta": { "code": "INVALID_CREDENTIALS" }
}
```

### GET `/platform-auth/me`
Perfil do admin da plataforma.

### POST `/platform-auth/refresh`
Renovar token JWT.

### POST `/platform-auth/logout`
Logout da plataforma.

### POST `/platform-auth/forgot-password`
Recuperação de senha para usuários Hub/TQ.

**Headers:**
- `Content-Type: application/json`

**Body**:
```json
{
  "email": "user@company.com"
}
```

**Resposta de Sucesso** (sempre 200 por segurança):
```json
{
  "success": true,
  "meta": {
    "code": "PASSWORD_RESET_SENT",
    "message": "If an account exists with this email, a new password has been sent."
  }
}
```

**Comportamento**:
- Gera nova senha aleatória de 12 caracteres
- Atualiza senha do usuário no banco de dados
- Envia email bilíngue (PT-BR + EN-US) com a nova senha
- **Segurança**: Sempre retorna sucesso para prevenir enumeração de emails
- **SMTP**: Usa configuração LivoCare.ai (`DEFAULT_SMTP_*` env vars)

**Email enviado**:
- **From**: `"LivoCare.ai" <noreply@livocare.ai>`
- **Subject**: `Sua nova senha / Your new password - LivoCare`
- **Conteúdo**: Bilíngue com instruções para trocar senha após login
- **Footer**: Slogan "Where care meets conversion | Onde cuidado encontra conversão" + link www.livocare.ai

**Códigos de Erro**:
| Status | Código | Descrição |
|--------|--------|-----------|
| 400 | `EMAIL_REQUIRED` | Email não informado |
| 429 | `RATE_LIMITED` | Excedeu limite de tentativas |

### Auditoria de Platform Login
Todos os acessos (sucessos e falhas) são registrados em `platform_login_audit` com:
- `user_id_fk` (se usuário válido), `email`, `ip_address`, `user_agent`
- `success` (true/false), `reason` (detalhes da falha), `created_at`

---

## 🏢 4. Tenant Management

> **Acesso**: Platform Admin apenas

### GET `/tenants`
Lista tenants com métricas operacionais.

**Parâmetros**: `status`, `limit`, `offset`, `search`

**Resposta**:
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": 1,
        "name": "Clínica Example",
        "subdomain": "example",
        "status": "active",
        "metrics": {
          "totalUsers": 25,
          "activeLicenses": 3
        }
      }
    ],
    "pagination": {...}
  }
}
```

### POST `/tenants`
Criar novo tenant.

**Body**:
```json
{
  "name": "Nova Clínica",
  "subdomain": "nova-clinica",
  "timezone": "America/Sao_Paulo",
  "status": "active"
}
```

**Campos obrigatórios**: `name`, `subdomain`, `timezone`
**Nota**: `timezone` deve ser um identificador IANA válido e não pode ser alterado após criação.

### PUT `/tenants/:id`
Atualizar tenant.

**Nota**: O campo `timezone` não pode ser incluído em operações de atualização.

### DELETE `/tenants/:id`
Desativar tenant (soft delete).

### **Addresses** (4 endpoints)

### GET `/tenants/:id/addresses`
Lista endereços do tenant com opções de filtro.

**Parâmetros Query**:
- `type` (string, opcional): Filtrar por tipo (`HQ`, `BILLING`, `SHIPPING`, `BRANCH`, `OTHER`)
- `active` (boolean, opcional): Filtrar endereços ativos/inativos
- `limit` (number, opcional): Limite de resultados (padrão: 20)
- `offset` (number, opcional): Paginação (padrão: 0)

**Resposta 200**:
```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "id": 1,
        "tenantId": 123,
        "type": "HQ",
        "label": "Sede Principal",
        "line1": "Rua das Flores, 123",
        "line2": "Sala 456",
        "city": "São Paulo",
        "state": "SP",
        "postalCode": "01234-567",
        "countryCode": "BR",
        "isPrimary": true,
        "active": true,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### POST `/tenants/:id/addresses`
Adiciona novo endereço ao tenant.

**Body**:
```json
{
  "type": "HQ",
  "label": "Sede Principal",
  "line1": "Rua das Flores, 123",
  "line2": "Sala 456",
  "city": "São Paulo",
  "state": "SP",
  "postalCode": "01234-567",
  "countryCode": "BR",
  "isPrimary": true
}
```

**Resposta 201**:
```json
{
  "success": true,
  "meta": {
    "code": "ADDRESS_CREATED",
    "message": "Address added successfully."
  },
  "data": {
    "address": {
      "id": 2,
      "tenantId": 123,
      "type": "HQ",
      "label": "Sede Principal",
      "line1": "Rua das Flores, 123",
      "line2": "Sala 456",
      "city": "São Paulo",
      "state": "SP",
      "postalCode": "01234-567",
      "countryCode": "BR",
      "isPrimary": true,
      "active": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Erros**:
- `400`: Dados de entrada inválidos
- `409`: Conflito de endereço primário (já existe um primário do mesmo tipo)

### PUT `/tenants/:id/addresses/:addressId`
Atualiza endereço existente.

**Body**: Mesmos campos do POST (todos opcionais)

**Resposta 200**: 
```json
{
  "success": true,
  "meta": {
    "code": "ADDRESS_UPDATED",
    "message": "Address updated successfully."
  },
  "data": {
    "address": { /* endereço atualizado */ }
  }
}
```

### DELETE `/tenants/:id/addresses/:addressId`
Remove endereço (soft delete).

**Resposta 200**:
```json
{
  "success": true,
  "meta": {
    "code": "ADDRESS_DELETED",
    "message": "Address removed successfully."
  }
}
```

### **Contacts** (4 endpoints)

### GET `/tenants/:id/contacts`
Lista contatos do tenant com opções de filtro.

**Parâmetros Query**:
- `type` (string, opcional): Filtrar por tipo (`ADMIN`, `BILLING`, `TECH`, `LEGAL`, `OTHER`)
- `active` (boolean, opcional): Filtrar contatos ativos/inativos
- `limit` (number, opcional): Limite de resultados (padrão: 20)
- `offset` (number, opcional): Paginação (padrão: 0)

**Resposta 200**:
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": 1,
        "tenantId": 123,
        "type": "ADMIN",
        "fullName": "João Silva",
        "email": "joao@clinica.com",
        "phoneE164": "+5511999999999",
        "title": "Diretor",
        "department": "Administração",
        "notes": "Contato principal da empresa",
        "isPrimary": true,
        "active": true,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 3,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### POST `/tenants/:id/contacts`
Adiciona novo contato ao tenant.

**Body**:
```json
{
  "type": "ADMIN",
  "fullName": "João Silva",
  "email": "joao@clinica.com",
  "phoneE164": "+5511999999999",
  "title": "Diretor",
  "department": "Administração",
  "notes": "Contato principal da empresa",
  "isPrimary": true
}
```

**Resposta 201**:
```json
{
  "success": true,
  "meta": {
    "code": "CONTACT_CREATED",
    "message": "Contact added successfully."
  },
  "data": {
    "contact": {
      "id": 2,
      "tenantId": 123,
      "type": "ADMIN",
      "fullName": "João Silva",
      "email": "joao@clinica.com",
      "phoneE164": "+5511999999999",
      "title": "Diretor",
      "department": "Administração",
      "notes": "Contato principal da empresa",
      "isPrimary": true,
      "active": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Erros**:
- `400`: Dados de entrada inválidos (email malformado, telefone não E.164)
- `409`: Conflito de contato primário (já existe um primário do mesmo tipo)

### PUT `/tenants/:id/contacts/:contactId`
Atualiza contato existente.

**Body**: Mesmos campos do POST (todos opcionais)

**Resposta 200**:
```json
{
  "success": true,
  "meta": {
    "code": "CONTACT_UPDATED",
    "message": "Contact updated successfully."
  },
  "data": {
    "contact": { /* contato atualizado */ }
  }
}
```

### DELETE `/tenants/:id/contacts/:contactId`
Remove contato (soft delete).

**Resposta 200**:
```json
{
  "success": true,
  "meta": {
    "code": "CONTACT_DELETED",
    "message": "Contact removed successfully."
  }
}

---

## 👥 5. Tenant Users Management

> **Acesso**: Platform Admin apenas

### GET `/tenants/users`
Lista usuários globalmente com filtro opcional por tenant.

**Parâmetros**: `tenantId` (filter), `search`, `status`, `limit`, `offset`

> **Nota**: Substituiu a rota `/tenants/:tenantId/users` para consistência

### POST `/tenants/:tenantId/users`
Criar usuário diretamente em um tenant.

**Body**:
```json
{
  "email": "novo@usuario.com",
  "password": "senha_segura",
  "firstName": "João",
  "lastName": "Silva",
  "role": "admin",
  "status": "active"
}
```

### GET `/tenants/:tenantId/users/:userId`
Detalhes de usuário específico.

### PUT `/tenants/:tenantId/users/:userId`
Atualizar usuário.

### DELETE `/tenants/:tenantId/users/:userId`
Desativar usuário.

### POST `/tenants/:tenantId/users/:userId/reset-password`
Redefinir senha do usuário.

### PUT `/tenants/:tenantId/users/:userId/applications/:appSlug/role`
Atualizar role do usuário em aplicação específica.

**Tag:** `global`
**Acesso**: Platform Admin apenas

**Body**:
```json
{
  "roleInApp": "manager"
}
```

**roleInApp**: Valores permitidos: `user`, `operations`, `manager`, `admin`

**Response (200)**:
```json
{
  "success": true,
  "meta": {
    "code": "ROLE_IN_APP_UPDATED",
    "message": "User role in application updated successfully"
  },
  "data": {
    "roleInApp": "manager",
    "userId": 123,
    "applicationSlug": "tq",
    "updatedAt": "2025-01-19T10:30:00Z"
  }
}
```

**Errors**:
- `404 USER_APP_ACCESS_NOT_FOUND`: Usuário não tem acesso à aplicação
- `422 INVALID_ROLE_IN_APP`: Role inválido
- `403 FORBIDDEN`: Sem permissão platform admin

### GET `/users`
Lista global de usuários com filtro por tenant.

**Parâmetros**: `tenantId`, `search`, `status`, `limit`, `offset`

---

## 🔐 6. Tenant Authentication

**Tag:** `tenant`

> **Escopo**: Tenant-specific (requer `x-tenant-id`)

### POST `/auth/register`
Registro de novo usuário no tenant.

**Headers:**
- `Content-Type: application/json`
- `x-tenant-id: <tenantId numérico>`

### POST `/auth/login`
Login no painel administrativo.

**Headers:**
- `Content-Type: application/json`
- `x-tenant-id: <tenantId numérico>`
**Body**:
```json
{
  "email": "admin@tenant.com",
  "password": "password"
}
```

### GET `/auth/me`
Perfil do usuário autenticado.

### PUT `/auth/change-password`
Alterar senha.

### POST `/auth/refresh`
Renovar token.

### POST `/auth/logout`
Logout.

---

## 👤 7. Users (Tenant-Scoped)

**Tag:** `tenant`

> **Escopo**: Tenant-specific  
> **Middleware**: Tenant context + Auth + Role-based

### GET `/users`
Lista usuários do tenant.

**Acesso**: Manager/Admin  
**Headers:**
- `Authorization: Bearer <jwt>`
- `x-tenant-id: <tenantId numérico>`
**Parâmetros**: `page`, `limit`, `role`, `status`

### POST `/users`
Criar usuário.

**Acesso**: Admin apenas

### GET `/users/:userId`
Detalhes do usuário.

**Acesso**: Self ou Admin

### PUT `/users/:userId`
Atualizar usuário.

### DELETE `/users/:userId`
Remover usuário.

### **User Application Access**

### GET `/users/:userId/apps`
Aplicações que o usuário tem acesso.

**Acesso**: Manager/Admin


---

## 📱 8. Applications

> **Acesso**: Platform Admin apenas

### GET `/applications`
Catálogo de aplicações.

**Parâmetros**: `status`, `limit`, `offset`


### GET `/applications/:id`
Detalhes da aplicação por ID.

### GET `/applications/slug/:slug`
Detalhes da aplicação por slug.




### GET `/tenants/{id}/applications`
Aplicações licenciadas para um tenant específico.

**Tag:** `global`

**Descrição**: Retorna SOMENTE as aplicações licenciadas para o tenant, seguindo o principle of least privilege. Substituiu o uso de `GET /tenants/{id}` que expunha dados desnecessários.

**Parâmetros de URL**:
- `id` (number): ID numérico do tenant

**Resposta**:
```json
{
  "applications": [
    {
      "slug": "tq",
      "name": "Transcription Quote",
      "status": "active",
      "userLimit": 50,
      "seatsUsed": 12,
      "expiresAt": "2025-12-31T23:59:59.000Z"
    }
  ],
  "tenantId": 1
}
```

**Exemplo de uso**:
```bash
curl -X GET \
  "http://localhost:3001/internal/api/v1/tenants/1/applications" \
  -H "Authorization: Bearer <token>"
```

### **Application Pricing**

### GET `/applications/:id/pricing`
Matriz de preços da aplicação.

**Parâmetros**: `current` (boolean)

**Resposta**:
```json
{
  "success": true,
  "data": {
    "applicationId": 1,
    "pricing": [
      {
        "id": 1,
        "userTypeId": 1,
        "userTypeName": "operations",
        "price": 35.00,
        "currency": "BRL",
        "billingCycle": "monthly",
        "validFrom": "2024-01-01T00:00:00.000Z",
        "active": true
      }
    ]
  }
}
```

### POST `/applications/:id/pricing`
Criar entrada de preço.

**Body**:
```json
{
  "userTypeId": 1,
  "price": 45.00,
  "currency": "BRL",
  "billingCycle": "monthly",
  "validFrom": "2024-01-01T00:00:00.000Z"
}
```

### PUT `/applications/:id/pricing/:pricingId`
Atualizar preço.

---

## 🎫 9. Entitlements (Licenses)

> **Escopo**: Tenant-specific  
> **Headers**: `x-tenant-id` obrigatório

### GET `/entitlements`
Licenças do tenant com usuários assignados (read-only).

**Acesso**: Manager/Admin
**Uso Principal**: Hub App para exibir licenças e usuários para admins
**Parâmetros**: `includeExpired`, `status`, `limit`, `offset`

**Resposta**:
```json
{
  "data": {
    "licenses": [
      {
        "applicationId": 1,
        "slug": "tq",
        "name": "Transcription Quote",
        "status": "active",
        "activatedAt": "2024-01-15T10:30:00Z",
        "seatsUsed": 3,
        "maxUsers": 50,
        "users": [
          {
            "email": "admin@tenant.com",
            "firstName": "John",
            "lastName": "Doe",
            "role": "admin",
            "grantedAt": "2024-01-15T14:20:00Z"
          },
          {
            "email": "manager@tenant.com",
            "firstName": "Jane",
            "lastName": "Smith",
            "role": "manager",
            "grantedAt": "2024-01-16T09:15:00Z"
          }
        ]
      }
    ],
    "summary": {
      "apps": 2,
      "seatsUsed": 5,
      "seatsLimit": 100
    }
  },
  "meta": {
    "code": "ENTITLEMENTS_RETRIEVED"
  }
}
```

**Nota sobre filtros**: A rota `/entitlements` agora suporta filtro por `applicationSlug` via query parameter (ex: `/entitlements?applicationSlug=tq`), substituindo a rota específica `/entitlements/:applicationSlug` que foi removida para evitar duplicação.

**Hub Integration**: Este endpoint é usado pelo Hub App para exibir a seção de entitlements para usuários admin, mostrando:
- Cards individuais de licença com toggle Show/Hide Users
- Tabela de usuários assignados com role badges
- Tabela resumo com seat usage e status
- Informações read-only (sem ações de modificação)

**Nota**: As operações de ativação e ajuste de licenças são feitas através das rotas global-scoped em `/tenants/:tenantId/applications/:slug/activate` e `/tenants/:tenantId/applications/:slug/adjust`.

---

## 🎨 10. Branding Configuration

**Scope**: Platform (uses `req.user.tenantId`)
**Base**: `/branding`

Configure tenant's visual identity including colors, logos, and company information.

### Get Branding Configuration

```http
GET /branding
```

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "data": {
    "id": 1,
    "tenantId": 123,
    "primaryColor": "#B725B7",
    "secondaryColor": "#E91E63",
    "tertiaryColor": "#5ED6CE",
    "logoUrl": "https://supabase.co/.../logo.png",
    "faviconUrl": "https://supabase.co/.../favicon.ico",
    "backgroundVideoUrl": "https://supabase.co/.../background-video.mp4",
    "companyName": "My Clinic",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

**Notes**:
- Returns default values if no custom configuration exists
- Default colors: `#B725B7`, `#E91E63`, `#5ED6CE`
- `backgroundVideoUrl` is null if no video has been uploaded

---

### Update Branding Configuration

```http
PUT /branding
```

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "primaryColor": "#B725B7",
  "secondaryColor": "#E91E63",
  "tertiaryColor": "#5ED6CE",
  "logoUrl": "https://...",
  "faviconUrl": "https://...",
  "backgroundVideoUrl": "https://...",
  "companyName": "My Clinic"
}
```

**Validation**:
- Colors must be hex format: `#RRGGBB`
- All fields are optional (partial updates supported)
- `backgroundVideoUrl` should be a valid Supabase storage URL (typically uploaded via `/branding/upload-video`)

**Response**:
```json
{
  "data": { /* updated branding */ },
  "meta": {
    "code": "BRANDING_UPDATED",
    "message": "Branding configuration updated successfully"
  }
}
```

---

### Reset Branding to Defaults

```http
DELETE /branding
```

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "meta": {
    "code": "BRANDING_RESET",
    "message": "Branding configuration reset to defaults"
  }
}
```

---

### Upload Logo

```http
POST /branding/upload-logo
```

**Headers**:
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data**:
- `logo`: Image file (PNG, JPEG, SVG, ICO, max 5MB)

**Response**:
```json
{
  "data": {
    "logoUrl": "https://supabase.co/.../logo_1234567890.png",
    "storagePath": "tenant_123/logo_1234567890.png",
    "size": 45678
  },
  "meta": {
    "code": "LOGO_UPLOADED",
    "message": "Logo uploaded successfully"
  }
}
```

**Storage**:
- Bucket: `tq-branding-assets` (env: `SUPABASE_BRANDING_BUCKET`)
- Path: `tenant_{id}/logo_{timestamp}.{ext}`
- Automatically updates branding configuration

---

### Upload Favicon

```http
POST /branding/upload-favicon
```

**Headers**:
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data**:
- `favicon`: Image file (PNG, JPEG, SVG, ICO, max 5MB)

**Response**:
```json
{
  "data": {
    "faviconUrl": "https://supabase.co/.../favicon_1234567890.ico",
    "storagePath": "tenant_123/favicon_1234567890.ico",
    "size": 12345
  },
  "meta": {
    "code": "FAVICON_UPLOADED",
    "message": "Favicon uploaded successfully"
  }
}
```

---

### Upload Background Video

```http
POST /branding/upload-video
```

**Headers**:
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data**:
- `video`: Video file (MP4 only, max 20MB)

**Response**:
```json
{
  "data": {
    "backgroundVideoUrl": "https://supabase.co/.../background-video.mp4",
    "storagePath": "tenant_123/background-video.mp4",
    "size": 15728640
  },
  "meta": {
    "code": "VIDEO_UPLOADED",
    "message": "Background video uploaded successfully"
  }
}
```

**Constraints**:
- Only MP4 format accepted
- Maximum file size: 20MB
- Replaces previous video (only one video per tenant)
- Automatically updates branding configuration
- Old video file is deleted from storage when replaced

**Usage**:
- Video can be used as background in Hero sections on public quote pages
- Supports autoplay, loop, and muted playback
- Configurable opacity overlay for text legibility
- Optional disable on mobile to save data

**Supabase Storage Architecture** (Per-Tenant Buckets):
- **Bucket per Tenant**: `tenant-{subdomain}` (e.g., `tenant-acme-clinic`)
- **Folder Structure**: `audio-files/`, `branding/` within each bucket
- **Pattern**: Buckets created automatically during tenant provisioning
- **Tenant Isolation**: Complete data isolation per tenant (LGPD/HIPAA compliant)
- **File Cleanup**: Old files automatically deleted when new ones uploaded

---

## 📋 11. Onboarding Wizard

**Tag:** `global`
**Base:** `/onboarding`

Track onboarding wizard completion for Hub and TQ applications (admin-only feature).

### GET `/onboarding/status`
Get onboarding status for all apps.

**Response**:
```json
{
  "data": {
    "hub": { "completed": true, "skipped": false, "completedAt": "2025-01-15T10:00:00Z" },
    "tq": { "completed": false, "skipped": false }
  }
}
```

### GET `/onboarding/:appSlug/needs`
Check if user needs onboarding for an app.

**Parameters**: `appSlug` (hub | tq)

**Response**:
```json
{ "data": { "needsOnboarding": true } }
```

### POST `/onboarding/:appSlug/complete`
Mark onboarding as completed.

### POST `/onboarding/:appSlug/skip`
Mark onboarding as skipped.

### POST `/onboarding/:appSlug/reset`
Reset onboarding status (allows re-running wizard).

---

## 📊 12. Transcription Plans

**Tag:** `global`
**Base:** `/transcription-plans`

> **Acesso**: Platform Admin (`internal_admin`) apenas

Manage transcription quota plans (Basic, VIP, etc.) with monthly limits and features.

### GET `/transcription-plans`
List all transcription plans.

**Parameters**: `active` (boolean), `limit`, `offset`

**Response**:
```json
{
  "data": {
    "plans": [
      {
        "id": 1,
        "slug": "starter",
        "name": "Starter Plan",
        "monthlyMinutesLimit": 420,
        "allowsCustomLimits": false,
        "allowsOverage": false,
        "sttModel": "nova-3",
        "costPerMinuteUsd": 0.0043,
        "active": true
      }
    ],
    "pagination": { "total": 5, "limit": 50, "offset": 0 }
  }
}
```

### GET `/transcription-plans/:id`
Get plan by ID.

### POST `/transcription-plans`
Create new plan.

**Body**:
```json
{
  "slug": "vip",
  "name": "VIP Plan",
  "monthlyMinutesLimit": 2400,
  "allowsCustomLimits": true,
  "allowsOverage": true,
  "sttModel": "nova-3",
  "languageDetectionEnabled": false,
  "costPerMinuteUsd": 0.0043,
  "active": true
}
```

### PUT `/transcription-plans/:id`
Update plan.

### DELETE `/transcription-plans/:id`
Soft delete plan (sets `active = false`).

---

## 🚀 13. Provisioning API

**Tag:** `external`
**Base:** `/api/provisioning`

> **Autenticação**: API Key via `x-api-key` header (NOT JWT)

External API for N8N/Stripe webhook integration. Creates tenants automatically after Stripe checkout.

### GET `/provisioning/health`
Health check endpoint.

### POST `/provisioning/signup`
Provision new tenant with admin user.

**Headers**: `x-api-key: <provisioning_api_key>`

**Body**:
```json
{
  "tenantName": "Clínica ABC",
  "tenantSubdomain": "clinica-abc",
  "adminEmail": "admin@clinica.com",
  "adminFirstName": "João",
  "adminLastName": "Silva",
  "adminPhone": "+5511999999999",
  "timezone": "America/Sao_Paulo",
  "planSlug": "starter",
  "seatsPurchased": 1,
  "trialDays": 7,
  "stripeCustomerId": "cus_xxx",
  "stripeSubscriptionId": "sub_xxx",
  "address": {
    "line1": "Rua Example, 123",
    "city": "São Paulo",
    "state": "SP",
    "postalCode": "01234-567",
    "country": "BR"
  }
}
```

**Response (201)**:
```json
{
  "data": {
    "tenant": { "id": 123, "name": "Clínica ABC", "subdomain": "clinica-abc" },
    "admin": { "id": 456, "email": "admin@clinica.com", "temporaryPassword": "abc123xyz" },
    "license": { "applicationSlug": "tq", "seatsPurchased": 1, "expiresAt": null },
    "transcription": { "planSlug": "starter", "monthlyMinutesLimit": 420 },
    "hubUrl": "https://hub.livocare.ai",
    "loginUrl": "https://hub.livocare.ai/login"
  },
  "meta": { "code": "TENANT_PROVISIONED" }
}
```

### PUT `/provisioning/plan-change`
Change tenant subscription plan (upgrade/downgrade).

**Body**:
```json
{
  "stripeCustomerId": "cus_xxx",
  "stripeSubscriptionId": "sub_xxx",
  "newPlanSlug": "solo",
  "newSeatsPurchased": 2
}
```

### PUT `/provisioning/cancel`
Cancel tenant subscription.

**Body**:
```json
{
  "stripeCustomerId": "cus_xxx"
}
```

---

# 🏗️ Arquitetura Técnica

## Multi-Layered Authorization (5 Camadas)

1. **Tenant License Check**: Tenant tem licença ativa para a aplicação?
2. **Seat Availability Check**: Tenant tem assentos disponíveis?
3. **User Access Check**: Usuário tem permissão individual?
4. **Role Validation**: Usuário tem role adequada?
5. **Audit Logging**: Registro completo de todas as tentativas

## Database Schema

### Core Tables (10 total)
- `tenants`: Registro de tenants com schema mapping
- `users`: Relação 1:1 com tenants (`tenant_id_fk`)
- `user_types`: Hierarquia de usuários para pricing
- `applications`: Catálogo de produtos
- `tenant_applications`: Licenças por tenant
- `user_application_access`: Permissões individuais com snapshots de preço
- `application_pricing`: Matriz de preços (App × UserType)
- `application_access_logs`: Trilha de auditoria completa
- `tenant_addresses`: Endereços múltiplos por tenant
- `tenant_contacts`: Contatos organizados por função

## Pricing System

### Seat-Based Pricing
- **Matriz de Preços**: Aplicações precificadas por seat × user type
- **Price Snapshots**: Preço capturado no momento da concessão
- **Billing Consistency**: Snapshots preservam consistência mesmo com mudanças de preço
- **Seat Limits**: Limites globais por aplicação por tenant

### Pricing Matrix Example
```
TQ (Transcription Quote):    operations($35), manager($55), admin($80)
PM (Patient Management):     operations($25), manager($40), admin($60)  
Billing System:              operations($30), manager($50), admin($70)
Reports Dashboard:           operations($20), manager($35), admin($50)
```

## JWT Token Structure

### Platform Admin Token
```json
{
  "userId": 1,
  "type": "platform_admin",
  "platformRole": "internal_admin",
  "iat": 1234567890
}
```

### Tenant User Token
```json
{
  "userId": 5,
  "tenantId": 2,
  "email": "user@tenant.com",
  "role": "admin",
  "schema": "tenant_clinic",
  "allowedApps": ["tq", "pm"],
  "userType": {
    "id": 3,
    "slug": "admin",
    "hierarchyLevel": 2
  },
  "iat": 1234567890
}
```

---

# 🔧 Configuração

## Environment Variables

### Database
```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=simplia_paas
DATABASE_USER=simplia
DATABASE_PASSWORD=senha
```

### API Configuration
```bash
INTERNAL_API_PREFIX=/internal/api/v1
ENABLE_INTERNAL_DOCS=true
INTERNAL_DOCS_PATH=/docs/internal
ADMIN_PANEL_ORIGIN=http://localhost:3002
```

### Security
```bash
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=10
ENABLE_HELMET=true
```

### Multi-tenancy
```bash
DEFAULT_TENANT=default
TENANT_HEADER_NAME=x-tenant-id
```

### Supabase Storage
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_AUDIO_BUCKET=tq-audio-files
SUPABASE_BRANDING_BUCKET=tq-branding-assets
```

## CORS Configuration

A API está configurada com CORS restritivo:
- **Produção**: Apenas `ADMIN_PANEL_ORIGIN`
- **Desenvolvimento**: Origem permissiva para testes

---

# 📈 Monitoramento

## Health Checks

- `GET /health`: Status geral da API
- `GET /auth/health`: Status do serviço de autenticação
- `GET /users/health`: Status do módulo de usuários

## Logging

Todos os acessos são registrados em `application_access_logs`:
- IP Address, User-Agent, API path
- Decision (granted/denied) com razão detalhada
- Timestamp e contexto completo do usuário

## Security Alerts

Sistema de alertas automático para:
- Tentativas de acesso negadas
- Padrões suspeitos de IP
- Usuários bloqueados ou inativos tentando acesso

---

# 🚀 Development

## Running the API

```bash
# Start development server
npm run dev:server

# Access Swagger documentation
open http://localhost:3001/docs/internal
```

## Testing

```bash
# Run all tests
npm test

# Run specific API tests
npm test tests/integration/internal/

# Run pricing system tests
npm test tests/integration/internal/pricing-system.test.js
```

## Database

```bash
# Run migrations
npm run migrate

# Create test database
npm run db:create:test

# Drop test database
npm run db:drop:test
```

### Boas Práticas de Consumo
- Prefira `public.*` ao se referir explicitamente ao core em exemplos SQL.
- Sempre informar `x-tenant-id` nos exemplos `tenant`.
- Em exemplos de grant/revoke, mencionar snapshots de preço e *seat limit* globais por app/tenant.

---

# 📊 API Statistics

- **Total Endpoints**: 75+ (estimated)
- **Platform Admin**: 58 endpoints (unchanged)
- **Tenant Admin**: 5 endpoints (streamlined)
- **Authentication Endpoints**: 8 (platform + tenant auth)
- **Debug/Dev Endpoints**: 8 (development only)
- **Rate Limited**: Authentication routes (10-15 req/15min)
- **Multi-tenant**: Schema-per-tenant isolation
- **Protection Levels**: 7 different auth requirements

> **🔧 Cleanup (Janeiro 2025)**: Removidos endpoints desnecessários para simplificar API:
> - Tenant user management movido para platform admin (`/tenants`)
> - Entitlements/licenses consolidados em `/tenants` routes
> - Endpoints de perfil de usuário e mudança de senha removidos
> - Focus em operações essenciais apenas

## 📋 Complete Route Reference

### 🌐 Global (Platform-Scoped) Routes
*Require platform admin authentication, NO x-tenant-id header*

#### Platform Authentication (`/platform-auth`)
- `POST /platform-auth/login` - Platform admin login
- `GET /platform-auth/me` - Get platform admin profile
- `POST /platform-auth/refresh` - Refresh platform token
- `POST /platform-auth/logout` - Platform admin logout
- `POST /platform-auth/forgot-password` - Password reset for Hub/TQ users (bilingual email)
- `GET /platform-auth/audit` - Platform login audit logs

#### Applications Management (`/applications`)
- `GET /applications` - List application catalog
- `GET /applications/:id` - Get application by ID
- `GET /applications/slug/:slug` - Get application by slug
- `GET /applications/:id/pricing` - Get pricing matrix
- `POST /applications/:id/pricing` - Create/schedule pricing
- `PUT /applications/:id/pricing/:pricingId` - Update pricing
- `POST /applications/:id/pricing/:pricingId/end` - End pricing period

#### Tenants Management (`/tenants`)
- `GET /tenants` - List all tenants
- `GET /tenants/:id` - Get tenant by ID
- `POST /tenants` - Create new tenant
- `PUT /tenants/:id` - Update tenant
- `DELETE /tenants/:id` - Soft delete tenant
- `GET /tenants/:id/addresses` - Get tenant addresses
- `POST /tenants/:id/addresses` - Create address
- `PUT /tenants/:id/addresses/:addressId` - Update address
- `DELETE /tenants/:id/addresses/:addressId` - Delete address
- `GET /tenants/:id/contacts` - Get tenant contacts
- `POST /tenants/:id/contacts` - Create contact
- `PUT /tenants/:id/contacts/:contactId` - Update contact
- `DELETE /tenants/:id/contacts/:contactId` - Delete contact
- `GET /tenants/:id/applications` - Get tenant licenses
- `POST /tenants/:id/applications/:appSlug/activate` - Activate app for tenant
- `PUT /tenants/:id/applications/:appSlug/adjust` - Adjust tenant app settings
- `POST /tenants/:id/users/:userId/applications/:appSlug/grant` - Grant user access
- `POST /tenants/:id/users/:userId/applications/:appSlug/revoke` - Revoke user access
- `PUT /tenants/:id/users/:userId/applications/:appSlug/reactivate` - Reactivate access
- `PUT /tenants/:id/users/:userId/applications/:appSlug/role` - Update user role
- `GET /tenants/:id/applications/:appSlug/users` - Get app users

#### Cross-Tenant User Management (`/tenant-users`)
- `POST /tenants/:tenantId/users` - Create user in tenant
- `GET /tenants/:tenantId/users/:userId` - Get tenant user
- `PUT /tenants/:tenantId/users/:userId` - Update tenant user
- `DELETE /tenants/:tenantId/users/:userId` - Deactivate tenant user
- `POST /tenants/:tenantId/users/:userId/reset-password` - Reset password

#### Audit & Metrics (`/audit`, `/metrics`)
- `GET /audit/access-logs` - Query access logs
- `GET /audit/access-summary` - Access summary stats
- `GET /audit/security-alerts` - Security alerts
- `GET /metrics/overview` - Platform overview metrics

#### Onboarding (`/onboarding`)
- `GET /onboarding/status` - Get all apps onboarding status
- `GET /onboarding/:appSlug/needs` - Check if user needs onboarding
- `POST /onboarding/:appSlug/complete` - Mark onboarding completed
- `POST /onboarding/:appSlug/skip` - Skip onboarding
- `POST /onboarding/:appSlug/reset` - Reset onboarding status

#### Transcription Plans (`/transcription-plans`)
- `GET /transcription-plans` - List transcription plans
- `GET /transcription-plans/:id` - Get plan by ID
- `POST /transcription-plans` - Create plan
- `PUT /transcription-plans/:id` - Update plan
- `DELETE /transcription-plans/:id` - Soft delete plan

### 🚀 External API Routes (API Key Auth)

#### Provisioning (`/api/provisioning`)
- `GET /provisioning/health` - Health check
- `POST /provisioning/signup` - Provision new tenant
- `PUT /provisioning/plan-change` - Change subscription plan
- `PUT /provisioning/cancel` - Cancel subscription

### 🏢 Tenant-Scoped Routes
*Require x-tenant-id header and tenant authentication*

#### Tenant Authentication (`/auth`)
- `POST /auth/login` - Tenant user login
- `POST /auth/refresh` - Refresh tenant token
- `POST /auth/logout` - Tenant user logout
- `GET /auth/me` - Get current user profile with apps

#### Tenant Users (`/users`)
- `GET /users` - List users in tenant

### 🔧 Development Routes
*Debug/development endpoints (no auth required)*
- `GET /debug/routes` - Debug route list
- `GET /debug/headers` - Debug headers
- `GET /debug/check-user/:tenantId/:userId` - Check user existence
- `GET /debug/auth` - Test auth middleware
- `GET /debug/platform` - Test platform role
- `GET /dev/tenants/:tenantId/users/:userId` - Dev get user
- `POST /dev/tenants/:tenantId/users` - Dev create user

---

**© 2025 Simplia - Internal API Documentation v1.2.0**