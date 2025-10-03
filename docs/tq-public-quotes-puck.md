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

### Typography
- **Heading**: Títulos com 7 tamanhos (XS a XXXL), 6 níveis semânticos (H1-H6), alinhamento e vertical padding
- **Text**: Parágrafos com 2 tamanhos (S/M), alinhamento, cor (default/muted), maxWidth opcional e vertical padding

### Actions
- **Button**: Botões com 3 variantes de cor (primary/secondary/tertiary baseadas no branding), 3 tamanhos (S/M/L)

### Quote Info
- **QuoteNumber**: Exibe número da cotação com label configurável (placeholder: `{{quote.number}}`)
- **QuoteTotal**: Exibe total da cotação com destaque visual e cor primária do branding (placeholder: `{{quote.total}}`)
- **ItemsTable**: Tabela de itens com colunas Item, Base Price, Discount (opcional), Final Price (placeholders: `{{item.*}}`)

### Header
- **Header**: Header fixo no topo com:
  - Logo do tenant (via branding API) ou texto "LOGO"
  - 4 cores de fundo (White, Primary, Secondary, Tertiary)
  - 3 tamanhos (Small 64px, Medium 80px, Large 96px)
  - Spacer automático para compensar posicionamento fixo

### Other
- **CardContainer**: Card com título, descrição e drop zone interna
- **CardWithIcon**: Card com ícone selecionável (100+ ícones médicos e de negócios), modo compacto ou largo
- **Hero**: Seção hero com:
  - Título e descrição
  - Botões de ação (múltiplos, cores do branding)
  - Alinhamento (left/center)
  - Media (imagem/vídeo) com 2 modos:
    - **inline**: Mídia ao lado do conteúdo (2 colunas)
    - **bg**: Imagem como background com gradiente branco para legibilidade
  - Padding vertical configurável
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
CREATE TABLE tenant_{slug}.public_quote_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content JSONB,  -- Puck data structure
  active BOOLEAN DEFAULT true,
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

### Hero Background Mode

Modo BG usa técnica de gradiente para legibilidade:

```typescript
// Imagem de fundo em opacity total
backgroundImage: `url(${url})`
backgroundSize: 'cover'
backgroundPosition: 'center'

// Gradiente branco sobre a imagem
// Left align: gradiente horizontal (branco forte à esquerda, transparente à direita)
background: 'linear-gradient(to right, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.2) 70%, rgba(255, 255, 255, 0) 100%)'

// Center align: gradiente uniforme
background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.75))'
```

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

## Próximos Passos

### Funcionalidades Planejadas

1. **Template Variables**: Sistema de variáveis para substituir placeholders (`{{quote.number}}`, `{{quote.total}}`)
2. **Conditional Sections**: Mostrar/ocultar seções baseado em dados da cotação
3. **Public Links**: Gerar links públicos com hash para compartilhar templates
4. **PDF Export**: Exportar template renderizado para PDF
5. **Email Templates**: Usar templates para enviar cotações por email
6. **Theme Presets**: Templates pré-prontos para diferentes indústrias

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
