# TQ Public Quotes - Puck Template Designer

## Overview

O TQ Public Quotes Template Designer utiliza o **Puck** ([@measured/puck](https://puckeditor.com/)) para permitir que usuários criem templates de cotações públicas de forma visual através de drag-and-drop, sem necessidade de código.

## Arquitetura

### Fluxo de Trabalho

1. **Criar Template** (`/public-quotes/templates/create`)
   - Usuário cria template básico com título e descrição
   - Template é salvo no banco com `content = null`

2. **Design Layout** (`/public-quotes/templates/:id/design`)
   - Editor visual Puck de tela cheia
   - Arrasta componentes da biblioteca para construir o layout
   - Salva layout em JSON no campo `content`

3. **Preview** (`/public-quotes/templates/:id/preview`)
   - Renderiza template completamente isolado (sem sidebar/header do sistema)
   - Simula exatamente como usuário final verá
   - Rota pública (sem autenticação)

### Estrutura de Arquivos

```
src/client/apps/tq/features/public-quotes/
├── DesignPublicQuoteTemplate.tsx          # Editor Puck
├── PreviewPublicQuoteTemplate.tsx         # Preview isolado
└── puck-config/
    ├── index.ts                           # Config principal do Puck
    ├── layout-components.tsx              # Grid, Flex, Space
    ├── typography-components.tsx          # Heading, Text
    ├── action-components.tsx              # Button
    ├── quote-components.tsx               # QuoteNumber, QuoteTotal, ItemsTable
    ├── header-component.tsx               # Header fixo
    ├── other-components.tsx               # Hero, CardWithIcon, Logos, Stats
    └── icons.ts                           # Re-exports de lucide-react
```

## Componentes Disponíveis

### Layout
- **Grid**: Grid CSS responsivo com colunas configuráveis (1-12), gap ajustável e vertical padding
- **Flex**: Flexbox com direção (row/column), justify-content, gap, wrap e vertical padding
- **Space**: Espaçador vertical, horizontal ou ambos com tamanhos de 8px a 160px
- **Divider**: Linha horizontal separadora com:
  - **Cor**: 13 opções (Light Gray padrão, Gray, Dark Gray, Primary, Secondary, Tertiary, Black, Blue, Red, Green, Yellow, Purple, Pink)
  - **Espessura**: 8 opções (1px a 10px)
  - **Espaçamento**: 9 opções de padding vertical (0px a 80px, padrão 24px)
  - Responsivo: espaçamento ajusta automaticamente em telas maiores

### Typography
- **Heading**: Títulos com 7 tamanhos (XS a XXXL), 6 níveis semânticos (H1-H6), alinhamento e vertical padding
- **Text**: Parágrafos com 2 tamanhos (S/M), alinhamento, cor (default/muted), maxWidth opcional e vertical padding

### Actions
- **Button**: Botões com 3 variantes de cor (primary/secondary/tertiary baseadas no branding), 3 tamanhos (S/M/L)

### Quote Info
- **QuoteNumber**: Exibe número da cotação com label configurável (placeholder: `{{quote.number}}`)
- **QuoteTotal**: Exibe total da cotação com destaque visual e cor primária do branding (placeholder: `{{quote.total}}`)
- **ItemsTable**: Tabela de itens com colunas configuráveis:
  - Item, Base Price, Discount (opcional), Price (opcional), Final Price
  - `showDiscount`: toggle para mostrar/ocultar coluna Discount
  - `showPrice`: toggle para mostrar/ocultar coluna Price
  - Placeholders: `{{item.*}}`

### Header
- **Header**: Header fixo no topo com:
  - Logo do tenant (via branding API) ou texto "LOGO"
  - 4 cores de fundo (White, Primary, Secondary, Tertiary)
  - 3 tamanhos (Small 64px, Medium 80px, Large 96px)
  - Spacer automático para compensar posicionamento fixo
- **Footer**: Rodapé com:
  - Múltiplas colunas configuráveis
  - Links customizáveis em cada coluna
  - Copyright text
  - Cor de texto personalizável (aplica-se a todo o conteúdo do footer)

### Media
- **Image**: Componente de imagem com:
  - URL da imagem
  - Texto alternativo (alt)
  - Aspect ratio (16:9, 4:3, 1:1, 21:9, custom)
  - Object fit (cover, contain, fill)
  - Border radius (0px a 24px)
  - Max width (100% a 800px)
  - Alinhamento (left, center, right)
  - Padding vertical
  - Link URL (opcional)
  - Abrir em nova aba
- **Video**: Componente de vídeo com:
  - URL do vídeo (YouTube, Vimeo ou direto)
  - Aspect ratio (16:9, 4:3, 1:1, 21:9)
  - Border radius (0px a 24px)
  - Max width (100% a 1200px)
  - Alinhamento (left, center, right)
  - Padding vertical
  - Autoplay, Loop, Muted
  - Mostrar controles

### Other
- **CardContainer**: Card com título, descrição e drop zone interna
- **CardWithIcon**: Card com ícone selecionável (100+ ícones médicos e de negócios), modo compacto ou largo
- **Hero**: Seção hero com:
  - **Título e descrição** com tamanhos de fonte customizáveis (placeholders: 48px e 18px)
  - **Botões de ação** (múltiplos, cores do branding, tamanhos: Small/Medium/Large, cor de texto customizável)
  - **Alinhamento** (left/center)
  - **Background Mode** (none/image/video):
    - **none**: Sem background, apenas cor de fundo
    - **image**: Imagem customizada como background (URL)
    - **video (from branding)**: Vídeo do branding como background
      - Autoplay, loop, muted automáticos
      - Opacidade configurável (0-1, default: 0.3)
      - **Disable video on mobile**: Opcional para economizar dados móveis
      - Garantia de loop infinito com fallback JavaScript
  - **Inline Media** (opcional, separado do background):
    - **Show inline media**: Yes/No
    - **Tipo**: Image ou Video (embed)
    - **URL**: Endereço da mídia inline
  - **Gradient Overlay**: Overlay branco semi-transparente para legibilidade de texto
    - Center align: `rgba(255, 255, 255, 0.25)` uniforme
    - Left align: Gradiente horizontal de `0.5 → 0.25 → 0.05 → 0`
  - **Padding vertical** configurável
  - **Cores customizáveis**: Título, descrição, background
  - **Responsivo**: Ajustes automáticos para mobile (Header button compacto, Footer empilhado)
- **Logos**: Grid de logos com título
- **Stats**: Cards de estatísticas com ícones e valores

## Integração com Branding

Todos os componentes consomem a API de branding (`/internal/api/v1/configurations/branding`) para aplicar:

- **Cores**: `primaryColor`, `secondaryColor`, `tertiaryColor` aplicadas em botões, headers e destaques
- **Logo**: `logoUrl` renderizada no Header component com fallback para texto "LOGO"
- **Company Name**: Disponível para uso futuro

### Exemplo de Uso de Branding

```typescript
// No puck-config/index.ts
export const createConfig = (branding: BrandingData) => ({
  components: {
    ...createActionComponents(branding),  // Botões com cores do branding
    ...createQuoteComponents(branding),   // QuoteTotal com primaryColor
    ...createHeaderComponent(branding),   // Header com logo do branding
    ...createOtherComponents(branding),   // Hero/Stats com cores do branding
  }
})
```

## Persistência de Dados

### Estrutura do JSON Salvo

```json
{
  "root": {
    "props": {}
  },
  "zones": {},
  "content": [
    {
      "type": "Header",
      "props": {
        "id": "Header-uuid",
        "height": "80",
        "backgroundColor": "white"
      }
    },
    {
      "type": "Hero",
      "props": {
        "id": "Hero-uuid",
        "title": "Bem-vindo",
        "description": "Descrição do serviço",
        "align": "left",
        "mode": "bg",
        "media": "image",
        "url": "https://...",
        "showMedia": true,
        "buttons": [
          {
            "label": "Solicitar Cotação",
            "href": "#",
            "variant": "primary"
          }
        ],
        "padding": "64px"
      }
    }
  ]
}
```

### Database Schema

```sql
-- Public Quote Templates
CREATE TABLE tenant_{slug}.public_quote_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content JSONB,  -- Puck data structure
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Public Quotes (Shareable Links)
CREATE TABLE tenant_{slug}.public_quote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL,
  quote_id UUID NOT NULL REFERENCES quote(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public_quote_template(id) ON DELETE SET NULL,
  access_token VARCHAR(64) UNIQUE NOT NULL,
  public_url TEXT,
  content JSONB,  -- Resolved template + data package (immutable snapshot)
  password_hash VARCHAR(255),
  views_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

## Funcionalidades do Editor

### Save Layout
- Botão "Save Layout" no header da página (fora do Puck)
- Salva `data` atual no campo `content` do template
- **Não navega** após salvar - permanece na página para continuar editando
- Usa `onChange` do Puck para capturar mudanças em tempo real

### Fullscreen Mode
- Botão "Fullscreen" no header do Puck
- Oculta header da página (Save Layout / Cancel)
- Editor Puck ocupa tela completa (`fixed inset-0 z-50`)
- Botão alterna para "Exit Fullscreen"

### Preview
- Botão "Preview" no header do Puck
- **Desabilitado** se `data.content` estiver vazio (template nunca salvo)
- Abre `/public-quotes/templates/:id/preview` em nova aba
- Preview é completamente isolado:
  - Sem autenticação (rota pública)
  - Sem sidebar/header do sistema TQ
  - Usa `<Render>` do Puck (componente read-only)
  - Renderiza exatamente como usuário final verá

### Cancel
- Botão "Cancel" retorna para `/public-quotes/templates`

## API do Puck

### Props Principais

```typescript
<Puck
  config={config}           // Configuração de componentes
  data={data}              // Estado atual do layout
  onChange={setData}       // Captura mudanças em tempo real
  onPublish={setData}      // (Opcional) Para salvar ao publicar
  overrides={{
    headerActions: () => <CustomButtons />  // Sobrescreve botões do header
  }}
/>
```

### Renderização no Preview

```typescript
<Render
  config={config}
  data={template.content}
/>
```

## Padrões de Design

### Padding e Espaçamento

1. **Layout containers** (Grid, Flex): `px-8` aplicado
2. **Content components** (Heading, Text): **Sem** padding horizontal (evita duplicação)
3. **Vertical padding**: Opção de 0px a 152px em todos os componentes relevantes

### Slots (Drop Zones)

Componentes de layout usam `type: 'slot'` para criar áreas de drop:

```typescript
fields: {
  content: {
    type: 'slot' as const,
  }
}

render: ({ content: Content }: any) => (
  <Content
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '24px'
    }}
  />
)
```

O Puck automaticamente gerencia drag-and-drop dentro do slot.

### Hero Background System

O Hero component suporta três modos de background mutuamente exclusivos:

#### 1. Background None
- Apenas cor de fundo sólida (configurável)
- Sem mídia de background

#### 2. Background Image
- Imagem customizada via URL
- `backgroundSize: 'cover'`, `backgroundPosition: 'center'`
- Opacidade configurável (0-1)

#### 3. Background Video (From Branding)
- Vídeo do tenant branding (`backgroundVideoUrl`)
- **HTML5 Attributes**:
  ```html
  <video autoPlay loop muted playsInline preload="auto">
  ```
- **JavaScript Fallback**: 
  - `onEnded`: Força loop se atributo nativo falhar
  - `onCanPlay`: Garante início automático
- **Mobile Data Saving**:
  - Opção "disable video on mobile" (default: off)
  - Quando ativado, oculta vídeo em telas ≤768px via CSS
  ```css
  @media (max-width: 768px) {
    video { display: none !important; }
  }
  ```
- **Opacidade configurável** (0-1, default: 0.3)

#### Gradient Overlay for Text Legibility

Aplicado sobre qualquer background (image/video) para garantir legibilidade:

```typescript
// Center align: gradiente uniforme suave
background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.25))'

// Left align: gradiente horizontal (forte à esquerda → transparente à direita)
background: 'linear-gradient(to right, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.05) 70%, rgba(255, 255, 255, 0) 100%)'
```

**Design Rationale**: Valores reduzidos (0.25-0.5) para evitar "whitewashing" do background enquanto mantém legibilidade.

## Troubleshooting

### Template não carrega após salvar

**Problema**: `data.content` está vazio `[]` após salvar
**Causa**: Puck não estava atualizando state `data` em tempo real
**Solução**: Adicionar `onChange` callback:

```typescript
<Puck
  data={data}
  onChange={(updatedData) => setData(updatedData)}  // ✅
  onPublish={(publishedData) => setData(publishedData)}
/>
```

### Componentes não aceitam drop (Grid multi-coluna)

**Problema**: Componentes não podem ser soltos em colunas do Grid
**Causa**: Uso de `renderDropZone()` (API antiga/deprecada)
**Solução**: Usar `type: 'slot'` e renderizar como componente:

```typescript
// ❌ ERRADO
{puck.renderDropZone('grid-items')}

// ✅ CORRETO
fields: {
  content: { type: 'slot' }
}
render: ({ content: Content }) => <Content />
```

### Preview mostra sidebar/header do sistema

**Problema**: Preview renderiza dentro do Layout do TQ
**Causa**: Rota de preview estava dentro do `<RouteGuard>` e `<Layout>`
**Solução**: Mover rota para fora:

```typescript
<Routes>
  {/* Fora do Layout - Isolado */}
  <Route path="/public-quotes/templates/:id/preview" element={<PreviewPublicQuoteTemplate />} />

  <Route path="/*" element={<RouteGuard><Layout /></RouteGuard>}>
    {/* Rotas do sistema aqui */}
  </Route>
</Routes>
```

### Logo muito grande no Header

**Problema**: Logo ocupa metade da página
**Causa**: Falta de restrições de tamanho
**Solução**: Aplicar maxHeight e maxWidth:

```typescript
<img
  src={branding.logoUrl}
  style={{
    maxHeight: `${parseInt(height) * 0.6}px`,  // 60% da altura do header
    maxWidth: '200px',                          // Máximo 200px de largura
    objectFit: 'contain',                       // Mantém proporções
  }}
/>
```

### Header não alinha com conteúdo abaixo

**Problema**: Logo tem padding extra lateral comparado ao Hero
**Causa**: Padding duplicado (header + container interno)
**Solução**: Aplicar `px-8` apenas no header:

```typescript
// ✅ CORRETO
<header className="px-8">
  <div className="max-w-6xl mx-auto">  {/* Sem px-8 aqui */}
    <img src={logo} />
  </div>
</header>
```

## Template Variables & Preview System

### Arquitetura de Resolução de Variáveis

O sistema de preview utiliza uma arquitetura **dual-config** para renderizar variáveis de forma segura:

#### 1. Config Normal (Edição)
- **Localização**: `src/client/apps/tq/features/public-quotes/puck-config/`
- **Uso**: Editor visual em `/public-quotes/templates/:id/design`
- **Comportamento**: Renderiza placeholders literais (`{{quote.number}}`) para visualização no editor

```typescript
// quote-components.tsx
QuoteNumber: {
  render: ({ label }) => (
    <span>{{'{{quote.number}}'}}</span>  // Placeholder visual
  )
}
```

#### 2. Config Preview (Renderização com Dados)
- **Localização**: `src/client/apps/tq/features/public-quotes/puck-config-preview.tsx`
- **Uso**: Preview em `/quotes/:id/preview-public-quote/:templateId`
- **Comportamento**: Renderiza valores reais da quote

```typescript
// puck-config-preview.tsx
export const createConfigWithResolvedData = (branding, quoteData) => ({
  QuoteNumber: {
    render: ({ label }) => (
      <span>{quoteData.quote.number}</span>  // Valor real: "QUO000001"
    )
  }
})
```

### Fluxo de Resolução de Variáveis

```
1. Quote Data (DB)
   ↓
2. resolveTemplateVariables()  → Formata dados
   ↓
3. createConfigWithResolvedData() → Cria config customizada
   ↓
4. Puck <Render> → Renderiza com valores reais
```

#### Serviços Utilizados

**`src/client/apps/tq/lib/resolveTemplateVariables.ts`**
```typescript
// Converte Quote raw para formato estruturado
export const resolveTemplateVariables = (
  templateContent: any,
  quote: Quote
): ResolvedQuoteData => {
  return {
    quote: {
      number: quote.number || '',
      total: quote.total ? `$${parseFloat(quote.total).toFixed(2)}` : '$0.00',
      content: quote.content || '',  // HTML do clinical summary
      status: quote.status || 'draft',
      created_at: new Date(quote.created_at).toLocaleDateString()
    },
    patient: {
      first_name: quote.patient_first_name || '',
      last_name: quote.patient_last_name || '',
      full_name: `${quote.patient_first_name} ${quote.patient_last_name}`.trim(),
      email: quote.patient_email || '',
      phone: quote.patient_phone || ''
    },
    items: quote.items.map(item => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      base_price: `$${parseFloat(item.basePrice).toFixed(2)}`,
      discount: `$${parseFloat(item.discountAmount).toFixed(2)}`,
      final_price: `$${parseFloat(item.finalPrice).toFixed(2)}`
    }))
  }
}
```

**`src/client/apps/tq/services/quotes.ts`**
```typescript
// Busca quote com todos os relacionamentos
quotesService.getQuote(quoteId)
```

**`src/client/apps/tq/services/publicQuotes.ts`**
```typescript
// Busca template Puck
publicQuotesService.getTemplate(templateId)
```

**`src/client/apps/tq/services/branding.ts`**
```typescript
// Busca branding para cores e logo
brandingService.getBranding()
```

### Preview Flow Completo

**Localização**: `src/client/apps/tq/features/quotes/PreviewPublicQuote.tsx`

```typescript
export const PreviewPublicQuote: React.FC = () => {
  const { id: quoteId, templateId } = useParams()

  // 1. Carrega dados em paralelo
  const [quote, template, branding] = await Promise.all([
    quotesService.getQuote(quoteId),
    publicQuotesService.getTemplate(templateId),
    brandingService.getBranding()
  ])

  // 2. Resolve variáveis
  const resolvedData = resolveTemplateVariables(template.content, quote)

  // 3. Cria config customizada com valores resolvidos
  const previewConfig = useMemo(
    () => createConfigWithResolvedData(branding, resolvedData),
    [branding, quote, template]
  )

  // 4. Renderiza com Puck
  return <Render config={previewConfig} data={template.content} />
}
```

### Variáveis Suportadas

#### Quote Variables
- `{{quote.number}}` → `"QUO000001"`
- `{{quote.total}}` → `"$5,701.00"`
- `{{quote.status}}` → `"approved"`
- `{{quote.created_at}}` → `"03/10/2025"`
- `{{quote.content}}` → HTML do clinical summary

#### Patient Variables
- `{{patient.first_name}}` → `"ANDRE"`
- `{{patient.last_name}}` → `"MELO"`
- `{{patient.full_name}}` → `"ANDRE MELO"`
- `{{patient.email}}` → `"andre@example.com"`
- `{{patient.phone}}` → `"11994411280"`

#### Item Variables (Todos os itens renderizados)
- `{{item.name}}` → `"Dental Implant"`
- `{{item.description}}` → `"Titanium implant with crown"`
- `{{item.quantity}}` → `1`
- `{{item.base_price}}` → `"$3,000.00"`
- `{{item.discount}}` → `"$500.00"`
- `{{item.final_price}}` → `"$2,500.00"`

### Preview Isolado

**Rota**: `/quotes/:id/preview-public-quote/:templateId`

**Características**:
- ✅ Sem autenticação (RouteGuard mas sem Layout)
- ✅ Sem sidebar/header do TQ
- ✅ Fullscreen - simula exatamente o que paciente verá
- ✅ Abre em nova aba via `window.open(..., '_blank')`
- ✅ Variáveis resolvidas em tempo real

**Configuração de Rota**:
```typescript
// src/client/apps/tq/routes/index.tsx
<Routes>
  {/* Preview isolado - Fora do Layout */}
  <Route
    path="/quotes/:id/preview-public-quote/:templateId"
    element={
      <RouteGuard requireAuth requiredApp="tq">
        <PreviewPublicQuote />
      </RouteGuard>
    }
  />

  <Route path="/*" element={<Layout />}>
    {/* Rotas normais com sidebar */}
  </Route>
</Routes>
```

### Por Que Dual-Config é Segura?

**Problemas da Abordagem Anterior (Mutação DOM)**:
- ❌ Race conditions (setTimeout arbitrário)
- ❌ React não sabe das mudanças
- ❌ Performance ruim (percorre todo DOM)
- ❌ Frágil (quebra em re-renders)

**Vantagens da Dual-Config**:
- ✅ React controla tudo - zero mutação DOM
- ✅ Type-safe - TypeScript mantém tipagem
- ✅ Performance - valores renderizados diretamente
- ✅ Sem timing issues - useMemo recalcula quando dados mudam
- ✅ Reutilizável - mesma config para qualquer quote

### Quote Items - Renderização Múltipla

O componente `QuoteItems` renderiza **todos** os items da quote:

```typescript
// puck-config-preview.tsx
QuoteItems: {
  render: ({ showDiscount }) => {
    const items = quoteData?.items || []

    return (
      <>
        {/* Mobile: Cards */}
        {items.map((item, index) => (
          <div key={index}>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <span>Qty: {item.quantity}</span>
            <span>Price: {item.base_price}</span>
            {showDiscount && <span>Discount: {item.discount}</span>}
            <span>Total: {item.final_price}</span>
          </div>
        ))}

        {/* Desktop: Table rows */}
        <table>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>{item.base_price}</td>
              {showDiscount && <td>{item.discount}</td>}
              <td>{item.final_price}</td>
            </tr>
          ))}
        </table>
      </>
    )
  }
}
```

### Integration com EditQuote

**Localização**: `src/client/apps/tq/features/quotes/EditQuote.tsx`

```typescript
// 1. Load templates
const [templates, setTemplates] = useState<PublicQuoteTemplate[]>([])
const [selectedTemplateId, setSelectedTemplateId] = useState('')

useEffect(() => {
  const response = await publicQuotesService.listTemplates({ active: true })
  setTemplates(response.data)

  // Auto-select default template
  const defaultTemplate = response.data.find(t => t.isDefault)
  if (defaultTemplate) setSelectedTemplateId(defaultTemplate.id)
}, [])

// 2. Preview button
<Button
  onClick={() => window.open(
    `/quotes/${id}/preview-public-quote/${selectedTemplateId}`,
    '_blank'
  )}
>
  Preview Template
</Button>

// 3. Generate public quote
<Button onClick={handleGeneratePublicQuote}>
  Generate Public Quote
</Button>
```

## Public Quote Content Resolution (Backend)

### Arquitetura de Imutabilidade

Quando um public quote link é gerado, o sistema **"congela"** o conteúdo no momento da criação para garantir que:
- ✅ Patient vê EXATAMENTE a mesma coisa que o usuário autenticado
- ✅ Alterações no template NÃO afetam links já gerados
- ✅ Dados históricos preservados para auditoria

### Backend Resolution Flow

```
1. POST /api/tq/v1/public-quotes
   ↓
2. Backend busca: Quote + Items + Patient + Template
   ↓
3. puckTemplateResolver.js resolve dados (EXATAMENTE igual ao frontend)
   ↓
4. Cria Content Package: { template, resolvedData }
   ↓
5. Salva em public_quote.content (JSONB)
   ↓
6. Retorna: { publicUrl, password }
```

### Content Package Structure

```json
{
  "template": {
    "content": [...],  // Puck template original
    "root": {},
    "zones": {}
  },
  "resolvedData": {
    "quote": {
      "number": "QUO000001",
      "total": "$5,701.00",
      "content": "<p>Clinical summary...</p>",
      "status": "approved",
      "created_at": "Jan 15, 2025"
    },
    "patient": {
      "first_name": "ANDRE",
      "last_name": "MELO",
      "full_name": "ANDRE MELO",
      "email": "andre@example.com",
      "phone": "11994411280"
    },
    "items": [
      {
        "name": "Dental Implant",
        "description": "Titanium implant with crown",
        "quantity": 1,
        "base_price": "$3,000.00",
        "discount": "$500.00",
        "final_price": "$2,500.00"
      }
    ]
  }
}
```

### Backend Service

**Location**: `src/server/services/puckTemplateResolver.js`

```javascript
// MUST match EXACTLY the frontend logic
function resolveQuoteData(quote, patient, items) {
  return {
    quote: {
      number: quote.number || '',
      total: formatCurrency(quote.total),
      content: quote.content || '',
      status: quote.status || 'draft',
      created_at: formatDate(quote.created_at)
    },
    patient: {
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      full_name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'N/A',
      email: patient.email || '',
      phone: patient.phone || ''
    },
    items: (items || []).map(item => ({
      name: item.name || '',
      description: item.description || '',
      quantity: item.quantity || 1,
      base_price: formatCurrency(item.base_price),
      discount: formatCurrency(item.discount_amount),
      final_price: formatCurrency(item.final_price)
    }))
  }
}
```

### Public Access Endpoint

**Route**: `POST /api/tq/v1/pq/:accessToken`

```javascript
// Patient enters password
// Returns saved content package (already resolved)
{
  "data": {
    "content": {
      "template": { ... },    // Original Puck template
      "resolvedData": { ... } // Pre-formatted quote data
    },
    "branding": {
      "primaryColor": "#B725B7",
      "secondaryColor": "#E91E63",
      "tertiaryColor": "#5ED6CE",
      "logo": "https://..."
    }
  }
}
```

### Frontend Rendering

**Location**: `src/client/apps/tq/features/public-quotes/PublicQuoteAccess.tsx`

```typescript
// Uses the saved resolvedData directly
const previewConfig = useMemo(() => {
  if (!quoteData?.content) return null
  
  const branding = { /* branding data */ }
  
  // Uses saved resolvedData (no need to resolve again)
  return createConfigWithResolvedData(branding, quoteData.content.resolvedData)
}, [quoteData])

return <Render config={previewConfig} data={quoteData.content.template} />
```

### Consistency Guarantees

1. **Format Functions Match**:
   - Backend `formatCurrency()` === Frontend `formatCurrency()`
   - Backend `formatDate()` === Frontend `formatDate()`

2. **Same Data Structure**:
   - Backend `resolveQuoteData()` === Frontend `resolveTemplateVariables()`
   - Identical field names and transformations

3. **No Runtime Resolution**:
   - Patient page uses pre-resolved data
   - Zero chance of divergence

## Public Quote Management

### Public Quote Links

**Route**: `/public-quotes/links`

Sistema completo de gerenciamento de links públicos gerados:

#### Filtros e Pesquisa
- **Quote Number**: Busca por número da cotação
- **Status**: Checkboxes para Active/Inactive
- **Created Date Range**: Filtro de data de criação (from/to)
- **Clear Filters**: Botão vermelho para limpar todos os filtros e query params da URL

#### Lista de Links
Cada link público exibe:
- **Quote Number**: Número da cotação associada
- **Patient**: Nome do paciente
- **Created**: Data e hora de criação
- **Views**: Contador de visualizações
- **Status**: Badge (Active/Inactive)
- **Actions**:
  - **Open Quote**: Redireciona para `/quotes/:id/edit`
  - **New Password**: Gera nova senha e exibe LinkToast (15s) com URL e nova senha
  - **Revoke**: DELETE - remove o link público

#### Recent Activity Integration
- Public quotes aparecem no Recent Activity da Home
- Ao clicar, navega para `/public-quotes/links?quote={NUMBER}` com filtro ativo
- Public quote templates também aparecem no Recent Activity
- Ao clicar no template, navega para `/public-quotes/templates/:id/edit`

#### Global Search Integration
A busca global no Header (QuickSearchBar) inclui:
- **Patients**
- **Sessions**
- **Quotes**
- **Clinical Reports** (ícone azul, tipo "report")
- **Templates** (ícone roxo)
- **Public Quote Templates** (ícone rosa, tipo "pq template")

### Geração de Link Público

**Route**: `/quotes/:id/edit` → Modal "Generate Public Quote"

Fluxo:
1. User seleciona template do dropdown
2. Clica "Generate Public Quote"
3. Backend:
   - Resolve dados da quote (items, patient, etc.)
   - Cria content package (template + resolvedData)
   - Gera access token único
   - Gera senha automática
   - Cria public_url: `{TQ_ORIGIN}/pq/{accessToken}`
   - Salva tudo em `public_quote` table
4. Frontend:
   - Exibe LinkToast (15s, fundo verde escuro)
   - Mostra public_url e password com botões de copiar
   - Não navega - toast persiste mesmo após fechar modal

**Button "View Public Link"**:
- Header de `/quotes/:id/edit`
- Navega para `/public-quotes/links?quote={quote.number}`
- Facilita acesso rápido aos links públicos dessa quote

### Public Access (Patient View)

**Route**: `/pq/:accessToken`

Página pública totalmente isolada:
- ✅ Sem autenticação
- ✅ Sem sidebar/header do sistema TQ
- ✅ Sem breadcrumbs
- ✅ Fullscreen - standalone page

Fluxo:
1. Patient acessa link `{TQ_ORIGIN}/pq/{accessToken}`
2. Sistema exibe tela de senha:
   - Card com logo do tenant (branding)
   - Input de senha (common/ui components)
   - Button "Access Quote" (variant="primary")
3. Patient digita senha e submete
4. POST `/api/tq/v1/pq/:accessToken` com password
5. Backend valida:
   - ✅ Access token existe
   - ✅ Link está ativo
   - ✅ Senha correta (bcrypt hash)
   - ✅ Não expirou
6. Retorna:
   ```json
   {
     "data": {
       "content": {
         "template": { ... },
         "resolvedData": { ... }
       },
       "branding": { ... }
     }
   }
   ```
7. Frontend renderiza:
   - Usa `createConfigWithResolvedData(branding, resolvedData)`
   - Renderiza template com Puck `<Render>`
   - Patient vê EXATAMENTE a mesma coisa que usuário autenticado viu

**Error Handling**:
- 401 (Unauthorized): "Invalid password. Please try again."
- 404 (Not Found): "This quote link no longer exists."
- 403 (Forbidden): "This quote link has expired or been revoked."
- Generic: "Failed to load quote. Please try again later."

## Próximos Passos

### Funcionalidades Planejadas

1. ✅ **Template Variables**: Sistema de variáveis implementado com dual-config
2. ✅ **Public Links**: Links públicos com password protection implementado
3. ✅ **Content Immutability**: Backend resolve e salva content package
4. ✅ **New Password Generation**: Regenera senha para link existente
5. ✅ **Public Quote Management**: Interface completa de gerenciamento de links
6. ✅ **Global Search**: Busca inclui templates e clinical reports
7. ✅ **Recent Activity**: Integrado com public quotes e templates
8. **Conditional Sections**: Mostrar/ocultar seções baseado em dados da cotação
9. **PDF Export**: Exportar template renderizado para PDF
10. **Email Templates**: Usar templates para enviar cotações por email
11. **Theme Presets**: Templates pré-prontos para diferentes indústrias

### Melhorias Técnicas

1. **Type Safety**: Adicionar tipos TypeScript mais rigorosos no Puck config
2. **Component Library**: Documentar componentes com Storybook
3. **Performance**: Lazy load de componentes pesados
4. **SEO**: Meta tags dinâmicas baseadas no template
5. **Analytics**: Tracking de uso de componentes

## Referências

- **Puck Documentation**: https://puckeditor.com/docs
- **Puck GitHub**: https://github.com/measuredco/puck
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/icons
