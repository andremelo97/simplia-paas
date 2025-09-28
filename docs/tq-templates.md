# TQ Template Management System

## Overview

The TQ Template Management System provides a comprehensive solution for creating, managing, and utilizing clinical documentation templates. This system enables healthcare professionals to standardize their documentation process, improve consistency, and streamline clinical note generation through intelligent template filling.

## Table of Contents

- [Template System Architecture](#template-system-architecture)
- [Template Syntax](#template-syntax)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Frontend Implementation](#frontend-implementation)
- [AI Agent Integration (Planned)](#ai-agent-integration-planned)
- [File Structure](#file-structure)
- [Usage Workflows](#usage-workflows)
- [Technical Implementation](#technical-implementation)

## Template System Architecture

The template system follows a three-tier architecture:

1. **Database Layer**: PostgreSQL with tenant-scoped schemas for multi-tenancy
2. **API Layer**: RESTful Express.js endpoints for template CRUD operations
3. **Frontend Layer**: React TypeScript interface with rich text editing capabilities

### Key Components

- **Template Editor**: TipTap-based rich text editor with custom syntax highlighting
- **Template Engine**: AI-powered template filling using transcription data
- **Usage Analytics**: Track template usage patterns and popular templates
- **Multi-tenant Isolation**: Complete data separation between tenants

## Template Syntax

Templates support three types of dynamic content markers:

### 1. Placeholders `[placeholder]`
Wrapped in square brackets, these are filled with information from session dialogue, clinical notes, or contextual notes.

**Examples:**
- `[reason for visit]` - Primary complaint or visit purpose
- `[examination results]` - Clinical findings
- `[treatment plan]` - Recommended treatments
- `[next appointment details]` - Follow-up scheduling

### 2. System Variables `$variable$`
Wrapped in double dollar signs, these are automatically filled with database values when the quote/report is created.

**Available Variables:**
- `$patient.name$` - Patient's full name
- `$patient.first_name$` - Patient's first name
- `$patient.email$` - Patient's email address
- `$date.now$` - Current date
- `$date.session$` - Session date
- `$profile.name$` - Doctor's name
- `$clinic.name$` - Clinic name
- `$session.number$` - Session number

### 3. Instructions `(instruction)`
Wrapped in round brackets, these guide the AI on how to behave when information is missing. Instructions will not appear in the final output.

**Examples:**
- `(Only include if mentioned in transcript)`
- `(Use professional medical terminology)`
- `(Summarize in 2-3 sentences maximum)`

### Complete Example Template

```
Dear $patient.name$,

Your appointment on $date.session$ was regarding [reason for visit].

Clinical Findings:
[examination results] (Only include if mentioned in transcript)

Treatment Plan:
Dr. $profile.name$ recommends [treatment plan]. (Use professional medical terminology)

Next Steps:
[next appointment details] (Include date and time if specified)

Best regards,
$clinic.name$
```

## Database Schema

### Template Table

```sql
CREATE TABLE tenant_{slug}.template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX template_active_idx ON tenant_{slug}.template(active);
CREATE INDEX template_usage_count_idx ON tenant_{slug}.template(usage_count DESC);
CREATE INDEX template_title_idx ON tenant_{slug}.template(title);

-- Full-text search index
CREATE INDEX template_search_idx ON tenant_{slug}.template
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Auto-update timestamp trigger
CREATE TRIGGER template_updated_at_trigger
    BEFORE UPDATE ON tenant_{slug}.template
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Key Features

- **UUID Primary Keys**: Secure, non-sequential identifiers
- **Multi-tenant Isolation**: Complete schema separation per tenant
- **Usage Tracking**: Automatic usage count increment
- **Full-text Search**: Fast searching across title and description
- **Soft Delete**: Active/inactive status instead of hard deletion
- **Timestamp Tracking**: Automatic created/updated timestamp management

## API Endpoints

Base URL: `/api/tq/v1/templates`

### GET /
List all templates for the tenant with optional filtering and pagination.

**Query Parameters:**
- `limit` (integer): Number of templates to return (default: 50)
- `offset` (integer): Number of templates to skip (default: 0)
- `active` (boolean): Filter by active status
- `search` (string): Search in title and description

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}
```

### GET /:id
Retrieve a specific template by ID.

### POST /
Create a new template.

**Request Body:**
```json
{
  "title": "Dental Consultation Summary",
  "content": "Patient $patient.name$ visited...",
  "description": "Standard template for dental consultations",
  "active": true
}
```

### PUT /:id
Update an existing template.

### DELETE /:id
Soft delete a template (sets active to false).

### GET /most-used
Get templates ordered by usage count.

**Query Parameters:**
- `limit` (integer): Number of templates to return (default: 10)

### POST /:id/increment-usage
Increment the usage count for a template (called by AI agent).

## Frontend Implementation

### File Structure

```
src/client/apps/tq/features/templates/
├── Templates.tsx           # Main listing page
├── CreateTemplate.tsx      # Template creation form
├── EditTemplate.tsx        # Template editing form
└── ViewTemplate.tsx        # Template preview/details

src/client/apps/tq/components/templates/
├── TemplateRow.tsx         # Template list item
├── TemplateFilters.tsx     # Search and filter controls
├── TemplatesEmpty.tsx      # Empty state component
└── TemplatePreview.tsx     # Template preview modal

src/client/apps/tq/services/
└── templates.ts            # API service layer

src/client/apps/tq/hooks/
├── useTemplates.ts         # Template data fetching hooks
├── useTemplatesList.ts     # Paginated templates list
└── useTemplate.ts          # Single template operations
```

### Key Components

#### CreateTemplate Page Layout

The create template page uses a responsive 2-column layout:

- **60% Main Form** (3/5 grid columns):
  - Template title and description inputs
  - Rich text editor with template syntax support
  - Active status checkbox
  - Save/Cancel action buttons

- **40% Creation Guide** (2/5 grid columns):
  - Template syntax documentation
  - System variables reference
  - Example templates
  - Best practices guide

#### Template Editor Features

The template editor is built on TipTap's Simple Editor template with customizations for template syntax:

- **Rich Text Editing**: Full WYSIWYG editing experience with formatting toolbar
- **Template Syntax Support**: Optimized for placeholders, variables, and instructions
- **Simplified Toolbar**: Focused on essential formatting (headings, lists, bold, italic, highlight, alignment)
- **Constrained Layout**: Fits within 60% of the CreateTemplate form area
- **Dark/Light Mode**: Complete theme support for both toolbar and content area
- **Keyboard Shortcuts**: Full support including Ctrl+A for select all
- **Proper Line Spacing**: Optimized paragraph spacing for better readability
- **Scrollable Content**: Automatic scrollbar when content exceeds available height
- **Responsive Design**: Mobile-friendly interface with adaptive toolbar

### Template Editor Component

```tsx
<TemplateEditor
  content={formData.content}
  onChange={handleContentChange}
  placeholder="Create your template using [placeholders], $variables$, and (instructions)..."
  readonly={isSubmitting}
/>
```

## AI Agent Integration (Planned)

### Overview

The AI Agent will be responsible for automatically filling templates using session transcription data, patient information, and clinical context. This feature will significantly reduce documentation time and improve consistency.

### Integration Points

#### 1. Template Processing Pipeline

```
Session Transcription → AI Analysis → Template Filling → Clinical Note
```

#### 2. AI Agent Responsibilities

- **Context Analysis**: Parse session transcription for relevant clinical information
- **Placeholder Resolution**: Map transcription content to template placeholders
- **Variable Substitution**: Replace system variables with database values
- **Instruction Processing**: Follow template instructions for content formatting
- **Quality Assurance**: Ensure medical accuracy and completeness

#### 3. Template Filling Process

1. **Template Selection**: Choose appropriate template based on session type
2. **Data Extraction**: Extract relevant information from transcription
3. **Content Mapping**: Map extracted data to template placeholders
4. **Variable Replacement**: Substitute system variables with actual values
5. **Instruction Processing**: Apply AI behavior instructions
6. **Final Review**: Generate complete clinical note for review

#### 4. API Integration

The AI Agent will integrate with the template system through these endpoints:

- `GET /templates/most-used` - Select appropriate templates
- `POST /templates/:id/increment-usage` - Track template usage
- `GET /templates/:id` - Retrieve template for processing

#### 5. Future Enhancements

- **Template Suggestions**: AI-powered template recommendations
- **Content Validation**: Automated clinical content verification
- **Learning System**: Improve template filling based on user feedback
- **Integration with External AI**: Support for multiple AI providers
- **Batch Processing**: Process multiple sessions simultaneously

### Implementation Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Transcription │───▶│   AI Agent      │───▶│   Filled        │
│   Service       │    │   Template      │    │   Template      │
│   (Deepgram)    │    │   Processor     │    │   Output        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Session       │    │   Template      │    │   Quote/Report  │
│   Database      │    │   Database      │    │   Generation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## File Structure

### Backend Files

```
src/server/
├── api/tq/routes/
│   └── templates.js                 # Template API routes
├── infra/
│   ├── models/
│   │   └── Template.js              # Template database model
│   └── provisioners/
│       └── tq.js                    # Database schema provisioning
└── services/
    └── ai-agent.js                  # AI template processing (planned)
```

### Frontend Files

```
src/client/
├── apps/tq/
│   ├── features/templates/
│   │   ├── Templates.tsx            # Template listing page
│   │   ├── CreateTemplate.tsx       # Template creation form
│   │   ├── EditTemplate.tsx         # Template editing form
│   │   └── ViewTemplate.tsx         # Template details view
│   ├── components/templates/
│   │   ├── TemplateRow.tsx          # List item component
│   │   ├── TemplateFilters.tsx      # Search/filter controls
│   │   ├── TemplatesEmpty.tsx       # Empty state component
│   │   └── TemplatePreview.tsx      # Preview modal
│   ├── services/
│   │   └── templates.ts             # API service layer
│   └── hooks/
│       ├── useTemplates.ts          # Template hooks
│       ├── useTemplatesList.ts      # List management
│       └── useTemplate.ts           # Single template operations
├── common/ui/
│   ├── TemplateEditor.tsx           # Template-specific editor (wraps SimpleEditor)
│   └── RichTextEditor.tsx           # Generic TipTap wrapper
└── shared/components/tiptap-templates/simple/
    ├── simple-editor.tsx            # TipTap Simple Editor template
    ├── simple-editor.scss           # Editor styling
    ├── theme-toggle.tsx             # Dark/light mode toggle
    └── data/
        └── content.json             # Default content (removed for templates)
```

## Usage Workflows

### 1. Creating a New Template

1. Navigate to `/templates`
2. Click "Add Template" button
3. Fill in template information:
   - **Title**: Descriptive name for the template
   - **Description**: Optional purpose description
   - **Content**: Template body with syntax markers
   - **Active**: Enable/disable template
4. Use the Creation Guide for syntax reference
5. Save template

### 2. Managing Existing Templates

1. View templates in the main listing
2. Use search and filters to find specific templates
3. Edit templates using the pencil icon
4. Soft delete templates using the trash icon
5. View usage statistics and popular templates

### 3. Template Filling (AI Agent - Planned)

1. Complete a patient session with transcription
2. AI Agent analyzes transcription content
3. System selects appropriate template(s)
4. Template placeholders are filled automatically
5. Generated clinical note is presented for review
6. Template usage count is incremented

### 4. Template Analytics

- View most-used templates for optimization
- Track template performance and adoption
- Identify gaps in template coverage
- Monitor template effectiveness

## Technical Implementation

### Multi-tenancy Support

Templates are completely isolated between tenants using PostgreSQL schemas:

```javascript
// Tenant-scoped database queries
const schema = req.tenant?.schema;
await db.query(`SET LOCAL search_path TO ${schema}, public`);
const templates = await Template.findAll(schema, options);
```

### Rich Text Editing

Templates use TipTap's Simple Editor template with custom constraints:

```tsx
const TemplateEditor = ({ content, onChange, placeholder, readonly, minHeight }) => {
  return (
    <div className="template-editor-constrained" style={{ minHeight }}>
      <SimpleEditor />
    </div>
  );
};
```

#### Editor Implementation Details

The TemplateEditor wraps TipTap's SimpleEditor with custom CSS constraints:

- **Removed Features**: Blockquote, code blocks, code inline, links, superscript, subscript, image upload
- **Maintained Features**: Headings, lists, basic formatting, highlight, text alignment, theme toggle
- **Custom Styling**: Constrained dimensions, proper spacing, theme support
- **Enhanced Functionality**: Ctrl+A selection, optimized line breaks, scrollable content

#### CSS Customizations

```css
.template-editor-constrained .simple-editor-wrapper {
  width: 100% !important;
  height: auto !important;
  max-height: 500px !important;
  overflow: auto !important;
}

.template-editor-constrained .simple-editor-content .tiptap.ProseMirror.simple-editor {
  padding: 1rem !important;
  min-height: 350px !important;
  max-height: 400px !important;
  overflow-y: auto !important;
  background-color: white !important;
  border: 1px solid #e5e7eb !important;
  border-top: none !important; /* Connects with toolbar */
  border-radius: 0 !important;
}

/* Dark mode support */
.dark .template-editor-constrained .simple-editor-content .tiptap.ProseMirror.simple-editor {
  background-color: #1f2937 !important;
  color: #f9fafb !important;
  border-color: #374151 !important;
}
```

### API Response Format

All template endpoints follow the standard TQ API response format:

```json
{
  "data": [...],
  "meta": {
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}
```

### Error Handling

Comprehensive error handling across all layers:

- Database constraint violations
- Tenant context validation
- Template syntax validation
- Access permission checks
- Network and timeout errors

### Performance Optimizations

- Database indexes for common queries
- Pagination for large template lists
- Caching for frequently used templates
- Optimistic updates in the frontend
- Debounced search queries

## Security Considerations

- **Tenant Isolation**: Complete data separation using PostgreSQL schemas
- **Input Validation**: Sanitize template content to prevent XSS
- **Access Control**: Verify user permissions for template operations
- **Audit Trail**: Log all template modifications and usage
- **Content Security**: Validate template syntax and structure

## Monitoring and Analytics

- **Usage Metrics**: Track template usage patterns
- **Performance Metrics**: Monitor API response times
- **Error Tracking**: Log and alert on template processing failures
- **User Analytics**: Understand template adoption and effectiveness
- **AI Agent Metrics**: Monitor AI template filling accuracy (planned)

## Best Practices

### Template Creation

1. Use descriptive, specific titles
2. Include helpful descriptions for context
3. Follow consistent naming conventions
4. Test templates with sample data
5. Keep templates focused and concise

### Template Content

1. Use clear, professional language
2. Include appropriate instructions for AI
3. Organize content logically
4. Consider mobile viewing constraints
5. Validate syntax before saving

### System Variables

1. Use appropriate variable types
2. Consider data availability
3. Test with different patient data
4. Handle missing data gracefully
5. Document custom variables

### AI Instructions

1. Be specific about requirements
2. Consider edge cases and missing data
3. Specify formatting preferences
4. Include quality requirements
5. Test with various transcription types

---

*This documentation covers the current implementation and planned features of the TQ Template Management System. For technical implementation details, see the source code and API documentation.*